"""Email utility for sending notifications to users about IRCC status changes."""

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime
from config import Config
import logging

logger = logging.getLogger(__name__)

class EmailSenderBase:
    def send_status_update_email(self, to_email, ircc_username, old_status, new_status, timestamp=None) -> bool:
        pass
    
    def send_error_notification(self, to_email, ircc_username, error_message) -> bool:
        pass
    
    def test_connection(self) -> bool:
        pass

    def send_test_email(self) -> bool:
        pass

class FakeEmailSender(EmailSenderBase):
    def send_status_update_email(self, to_email, ircc_username, old_status, new_status, timestamp=None):
        logger.info("Status update email sent to: %s", to_email)
        return True
    
    def send_error_notification(self, to_email, ircc_username, error_message):
        logger.info("Error notification email sent to: %s", to_email)
        return True
    
    def test_connection(self):
        logger.info("Email server connection test successful")
        return True

class EmailSender(EmailSenderBase):
    def __init__(self):
        self.smtp_server = Config.SMTP_SERVER
        self.smtp_port = Config.SMTP_PORT
        self.username = Config.SMTP_USERNAME
        self.password = Config.SMTP_PASSWORD
        self.from_email = Config.FROM_EMAIL
        self.admin_email = Config.ADMIN_EMAIL
        
    def send_status_update_email(self, to_email: str, ircc_username: str, application_number: str, changes: str, timestamp: datetime) -> bool:
        """Send status update email"""
        try:
            # Create email object
            message = MIMEMultipart("alternative")
            message["Subject"] = "IRCC Status Update Notification"
            message["From"] = self.from_email
            message["To"] = to_email
            
            # Create email content
            html_content = self._create_status_update_html(
                ircc_username, application_number, changes, timestamp
            )
            text_content = self._create_status_update_text(
                ircc_username, application_number, changes, timestamp
            )
            
            # Add email content
            part_text = MIMEText(text_content, "plain", "utf-8")
            part_html = MIMEText(html_content, "html", "utf-8")
            
            message.attach(part_text)
            message.attach(part_html)
            
            # Send email
            self._send_email(message, to_email)
            logger.info("Status update email sent to: %s", to_email)
            return True
            
        except Exception as e:
            logger.error("Failed to send email: %s", str(e))
            return False
    
    def send_error_notification(self, to_email, ircc_username, error_message):
        """Send error notification email"""
        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = "IRCC Tracker Error Notification"
            message["From"] = self.from_email
            message["To"] = to_email
            
            html_content = f"""
            <html>
                <body>
                    <h2>IRCC Tracker Error Notification</h2>
                    <p>Username: <strong>{ircc_username}</strong></p>
                    <p>Error Message: <strong style="color: red;">{error_message}</strong></p>
                    <p>Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                    <p>Please check your IRCC account information or contact the system administrator.</p>
                </body>
            </html>
            """
            
            text_content = f"""
IRCC Tracker Error Notification

Username: {ircc_username}
Error Message: {error_message}
Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Please check your IRCC account information or contact the system administrator.
            """
            
            part_text = MIMEText(text_content, "plain", "utf-8")
            part_html = MIMEText(html_content, "html", "utf-8")
            
            message.attach(part_text)
            message.attach(part_html)
            
            self._send_email(message, to_email)
            logger.info("Error notification email sent to: %s", to_email)
            return True
            
        except Exception as e:
            logger.error("Failed to send error notification email: %s", str(e))
            return False
    
    def _create_status_update_html(self, ircc_username: str, application_number: str, changes: str, timestamp: datetime):
        """Create HTML format status update email content"""
        timestamp_str = timestamp.strftime('%Y-%m-%d %H:%M:%S') if timestamp else "Unknown"
        
        return f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2c5aa0; border-bottom: 2px solid #2c5aa0; padding-bottom: 10px;">
                        🇨🇦 IRCC Status Update Notification
                    </h2>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #495057;">Account Information</h3>
                        <p><strong>IRCC Username:</strong> {ircc_username}</p>
                        <p><strong>Application Number:</strong> {application_number}</p>
                        <p><strong>Check Time:</strong> {timestamp_str}</p>
                    </div>
                    
                    <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
                        <h3 style="margin-top: 0; color: #856404;">Status Change</h3>
                        {changes}
                    </div>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                        <p style="font-size: 0.9em; color: #6c757d;">
                            This is an automatically generated email, please do not reply.<br>
                            If you have any questions, please contact the system administrator.
                        </p>
                        <p style="font-size: 0.9em; color: #6c757d;">
                            <strong>IRCC Tracker</strong> - Keep you informed about your application progress
                        </p>
                    </div>
                </div>
            </body>
        </html>
        """
    
    def _create_status_update_text(self, ircc_username: str, application_number: str, changes: list[str], timestamp: datetime):
        """Create plain text format status update email content"""
        timestamp_str = timestamp.strftime('%Y-%m-%d %H:%M:%S') if timestamp else "Unknown"
        
        return f"""
🇨🇦 IRCC Status Update Notification

Account Information:
IRCC Username: {ircc_username}
Check Time: {timestamp_str}

Status Change:
{changes}

---
This is an automatically generated email, please do not reply.
If you have any questions, please contact the system administrator.

IRCC Tracker - Keep you informed about your application progress
        """
    
    def _send_email(self, message, to_email):
        """Low-level email sending method"""
        # Create SSL context
        context = ssl.create_default_context()
        
        # Connect to SMTP server and send email
        with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
            server.starttls(context=context)
            server.login(self.username, self.password)
            server.send_message(message)
    
    def test_connection(self):
        """Test email server connection"""
        try:
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.username, self.password)
            logger.info("Email server connection test successful")
            return True
        except Exception as e:
            logger.error("Email server connection test failed: %s", str(e))
            return False

    def send_test_email(self) -> bool:
        """Send a test email"""
        return self.send_status_update_email(self.admin_email, "test application", "test application number", ["test change"], datetime.now())
        
# Global email sender instance
if Config.SMTP_SERVER:
    email_sender = EmailSender()
else:
    email_sender = FakeEmailSender()
