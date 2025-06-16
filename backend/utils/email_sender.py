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
        return False
    
    def send_error_notification(self, to_email, ircc_username, error_message) -> bool:
        return False
    
    def test_connection(self) -> bool:
        return False

    def send_test_email(self) -> bool:
        return False

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

    def send_test_email(self) -> bool:
        logger.info("Test email sent")
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
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="color: #2c5aa0; border-bottom: 2px solid #2c5aa0; padding-bottom: 10px; margin: 0;">
                            🇨🇦 Goagain's IRCC Status Update Notification
                        </h2>
                        <div style="text-align: right;">
                            <a href="https://github.com/goagain/ircc-tracker" style="text-decoration: none; color: #2c5aa0;">
                                <span style="display: inline-flex; align-items: center; background: #f8f9fa; padding: 5px 10px; border-radius: 4px;">
                                    <svg style="width: 16px; height: 16px; margin-right: 5px;" viewBox="0 0 16 16" fill="currentColor">
                                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                                    </svg>
                                    Star on GitHub
                                </span>
                            </a>
                        </div>
                    </div>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #495057;">Account Information</h3>
                        <p><strong>IRCC Username:</strong> {ircc_username}</p>
                        <p><strong>Application Number:</strong> {application_number}</p>
                        <p><strong>Check Time:</strong> {timestamp_str}</p>
                    </div>
                    
                    <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
                        <h3 style="margin-top: 0; color: #856404;">Status Change</h3>
                        {changes.replace('\n', '<br>')}
                    </div>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                        <p style="font-size: 0.9em; color: #6c757d;">
                            This is an automatically generated email, please do not reply.<br>
                            If you have any questions, please contact the system administrator.
                        </p>
                        <p style="font-size: 0.9em; color: #6c757d;">
                            <strong>Goagain's IRCC Tracker</strong> - Keep you informed about your application progress
                        </p>
                        <p style="font-size: 0.9em; color: #6c757d;">
                            Visit our website: <a href="https://tracker.goagain.me" style="color: #2c5aa0; text-decoration: none;">https://tracker.goagain.me</a>
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

Goagain's IRCC Tracker - Keep you informed about your application progress
Visit our website: https://tracker.goagain.me
Star us on GitHub: https://github.com/goagain/ircc-tracker
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
