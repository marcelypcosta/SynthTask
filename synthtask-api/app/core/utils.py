"""
Core utility functions for database operations and response formatting
Centralizes all database queries and model conversions
"""
from typing import Dict, Optional
from bson import ObjectId
from datetime import datetime

from .database import database, users_table, meetings_collection
from ..models import User, ProcessedMeeting, Task


# ============================================================================
# USER DATABASE OPERATIONS
# ============================================================================

async def get_user_by_email(email: str) -> Optional[Dict]:
    """
    Fetch user from database by email address.
    
    Args:
        email: User email address
        
    Returns:
        User dictionary from database or None if not found
    """
    query = users_table.select().where(users_table.c.email == email)
    return await database.fetch_one(query)


async def get_user_by_id(user_id: int) -> Optional[Dict]:
    """
    Fetch user from database by ID.
    
    Args:
        user_id: User ID
        
    Returns:
        User dictionary from database or None if not found
    """
    query = users_table.select().where(users_table.c.id == user_id)
    return await database.fetch_one(query)


async def update_user_field(user_id: int, **fields) -> None:
    """
    Update specific user fields in database.
    
    Args:
        user_id: User ID
        **fields: Key-value pairs of fields to update
        
    Example:
        await update_user_field(1, trello_api_key="xxx", trello_token="yyy")
    """
    query = users_table.update().where(
        users_table.c.id == user_id
    ).values(**fields)
    await database.execute(query)


# ============================================================================
# USER RESPONSE FORMATTING
# ============================================================================

def format_user_response(user_data: Dict) -> User:
    """
    Convert database user dictionary to User Pydantic model.
    Handles all optional Trello fields gracefully.
    
    Args:
        user_data: Raw user dictionary from database
        
    Returns:
        User Pydantic model instance
    """
    return User(
        id=user_data["id"],
        email=user_data["email"],
        name=user_data["name"],
        trello_api_key=user_data.get("trello_api_key"),
        trello_token=user_data.get("trello_token"),
        trello_list_id=user_data.get("trello_list_id"),
    )


# ============================================================================
# MEETING DATABASE OPERATIONS (MongoDB)
# ============================================================================

async def get_user_meeting(meeting_id: str, user_id: int) -> Optional[Dict]:
    """
    Fetch meeting from MongoDB by ID with ownership validation.
    Ensures user can only access their own meetings.
    
    Args:
        meeting_id: MongoDB meeting ObjectId as string
        user_id: User ID for ownership check
        
    Returns:
        Meeting dictionary from MongoDB or None if not found
        
    Raises:
        Exception: If meeting_id is not a valid MongoDB ObjectId
    """
    try:
        return await meetings_collection.find_one({
            "_id": ObjectId(meeting_id),
            "user_id": user_id
        })
    except Exception as e:
        raise ValueError(f"ID de reunião inválido: {str(e)}")


async def get_user_meetings(user_id: int, limit: int = 100) -> list[Dict]:
    """
    Fetch all meetings for a user, sorted by creation date (newest first).
    
    Args:
        user_id: User ID
        limit: Maximum number of meetings to return
        
    Returns:
        List of meeting dictionaries from MongoDB
    """
    cursor = meetings_collection.find({"user_id": user_id}).sort("created_at", -1)
    return await cursor.to_list(length=limit)


async def save_processed_meeting(
    user_id: int,
    original_text: str,
    processed_data: Dict,
    file_name: Optional[str] = None
) -> str:
    """
    Save a processed meeting to MongoDB.
    Centralizes meeting document structure to prevent inconsistencies.
    
    Args:
        user_id: User ID (owner)
        original_text: Original meeting text/content
        processed_data: Dictionary containing 'summary', 'key_points', 'tasks'
        file_name: Optional original filename if uploaded
        
    Returns:
        MongoDB ObjectId as string (meeting_id)
        
    Example:
        meeting_id = await save_processed_meeting(
            user_id=1,
            original_text="Meeting notes...",
            processed_data={"summary": "...", "key_points": [...], "tasks": [...]},
            file_name="meeting.txt"
        )
    """
    meeting_doc = {
        "user_id": user_id,
        "original_text": original_text,
        "summary": processed_data["summary"],
        "key_points": processed_data["key_points"],
        "tasks": processed_data["tasks"],
        "created_at": datetime.utcnow(),
        "sent_to_trello": False
    }
    
    if file_name:
        meeting_doc["file_name"] = file_name
    
    result = await meetings_collection.insert_one(meeting_doc)
    return str(result.inserted_id)


async def update_meeting_tasks(meeting_id: str, tasks: list[Dict]) -> None:
    """
    Update the tasks array in a meeting document.
    
    Args:
        meeting_id: MongoDB meeting ObjectId as string
        tasks: New list of task dictionaries
    """
    await meetings_collection.update_one(
        {"_id": ObjectId(meeting_id)},
        {"$set": {"tasks": tasks}}
    )


async def mark_meeting_sent_to_trello(meeting_id: str) -> None:
    """
    Mark a meeting as sent to Trello (update sent_to_trello flag).
    
    Args:
        meeting_id: MongoDB meeting ObjectId as string
    """
    await meetings_collection.update_one(
        {"_id": ObjectId(meeting_id)},
        {"$set": {"sent_to_trello": True}}
    )


# ============================================================================
# MEETING RESPONSE FORMATTING
# ============================================================================

def format_meeting_response(
    meeting_data: Dict,
    meeting_id: Optional[str] = None
) -> ProcessedMeeting:
    """
    Convert MongoDB meeting document to ProcessedMeeting Pydantic model.
    
    Args:
        meeting_data: Raw meeting dictionary from MongoDB
        meeting_id: Optional override for meeting ID (if not in data as _id)
        
    Returns:
        ProcessedMeeting Pydantic model instance
    """
    if not meeting_id:
        meeting_id = str(meeting_data.get("_id", ""))
    
    return ProcessedMeeting(
        id=meeting_id,
        summary=meeting_data["summary"],
        key_points=meeting_data["key_points"],
        tasks=[Task(**task) for task in meeting_data["tasks"]],
        created_at=meeting_data["created_at"].isoformat(),
        sent_to_trello=meeting_data.get("sent_to_trello", False)
    )


# ============================================================================
# VALIDATION HELPERS
# ============================================================================

def validate_trello_config(user: Dict) -> bool:
    """
    Validate that user has all required Trello configuration.
    
    Args:
        user: User dictionary from database
        
    Returns:
        True if all Trello fields are configured, False otherwise
    """
    return bool(
        user.get("trello_api_key") and
        user.get("trello_token") and
        user.get("trello_list_id")
    )


def validate_object_id(obj_id: str) -> bool:
    """
    Validate if string is a valid MongoDB ObjectId.
    
    Args:
        obj_id: String to validate as ObjectId
        
    Returns:
        True if valid ObjectId format, False otherwise
    """
    try:
        ObjectId(obj_id)
        return True
    except Exception:
        return False
