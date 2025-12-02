"""
Configuração e conexões de banco de dados para MongoDB e PostgreSQL.
"""
import sqlalchemy
from motor.motor_asyncio import AsyncIOMotorClient
from databases import Database
from datetime import datetime

from .config import settings

# MongoDB Setup
mongodb_client = AsyncIOMotorClient(settings.MONGODB_URL)
mongodb = mongodb_client[settings.MONGODB_DATABASE]
meetings_collection = mongodb[settings.MONGODB_COLLECTION]

# PostgreSQL Setup
database = Database(settings.POSTGRES_URL)
metadata = sqlalchemy.MetaData()

# Users table definition
users_table = sqlalchemy.Table(
    "users",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("email", sqlalchemy.String, unique=True, nullable=False),
    sqlalchemy.Column("password_hash", sqlalchemy.String, nullable=False),
    sqlalchemy.Column("name", sqlalchemy.String, nullable=False),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime, default=datetime.utcnow),
)

# Integration credentials table definition (secure storage per provider/user)
integration_credentials = sqlalchemy.Table(
    "integration_credentials",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("user_id", sqlalchemy.Integer, nullable=False),
    sqlalchemy.Column("provider", sqlalchemy.String, nullable=False),
    sqlalchemy.Column("data_encrypted", sqlalchemy.Text, nullable=False),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime, default=datetime.utcnow),
    sqlalchemy.UniqueConstraint("user_id", "provider", name="uq_integration_user_provider"),
)

projects_table = sqlalchemy.Table(
    "projects",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("user_id", sqlalchemy.Integer, nullable=False),
    sqlalchemy.Column("name", sqlalchemy.String, nullable=False),
    sqlalchemy.Column("provider", sqlalchemy.String, nullable=False),
    sqlalchemy.Column("target_id", sqlalchemy.String, nullable=False),
    sqlalchemy.Column("target_name", sqlalchemy.String, nullable=True),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime, default=datetime.utcnow),
)

# SQLAlchemy engine for metadata operations
engine = sqlalchemy.create_engine(settings.POSTGRES_URL)


# --- Limpeza legada: remove colunas antigas do Trello da tabela users se existirem ---
def drop_legacy_trello_columns():
    try:
        with engine.connect() as conn:
            conn.execute(sqlalchemy.text("""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name='users' AND column_name='trello_api_key'
                    ) THEN
                        EXECUTE 'ALTER TABLE users DROP COLUMN trello_api_key';
                    END IF;

                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name='users' AND column_name='trello_token'
                    ) THEN
                        EXECUTE 'ALTER TABLE users DROP COLUMN trello_token';
                    END IF;

                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name='users' AND column_name='trello_list_id'
                    ) THEN
                        EXECUTE 'ALTER TABLE users DROP COLUMN trello_list_id';
                    END IF;
                END
                $$;
            """))
    except Exception as e:
        # Evitar falha crítica na inicialização; apenas registrar
        print(f"Aviso: não foi possível remover colunas legadas do Trello: {e}")


async def connect_databases():
    """Conectar todos os bancos de dados"""
    try:
        # Connect to PostgreSQL
        await database.connect()
        print("🔌 Conectado ao PostgreSQL")
        
        # Criar tabelas se não existirem
        metadata.create_all(engine)
        print("📋 Tabelas do PostgreSQL verificadas/criadas")
        
        # Testar conexão com o MongoDB
        await mongodb.command("ping")
        print("🔌 Conectado ao MongoDB")
        
        print("✅ Todos os bancos de dados conectados com sucesso")
        
    except Exception as e:
        print(f"❌ Erro ao conectar aos bancos de dados: {e}")
        raise


async def disconnect_databases():
    """Desconectar de todos os bancos de dados"""
    await database.disconnect()
    mongodb_client.close()
    print("📴 Desconectado dos bancos de dados")