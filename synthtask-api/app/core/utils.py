"""
Funções utilitárias centrais para operações de banco de dados e formatação de respostas.
Centraliza consultas ao banco e conversões de modelos.
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
    Buscar usuário no banco de dados pelo e-mail.
    
    Args:
        email: Endereço de e-mail do usuário
        
    Returns:
        Dicionário do usuário no banco ou None se não encontrado
    """
    query = users_table.select().where(users_table.c.email == email)
    return await database.fetch_one(query)


async def get_user_by_id(user_id: int) -> Optional[Dict]:
    """
    Buscar usuário no banco de dados pelo ID.
    
    Args:
        user_id: ID do usuário
        
    Returns:
        Dicionário do usuário no banco ou None se não encontrado
    """
    query = users_table.select().where(users_table.c.id == user_id)
    return await database.fetch_one(query)


async def update_user_field(user_id: int, **fields) -> None:
    """
    Atualizar campos específicos do usuário no banco de dados.
    
    Args:
        user_id: ID do usuário
        **fields: Pares chave-valor dos campos a atualizar
        
    Exemplo:
        await update_user_field(1, name="Novo Nome")
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
    Converter dicionário de usuário do banco para modelo Pydantic User.
    
    Args:
        user_data: Dicionário cru do usuário vindo do banco
        
    Returns:
        Instância do modelo Pydantic User
    """
    return User(
        id=user_data["id"],
        email=user_data["email"],
        name=user_data["name"],
    )


# ============================================================================
# MEETING DATABASE OPERATIONS (MongoDB)
# ============================================================================

async def get_user_meeting(meeting_id: str, user_id: int) -> Optional[Dict]:
    """
    Buscar reunião no MongoDB por ID com validação de propriedade.
    Garante que o usuário só acesse suas próprias reuniões.
    
    Args:
        meeting_id: ObjectId da reunião no MongoDB como string
        user_id: ID do usuário para checagem de propriedade
        
    Returns:
        Dicionário da reunião no MongoDB ou None se não encontrada
        
    Raises:
        Exception: Se meeting_id não for um ObjectId válido
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
    Buscar todas as reuniões de um usuário, ordenadas por criação (mais novas primeiro).
    
    Args:
        user_id: ID do usuário
        limit: Número máximo de reuniões a retornar
        
    Returns:
        Lista de dicionários de reuniões do MongoDB
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
    Salvar uma reunião processada no MongoDB.
    Centraliza a estrutura do documento de reunião para evitar inconsistências.
    
    Args:
        user_id: ID do usuário (proprietário)
        original_text: Texto/conteúdo original da reunião
        processed_data: Dicionário contendo 'summary', 'key_points', 'tasks'
        file_name: Nome do arquivo original opcional, se enviado
        
    Returns:
        ObjectId do MongoDB como string (meeting_id)
        
    Exemplo:
        meeting_id = await save_processed_meeting(
            user_id=1,
            original_text="Notas da reunião...",
            processed_data={"summary": "...", "key_points": [...], "tasks": [...]},
            file_name="reuniao.txt"
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
    Atualizar o array de tasks em um documento de reunião.
    
    Args:
        meeting_id: ObjectId da reunião no MongoDB como string
        tasks: Nova lista de dicionários de tarefas
    """
    await meetings_collection.update_one(
        {"_id": ObjectId(meeting_id)},
        {"$set": {"tasks": tasks}}
    )


async def mark_meeting_sent_to_trello(meeting_id: str) -> None:
    """
    Marcar uma reunião como enviada ao Trello (atualiza a flag sent_to_trello).
    
    Args:
        meeting_id: ObjectId da reunião no MongoDB como string
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
    Converter documento de reunião do MongoDB para o modelo Pydantic ProcessedMeeting.
    
    Args:
        meeting_data: Dicionário cru da reunião vindo do MongoDB
        meeting_id: Sobrescrita opcional para o ID da reunião (se não estiver como _id)
        
    Returns:
        Instância do modelo Pydantic ProcessedMeeting
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

# Legacy helper removed: Trello config lives in integration storage now


def validate_object_id(obj_id: str) -> bool:
    """
    Validar se a string é um ObjectId válido do MongoDB.
    
    Args:
        obj_id: String a validar como ObjectId
        
    Returns:
        True se formato válido de ObjectId, False caso contrário
    """
    try:
        ObjectId(obj_id)
        return True
    except Exception:
        return False
