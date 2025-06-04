"""Authentication routes for user registration, login, and token management."""

from flask import Blueprint, request, jsonify
from models.user import User
from models.database import db_instance
import jwt
from datetime import datetime, timedelta, timezone
from config import Config
import logging

logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """User registration"""
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password cannot be empty'}), 400
        
        email = data.get('email').lower().strip()
        password = data.get('password')
        
        # Check if user already exists
        existing_user = User.find_by_email(email)
        if existing_user:
            return jsonify({'error': 'This email is already registered'}), 400
        
        # Create new user
        user = User(email=email, password=password, role='user')
        user_id = user.save()
        
        logger.info(f"New user registered successfully: {email}")
        
        return jsonify({
            'message': 'Registration successful',
            'user': {
                'email': user.email,
                'role': user.role
            }
        }), 201
        
    except Exception as e:
        logger.error(f"User registration failed: {str(e)}")
        return jsonify({'error': 'Registration failed, please try again later'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password cannot be empty'}), 400
        
        email = data.get('email').lower().strip()
        password = data.get('password')
        
        # Find user
        user = User.find_by_email(email)
        if not user or not user.check_password(password):
            return jsonify({'error': 'Incorrect email or password'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account has been disabled'}), 401
        
        # Generate JWT token
        token = generate_token(user)
        
        logger.info(f"User login successful: {email}")
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'email': user.email,
                'role': user.role,
            }
        }), 200
        
    except Exception as e:
        logger.error(f"User login failed: {str(e)}")
        return jsonify({'error': 'Login failed, please try again later'}), 500

@auth_bp.route('/verify-token', methods=['POST'])
def verify_token():
    """Verify JWT token"""
    try:
        data = request.get_json()
        token = data.get('token') if data else None
        
        if not token:
            return jsonify({'error': 'Token cannot be empty'}), 400
        
        user_data = decode_token(token)
        if not user_data:
            return jsonify({'error': 'Token is invalid or expired'}), 401
        
        # Check if user still exists and is active
        user = User.find_by_email(user_data['email'])
        if not user or not user.is_active:
            return jsonify({'error': 'User does not exist or has been disabled'}), 401
        
        return jsonify({
            'valid': True,
            'user': {
                'email': user.email,
                'role': user.role
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        return jsonify({'error': 'Token verification failed'}), 500

@auth_bp.route('/change-password', methods=['POST'])
def change_password():
    """Change password"""
    try:
        # Get token from request header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
        
        token = auth_header.split(' ')[1]
        user_data = decode_token(token)
        if not user_data:
            return jsonify({'error': 'Token is invalid or expired'}), 401
        
        data = request.get_json()
        if not data or not data.get('old_password') or not data.get('new_password'):
            return jsonify({'error': 'Old password and new password cannot be empty'}), 400
        
        old_password = data.get('old_password')
        new_password = data.get('new_password')
        
        # Find user
        user = User.find_by_email(user_data['email'])
        if not user:
            return jsonify({'error': 'User does not exist'}), 404
        
        # Verify old password
        if not user.check_password(old_password):
            return jsonify({'error': 'Old password is incorrect'}), 400
        
        # Update password
        user.password_hash = user._hash_password(new_password)
        user.save()
        
        logger.info(f"User password changed successfully: {user.email}")
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        logger.error(f"Change password failed: {str(e)}")
        return jsonify({'error': 'Change password failed, please try again later'}), 500

def generate_token(user):
    """Generate JWT token"""
    payload = {
        'email': user.email,
        'role': user.role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=Config.JWT_EXPIRATION_HOURS),
        'iat': datetime.now(timezone.utc)
    }
    
    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm='HS256')

def decode_token(token):
    """Decode JWT token"""
    try:
        payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        return None
    except jwt.InvalidTokenError:
        logger.warning("Token is invalid")
        return None

def require_auth(f):
    """Authentication decorator"""
    from functools import wraps
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
        
        token = auth_header.split(' ')[1]
        user_data = decode_token(token)
        if not user_data:
            return jsonify({'error': 'Token is invalid or expired'}), 401
        
        # Add user information to request context
        request.current_user = user_data
        return f(*args, **kwargs)
    
    return decorated_function

def require_admin(f):
    """Admin permission decorator"""
    from functools import wraps
    
    @wraps(f)
    @require_auth
    def decorated_function(*args, **kwargs):
        if request.current_user.get('role') != 'admin':
            return jsonify({'error': 'Admin permission required'}), 403
        
        return f(*args, **kwargs)
    
    return decorated_function 