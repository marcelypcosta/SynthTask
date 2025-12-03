"""
Rotas de gestão de reuniões e tarefas da Sintask API
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from bson import ObjectId
from typing import List
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from ..core.config import settings

from ..models import (
    MeetingText, ProcessedMeeting, Task, TaskUpdate,
    MessageResponse
)
from ..core.auth import get_current_user
from ..core.utils import (
    get_user_meeting, get_user_meetings, save_processed_meeting,
    format_meeting_response, update_meeting_tasks, mark_meeting_sent,
    validate_object_id, delete_user_meeting
)
from ..services.ai_service import ai_service 

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


# Helpers internos: extração de texto conforme extensão
async def extract_text_from_upload(file: UploadFile) -> str:
    file_name = file.filename or ""
    file_ext = "." + file_name.split(".")[-1].lower() if "." in file_name else ""
    content = await file.read()

    if file_ext in {".txt", ".md"}:
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            text = content.decode("latin-1")
        return text.strip()

    if file_ext == ".docx":
        try:
            from docx import Document  # type: ignore
        except ImportError:
            raise HTTPException(
                status_code=500, detail="Suporte a .docx requer 'python-docx' instalado."
            )
        import io
        doc = Document(io.BytesIO(content))
        text = "\n".join(p.text for p in doc.paragraphs)
        return text.strip()

    if file_ext == ".doc":
        try:
            import textract  # type: ignore
        except ImportError:
            raise HTTPException(
                status_code=400,
                detail="Arquivos .doc requerem 'textract'. Instale ou converta para .docx/.txt.",
            )
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".doc", delete=True) as tmp:
            tmp.write(content)
            tmp.flush()
            try:
                out = textract.process(tmp.name)
                return out.decode("utf-8", errors="ignore").strip()
            except Exception:
                raise HTTPException(
                    status_code=400, detail="Falha ao extrair texto do arquivo .doc."
                )

    raise HTTPException(
        status_code=400, detail="Formato não permitido. Use: .txt, .docx ou .doc"
    )


@router.post("/process-file", response_model=ProcessedMeeting)
async def process_meeting_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Process meeting text from uploaded file with AI"""
    
    # Validar extensão do arquivo
    allowed_extensions = {".txt", ".docx", ".doc"}
    file_name = file.filename or ""
    file_ext = "." + file_name.split(".")[-1].lower() if "." in file_name else ""
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Formato não permitido. Use: {', '.join(sorted(allowed_extensions))}"
        )
    
    try:
        # Extrair conteúdo do arquivo conforme extensão
        text = await extract_text_from_upload(file)
        
        if not text:
            raise HTTPException(status_code=400, detail="Arquivo sem conteúdo textual")
        
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
    """Listar todas as reuniões do usuário atual"""
    meetings = await get_user_meetings(current_user["id"])
    result = []
    tz = ZoneInfo(settings.TIMEZONE)
    for meeting in meetings:
        dt = meeting.get("created_at")
        if isinstance(dt, datetime) and dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        dt_local = dt.astimezone(tz) if isinstance(dt, datetime) else dt
        created_iso = dt_local.isoformat() if isinstance(dt_local, datetime) else str(dt_local)
        result.append({
            "id": str(meeting["_id"]),
            "file_name": meeting.get("file_name"),
            "created_at": created_iso,
            "tasks_count": len(meeting.get("tasks", [])),
            "sent": meeting.get("sent", meeting.get("sent_to_trello", False)),
        })
    return result


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
                "assignee": task_update.assignee,
                "due_date": task_update.due_date
            }
            task_found = True
            break
    
    if not task_found:
        raise HTTPException(status_code=404, detail="Task não encontrada")
    
    await update_meeting_tasks(meeting_id, tasks)
    
    return MessageResponse(message="Task atualizada com sucesso")


@router.post("/{meeting_id}/tasks", response_model=Task)
async def create_task(
    meeting_id: str,
    task_data: TaskUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new task in a meeting"""
    if not validate_object_id(meeting_id):
        raise HTTPException(status_code=400, detail="ID de reunião inválido")

    meeting = await get_user_meeting(meeting_id, current_user["id"])

    if not meeting:
        raise HTTPException(status_code=404, detail="Reunião não encontrada")

    new_task = {
        "id": str(ObjectId()),
        "title": task_data.title,
        "description": task_data.description,
        "assignee": task_data.assignee,
        "due_date": task_data.due_date,
    }

    tasks = meeting["tasks"] + [new_task]
    await update_meeting_tasks(meeting_id, tasks)

    return Task(**new_task)


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


@router.delete("/{meeting_id}", response_model=MessageResponse)
async def delete_meeting(meeting_id: str, current_user: dict = Depends(get_current_user)):
    """Apagar uma transcrição/reunião do usuário atual"""
    if not validate_object_id(meeting_id):
        raise HTTPException(status_code=400, detail="ID de reunião inválido")
    deleted = await delete_user_meeting(meeting_id, current_user["id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Reunião não encontrada")
    return MessageResponse(message="Transcrição apagada com sucesso")




@router.post("/{meeting_id}/sent", response_model=MessageResponse)
async def mark_sent(meeting_id: str, current_user: dict = Depends(get_current_user)):
    """Marcar reunião como enviada (status genérico de envio)."""
    if not validate_object_id(meeting_id):
        raise HTTPException(status_code=400, detail="ID de reunião inválido")
    meeting = await get_user_meeting(meeting_id, current_user["id"])
    if not meeting:
        raise HTTPException(status_code=404, detail="Reunião não encontrada")
    await mark_meeting_sent(meeting_id)
    return MessageResponse(message="Reunião marcada como enviada")
