from datetime import datetime
from bson import ObjectId
from flask import Blueprint, request, jsonify
from utils.ircc_agent import IRCCAgentFactory
from models.ircc_credential import IRCCCredential
from models.user import User
from utils.encryption import encryption_manager
from routes.auth import require_auth, require_admin
import logging

logger = logging.getLogger(__name__)

credentials_bp = Blueprint('credentials', __name__, url_prefix='/api/credentials')

@credentials_bp.route('/', methods=['POST'])
@require_auth
def upload_credential():
    """User upload IRCC credentials"""
    try:
        data = request.get_json()
        
        if not data or not data.get('ircc_username') or not data.get('ircc_password'):
            return jsonify({'error': 'IRCC username and password cannot be empty'}), 400
        
        ircc_username = data.get('ircc_username').strip()
        ircc_password = data.get('ircc_password')
        application_type = data.get('application_type')
        notification_email = data.get('notification_email', request.current_user['email'])
        
        current_user_email = request.current_user['email']
        # Find user
        user = User.find_by_email(current_user_email)
        if not user:
            return jsonify({'error': 'User does not exist'}), 404
        
        if application_type not in ['citizen', 'immigrant']:
            return jsonify({'error': 'Invalid application type'}), 400
        
        ircc_agent = IRCCAgentFactory.get_ircc_agent(application_type)
        
        # Verify IRCC credentials
        if not ircc_agent.verify_ircc_credentials(current_user_email, ircc_username, ircc_password):
            return jsonify({'error': 'Invalid IRCC credentials'}), 400
        
        application_summary = ircc_agent.get_application_summary(IRCCCredential(
            user_id=current_user_email,
            ircc_username=ircc_username,
            encrypted_password=encryption_manager.encrypt(ircc_password),
            application_type=application_type,
            email=notification_email
        ))
        if not application_summary:
            return jsonify({'error': 'Failed to get application summary'}), 500
        
        application_number = application_summary.get('apps', [{}])[0].get('appNumber')
        
        # Encrypt password
        encrypted_password = encryption_manager.encrypt(ircc_password)
        
        # Create or update credentials
        credential = IRCCCredential(
            user_id=current_user_email,  # Use email as user ID
            ircc_username=ircc_username,
            encrypted_password=encrypted_password,
            application_type=application_type,
            email=notification_email,
            application_number=application_number
        )
        
        credential_id = credential.save()
        
        logger.info("User %s uploaded IRCC credentials successfully: %s", current_user_email, ircc_username)
        
        return jsonify({
            'message': 'IRCC credentials uploaded successfully',
            'credential_id': str(credential_id)
        }), 201
        
    except Exception as e:
        logger.error("Upload IRCC credentials failed: %s", str(e))
        return jsonify({'error': 'Upload failed, please try again later'}), 500

@credentials_bp.route('/my-credentials', methods=['GET'])
@require_auth
def get_my_credentials():
    """Get current user's credentials list"""
    try:
        credentials = IRCCCredential.find_by_user_id(request.current_user['email'])
        
        credential_list = []
        for credential in credentials:
            credential_list.append({
                'id': str(credential.id),
                'ircc_username': credential.ircc_username,
                'application_number': credential.application_number,
                'email': credential.email,
                'is_active': credential.is_active,
                'created_at': credential.created_at,
                'last_checked': credential.last_checked,
                'last_status': credential.last_status,
                'last_timestamp': credential.last_timestamp
            })
        
        return jsonify({
            'credentials': credential_list,
            'total': len(credential_list)
        }), 200
        
    except Exception as e:
        logger.error("Get user credentials failed: %s", str(e))
        return jsonify({'error': 'Failed to get credentials, please try again later'}), 500

@credentials_bp.route('/<credential_id>', methods=['GET'])
@require_auth
def get_credential(credential_id):
    """Get a single credential"""
    try:
        credential = IRCCCredential.find_by_id(credential_id)
        if not credential:
            return jsonify({'error': 'Specified credentials not found'}), 404
        
        if credential.user_id != request.current_user['email']:
            return jsonify({'error': 'Unauthorized'}), 403

        return jsonify(credential.to_dict()), 200
    except Exception as e:
        logger.error("Get credential failed: %s", str(e))
        return jsonify({'error': 'Failed to get credential, please try again later'}), 500
    
