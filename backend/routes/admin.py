from flask import Blueprint, request, jsonify
from models.user import User
from models.ircc_credential import IRCCCredential
from services.scheduler import task_scheduler
from services.ircc_checker import ircc_checker
from routes.auth import require_admin
from utils.email_sender import email_sender
import logging

logger = logging.getLogger(__name__)

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.route("/dashboard", methods=["GET"])
@require_admin
def get_dashboard_stats():
    """Get admin dashboard statistics"""
    try:
        # Get user statistics
        all_users = User.get_all_users()
        active_users = [user for user in all_users if user.is_active]

        # Get credential statistics
        all_credentials = IRCCCredential.get_all_active_credentials()

        # Get scheduler status
        scheduler_status = task_scheduler.get_job_status()

        # Calculate status distribution
        status_counts = {}
        for credential in all_credentials:
            status = credential.last_status or "Unknown"
            status_counts[status] = status_counts.get(status, 0) + 1

        return (
            jsonify(
                {
                    "users": {
                        "total": len(all_users),
                        "active": len(active_users),
                        "inactive": len(all_users) - len(active_users),
                    },
                    "credentials": {
                        "total": len(all_credentials),
                        "status_distribution": status_counts,
                    },
                    "scheduler": scheduler_status,
                    "system_status": "running",
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Failed to get dashboard statistics: {str(e)}")
        return jsonify({"error": "Failed to get statistics"}), 500


@admin_bp.route("/users", methods=["GET"])
@require_admin
def get_all_users():
    """Get all users list"""
    try:
        users = User.get_all_users()

        user_list = []
        for user in users:
            # Get user's credential count
            credentials = IRCCCredential.find_by_user_id(user.email)

            user_list.append(
                {
                    "email": user.email,
                    "role": user.role,
                    "is_active": user.is_active,
                    "created_at": user.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                    "credentials_count": len(credentials),
                }
            )

        return jsonify({"users": user_list, "total": len(user_list)}), 200

    except Exception as e:
        logger.error(f"Failed to get user list: {str(e)}")
        return jsonify({"error": "Failed to get user list"}), 500


@admin_bp.route("/users/<email>/toggle-status", methods=["PUT"])
@require_admin
def toggle_user_status(email):
    """Toggle user active status"""
    try:
        user = User.find_by_email(email)
        if not user:
            return jsonify({"error": "User not found"}), 404

        user.is_active = not user.is_active
        user.save()

        status = "activated" if user.is_active else "deactivated"
        logger.info(f"Admin {request.current_user['email']} {status}ed user: {email}")

        return jsonify({"message": f"User {status}", "is_active": user.is_active}), 200

    except Exception as e:
        logger.error(f"Failed to toggle user status: {str(e)}")
        return jsonify({"error": "Operation failed"}), 500


@admin_bp.route("/users/<email>/role", methods=["PUT"])
@require_admin
def update_user_role(email):
    """Update user role"""
    try:
        data = request.get_json()
        if not data or not data.get("role"):
            return jsonify({"error": "Role cannot be empty"}), 400

        new_role = data.get("role")
        if new_role not in ["user", "admin"]:
            return jsonify({"error": "Invalid role"}), 400

        user = User.find_by_email(email)
        if not user:
            return jsonify({"error": "User not found"}), 404

        user.role = new_role
        user.save()

        logger.info(
            f"Admin {request.current_user['email']} updated user {email} role to: {new_role}"
        )

        return (
            jsonify({"message": "User role update successful", "role": user.role}),
            200,
        )

    except Exception as e:
        logger.error(f"Failed to update user role: {str(e)}")
        return jsonify({"error": "Update failed"}), 500


@admin_bp.route("/scheduler/status", methods=["GET"])
@require_admin
def get_scheduler_status():
    """Get scheduler status"""
    try:
        status = task_scheduler.get_job_status()
        return jsonify(status), 200

    except Exception as e:
        logger.error(f"Failed to get scheduler status: {str(e)}")
        return jsonify({"error": "Failed to get status"}), 500


@admin_bp.route("/scheduler/start", methods=["POST"])
@require_admin
def start_scheduler():
    """Start scheduler"""
    try:
        task_scheduler.start()

        logger.info(f"Admin {request.current_user['email']} started scheduler")

        return jsonify({"message": "Scheduler start successful"}), 200

    except Exception as e:
        logger.error(f"Failed to start scheduler: {str(e)}")
        return jsonify({"error": "Start failed"}), 500


@admin_bp.route("/scheduler/stop", methods=["POST"])
@require_admin
def stop_scheduler():
    """Stop scheduler"""
    try:
        task_scheduler.stop()

        logger.info(f"Admin {request.current_user['email']} stopped scheduler")

        return jsonify({"message": "Scheduler stop successful"}), 200

    except Exception as e:
        logger.error(f"Failed to stop scheduler: {str(e)}")
        return jsonify({"error": "Stop failed"}), 500


@admin_bp.route("/test/ircc-connection", methods=["POST"])
@require_admin
def test_ircc_connection():
    """Test IRCC website connection"""
    try:
        success = ircc_checker.test_connection()

        return (
            jsonify(
                {
                    "success": success,
                    "message": (
                        "IRCC website connection normal"
                        if success
                        else "IRCC website connection failed"
                    ),
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Failed to test IRCC connection: {str(e)}")
        return jsonify({"error": "Connection test failed"}), 500


@admin_bp.route("/test/email", methods=["POST"])
@require_admin
def test_email():
    """Test email service"""
    try:
        success = email_sender.test_connection()

        return (
            jsonify(
                {
                    "success": success,
                    "message": (
                        "Email service connection normal"
                        if success
                        else "Email service connection failed"
                    ),
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Failed to test email service: {str(e)}")
        return jsonify({"error": "Email test failed"}), 500


@admin_bp.route("/test/send-email", methods=["POST"])
@require_admin
def send_test_email():
    """Send test email"""
    try:
        data = request.get_json()
        if not data or not data.get("email"):
            return jsonify({"error": "Email address cannot be empty"}), 400

        test_email = data.get("email")

        success = email_sender.send_status_update_email(
            test_email, "test_user", "Old status", "New status", None
        )

        if success:
            logger.info(
                f"Admin {request.current_user['email']} sent test email to: {test_email}"
            )
            return jsonify({"message": "Test email send successful"}), 200
        else:
            return jsonify({"error": "Test email send failed"}), 500

    except Exception as e:
        logger.error(f"Failed to send test email: {str(e)}")
        return jsonify({"error": "Send failed"}), 500


@admin_bp.route("/check-all", methods=["POST"])
@require_admin
def trigger_immediate_check():
    """Trigger immediate status check"""
    try:
        # Add one-time job
        job_id = task_scheduler.add_one_time_job(ircc_checker.check_all_credentials)

        if job_id:
            logger.info(
                f"Admin {request.current_user['email']} triggered immediate check"
            )
            return (
                jsonify({"message": "Immediate check triggered", "job_id": job_id}),
                200,
            )
        else:
            return jsonify({"error": "Trigger check failed"}), 500

    except Exception as e:
        logger.error(f"Failed to trigger immediate check: {str(e)}")
        return jsonify({"error": "Trigger failed"}), 500


@admin_bp.route("/logs", methods=["GET"])
@require_admin
def get_system_logs():
    """Get system logs (simplified version)"""
    try:
        # Here can implement log reading function
        # For simplification, return basic information

        return jsonify({"message": "Log function not implemented yet", "logs": []}), 200

    except Exception as e:
        logger.error(f"Failed to get system logs: {str(e)}")
        return jsonify({"error": "Failed to get logs"}), 500


@admin_bp.route("/test-email", methods=["POST"])
@require_admin
def test_email_route():
    """Test email sending functionality"""
    try:
        success = email_sender.send_test_email()
        return jsonify({"success": success}), 200
    except Exception as e:
        logger.error(f"Failed to test email: {str(e)}")
        return jsonify({"error": "Failed to test email"}), 500
