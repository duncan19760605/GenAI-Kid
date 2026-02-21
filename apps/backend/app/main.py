from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.parent import router as parent_router
from app.api.kid import router as kid_router
from app.api.ws.voice import router as ws_router

app = FastAPI(
    title="Companion - Kids AI Character Platform",
    version="0.1.0",
    description="Multilingual voice-interactive GenAI character companion for children",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(parent_router)
app.include_router(kid_router)
app.include_router(ws_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
