"""Database connection manager using MongoDB."""

from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from config import Config
import logging

logger = logging.getLogger(__name__)

class Database:
    _instance = None
    _client = None
    _db = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
        return cls._instance
    
    def connect(self):
        """Connect to MongoDB database"""
        try:
            self._client = MongoClient(Config.MONGODB_URL)
            # Test connection
            self._client.admin.command('ping')
            self._db = self._client[Config.DATABASE_NAME]
            logger.info(f"Successfully connected to MongoDB database: {Config.DATABASE_NAME}")
            return True
        except ConnectionFailure as e:
            logger.error(f"Unable to connect to MongoDB: {e}")
            return False
    
    def get_database(self):
        """Get database instance"""
        if self._db is None:
            self.connect()
        return self._db
    
    def get_collection(self, collection_name):
        """Get collection"""
        db = self.get_database()
        return db[collection_name]
    
    def close(self):
        """Close database connection"""
        if self._client:
            self._client.close()
            logger.info("Database connection closed")

# Global database instance
db_instance = Database() 