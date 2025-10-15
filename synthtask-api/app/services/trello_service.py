"""
Trello integration service
"""
import requests
from fastapi import HTTPException
from typing import Dict, Any

from ..models import Task


class TrelloService:
    
    @staticmethod
    def create_card(task: Task, api_key: str, token: str, list_id: str) -> Dict[str, Any]:
        """Create a card in Trello"""
        
        url = "https://api.trello.com/1/cards"
        
        # Build card description
        description = f"{task.description}\n\n"
        if task.priority:
            priority_emoji = "🔴" if task.priority == "Alta" else "🟡" if task.priority == "Média" else "🟢"
            description += f"{priority_emoji} **Prioridade:** {task.priority}\n"
        if task.assignee:
            description += f"👤 **Responsável:** {task.assignee}\n"
        if task.due_date:
            description += f"📅 **Prazo:** {task.due_date}\n"
        
        description += f"\n---\n_Criado pelo Sintask_"
        
        # Prepare API parameters
        params = {
            "key": api_key,
            "token": token,
            "idList": list_id,
            "name": task.title,
            "desc": description,
        }
        
        if task.due_date:
            params["due"] = task.due_date
        
        # Make API request
        response = requests.post(url, params=params)
        
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Erro ao criar card: {response.text}")
        
        return response.json()


# Global Trello service instance
trello_service = TrelloService()