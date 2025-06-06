"""Encryption utilities for securing sensitive user data using Fernet encryption."""

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os
from config import Config

class EncryptionManager:
    def __init__(self):
        self.key = Config.ENCRYPTION_KEY.encode()
        
    def generate_salt(self) -> str:
        """Generate random salt"""
        return os.urandom(16).hex()
    
    def _get_or_create_key(self, salt: str) -> bytes:
        """Get or create encryption key"""
        # Use key from config as password
        password = Config.ENCRYPTION_KEY.encode()
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        
        key = base64.urlsafe_b64encode(kdf.derive(password))
        return key
    
    def encrypt(self, salt: str, plaintext: str) -> str | None:
        """Encrypt text"""
        if not plaintext:
            return None
        
        try:
            # Convert string to bytes
            plaintext_bytes = plaintext.encode('utf-8')
            salt_bytes = salt.encode('utf-8')
            fernet = Fernet(self._get_or_create_key(salt_bytes))
            # Encrypt
            encrypted_bytes = fernet.encrypt(plaintext_bytes)
            # Convert to base64 string for storage
            return base64.urlsafe_b64encode(encrypted_bytes).decode('utf-8')
        except Exception as e:
            raise Exception(f"Encryption failed: {str(e)}")
    
    def decrypt(self, salt: str, encrypted_text: str) -> str | None:
        """Decrypt text"""
        if not encrypted_text:
            return None
        
        try:
            # Convert from base64 string to bytes
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_text.encode('utf-8'))
            salt_bytes = salt.encode('utf-8')
            fernet = Fernet(self._get_or_create_key(salt_bytes))
            # Decrypt
            decrypted_bytes = fernet.decrypt(encrypted_bytes)
            # Convert to string
            return decrypted_bytes.decode('utf-8')
        except Exception as e:
            raise Exception(f"Decryption failed: {str(e)}")
    
# Global encryption manager instance
encryption_manager = EncryptionManager() 