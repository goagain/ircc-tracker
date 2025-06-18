"""IRCC credential model for storing and managing user immigration application credentials."""

from datetime import datetime, timezone, timedelta
from typing import Self
from bson import ObjectId
from models.database import db_instance

class IRCCCredential:
    def __init__(self, user_id: str, ircc_username: str, salt: str, encrypted_password: str, application_type: str, email=None, application_number=None):
        self.id: ObjectId | None = None
        self.user_id = user_id
        self.ircc_username = ircc_username
        self.salt = salt
        self.encrypted_password = encrypted_password  # AES encrypted password
        self.email = email  # Email for receiving notifications
        self.is_active = True
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)
        self.last_checked = None
        self.last_status = None
        self.last_timestamp = None
        self.application_type = application_type
        self.application_number: str | None = application_number
        self.retry_count = 0
        self.next_retry_time: datetime | None = None
    def to_dict(self):
        """Convert to dictionary format"""
        return {
            'id': str(self.id),
            'user_id': self.user_id,
            'ircc_username': self.ircc_username,
            'salt': self.salt,
            'encrypted_password': self.encrypted_password,
            'email': self.email,
            'is_active': self.is_active,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'last_checked': self.last_checked,
            'last_status': self.last_status,
            'last_timestamp': self.last_timestamp,
            'application_type': self.application_type,
            'application_number': self.application_number,
            'retry_count': self.retry_count,
            'next_retry_time': self.next_retry_time
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create credential object from dictionary"""
        credential = cls.__new__(cls)
        credential.id = ObjectId(data.get('_id'))
        credential.user_id = data.get('user_id')
        credential.ircc_username = data.get('ircc_username')
        credential.salt = data.get('salt')
        credential.encrypted_password = data.get('encrypted_password')
        credential.email = data.get('email')
        credential.is_active = data.get('is_active', True)
        credential.created_at = data.get('created_at', datetime.now(timezone.utc))
        credential.updated_at = data.get('updated_at', datetime.now(timezone.utc))
        credential.last_checked = data.get('last_checked')
        credential.last_status = data.get('last_status')
        credential.last_timestamp = data.get('last_timestamp')
        credential.application_type = data.get('application_type')
        credential.application_number = data.get('application_number')
        credential.retry_count = data.get('retry_count', 0)
        
        # Ensure next_retry_time is timezone-aware
        next_retry_time = data.get('next_retry_time')
        if next_retry_time and next_retry_time.tzinfo is None:
            next_retry_time = next_retry_time.replace(tzinfo=timezone.utc)
        credential.next_retry_time = next_retry_time
        
        return credential
    
    def save(self):
        """Save credential to database"""
        collection = db_instance.get_collection('ircc_credentials')
        self.updated_at = datetime.now(timezone.utc)
        
        # Check if credential already exists for the same user
        existing_credential = collection.find_one({
            'user_id': self.user_id,
            'ircc_username': self.ircc_username
        })
        
        if existing_credential:
            credential_dict = self.to_dict()
            credential_dict.pop('_id', None)  # Remove id field

            # Update existing credential
            collection.update_one(
                {'_id': existing_credential['_id']},
                {'$set': credential_dict}
            )
            return existing_credential['_id']
        else:
            # Create new credential
            credential_dict = self.to_dict()
            credential_dict.pop('_id', None)  # 移除id字段
            result = collection.insert_one(credential_dict)
            return result.inserted_id
    
    @classmethod
    def find_by_user_id(cls, user_id) -> list[Self]:
        """Find credentials by user ID"""
        collection = db_instance.get_collection('ircc_credentials')
        credentials_data = collection.find({'user_id': user_id, 'is_active': True})
        return [cls.from_dict(credential_data) for credential_data in credentials_data]
    
    @classmethod
    def find_by_id(cls, credential_id: str) -> Self | None:
        """Find credential by ID"""
        collection = db_instance.get_collection('ircc_credentials')
        credential_data = collection.find_one({'_id': ObjectId(credential_id)})
        if credential_data:
            return cls.from_dict(credential_data)
        return None
    
    @classmethod
    def get_by_application_number(cls, application_number: str) -> Self | None:
        """Get credential by application number"""
        collection = db_instance.get_collection('ircc_credentials')
        credential_data = collection.find_one({'application_number': application_number})
        return cls.from_dict(credential_data) if credential_data else None
    
    @classmethod
    def get_all_active_credentials(cls):
        """Get all active credentials"""
        collection = db_instance.get_collection('ircc_credentials')
        credentials_data = collection.find({'is_active': True})
        return [cls.from_dict(credential_data) for credential_data in credentials_data]
    
    def update_status(self, status, timestamp=None):
        """Update status information"""
        self.last_checked = datetime.now(timezone.utc)
        self.last_status = status
        if timestamp:
            self.last_timestamp = timestamp
        
        # Update database
        collection = db_instance.get_collection('ircc_credentials')
        collection.update_one(
            {'_id': self.id},
            {'$set': {
                'last_checked': self.last_checked,
                'last_status': self.last_status,
                'last_timestamp': self.last_timestamp,
                'updated_at': datetime.now(timezone.utc)
            }}
        )
    
    def deactivate(self):
        """Deactivate credential"""
        self.is_active = False
        self.updated_at = datetime.now(timezone.utc)
        
        collection = db_instance.get_collection('ircc_credentials')
        collection.update_one(
            {'_id': self.id},
            {'$set': {'is_active': False, 'updated_at': self.updated_at}}
        )

    def update_retry_info(self, success: bool = True):
        """Update retry information"""
        if success:
            self.retry_count = 0
            self.next_retry_time = None
        else:
            self.retry_count += 1
            # Retry time strategy:
            # 1st attempt: 10 minutes
            # 2nd attempt: 30 minutes
            # 3rd attempt: 1 hour
            # 4th attempt: 2 hours
            # 5th attempt: 4 hours
            # 6th attempt: 12 hours
            # 7th attempt and above: 24 hours
            if self.retry_count == 1:
                wait_hours = 10/60  # 10 minutes
            elif self.retry_count == 2:
                wait_hours = 30/60  # 30 minutes
            elif self.retry_count == 3:
                wait_hours = 1
            elif self.retry_count == 4:
                wait_hours = 2
            elif self.retry_count == 5:
                wait_hours = 4
            elif self.retry_count == 6:
                wait_hours = 12
            else:
                wait_hours = 24
            
            self.next_retry_time = datetime.now(timezone.utc) + timedelta(hours=wait_hours)
        
        collection = db_instance.get_collection('ircc_credentials')
        collection.update_one(
            {'_id': self.id},
            {'$set': {
                'retry_count': self.retry_count,
                'next_retry_time': self.next_retry_time,
                'updated_at': datetime.now(timezone.utc)
            }}
        ) 