"""Configuration settings for the IRCC Tracker application."""

import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # MongoDB configuration
    MONGODB_URL = os.getenv('MONGODB_URL', 'mongodb://localhost:27017/')
    DATABASE_NAME = os.getenv('DATABASE_NAME', 'ircc_tracker')
    
    # Flask configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-change-this-in-production')
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    
    # AES encryption configuration
    ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY', 'your-32-byte-encryption-key-here!')
    
    # Email configuration
    SMTP_SERVER = os.getenv('SMTP_SERVER', '')
    SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
    SMTP_USERNAME = os.getenv('SMTP_USERNAME', '')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
    FROM_EMAIL = os.getenv('FROM_EMAIL', '')
    # Scheduled task configuration
    CHECK_INTERVAL_MINUTES = int(os.getenv('CHECK_INTERVAL_MINUTES', '10'))
    
    # JWT configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-this')
    JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', '24'))
    
    # Admin configuration
    ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@example.com')
    ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'admin123')  # Please change this in production

    # IRCC check URL
    IRCC_CITIZEN_CHECK_URL = os.getenv('IRCC_CITIZEN_CHECK_URL', 'https://tracker-suivi.apps.cic.gc.ca/en/login')
    IRCC_IMMIGRANT_CHECK_URL = os.getenv('IRCC_IMMIGRANT_CHECK_URL', 'https://ircc-tracker-suivi.apps.cic.gc.ca/en/login')

    # Google Analytics
    GOOGLE_ANALYTICS_ID = os.getenv('GOOGLE_ANALYTICS_ID')

# Example configuration file - copy as config.py and modify actual values
EXAMPLE_ENV = """
# MongoDB configuration
MONGODB_URL=mongodb://localhost:27017/
DATABASE_NAME=ircc_tracker

# Flask configuration
SECRET_KEY=your-very-secure-secret-key-here
DEBUG=True

# AES encryption key (32 bytes)
ENCRYPTION_KEY=your-32-byte-encryption-key-here!

# Email configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com

# Scheduled task configuration
CHECK_INTERVAL_MINUTES=10

# JWT configuration
JWT_SECRET_KEY=your-jwt-secret-key
JWT_EXPIRATION_HOURS=24

# Admin configuration
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure-admin-password
""" 