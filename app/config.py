from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import SecretStr
from typing import List


class Settings(BaseSettings):
    APP_SECRET_KEY: SecretStr

    PROJECT_NAME: str = "Transcript audit validation engine"

    BACKEND_CORS_ORIGIN: List[str] = [
        "https://script.google.com",
        "https://docs.google.com",
        "https://sheets.google.com"
    ]
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
