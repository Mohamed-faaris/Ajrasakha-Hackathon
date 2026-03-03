from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    mongo_uri: str
    port: int = 8000
    
    class Config:
        # Load from root .env file (single source of truth)
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
        env_file_encoding = "utf-8"

@lru_cache()
def get_settings():
    return Settings()
