from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from .routes import router

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGIN,
    allow_credentials=True,
    allow_methods=["*"],  # Allows GET, POST, OPTIONS, etc.
    allow_headers=["*"],  # Allows your custom X-API-KEY header
)


app.include_router(router=router)
