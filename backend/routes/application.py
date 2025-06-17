from flask import Blueprint, jsonify, request, g
from routes.auth import require_auth
from models.application_records import ApplicationRecord
from services.ircc_checker import ircc_checker
from utils.ircc_agent import IRCCAgentFactory
from models.ircc_credential import IRCCCredential
from utils.encryption import encryption_manager
from functools import wraps

application_bp = Blueprint('application', __name__, url_prefix='/api/applications')

def verify_user_credential(f):
    """验证用户是否有权限访问该申请"""
    @require_auth
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # 从请求头获取用户ID
            user_id = request.current_user.get('email')
            if not user_id and not request.current_user.get('role') == 'admin':
                return jsonify({'error': '未提供用户ID'}), 401

            # 获取申请号
            application_number = kwargs.get('application_number')
            if not application_number:
                return jsonify({'error': '未提供申请号'}), 400

            # 从数据库获取凭证
            credential = IRCCCredential.get_by_application_number(application_number)
            if not credential:
                return jsonify({'error': '申请记录不存在'}), 404

            # 验证用户ID是否匹配
            if credential.user_id != user_id and not request.current_user.get('role') == 'admin':
                return jsonify({'error': '无权访问该申请记录'}), 403

            # 将凭证存储在g对象中供路由函数使用
            g.credential = credential
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return decorated_function

def verify_user(f):
    """验证用户是否已登录"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # 从请求头获取用户ID
            user_id = request.headers.get('X-User-ID')
            if not user_id:
                return jsonify({'error': '未提供用户ID'}), 401

            # 将用户ID存储在g对象中供路由函数使用
            g.user_id = user_id
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return decorated_function

@application_bp.route('/', methods=['GET'])
@verify_user
def get_user_applications():
    """获取用户的所有申请记录"""
    try:
        # 获取用户的所有凭证
        credentials = IRCCCredential.find_by_user_id(g.user_id)
        if not credentials:
            return jsonify({'applications': []})

        # 获取每个申请的详细信息
        applications = []
        for credential in credentials:
            try:
                ircc_agent = IRCCAgentFactory.get_ircc_agent(credential.application_type)
                application_record = ircc_agent.get_application_details(credential)
                
                if application_record:
                    applications.append(application_record.to_dict())
            except Exception as e:
                # 如果获取某个申请详情失败，记录错误但继续处理其他申请
                print(f"Error fetching application {credential.application_number}: {str(e)}")
                continue

        # 按最后更新时间排序
        applications.sort(key=lambda x: x['lastUpdatedTime'], reverse=True)
        
        return jsonify({
            'applications': applications,
            'total': len(applications)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@application_bp.route('/<application_number>', methods=['GET'])
@verify_user_credential
def get_application_status(application_number: str):
    """获取申请状态"""
    try:
        credential = g.credential
        # 获取申请详情
        application_data = ApplicationRecord.get_by_application_number(application_number)
        if not application_data:
            return jsonify({'error': 'Failed to fetch application details'}), 500

        # 转换为ApplicationRecord对象
        application_record = ApplicationRecord.from_dict(application_data)
        
        return jsonify(application_record.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@application_bp.route('/<application_number>/<timestamp>', methods=['GET'])
@verify_user_credential
def get_application_status_by_timestamp(application_number: str, timestamp: int | str | None = None):
    """获取申请状态"""
    try:
        credential = g.credential
        
        if timestamp == 'latest':
            timestamp = g.credential.last_timestamp
            
        # 获取申请详情
        application_records = ApplicationRecord.get_by_application_number(application_number, timestamp)
        if not application_records:
            return jsonify({'error': 'No application record found'}), 404
        application_data = application_records[0]
        if not application_data:
            return jsonify({'error': 'Failed to fetch application details'}), 500

        # 转换为ApplicationRecord对象
        application_record = application_data
        
        return jsonify(application_record.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500