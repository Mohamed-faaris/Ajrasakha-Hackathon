from pymongo import MongoClient
from pymongo.collection import Collection
from app.config import get_settings

_settings = get_settings()
_client = MongoClient(_settings.mongo_uri)
_db = _client.get_default_database()

def get_prices_collection() -> Collection:
    return _db["prices"]

def get_predictions_collection() -> Collection:
    return _db["predictions"]

def get_logs_collection() -> Collection:
    return _db["logs"]

def get_topmovers_collection() -> Collection:
    return _db["topmovers"]

def close_db():
    _client.close()
