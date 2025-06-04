import requests
import time
from typing import Optional, Tuple, Dict, Any, Callable
from functools import wraps
from cachetools import TTLCache

from models.ircc_credential import IRCCCredential
from utils.encryption import encryption_manager

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
            "x-amz-user-agent": "aws-amplify/5.0.4 js"
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return headers

    def _get_api_headers(self, token: str) -> dict:
        """Get API request headers"""
        return {
            'accept': 'application/json',
            'accept-language': 'en-CA,en;q=0.9,zh-CN;q=0.8,zh;q=0.7,en-GB;q=0.6,en-US;q=0.5',
            'authorization': f'Bearer {token}',
            'content-type': 'application/json',
            'origin': 'https://tracker-suivi.apps.cic.gc.ca',
            'referer': 'https://tracker-suivi.apps.cic.gc.ca/',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
        }

    def _get_token(self, user_id: str, ircc_username: str, ircc_password: str) -> Optional[str]:
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
            "AuthParameters": {
                "USERNAME": ircc_username,
                "PASSWORD": ircc_password
            },
            "ClientMetadata": {}
        }
        
        try:
            response = requests.post(
                self.cognito_url,
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                token = response.json().get('AuthenticationResult', {}).get('IdToken')
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
                self.base_url,
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            raise Exception(f"API request failed: {response.status_code} {response.text}")
        except Exception as e:
            raise Exception(f"API request error: {str(e)}")

    @staticmethod
    def with_token(func: Callable) -> Callable:
        """Decorator to handle token management"""
        @wraps(func)
        def wrapper(self, credential: IRCCCredential, *args, **kwargs):
            # Get token
            token = self._get_token(
                credential.user_id,
                credential.ircc_username,
                encryption_manager.decrypt(credential.encrypted_password)
            )
            
            if not token:
                raise Exception("Failed to get authentication token")
            
            # Call original function with token
            return func(self, credential, token=token, *args, **kwargs)
        return wrapper

    def verify_ircc_credentials(self, user_id: str, ircc_username: str, ircc_password: str) -> bool:
        """Verify IRCC credentials"""
        del self.token_cache[(user_id, ircc_username)]
        token = self._get_token(user_id, ircc_username, ircc_password)
        if not token:
            return False
            
        return True

    @with_token
    def get_application_summary(self, credential: IRCCCredential, token: Optional[str]=None) -> Dict[str, Any]:
        """Get application summary"""
        return self._make_api_request(token, "get-profile-summary", limit="500")

    @with_token
    def get_application_details(self, credential: IRCCCredential, token: Optional[str]=None) -> Dict[str, Any]:
        """Get application details"""
        return self._make_api_request(token, "get-application-details", applicationNumber=credential.application_number)

class IRCCAgentFactory:
    _instances = {}
    
    @classmethod
    def get_ircc_agent(cls, application_type: str) -> IRCCAgent:
        """Get IRCC agent singleton instance"""
        if application_type not in cls._instances:
            if application_type == 'citizen':
                cls._instances[application_type] = IRCCCitizenAgent()
            elif application_type == 'immigrant':
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

class IRCCImmigrantAgent(IRCCAgent):
    """Immigrant application specific agent implementation"""
    
    def __init__(self):
        super().__init__()
        self.base_url = "https://api.ircc-tracker-suivi.apps.cic.gc.ca/user"
        self.cognito_url = "https://cognito-idp.ca-central-1.amazonaws.com/"
        self.client_id = "3cfutv5ffd1i622g1tn6vton5r"


