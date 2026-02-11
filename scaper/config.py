import os
from dotenv import load_dotenv
from pymongo import MongoClient
import google.generativeai as genai

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "mandi_insights")
COLLECTION_NAME = "mandi_sources"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
mandi_collection = db[COLLECTION_NAME]

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
else:
    print("Warning: GOOGLE_API_KEY not found in environment variables.")

def get_db_collection():
    return mandi_collection

def get_llm():
    return genai.GenerativeModel('gemini-pro')
