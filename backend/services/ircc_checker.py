from types import TracebackType
import requests
import json
import re
from datetime import datetime
from bs4 import BeautifulSoup
from models.application_records import ApplicationRecord
from utils.ircc_agent import IRCCAgentFactory
from utils.encryption import encryption_manager
from utils.email_sender import email_sender
from models.ircc_credential import IRCCCredential
from config import Config
import logging

logger = logging.getLogger(__name__)

class ApplicationRecordChange:
    def __init__(self, status: str, change_type: str, old_value: str, new_value: str):
        self.change_type = change_type
        self.status = status
        self.old_value = old_value
        self.new_value = new_value
        
    def __str__(self):
        return f"{self.change_type}: {self.status}: {self.old_value} -> {self.new_value}"
    
    def __repr__(self):
        return self.__str__()

class IRCCChecker:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
    
    @classmethod
    def compare_application_details(cls, current_application_details: ApplicationRecord | None, new_application_details: ApplicationRecord | None) -> list[ApplicationRecordChange]:
        """Compare application details"""
        
        if current_application_details is None:
            current_application_details = ApplicationRecord(
                application_number="",
                uci="",
                last_updated_time=0,
                status="",
                activities=[],
            history=[],
        )
        
        changes = []
        if current_application_details.status != new_application_details.status:
            changes.append(ApplicationRecordChange("Application Status", "Changed", current_application_details.status, new_application_details.status))
        if current_application_details.last_updated_time != new_application_details.last_updated_time:
            changes.append(ApplicationRecordChange("Last Updated Time", "Changed", current_application_details.last_updated_time, new_application_details.last_updated_time))
        current_activities = {activity.activity: activity for activity in new_application_details.activities}
        new_activities = {activity.activity: activity for activity in current_application_details.activities}
        for activity in new_activities:
            if activity not in current_activities:
                changes.append(ApplicationRecordChange(activity, "Added", "N/A", new_activities[activity].status))
            elif current_activities[activity].status != new_activities[activity].status:
                changes.append(ApplicationRecordChange(activity, "Changed", current_activities[activity].status, new_activities[activity].status))

        # Sort history by time
        history = sorted(current_application_details.history, key=lambda x: x.time)
        new_history = sorted(new_application_details.history, key=lambda x: x.time)
        len_history = len(history)
        
        for i in range(len_history, len(new_history)):
            changes.append(ApplicationRecordChange("Event", "Added", new_history[i].title, new_history[i].title))
        return changes
    
    def check_single_credential(self, credential: IRCCCredential) -> bool:
        """Check single credential's IRCC status"""
        try:            
            # Send request to check status
            application_details = self._make_ircc_request(credential)
            
            if application_details:
                # get current status and timestamp
                current_status = application_details.get('status')
                current_timestamp = application_details.get('lastUpdatedTime')
                # if not self._status_changed(credential, current_status, current_timestamp):
                #     return False
                last_application_details = ApplicationRecord.get_latest_record(credential.application_number)
                
                application_record = ApplicationRecord.from_dict(application_details)
                changes = self.compare_application_details(last_application_details, application_record)
                if changes:
                    # Send email notification
                    if credential.email:
                        email_sender.send_status_update_email(
                            credential.email,
                            credential.ircc_username,
                            credential.application_number,
                            '\n'.join([str(change) for change in changes]),
                            datetime.fromtimestamp(current_timestamp / 1000)
                        )
                    
                    logger.info(f"Status change detected - User: {credential.ircc_username}, New status: {current_status}")
                
                application_record.save()
                # Update credential status
                credential.update_status(current_status, current_timestamp)
                credential.save()
                
                return True
            else:
                logger.warning(f"Unable to get status information for user {credential.ircc_username}")
                return False
                
        except Exception as e:
            error_msg = f"Error checking status for user {credential.ircc_username}: {str(e)}"
            logger.error(error_msg)
            raise
    
    def check_all_credentials(self):
        """Check status of all active credentials"""
        credentials = IRCCCredential.get_all_active_credentials()
        success_count = 0
        total_count = len(credentials)
        
        logger.info(f"Starting to check IRCC status for {total_count} users")
        
        for credential in credentials:
            try:
                if self.check_single_credential(credential):
                    success_count += 1
            except Exception as e:
                logger.error(f"Exception occurred while checking credential: {str(e)}")
        logger.info(f"Status check completed: {success_count}/{total_count} successful")
        return success_count, total_count
    
    def _make_ircc_request(self, credential: IRCCCredential):
        """Send request to IRCC website"""
        try:            
            ircc_agent = IRCCAgentFactory.get_ircc_agent(credential.application_type)
            
            return ircc_agent.get_application_details(credential)
        except requests.exceptions.Timeout:
            raise Exception("Request timeout, please try again later")
        except requests.exceptions.RequestException as e:
            raise Exception(f"Network request error: {str(e)}")
        except Exception as e:
            raise Exception(f"Error occurred while checking status: {str(e)}")
    
    def _status_changed(self, credential: IRCCCredential, new_status: str, new_timestamp: int):
        """Check if status has changed"""
        # Check if status text has changed
        if credential.last_status != new_status:
            return True
        
        # Check if timestamp has changed
        if credential.last_timestamp and new_timestamp:
            if credential.last_timestamp != new_timestamp:
                return True
        
        return False
    
    def test_connection(self):
        """Test connection to IRCC website"""
        try:
            response = self.session.get(Config.IRCC_CITIZEN_CHECK_URL, timeout=10)
            if response.status_code == 200:
                logger.info("IRCC website connection test successful")
                return True
            else:
                logger.warning(f"IRCC website returned status code: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"IRCC website connection test failed: {str(e)}")
            return False

# Global IRCC checker instance
ircc_checker = IRCCChecker() 