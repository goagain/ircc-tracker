"""User model for managing user accounts and authentication."""

from datetime import datetime, timezone
from typing import Self
from bson import ObjectId
from models.database import db_instance
import bcrypt

class User:
    def __init__(self, email: str, password: str | None = None, role: str = 'user', is_active: bool = True, google_id: str | None = None):
        self.email = email
        self.password_hash = self._hash_password(password) if password else None
        self.google_id: str | None = google_id
        self.role = role  # 'admin' or 'user'
        self.is_active = is_active
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)
    
    def _hash_password(self, password: str) -> str | None:
        """Hash password"""
        if password:
            return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        return None
    
    def check_password(self, password: str) -> bool:
        """Verify password"""
        if self.password_hash:
            return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
        return False
    
    def set_password(self, password: str) -> None:
        """Set password"""
        self.password_hash = self._hash_password(password)
    
    def to_dict(self):
        """Convert to dictionary format"""
        return {
            'email': self.email,
            'password_hash': self.password_hash,
            'role': self.role,
            'is_active': self.is_active,
            'google_id': self.google_id,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create user object from dictionary"""
        user = cls.__new__(cls)
        user.email = data.get('email')
        user.password_hash = data.get('password_hash')
        user.google_id = data.get('google_id')
        user.role = data.get('role', 'user')
        user.is_active = data.get('is_active', True)
        user.created_at = data.get('created_at', datetime.now(timezone.utc))
        user.updated_at = data.get('updated_at', datetime.now(timezone.utc))
        return user
    
    def save(self):
        """Save user to database"""
        collection = db_instance.get_collection('users')
        self.updated_at = datetime.now(timezone.utc)
        
        # Check if user already exists
        existing_user = collection.find_one({'email': self.email})
        if existing_user:
            # Update existing user
            collection.update_one(
                {'email': self.email},
                {'$set': self.to_dict()}
            )
            return existing_user['_id']
        else:
            # Create new user
            result = collection.insert_one(self.to_dict())
            return result.inserted_id
    
    @classmethod
    def find_by_email(cls, email) -> Self | None:
        """Find user by email"""
        collection = db_instance.get_collection('users')
        user_data = collection.find_one({'email': email})
        if user_data:
            return cls.from_dict(user_data)
        return None
    
    @classmethod
    def find_by_id(cls, user_id: str) -> Self | None:
        """Find user by ID"""
        collection = db_instance.get_collection('users')
        user_data = collection.find_one({'_id': ObjectId(user_id)})
        if user_data:
            return cls.from_dict(user_data)
        return None
    
    @classmethod
    def get_all_users(cls) -> list[Self]:
        """Get all users"""
        collection = db_instance.get_collection('users')
        users_data = collection.find()
        return [cls.from_dict(user_data) for user_data in users_data] 