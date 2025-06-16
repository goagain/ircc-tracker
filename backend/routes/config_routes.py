from flask import Blueprint, jsonify
from config import Config

config_bp = Blueprint('config', __name__)

@config_bp.route('/api/config/analytics', methods=['GET'])
def get_analytics_config():
    # 只有在配置了 ID 时才返回
    if Config.GOOGLE_ANALYTICS_ID:
        return jsonify({
            'googleAnalyticsId': Config.GOOGLE_ANALYTICS_ID
        })
    return jsonify({
        'googleAnalyticsId': None
    }) 