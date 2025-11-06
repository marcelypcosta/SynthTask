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

    @staticmethod
    def get_boards_and_lists(api_key: str, token: str) -> Dict[str, Any]:
        """Return a structure with boards and their lists for the given Trello credentials.

        Returns:
            {"boards": [{"id": "...", "name": "...", "lists": [{"id":"..","name":"..."}, ...]}, ...]}
        """
        base = "https://api.trello.com/1"
        # Get boards for the member 'me'
        boards_url = f"{base}/members/me/boards"
        params = {"key": api_key, "token": token, "fields": "id,name"}
        resp = requests.get(boards_url, params=params)
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Erro ao listar boards: {resp.text}")

        boards = resp.json()
        result = {"boards": []}

        for b in boards:
            # For each board get lists
            lists_url = f"{base}/boards/{b['id']}/lists"
            resp_lists = requests.get(lists_url, params={"key": api_key, "token": token, "fields": "id,name"})
            if resp_lists.status_code != 200:
                # skip this board if lists can't be fetched
                continue
            lists = resp_lists.json()
            result["boards"].append({
                "id": b["id"],
                "name": b.get("name"),
                "lists": [{"id": l["id"], "name": l.get("name")} for l in lists]
            })

        return result


# Global Trello service instance
trello_service = TrelloService()