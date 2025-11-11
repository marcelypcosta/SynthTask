"""
Interface base para integrações plug-and-play.
Define capacidades e operações comuns para ferramentas de gestão de projetos.
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List


class IntegrationService(ABC):
    provider_name: str = "base"
    capabilities: List[str] = []

    @abstractmethod
    async def save_credentials(self, user_id: int, payload: Dict[str, Any]) -> None:
        """Armazenar credenciais do usuário para este provedor."""

    @abstractmethod
    async def get_user_credentials(self, user_id: int) -> Dict[str, Any]:
        """Recuperar credenciais do usuário para este provedor."""

    # Auxiliares de descoberta opcionais (sobrescreva conforme necessário)
    async def get_boards(self, user_id: int) -> List[Dict[str, Any]]:
        raise NotImplementedError

    async def get_projects(self, user_id: int) -> List[Dict[str, Any]]:
        raise NotImplementedError

    # Operação principal
    @abstractmethod
    async def create_task(self, user_id: int, target_id: str, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Criar tarefa/card no container alvo (lista/projeto)."""