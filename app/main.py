from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import sys
from contextlib import asynccontextmanager
from groq import AsyncGroq
from app.config import settings
from .routes import router


@asynccontextmanager
async def main(app: FastAPI):
    app.state.prompt_cache = {}
    prompt_path = os.path.join("prompts", "system.md")

    if os.path.exists(prompt_path):
        with open(prompt_path, "r") as file:
            app.state.prompt_cache["system_prompt"] = file.read().strip()

    else:
        print("System prompt not found")
        sys.exit(1)

    app.state.groq = AsyncGroq(api_key=settings.GROQ_API_KEY.get_secret_value())

    yield

    await app.state.groq.close()


app = FastAPI(title=settings.PROJECT_NAME, lifespan=main)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGIN,
    allow_credentials=True,
    allow_methods=["*"],  # Allows GET, POST, OPTIONS, etc.
    allow_headers=["*"],  # Allows your custom X-API-KEY header
)


app.include_router(router=router)
