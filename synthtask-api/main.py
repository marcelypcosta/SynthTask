from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import database, metadata, engine, drop_legacy_trello_columns
from app.routers.auth import router as auth_router
from app.routers.meetings import router as meetings_router
from app.routers.integrations import router as integrations_router
from app.routers.projects import router as projects_router

app = FastAPI(title=settings.APP_NAME, version=settings.VERSION)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router)
app.include_router(meetings_router)
app.include_router(integrations_router)
app.include_router(projects_router)


@app.on_event("startup")
async def on_startup():
    # Garante tabelas e conecta ao banco
    metadata.create_all(engine)
    # Remove colunas legadas de Trello no users, se existirem
    drop_legacy_trello_columns()
    await database.connect()


@app.on_event("shutdown")
async def on_shutdown():
    await database.disconnect()


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.HOST,
        port=settings.PORT,
        timeout_keep_alive=300
    )