@credentials_bp.route('/<credential_id>', methods=['PUT'])
@require_auth
def update_credential(credential_id: str):
    """Update IRCC credentials"""
    try:
        data = request.get_json()
        
        credential_id = ObjectId(credential_id)
        ircc_password = data.get('ircc_password')
        notification_email = data.get('notification_email')
        
        # Find existing credentials
        credential = IRCCCredential.find_by_id(credential_id)
        
        if not credential:
            return jsonify({'error': 'Specified credentials not found'}), 404
        
        if credential.user_id != request.current_user['email']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Update credential information
        if ircc_password:
            credential.encrypted_password = encryption_manager.encrypt(ircc_password)
            if not IRCCAgentFactory.get_ircc_agent(credential.application_type).verify_ircc_credentials(request.current_user['user_id'], credential.ircc_username, ircc_password):
                return jsonify({'error': 'Invalid IRCC credentials'}), 400
        
        if notification_email:
            credential.email = notification_email
        
        
        credential.save()
        
        logger.info("User %s updated IRCC credentials successfully: %s", request.current_user['email'], credential.ircc_username)
        
        return jsonify({'message': 'IRCC credentials updated successfully'}), 200
        
    except Exception as e:
        logger.error("Update IRCC credentials failed: %s", str(e))
        return jsonify({'error': 'Update failed, please try again later'}), 500

@credentials_bp.route('/delete', methods=['DELETE'])
@require_auth
def delete_credential():
    """Delete IRCC credentials"""
    try:
        data = request.get_json()
        
        if not data or not data.get('ircc_username'):
            return jsonify({'error': 'IRCC username cannot be empty'}), 400
        
        ircc_username = data.get('ircc_username').strip()
        
        # Find existing credentials
        credentials = IRCCCredential.find_by_user_id(request.current_user['email'])
        credential = None
        
        for cred in credentials:
            if cred.ircc_username == ircc_username:
                credential = cred
                break
        
        if not credential:
            return jsonify({'error': 'Specified credentials not found'}), 404
        
        # Deactivate credentials
        credential.deactivate()
        
        logger.info("User %s deleted IRCC credentials successfully: %s", request.current_user['email'], ircc_username)
        
        return jsonify({'message': 'IRCC credentials deleted successfully'}), 200
        
    except Exception as e:
        logger.error("Delete IRCC credentials failed: %s", str(e))
        return jsonify({'error': 'Delete failed, please try again later'}), 500

@credentials_bp.route('/refresh', methods=['POST'])
@require_auth
def refresh_credential():
    """Refresh IRCC credentials"""
    pass

@credentials_bp.route('/all', methods=['GET'])
@require_admin
def get_all_credentials():
    """Admin get all credentials"""
    try:
        credentials = IRCCCredential.get_all_active_credentials()
        
        credential_list = []
        for credential in credentials:
            credential_list.append({
                'user_id': credential.user_id,
                'ircc_username': credential.ircc_username,
                'email': credential.email,
                'is_active': credential.is_active,
                'created_at': credential.created_at,
                'last_checked': credential.last_checked,
                'last_status': credential.last_status,
                'last_timestamp': credential.last_timestamp,
                'application_number': credential.application_number
            })
        
        return jsonify({
            'credentials': credential_list,
            'total': len(credential_list)
        }), 200
        
    except Exception as e:
        logger.error("Admin get all credentials failed: %s", str(e))
        return jsonify({'error': 'Failed to get credentials, please try again later'}), 500

@credentials_bp.route('/test-encryption', methods=['POST'])
@require_auth
def test_encryption():
    """Test encryption functionality"""
    try:
        data = request.get_json()
        
        if not data or not data.get('test_text'):
            return jsonify({'error': 'Test text cannot be empty'}), 400
        
        test_text = data.get('test_text')
        
        # Encrypt
        encrypted = encryption_manager.encrypt(test_text)
        
        # Decrypt
        decrypted = encryption_manager.decrypt(encrypted)
        
        return jsonify({
            'original': test_text,
            'encrypted': encrypted,
            'decrypted': decrypted,
            'success': test_text == decrypted
        }), 200
        
    except Exception as e:
        logger.error("Encryption test failed: %s", str(e))
        return jsonify({'error': 'Encryption test failed'}), 500 
