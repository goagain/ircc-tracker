from datetime import datetime
import requests
import time
from typing import Optional, Tuple, Dict, Any, Callable
from functools import wraps
from cachetools import TTLCache

from models.application_records import Activity, ActivityStatus, ApplicationRecord, HistoryRecord
from models.ircc_credential import IRCCCredential
from utils.encryption import encryption_manager


class ApplicationSummary:
    def __init__(self, application_type: str, application_number: str):
        self.application_type = application_type
        self.application_number = application_number


class ApplicationDetails:
    def __init__(self):
        pass


class IRCCAgent:
    def __init__(self):
        # use TTLCache, max size 10000, default 50 minutes expiration
        self.client_id: Optional[str] = None
        self.cognito_url: Optional[str] = None
        self.base_url: Optional[str] = None
        self.token_cache = TTLCache(maxsize=10000, ttl=3000)

    def _get_auth_headers(self, token: Optional[str] = None) -> dict:
        """Get authentication headers"""
        headers = {
            "content-type": "application/x-amz-json-1.1",
            "x-amz-target": "AWSCognitoIdentityProviderService.InitiateAuth",
            "x-amz-user-agent": "aws-amplify/5.0.4 js",
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return headers

    def _get_api_headers(self, token: str) -> dict:
        """Get API request headers"""
        return {
            "accept": "application/json",
            "accept-language": "en-CA,en;q=0.9,zh-CN;q=0.8,zh;q=0.7,en-GB;q=0.6,en-US;q=0.5",
            "authorization": f"Bearer {token}",
            "content-type": "application/json",
            "origin": "https://tracker-suivi.apps.cic.gc.ca",
            "referer": "https://tracker-suivi.apps.cic.gc.ca/",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        }

    def _get_token(
        self, user_id: str, ircc_username: str, ircc_password: str
    ) -> Optional[str]:
        """Get authentication token"""
        # Check cache first
        cached_token = self.token_cache.get((user_id, ircc_username))
        if cached_token:
            return cached_token

        # Get new token
        headers = self._get_auth_headers()
        payload = {
            "AuthFlow": "USER_PASSWORD_AUTH",
            "ClientId": self.client_id,
            "AuthParameters": {"USERNAME": ircc_username, "PASSWORD": ircc_password},
            "ClientMetadata": {},
        }

        try:
            response = requests.post(
                self.cognito_url, headers=headers, json=payload, timeout=30
            )

            if response.status_code == 200:
                token = response.json().get("AuthenticationResult", {}).get("IdToken")
                if token:
                    self.token_cache[(user_id, ircc_username)] = token
                    return token
        except Exception as e:
            print(f"Error getting token: {str(e)}")

        return None

    def _make_api_request(self, token: str, method: str, **kwargs) -> Dict[str, Any]:
        """Make API request with token"""
        headers = self._get_api_headers(token)
        payload = {"method": method, **kwargs}

        try:
            response = requests.post(
                self.base_url, headers=headers, json=payload, timeout=30
            )

            if response.status_code == 200:
                return response.json()
            raise Exception(
                f"API request failed: {response.status_code} {response.text}"
            )
        except Exception as e:
            raise Exception(f"API request error: {str(e)}")

    @staticmethod
    def with_token(func: Callable) -> Callable:
        """Decorator to handle token management"""

        @wraps(func)
        def wrapper(self, credential: IRCCCredential, *args, **kwargs):
            salt = credential.salt
            # Get token
            token = self._get_token(
                credential.user_id,
                credential.ircc_username,
                encryption_manager.decrypt(salt, credential.encrypted_password),
            )

            if not token:
                raise Exception("Failed to get authentication token")

            # Call original function with token
            return func(self, credential, token=token, *args, **kwargs)

        return wrapper

    def verify_ircc_credentials(
        self, user_id: str, ircc_username: str, ircc_password: str
    ) -> bool:
        """Verify IRCC credentials"""
        if (user_id, ircc_username) in self.token_cache:
            del self.token_cache[(user_id, ircc_username)]
        token = self._get_token(user_id, ircc_username, ircc_password)
        if not token:
            return False

        return True

    @with_token
    def get_application_summary(
        self, credential: IRCCCredential, token: Optional[str] = None
    ) -> list[ApplicationSummary]:
        """Get application summary"""
        raise NotImplementedError("This method is not implemented")

    @with_token
    def get_application_details(
        self, credential: IRCCCredential, token: Optional[str] = None
    ) -> ApplicationRecord:
        raise NotImplementedError("This method is not implemented")


class IRCCAgentFactory:
    _instances = {}

    @classmethod
    def get_ircc_agent(cls, application_type: str) -> IRCCAgent:
        """Get IRCC agent singleton instance"""
        if application_type not in cls._instances:
            if application_type == "citizen":
                cls._instances[application_type] = IRCCCitizenAgent()
            elif application_type == "immigrant":
                cls._instances[application_type] = IRCCImmigrantAgent()
            else:
                raise ValueError("Invalid application type")
        return cls._instances[application_type]


class IRCCCitizenAgent(IRCCAgent):
    """Citizen application specific agent implementation"""

    def __init__(self):
        super().__init__()
        self.base_url = "https://api.tracker-suivi.apps.cic.gc.ca/user"
        self.cognito_url = "https://cognito-idp.ca-central-1.amazonaws.com/"
        self.client_id = "mtnf1qn9p739g2v8aij2anpju"

    @IRCCAgent.with_token
    def get_application_summary(
        self, credential: IRCCCredential, token: Optional[str] = None
    ) -> list[ApplicationSummary]:
        """Get application summary"""
        response = self._make_api_request(token, "get-profile-summary", limit="500")
        return [
            ApplicationSummary("citizen", app.get("appNumber"))
            for app in response.get("apps", [])
        ]

    @IRCCAgent.with_token
    def get_application_details(
        self, credential: IRCCCredential, token: Optional[str] = None
    ) -> ApplicationRecord:
        """Get application details"""
        response = self._make_api_request(
            token,
            "get-application-details",
            applicationNumber=credential.application_number,
        )
        return ApplicationRecord.from_dict(response)


class IRCCImmigrantAgent(IRCCAgent):
    """Immigrant application specific agent implementation"""

    history_map = {
        "28": "BIRTH_CERT",
        "29": "DIVORCE_CERT",
        "31": "CUSTODY",
        "41": "PASSPORT",
        "42": "PASSPORT_PHOTO",
        "54": "MED_PROOF",
        "57": "POLICE_CERT",
        "61": "FAMILY_INFO",
        "63": "USE_OF_REP",
        "65": "GEN_APPL_FORM",
        "96": "WITHDRAWAL",
        "437": "ADD_FEES",
        "602": "SPR_INFO",
        "609": "SPR_UNDERTAKING",
        "651": "RELATIONSHIP",
        "664": "PAYMENT",
        "667": "MARRIAGE_CERT",
        "723": "ADD_FAMILY_INFO",
        "871": "POLICE_CERT",
        "873": "PASSPORT",
        "1021": "ENQUIRY",
        "Word LTR 01": "AOR",
        "Auto E-mail 01": "AOR",
        "Auto E-mail 111": "BIOMETRICS",
        "IMM5756": "BIOMETRIC_FEES",
        "Word LTR 20": "COPR_ISSUED",
        "Word LTR 29": "ELIG_DEC",
        "Word LTR 11": "ELIG_DEC",
        "IMM1017": "MED_REPORT",
        "IMM5706": "MED_ADD",
        "IMM0535": "MED_RESULT",
        "Auto E-mail 108": "PREARRIVAL",
        "IMM5801": "PREARRIVAL",
        "Word LTR 28": "PR_AUTH",
        "Word LTR 24": "REFUND_FEES",
        "Word LTR 21": "SPR_DEC",
        "Word LTR 22": "SPR_DEC",
        "Word LTR 19": "TRANSFERRED",
        "Word LTR 12": "WITHDRAWN",
        "INITIAL": "INITIAL",
    }

    def __init__(self):
        super().__init__()
        self.base_url = "https://api.ircc-tracker-suivi.apps.cic.gc.ca/user"
        self.cognito_url = "https://cognito-idp.ca-central-1.amazonaws.com/"
        self.client_id = "3cfutv5ffd1i622g1tn6vton5r"

    @IRCCAgent.with_token
    def get_application_summary(
        self, credential: IRCCCredential, token: Optional[str] = None
    ) -> list[ApplicationSummary]:
        """Get application summary"""
        response = self._make_api_request(token, "get-profile-summary", limit="500")
        return [
            ApplicationSummary("immigrant", app.get("appNum"))
            for app in response.get("apps", [])
        ]

    @IRCCAgent.with_token
    def get_application_details(
        self, credential: IRCCCredential, token: Optional[str] = None
    ) -> ApplicationRecord:
        """Get application details"""
        response = self._make_api_request(
            token,
            "get-application-details",
            applicationNumber=credential.application_number,
            uci=credential.ircc_username,
            isAgent=False,
        )

        relations = response.get("relations", [{}])[0]

        acitivites = [
            Activity(activity_key, 0, ActivityStatus(activity_value))
            for activity_key, activity_value in relations.get("activities", {}).items()
        ]
        history = [
            HistoryRecord(
                int(datetime.fromisoformat(history_value.get("dateCreated")).timestamp() * 1000),
                False,
                False,
                "Activity",
                f"{history_value.get("key", "")} {self.history_map.get(history_value.get("key", ""), "")}",
                int(datetime.fromisoformat(history_value.get("dateLoaded")).timestamp() * 1000),
                None,
                None,
            )
            for history_value in relations.get("history", [])
        ]
        actions = relations.get("actions", [])
        record = ApplicationRecord(
            credential.application_number,
            credential.ircc_username,
            int(datetime.fromisoformat(response.get("app", {}).get("lastUpdated")).timestamp() * 1000),
            response.get("app", {}).get("status"),
            acitivites,
            history,
            actions,
        )

        return record
