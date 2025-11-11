"""
Registro de provedores e fábrica para integrações.
"""
from typing import Dict

from .base import IntegrationService
from .trello.service import TrelloService
from .jira.service import JiraService


REGISTRY: Dict[str, IntegrationService] = {
    "trello": TrelloService(),
    "jira": JiraService(),
}


def get_integration(provider: str) -> IntegrationService:
    service = REGISTRY.get(provider)
    if not service:
        raise ValueError(f"Provider não suportado: {provider}")
    return service