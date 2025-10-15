"""
Meeting and task management routes for the Sintask API
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from bson import ObjectId
from typing import List

from ..models import (
    MeetingText, ProcessedMeeting, Task, TaskUpdate, SendToTrelloRequest,
    MessageResponse, SendToTrelloResponse, TrelloCardResponse
)
from ..core.auth import get_current_user
from ..core.database import meetings_collection
from ..services.ai_service import ai_service
from ..services.trello_service import trello_service

router = APIRouter(prefix="/api/meetings", tags=["Meetings"])


@router.post("/process", response_model=ProcessedMeeting)
async def process_meeting(
    meeting: MeetingText,
    current_user: dict = Depends(get_current_user)
):
    """Process meeting text with AI"""
    
    if not meeting.text.strip():
        raise HTTPException(status_code=400, detail="Texto vazio")
    
    try:
        # Process with AI
        processed_data = ai_service.process_meeting_text(meeting.text)
        
        # Add IDs to tasks
        for task in processed_data["tasks"]:
            task["id"] = str(ObjectId())
        
        # Save to MongoDB
        meeting_doc = {
            "user_id": current_user["id"],
            "original_text": meeting.text,
            "summary": processed_data["summary"],
            "key_points": processed_data["key_points"],
            "tasks": processed_data["tasks"],
            "created_at": datetime.utcnow(),
            "sent_to_trello": False
        }
        
        result = await meetings_collection.insert_one(meeting_doc)
        meeting_id = str(result.inserted_id)
        
        return ProcessedMeeting(
            id=meeting_id,
            summary=processed_data["summary"],
            key_points=processed_data["key_points"],
            tasks=processed_data["tasks"],
            created_at=meeting_doc["created_at"].isoformat(),
            sent_to_trello=False
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=List[dict])
async def get_meetings(current_user: dict = Depends(get_current_user)):
    """List all meetings for current user"""
    
    cursor = meetings_collection.find({"user_id": current_user["id"]}).sort("created_at", -1)
    meetings = await cursor.to_list(length=100)
    
    return [
        {
            "id": str(meeting["_id"]),
            "summary": meeting["summary"],
            "created_at": meeting["created_at"].isoformat(),
            "tasks_count": len(meeting["tasks"]),
            "sent_to_trello": meeting.get("sent_to_trello", False)
        }
        for meeting in meetings
    ]


@router.get("/{meeting_id}", response_model=ProcessedMeeting)
async def get_meeting(meeting_id: str, current_user: dict = Depends(get_current_user)):
    """Get detailed meeting information"""
    
    meeting = await meetings_collection.find_one({
        "_id": ObjectId(meeting_id),
        "user_id": current_user["id"]
    })
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Reunião não encontrada")
    
    return ProcessedMeeting(
        id=str(meeting["_id"]),
        summary=meeting["summary"],
        key_points=meeting["key_points"],
        tasks=meeting["tasks"],
        created_at=meeting["created_at"].isoformat(),
        sent_to_trello=meeting.get("sent_to_trello", False)
    )


@router.put("/{meeting_id}/tasks/{task_id}", response_model=MessageResponse)
async def update_task(
    meeting_id: str,
    task_id: str,
    task_update: TaskUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a specific task"""
    
    meeting = await meetings_collection.find_one({
        "_id": ObjectId(meeting_id),
        "user_id": current_user["id"]
    })
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Reunião não encontrada")
    
    # Update the task
    tasks = meeting["tasks"]
    task_found = False
    
    for i, task in enumerate(tasks):
        if task.get("id") == task_id:
            tasks[i] = {
                "id": task_id,
                "title": task_update.title,
                "description": task_update.description,
                "priority": task_update.priority,
                "assignee": task_update.assignee,
                "due_date": task_update.due_date
            }
            task_found = True
            break
    
    if not task_found:
        raise HTTPException(status_code=404, detail="Task não encontrada")
    
    await meetings_collection.update_one(
        {"_id": ObjectId(meeting_id)},
        {"$set": {"tasks": tasks}}
    )
    
    return MessageResponse(message="Task atualizada com sucesso")


@router.delete("/{meeting_id}/tasks/{task_id}", response_model=MessageResponse)
async def delete_task(
    meeting_id: str,
    task_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a task"""
    
    meeting = await meetings_collection.find_one({
        "_id": ObjectId(meeting_id),
        "user_id": current_user["id"]
    })
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Reunião não encontrada")
    
    # Remove the task
    tasks = [t for t in meeting["tasks"] if t.get("id") != task_id]
    
    await meetings_collection.update_one(
        {"_id": ObjectId(meeting_id)},
        {"$set": {"tasks": tasks}}
    )
    
    return MessageResponse(message="Task deletada com sucesso")


@router.post("/send-to-trello", response_model=SendToTrelloResponse)
async def send_to_trello(
    request: SendToTrelloRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send selected tasks to Trello"""
    
    # Check Trello configuration
    if not current_user["trello_api_key"] or not current_user["trello_token"] or not current_user["trello_list_id"]:
        raise HTTPException(status_code=400, detail="Configure suas credenciais do Trello primeiro")
    
    # Get meeting
    meeting = await meetings_collection.find_one({
        "_id": ObjectId(request.meeting_id),
        "user_id": current_user["id"]
    })
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Reunião não encontrada")
    
    # Send selected tasks
    trello_cards = []
    for task_data in meeting["tasks"]:
        if task_data.get("id") in request.task_ids:
            task = Task(**task_data)
            try:
                card = trello_service.create_card(
                    task,
                    current_user["trello_api_key"],
                    current_user["trello_token"],
                    current_user["trello_list_id"]
                )
                trello_cards.append(TrelloCardResponse(
                    task_id=task_data.get("id"),
                    card_id=card["id"],
                    card_url=card["url"],
                    card_name=card["name"]
                ))
            except Exception as e:
                print(f"Erro ao criar card: {e}")
    
    # Update status
    await meetings_collection.update_one(
        {"_id": ObjectId(request.meeting_id)},
        {"$set": {"sent_to_trello": True}}
    )
    
    return SendToTrelloResponse(
        message=f"{len(trello_cards)} cards criados no Trello",
        cards=trello_cards
    )