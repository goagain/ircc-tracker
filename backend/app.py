"""Main Flask application module for the IRCC Tracker API server."""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from models.database import db_instance
from models.user import User
from routes.auth import auth_bp
from routes.credentials import credentials_bp
from routes.application import application_bp
from routes.admin import admin_bp
from services.scheduler import task_scheduler
from config import Config
import logging
import os
from utils.mongodb_index_manager import init_mongodb_indexes
from models.database import db_instance

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s',
    handlers=[
        logging.FileHandler('ircc_tracker.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

def create_app():
    """Create Flask application"""
    app = Flask(__name__, 
                static_folder='static',
                static_url_path='')
    
    # Configure application
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['DEBUG'] = Config.DEBUG
    
    # Enable CORS
    CORS(app, origins=["http://localhost:3000"])  # React frontend default port
        
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(credentials_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(application_bp)
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'message': 'IRCC Tracker API is running',
            'version': '1.0.0'
        }), 200
    
    # Serve static files and handle frontend routes
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        if path.startswith('api/') and not any(rule.endpoint != 'static' and rule.rule.startswith('/api/') for rule in app.url_map.iter_rules()):
            return jsonify({'error': 'API endpoint not found'}), 404
            
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
            
        return send_from_directory(app.static_folder, 'index.html')
    
    @app.errorhandler(404)
    def not_found(error):
        if request.path.startswith('/api/'):
            return jsonify({'error': 'API endpoint not found'}), 404
        return send_from_directory(app.static_folder, 'index.html')
    
    # Error handling
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'error': 'Bad request format'}), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({'error': 'Unauthorized access'}), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    return app

def initialize_database():
    """Initialize database"""
    try:
        logger.info("Connecting to database...")
        
        # Connect to database
        if db_instance.connect():
            logger.info("Database connection successful")
            
            # Initialize MongoDB indexes
            created_indexes = init_mongodb_indexes(db_instance)
            print("Created MongoDB indexes:", created_indexes)
            
            # Create default admin user
            create_admin_user()
            
        else:
            logger.error("Database connection failed")
            return False
            
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        return False
    
    return True

def create_admin_user():
    """Create default admin user"""
    try:
        admin_email = Config.ADMIN_EMAIL
        admin_password = Config.ADMIN_PASSWORD
        
        # Check if admin user already exists
        existing_admin = User.find_by_email(admin_email)
        
        if not existing_admin:
            # Create admin user
            admin_user = User(
                email=admin_email,
                password=admin_password,
                role='admin'
            )
            admin_user.save()
            logger.info(f"Default admin user created: {admin_email}")
        else:
            # Ensure existing user is admin
            if existing_admin.role != 'admin':
                existing_admin.role = 'admin'
                existing_admin.save()
                logger.info(f"User {admin_email} role updated to admin")
            else:
                logger.info(f"Admin user already exists: {admin_email}")
                
    except Exception as e:
        logger.error(f"Failed to create admin user: {str(e)}")

def initialize_scheduler():
    """Initialize task scheduler"""
    try:
        logger.info("Starting task scheduler...")
        task_scheduler.start()
        logger.info("Task scheduler started successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to start task scheduler: {str(e)}")
        return False

def main():
    """Main function"""
    logger.info("IRCC Tracker starting...")
    
    # Initialize database
    if not initialize_database():
        logger.error("Failed to initialize database. Exiting...")
        return
    
    # # Initialize scheduler
    if not initialize_scheduler():
        logger.error("Failed to initialize scheduler. Continuing without scheduler...")
    
    # Create Flask application
    app = create_app()
    
    try:
        # Start server
        port = int(os.environ.get('PORT', 5000))
        host = os.environ.get('HOST', '127.0.0.1')
        
        logger.info(f"Starting server on {host}:{port}")
        app.run(host=host, port=port, debug=Config.DEBUG)
        
    except KeyboardInterrupt:
        logger.info("Server shutdown requested by user")
    except Exception as e:
        logger.error(f"Server startup failed: {str(e)}")
    finally:
        # Cleanup
        try:
            task_scheduler.stop()
            db_instance.close()
            logger.info("Application cleanup completed")
        except:
            pass

if __name__ == '__main__':
    main() 