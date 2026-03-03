from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import os

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"  # Ignore extra env vars not defined in this model
    )
    
    mongo_uri: str
    port: int = 8000

@lru_cache()
def get_settings():
    return Settings()
