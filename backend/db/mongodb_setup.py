from pymongo import MongoClient
import os
from dotenv import load_dotenv
from backend.utils.logger import logger
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "mi_5_db")

if not MONGO_URI:
    logger.error("MONGO_URI is missing from .env file")
    raise ValueError("MONGO_URI is missing from .env file")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]


logger.info(f"Connected to MongoDB database: {DB_NAME}")
