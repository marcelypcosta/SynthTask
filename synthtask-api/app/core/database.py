"""
Database configuration and connections for MongoDB and PostgreSQL
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
    sqlalchemy.Column("trello_api_key", sqlalchemy.String, nullable=True),
    sqlalchemy.Column("trello_token", sqlalchemy.String, nullable=True),
    sqlalchemy.Column("trello_list_id", sqlalchemy.String, nullable=True),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime, default=datetime.utcnow),
)

# SQLAlchemy engine for metadata operations
engine = sqlalchemy.create_engine(settings.POSTGRES_URL)


async def connect_databases():
    """Connect to all databases"""
    try:
        # Connect to PostgreSQL
        await database.connect()
        print("🔌 Conectado ao PostgreSQL")
        
        # Create tables if they don't exist
        metadata.create_all(engine)
        print("📋 Tabelas do PostgreSQL verificadas/criadas")
        
        # Test MongoDB connection
        await mongodb.command("ping")
        print("🔌 Conectado ao MongoDB")
        
        print("✅ Todos os bancos de dados conectados com sucesso")
        
    except Exception as e:
        print(f"❌ Erro ao conectar bancos de dados: {e}")
        raise


async def disconnect_databases():
    """Disconnect from all databases"""
    await database.disconnect()
    mongodb_client.close()
    print("📴 Desconectado dos bancos de dados")