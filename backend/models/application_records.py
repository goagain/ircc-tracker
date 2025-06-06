from datetime import datetime, timezone
from typing import List, Dict, Optional
from dataclasses import dataclass
from enum import Enum

from bson import ObjectId
from models.database import db_instance

class ActivityStatus(Enum):
    IN_PROGRESS = "inProgress"
    NOT_STARTED = "notStarted"
    COMPLETED = "completed"

@dataclass
class Activity:
    activity: str
    order: int
    status: ActivityStatus

@dataclass
class BilingualText:
    en: str
    fr: str

@dataclass
class HistoryRecord:
    time: int
    is_new: bool
    is_waiting: bool
    type: str
    activity: str
    load_time: int
    title: BilingualText
    text: BilingualText

class ApplicationRecord:
    def __init__(
        self,
        application_number: str,
        uci: str,
        last_updated_time: int,
        status: str,
        activities: List[Activity],
        history: List[HistoryRecord],
        actions: List[str] = None
    ):
        self._id : Optional[ObjectId] = None
        self.application_number = application_number
        self.uci = uci
        self.last_updated_time = last_updated_time
        self.status = status
        self.activities = activities
        self.history = history
        self.actions = actions or []
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)
        
    @classmethod
    def from_dict(cls, data: dict) -> 'ApplicationRecord':
        """Create ApplicationRecord instance from dictionary"""
        activities = [
            Activity(
                activity=activity_data["activity"],
                order=activity_data["order"],
                status=ActivityStatus(activity_data["status"])
            )
            for activity_data in data.get("activities", [])
        ]

        history = [
            HistoryRecord(
                time=record["time"],
                is_new=record["isNew"],
                is_waiting=record["isWaiting"],
                type=record["type"],
                activity=record["activity"],
                load_time=record["loadTime"],
                title=BilingualText(**record["title"]),
                text=BilingualText(**record["text"])
            )
            for record in data.get("history", [])
        ]

        record = cls(
            application_number=data["applicationNumber"],
            uci=data["uci"],
            last_updated_time=data["lastUpdatedTime"],
            status=data["status"],
            activities=activities,
            history=history,
            actions=data.get("actions", []),
        )
        record.updated_at = data.get("updatedAt", datetime.now(timezone.utc))
        record.created_at = data.get("createdAt", datetime.now(timezone.utc))
        return record
    
    def to_dict(self) -> dict:
        """Convert ApplicationRecord instance to dictionary"""
        return {
            "applicationNumber": self.application_number,
            "uci": self.uci,
            "lastUpdatedTime": self.last_updated_time,
            "status": self.status,
            "activities": [
                {
                    "activity": activity.activity,
                    "order": activity.order,
                    "status": activity.status.value
                }
                for activity in self.activities
            ],
            "history": [
                {
                    "time": record.time,
                    "isNew": record.is_new,
                    "isWaiting": record.is_waiting,
                    "type": record.type,
                    "activity": record.activity,
                    "loadTime": record.load_time,
                    "title": {
                        "en": record.title.en,
                        "fr": record.title.fr
                    },
                    "text": {
                        "en": record.text.en,
                        "fr": record.text.fr
                    }
                }
                for record in self.history
            ],
            "actions": self.actions,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at
        }

    def get_last_updated_datetime(self) -> datetime:
        """Get datetime object of last updated time"""
        return datetime.fromtimestamp(self.last_updated_time / 1000)

    def get_activity_status(self, activity: str) -> Optional[ActivityStatus]:
        """Get status of specific activity"""
        for activity in self.activities:
            if activity.activity == activity:
                return activity.status
        return None

    @classmethod
    def get_latest_record(cls, application_number: str) -> Optional['ApplicationRecord']:
        """Get latest application record"""
        records = cls.get_by_application_number(application_number, None)
        if records:
            return records[0]
        else:
            return None
    
    @classmethod
    def get_by_application_number(cls, application_number: str, timestamp: int | str | None = None) -> List['ApplicationRecord']:
        """Get application record by application number"""
        collection = db_instance.get_collection('application_records')
        query = {'applicationNumber': application_number}
        if timestamp:
            query['lastUpdatedTime'] = timestamp
            
        return [cls.from_dict(data) for data in collection.find(query, sort=[('lastUpdatedTime', -1)])]
    
    def save(self) -> str:
        """Save application record to database"""
        collection = db_instance.get_collection('application_records')
        self.updated_at = datetime.now(timezone.utc)
        
        # Check if application record already exists
        existing_record = collection.find_one({'applicationNumber': self.application_number, 'lastUpdatedTime': self.last_updated_time})
        if existing_record:
            # Update existing record
            collection.update_one(
                {'applicationNumber': self.application_number},
                {'$set': self.to_dict()}
            )
            return existing_record['_id']
        else:
            # Insert new record
            result = collection.insert_one(self.to_dict())
            return result.inserted_id


