"""IRCC credential model for storing and managing user immigration application credentials."""

from datetime import datetime, timezone
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
    def to_dict(self):
        """Convert to dictionary format"""
        return {
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
            'application_number': self.application_number
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
            # Update existing credential
            collection.update_one(
                {'_id': existing_credential['_id']},
                {'$set': self.to_dict()}
            )
            return existing_credential['_id']
        else:
            # Create new credential
            result = collection.insert_one(self.to_dict())
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