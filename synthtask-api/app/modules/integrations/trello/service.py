# Classe: TrelloService
# Seções: Helpers e create_task refatorado
"""
Integração Trello implementando o adaptador IntegrationService.
"""
import requests
from typing import Any, Dict, List
from fastapi import HTTPException

from app.modules.integrations.base import IntegrationService
from app.modules.integrations.storage import IntegrationStorage

class TrelloService(IntegrationService):
    provider_name = "trello"
    capabilities = ["boards", "lists", "members", "create_task"]
    BASE_URL = "https://api.trello.com/1"

    def __init__(self):
        self.storage = IntegrationStorage(provider=self.provider_name)

    async def save_credentials(self, user_id: int, payload: Dict[str, Any]) -> None:
        required = ["api_key", "token"]
        for r in required:
            if r not in payload:
                raise HTTPException(status_code=400, detail=f"Campo ausente: {r}")
        # Enriquecer com dados do usuário Trello (username, fullName, email quando disponível)
        try:
            url = f"{self.BASE_URL}/members/me"
            params = {"key": payload["api_key"], "token": payload["token"], "fields": "username,fullName,email"}
            resp = requests.get(url, params=params, timeout=20)
            if resp.status_code < 400:
                me = resp.json() or {}
                if isinstance(me, dict):
                    payload["username"] = me.get("username")
                    payload["fullName"] = me.get("fullName")
                    # Algumas contas não expõem email via API; use quando presente
                    email = me.get("email")
                    if email:
                        payload["email"] = email
        except Exception:
            # Não bloquear o save se enriquecimento falhar
            pass
        await self.storage.save(user_id, payload)

    async def get_user_credentials(self, user_id: int) -> Dict[str, Any]:
        creds = await self.storage.get(user_id)
        if not creds or "api_key" not in creds or "token" not in creds:
            raise HTTPException(status_code=400, detail="Credenciais Trello não configuradas")
        return creds

    async def get_boards(self, user_id: int) -> List[Dict[str, Any]]:
        creds = await self.get_user_credentials(user_id)
        url = f"{self.BASE_URL}/members/me/boards"
        params = {"key": creds["api_key"], "token": creds["token"], "fields": "id,name"}
        resp = requests.get(url, params=params)
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Erro ao listar boards: {resp.text}")
        return resp.json()

    async def get_lists(self, user_id: int, board_id: str) -> List[Dict[str, Any]]:
        creds = await self.get_user_credentials(user_id)
        url = f"{self.BASE_URL}/boards/{board_id}/lists"
        params = {"key": creds["api_key"], "token": creds["token"], "fields": "id,name"}
        resp = requests.get(url, params=params)
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Erro ao listar listas: {resp.text}")
        return resp.json()

    async def get_members(self, user_id: int, board_id: str) -> List[Dict[str, Any]]:
        creds = await self.get_user_credentials(user_id)
        url = f"{self.BASE_URL}/boards/{board_id}/members"
        params = {"key": creds["api_key"], "token": creds["token"]}
        try:
            resp = requests.get(url, params=params, timeout=20)
            if resp.status_code >= 400:
                # Propaga o status original para melhor diagnóstico (401/403/404)
                raise HTTPException(status_code=resp.status_code, detail=f"Erro ao listar membros: {resp.text}")
            members = resp.json() or []
            normalized = []
            for m in members:
                normalized.append({
                    "id": m.get("id"),
                    "username": m.get("username"),
                    "fullName": m.get("fullName"),
                    "avatarUrl": m.get("avatarUrl"),
                })
            return normalized
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def get_board_id_for_list(self, user_id: int, list_id: str) -> str:
        creds = await self.get_user_credentials(user_id)
        url = f"{self.BASE_URL}/lists/{list_id}"
        params = {"key": creds["api_key"], "token": creds["token"], "fields": "idBoard"}
        try:
            resp = requests.get(url, params=params, timeout=20)
            if resp.status_code >= 400:
                raise HTTPException(status_code=resp.status_code, detail=f"Erro ao obter board da lista: {resp.text}")
            data = resp.json() or {}
            bid = data.get("idBoard")
            if not bid:
                raise HTTPException(status_code=404, detail="Board não encontrado para a lista informada")
            return str(bid)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def build_card_description(self, task_data: Dict[str, Any]) -> str:
        description = (task_data.get("description") or "") + "\n\n"
        assignee = task_data.get("assignee")
        if assignee:
            description += f"👤 **Responsável:** {assignee}\n"
        due_date = task_data.get("due_date")
        if due_date:
            description += f"📅 **Prazo:** {due_date}\n"
        description += "\n---\n_Criado pelo SynthTask_"
        return description

    async def create_task(self, user_id: int, target_list_id: str, task_data: Dict[str, Any]) -> Dict[str, Any]:
        creds = await self.get_user_credentials(user_id)
        url = f"{self.BASE_URL}/cards"

        description = self.build_card_description(task_data)
        params = {
            "key": creds["api_key"],
            "token": creds["token"],
            "idList": target_list_id,
            "name": task_data.get("title", "Tarefa"),
            "desc": description,
        }
        due_date = task_data.get("due_date")
        if due_date:
            params["due"] = due_date
        assignee = task_data.get("assignee")
        if assignee:
            try:
                import re
                s = str(assignee).strip()
                # Trello IDs geralmente têm 24 caracteres hexadecimais
                if re.fullmatch(r"[0-9a-fA-F]{24}", s):
                    params["idMembers"] = s
            except Exception:
                pass

        resp = requests.post(url, params=params)
        if resp.status_code != 200:
            msg = resp.text
            try:
                data = resp.json() or {}
                if isinstance(data, dict) and data.get("message") == "Invalid objectId":
                    msg = "idList ou idMembers inválido"
            except Exception:
                pass
            raise HTTPException(status_code=400, detail=f"Erro ao criar card: {msg}")
        return resp.json()
