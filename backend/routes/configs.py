"""Configuration routes for providing client-side configuration."""

from flask import Blueprint, jsonify, make_response
from config import Config
from datetime import datetime, timedelta

config_bp = Blueprint('config', __name__, url_prefix='/api/config')

@config_bp.route('/', methods=['GET'])
def get_config():
    """Get all configuration settings."""
    response = make_response(jsonify({
        'googleClientId': Config.GOOGLE_CLIENT_ID,
        'googleAnalyticsId': Config.GOOGLE_ANALYTICS_ID
    }))
    
    # set cache control header
    # Cache-Control: public means the response can be cached by any cache storage
    # max-age=300 means the cache is valid for 5 minutes
    # stale-while-revalidate=60 means that the cache can be used for 60 seconds after it expires, while asynchronously updating the cache
    response.headers['Cache-Control'] = 'public, max-age=300, stale-while-revalidate=60'
    response.headers['ETag'] = f'"{datetime.now().strftime("%Y%m%d%H%M")}"'
    
    return response

@config_bp.route('/google-client-id', methods=['GET'])
def get_google_client_id():
    """Get Google OAuth client ID for frontend."""
    return jsonify({
        'clientId': Config.GOOGLE_CLIENT_ID
    }) 
    
@config_bp.route('/analytics', methods=['GET'])
def get_analytics_config():
    response = make_response(jsonify({
        'googleAnalyticsId': Config.GOOGLE_ANALYTICS_ID if Config.GOOGLE_ANALYTICS_ID else None
    }))
    
    # set the same cache control header
    response.headers['Cache-Control'] = 'public, max-age=300, stale-while-revalidate=60'
    response.headers['ETag'] = f'"{datetime.now().strftime("%Y%m%d%H%M")}"'
    
    return response 