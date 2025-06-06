"""JWT token utilities for authentication."""

import jwt
from datetime import datetime, timedelta, timezone
from config import Config
import logging

logger = logging.getLogger(__name__)

def create_token(email: str) -> str:
    """Create JWT token"""
    payload = {
        'email': email,
        'exp': datetime.now(timezone.utc) + timedelta(hours=Config.JWT_EXPIRATION_HOURS),
        'iat': datetime.now(timezone.utc)
    }
    
    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm='HS256')

def verify_token(token: str) -> dict:
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        return None
    except jwt.InvalidTokenError:
        logger.warning("Token is invalid")
        return None 