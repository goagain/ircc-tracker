"""Authentication routes for user registration, login, and token management."""

from flask import Blueprint, request, jsonify, current_app
from models.user import User
from models.database import db_instance
import jwt
from datetime import datetime, timedelta, timezone
from config import Config
import logging
from utils.encryption import encryption_manager
from utils.jwt_utils import create_token, verify_token
from functools import wraps
import requests
from urllib.parse import urlencode

logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"error": "Token is missing"}), 401
        try:
            token = token.split(" ")[1]
            payload = verify_token(token)
            if not payload:
                return jsonify({"error": "Invalid token"}), 401
            current_user = User.find_by_email(payload.get("email"))
            if not current_user:
                return jsonify({"error": "User not found"}), 401
        except Exception as e:
            return jsonify({"error": "Invalid token"}), 401
        return f(current_user, *args, **kwargs)

    return decorated


@auth_bp.route("/register", methods=["POST"])
def register():
    """User registration"""
    try:
        data = request.get_json()

        if not data or not data.get("email") or not data.get("password"):
            return jsonify({"error": "Email and password cannot be empty"}), 400

        email = data.get("email").lower().strip()
        password = data.get("password")

        # Check if user already exists
        existing_user = User.find_by_email(email)
        if existing_user:
            return jsonify({"error": "This email is already registered"}), 400

        # Create new user
        user = User(email=email, password=password, role="user")
        user_id = user.save()

        logger.info(f"New user registered successfully: {email}")

        return (
            jsonify(
                {
                    "message": "Registration successful",
                    "user": {"email": user.email, "role": user.role},
                }
            ),
            201,
        )

    except Exception as e:
        logger.error(f"User registration failed: {str(e)}")
        return jsonify({"error": "Registration failed, please try again later"}), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    """User login"""
    try:
        data = request.get_json()

        if not data or not data.get("email") or not data.get("password"):
            return jsonify({"error": "Email and password cannot be empty"}), 400

        email = data.get("email").lower().strip()
        password = data.get("password")

        # Find user
        user = User.find_by_email(email)
        if not user or not user.check_password(password):
            return jsonify({"error": "Incorrect email or password"}), 401

        if not user.is_active:
            return jsonify({"error": "Account has been disabled"}), 401

        # Generate JWT token
        token = create_token(user.email, user.role)

        logger.info(f"User login successful: {email}")

        return (
            jsonify(
                {
                    "message": "Login successful",
                    "token": token,
                    "user": {
                        "email": user.email,
                        "role": user.role,
                    },
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"User login failed: {str(e)}")
        return jsonify({"error": "Login failed, please try again later"}), 500


@auth_bp.route("/verify-token", methods=["POST"])
def verify_token_route():
    """Verify JWT token"""
    try:
        data = request.get_json()
        token = data.get("token") if data else None

        if not token:
            return jsonify({"error": "Token cannot be empty"}), 400

        payload = verify_token(token)
        if not payload:
            return jsonify({"error": "Token is invalid or expired"}), 401

        # Check if user still exists and is active
        user = User.find_by_email(payload.get("email"))
        if not user or not user.is_active:
            return jsonify({"error": "User does not exist or has been disabled"}), 401

        return (
            jsonify({"valid": True, "user": {"email": user.email, "role": user.role}}),
            200,
        )

    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        return jsonify({"error": "Token verification failed"}), 500


@auth_bp.route("/change-password", methods=["POST"])
@token_required
def change_password(current_user: User):
    """Change user password"""
    try:
        data = request.get_json()
        current_password = data.get("currentPassword")
        new_password = data.get("newPassword")

        if not current_password or not new_password:
            return (
                jsonify({"error": "Current password and new password are required"}),
                400,
            )

        # Verify current password
        if not current_user.check_password(current_password):
            return jsonify({"error": "Current password is incorrect"}), 401

        # Update password
        current_user.set_password(new_password)
        current_user.save()

        logger.info(f"User password changed successfully: {current_user.email}")

        return jsonify({"message": "Password changed successfully"}), 200

    except Exception as e:
        logger.error(f"Change password failed: {str(e)}")
        return jsonify({"error": "Change password failed, please try again later"}), 500


def generate_token(user):
    """Generate JWT token"""
    payload = {
        "email": user.email,
        "role": user.role,
        "exp": datetime.now(timezone.utc)
        + timedelta(hours=Config.JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc),
    }

    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm="HS256")


def decode_token(token):
    """Decode JWT token"""
    try:
        payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        return None
    except jwt.InvalidTokenError:
        logger.warning("Token is invalid")
        return None


def require_auth(f):
    """Authentication decorator"""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authentication required"}), 401

        token = auth_header.split(" ")[1]
        user_data = decode_token(token)
        if not user_data:
            return jsonify({"error": "Token is invalid or expired"}), 401

        # Add user information to request context
        request.current_user = user_data
        return f(*args, **kwargs)

    return decorated_function


def require_admin(f):
    """Admin permission decorator"""

    @wraps(f)
    @require_auth
    def decorated_function(*args, **kwargs):
        if request.current_user.get("role") != "admin":
            return jsonify({"error": "Admin permission required"}), 403

        return f(*args, **kwargs)

    return decorated_function


@auth_bp.route("/google/callback", methods=["POST"])
def google_callback():
    """Handle Google OAuth callback"""
    try:
        data = request.get_json()
        if not data or not data.get("credential"):
            return jsonify({"error": "Missing Google credential"}), 400

        # validate Google ID Token
        token = data["credential"]
        google_response = requests.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={token}", timeout=30
        )

        if google_response.status_code != 200:
            return jsonify({"error": "Invalid Google token"}), 401

        google_data = google_response.json()

        # validate Google Client ID
        if google_data.get("aud") != Config.GOOGLE_CLIENT_ID:
            return jsonify({"error": "Invalid Google Client ID"}), 401

        email = google_data.get("email")
        if not email:
            return jsonify({"error": "Email not provided by Google"}), 400

        # find or create user
        user = User.find_by_email(email)
        if not user:
            # create new user
            user = User(
                email=email,
                password=None,  # Google user does not need password
                role="user",
                is_active=True,
                google_id=google_data.get("sub"),  # store Google user ID
            )
            user.save()
            logger.info(f"New user registered via Google: {email}")
        elif not user.is_active:
            return jsonify({"error": "Account has been disabled"}), 401

        # generate JWT token
        token = create_token(user.email, user.role)

        logger.info(f"User login successful via Google: {email}")

        return (
            jsonify(
                {
                    "message": "Login successful",
                    "token": token,
                    "user": {
                        "email": user.email,
                        "role": user.role,
                    },
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Google login failed: {str(e)}")
        return jsonify({"error": "Google login failed, please try again later"}), 500


@auth_bp.route("/google/url", methods=["GET"])
def get_google_auth_url():
    """Get Google OAuth URL"""
    try:
        # get frontend URL
        frontend_url = request.headers.get("Origin", "http://localhost:3000")
        
        # build complete redirect URI
        redirect_uri = f"{frontend_url}/api/auth/google/callback"
        
        # build Google OAuth URL
        params = {
            "client_id": Config.GOOGLE_CLIENT_ID,
            "redirect_uri": redirect_uri,
            "response_type": "token",
            "scope": "email profile",
            "include_granted_scopes": "true",
            "prompt": "select_account",
        }
        
        auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
        
        return jsonify({"url": auth_url}), 200
        
    except Exception as e:
        logger.error(f"Failed to generate Google auth URL: {str(e)}")
        return jsonify({"error": "Failed to generate Google auth URL"}), 500
