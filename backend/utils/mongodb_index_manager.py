from typing import List, Dict, Any
from pymongo import MongoClient, ASCENDING, DESCENDING, TEXT
from pymongo.database import Database
from pymongo.collection import Collection

class MongoDBIndexManager:
    def __init__(self, db: Database):
        self.db = db
        self.indexes = {
            'ircc_credentials': [
                {
                    'name': 'user_id_application_number',
                    'keys': [
                        ('user_id', ASCENDING),
                        ('application_number', ASCENDING)
                    ],
                    'unique': True
                },
                {
                    'name': 'ircc_username',
                    'keys': [('ircc_username', ASCENDING)],
                    'unique': True
                },
                {
                    'name': 'email',
                    'keys': [('email', ASCENDING)]
                },
                {
                    'name': 'is_active',
                    'keys': [('is_active', ASCENDING)]
                }
            ],
            'application_records': [
                {
                    'name': 'application_number_last_updated_time',
                    'keys': [
                        ('application_number', ASCENDING),
                        ('lastUpdatedTime', DESCENDING)
                    ],
                    'unique': True
                },
                {
                    'name': 'application_number',
                    'keys': [('application_number', ASCENDING)]
                },
                {
                    'name': 'last_updated_time',
                    'keys': [('lastUpdatedTime', DESCENDING)]
                },
                {
                    'name': 'uci',
                    'keys': [('uci', ASCENDING)]
                }
            ],
            'users': [
                {
                    'name': 'email',
                    'keys': [('email', ASCENDING)],
                    'unique': True
                }
            ]
        }

    def ensure_indexes(self) -> Dict[str, List[str]]:
        """
        Ensure all required indexes exist in the database
        
        Returns:
            Dict[str, List[str]]: Dictionary containing created indexes for each collection
        """
        created_indexes = {}
        
        for collection_name, indexes in self.indexes.items():
            collection = self.db.get_collection(collection_name)
            if collection is None:
                collection = self.db.create_collection(collection_name)
            created_indexes[collection_name] = self._create_collection_indexes(collection, indexes)
            
        return created_indexes

    def _create_collection_indexes(self, collection: Collection, indexes: List[Dict[str, Any]]) -> List[str]:
        """
        Create indexes for a specific collection
        
        Args:
            collection: MongoDB collection
            indexes: List of index definitions
            
        Returns:
            List[str]: List of created index names
        """
        created_indexes = []
        existing_indexes = collection.list_indexes()
        existing_index_names = {index['name'] for index in existing_indexes}

        for index_def in indexes:
            index_name = index_def['name']
            if index_name not in existing_index_names:
                try:
                    collection.create_index(
                        index_def['keys'],
                        name=index_name,
                        unique=index_def.get('unique', False),
                        background=True
                    )
                    created_indexes.append(index_name)
                except Exception as e:
                    print(f"Error creating index {index_name} for collection {collection.name}: {str(e)}")

        return created_indexes

def init_mongodb_indexes(db: Database) -> Dict[str, List[str]]:
    """
    Initialize MongoDB indexes
    
    Args:
        db: MongoDB database instance
        
    Returns:
        Dict[str, List[str]]: Dictionary containing created indexes for each collection
    """
    index_manager = MongoDBIndexManager(db)
    return index_manager.ensure_indexes() 