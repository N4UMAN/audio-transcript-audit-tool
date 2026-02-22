from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import SecretStr
from typing import List


class Settings(BaseSettings):
    GROQ_API_KEY: SecretStr
    APP_SECRET_KEY: SecretStr

    GROQ_MODEL: str = "moonshotai/kimi-k2-instruct-0905"
    TEMPERATURE: float = 0.7
    MAX_TOKENS: int = 1024

    PROJECT_NAME: str = "Sheets audit engine"

    BACKEND_CORS_ORIGIN: List[str] = ["*"]
    # "https://script.google.com",
    # "https://docs.google.com",
    # "https://sheets.google.com"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
