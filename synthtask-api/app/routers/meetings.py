"""
Meeting and task management routes for the Sintask API
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from bson import ObjectId
from typing import List

from ..models import (
    MeetingText, ProcessedMeeting, Task, TaskUpdate, SendToTrelloRequest,
    MessageResponse, SendToTrelloResponse, TrelloCardResponse
)
from ..core.auth import get_current_user
from ..core.utils import (
    get_user_meeting, get_user_meetings, save_processed_meeting,
    format_meeting_response, update_meeting_tasks, mark_meeting_sent_to_trello,
    validate_trello_config, validate_object_id
)
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
        meeting_id = await save_processed_meeting(
            current_user["id"],
            meeting.text,
            processed_data
        )
        
        # Get saved meeting
        saved_meeting = await get_user_meeting(meeting_id, current_user["id"])
        
        return format_meeting_response(saved_meeting, meeting_id)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/process-file", response_model=ProcessedMeeting)
async def process_meeting_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Process meeting text from uploaded file with AI"""
    
    # Validar extensão do arquivo
    allowed_extensions = {'.txt', '.md', '.pdf'}
    file_name = file.filename or ""
    file_ext = '.' + file_name.split('.')[-1].lower() if '.' in file_name else ""
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Formato não permitido. Use: {', '.join(allowed_extensions)}"
        )
    
    try:
        # Ler conteúdo do arquivo
        content = await file.read()
        text = content.decode('utf-8').strip()
        
        if not text:
            raise HTTPException(status_code=400, detail="Arquivo vazio")
        
        # Process with AI
        processed_data = ai_service.process_meeting_text(text)
        
        # Add IDs to tasks
        for task in processed_data["tasks"]:
            task["id"] = str(ObjectId())
        
        # Save to MongoDB
        meeting_id = await save_processed_meeting(
            current_user["id"],
            text,
            processed_data,
            file_name
        )
        
        # Get saved meeting
        saved_meeting = await get_user_meeting(meeting_id, current_user["id"])
        
        return format_meeting_response(saved_meeting, meeting_id)
        
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Arquivo não é texto válido (UTF-8)")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=List[dict])
async def get_meetings(current_user: dict = Depends(get_current_user)):
    """List all meetings for current user"""
    
    meetings = await get_user_meetings(current_user["id"])
    
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
    
    if not validate_object_id(meeting_id):
        raise HTTPException(status_code=400, detail="ID de reunião inválido")
    
    meeting = await get_user_meeting(meeting_id, current_user["id"])
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Reunião não encontrada")
    
    return format_meeting_response(meeting, meeting_id)


@router.put("/{meeting_id}/tasks/{task_id}", response_model=MessageResponse)
async def update_task(
    meeting_id: str,
    task_id: str,
    task_update: TaskUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a specific task"""
    
    if not validate_object_id(meeting_id):
        raise HTTPException(status_code=400, detail="ID de reunião inválido")
    
    meeting = await get_user_meeting(meeting_id, current_user["id"])
    
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
    
    await update_meeting_tasks(meeting_id, tasks)
    
    return MessageResponse(message="Task atualizada com sucesso")


@router.delete("/{meeting_id}/tasks/{task_id}", response_model=MessageResponse)
async def delete_task(
    meeting_id: str,
    task_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a task"""
    
    if not validate_object_id(meeting_id):
        raise HTTPException(status_code=400, detail="ID de reunião inválido")
    
    meeting = await get_user_meeting(meeting_id, current_user["id"])
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Reunião não encontrada")
    
    # Remove the task
    tasks = [t for t in meeting["tasks"] if t.get("id") != task_id]
    
    await update_meeting_tasks(meeting_id, tasks)
    
    return MessageResponse(message="Task deletada com sucesso")


@router.post("/send-to-trello", response_model=SendToTrelloResponse)
async def send_to_trello(
    request: SendToTrelloRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send selected tasks to Trello"""
    
    # Check Trello configuration
    if not validate_trello_config(current_user):
        raise HTTPException(status_code=400, detail="Configure suas credenciais do Trello primeiro")
    
    if not validate_object_id(request.meeting_id):
        raise HTTPException(status_code=400, detail="ID de reunião inválido")
    
    # Get meeting
    meeting = await get_user_meeting(request.meeting_id, current_user["id"])
    
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
    await mark_meeting_sent_to_trello(request.meeting_id)
    
    return SendToTrelloResponse(
        message=f"{len(trello_cards)} cards criados no Trello",
        cards=trello_cards
    )