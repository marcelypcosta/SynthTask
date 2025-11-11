"""
Camada de armazenamento para credenciais de integrações usando PostgreSQL e criptografia simétrica.
Fornece operações assíncronas de salvar/buscar por usuário/provedor.
"""
import json
from typing import Any, Dict, Optional

import sqlalchemy
from sqlalchemy.dialects.postgresql import insert

from app.core.database import database, integration_credentials
from app.core.security import encrypt, decrypt


class IntegrationStorage:
    def __init__(self, provider: str):
        self.provider = provider

    async def save(self, user_id: int, data: Dict[str, Any]) -> None:
        payload = encrypt(json.dumps(data))
        stmt = insert(integration_credentials).values(
            user_id=user_id,
            provider=self.provider,
            data_encrypted=payload,
        )
        upsert = stmt.on_conflict_do_update(
            index_elements=[integration_credentials.c.user_id, integration_credentials.c.provider],
            set_={"data_encrypted": payload},
        )
        await database.execute(upsert)

    async def get(self, user_id: int) -> Dict[str, Any]:
        query = integration_credentials.select().where(
            (integration_credentials.c.user_id == user_id)
            & (integration_credentials.c.provider == self.provider)
        )
        row: Optional[sqlalchemy.Row] = await database.fetch_one(query)
        if not row:
            return {}
        try:
            return json.loads(decrypt(row["data_encrypted"]))
        except Exception:
            return {}