from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import os

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    mongo_uri: str = ""
    port: int = 0

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.mongo_uri:
            raise ValueError("mongo_uri is required. Set MONGO_URI in .env")
        if not self.port:
            raise ValueError("port is required. Set PREDICTION_ENGINE_PORT in .env")

@lru_cache()
def get_settings():
    return Settings()
