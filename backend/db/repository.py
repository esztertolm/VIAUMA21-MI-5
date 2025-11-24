from datetime import datetime
from bson.objectid import ObjectId
from bson.errors import InvalidId
from backend.db.mongodb_setup import db

from backend.utils.logger import logger

def _safe_objectid(id_str: str) -> ObjectId | None:
    try:
        return ObjectId(id_str)
    except InvalidId:
        return None

# 'Primary key': oauthid
users_collection = db["users"]

# Foreign key is oauthid
transcripts_collection = db["transcripts"]

def create_user(oauth_id: str) -> str:
    existing = users_collection.find_one({"oauth_id": oauth_id})
    if existing:
        return str(existing["_id"])

    doc = {
        "oauth_id": oauth_id,
        "created_at": datetime.now()
    }

    result = users_collection.insert_one(doc)
    logger.info("User created.")
    return str(result.inserted_id)

def update_user(user_id: str, oauth_id: str = None) -> bool:
    user_id = _safe_objectid(user_id)
    if not user_id:
        return False

    update_fields = {}

    if oauth_id is not None:
        update_fields["oauth_id"] = oauth_id

    if not update_fields:
        return False
    
    result = users_collection.update_one(
        {"_id": user_id},
        {"$set": update_fields}
    )

    logger.info("User updated.")


    return result.modified_count > 0

def get_user_by_oauth(oauth_id: str) -> dict | None:
    doc = users_collection.find_one({"oauth_id": oauth_id})

    if doc:
        doc["_id"] = str(doc["_id"])
    return doc

def get_user_by_id(user_id: str) -> dict | None:
    user_id = _safe_objectid(user_id)
    if not user_id:
        return None

    doc = users_collection.find_one({"_id": user_id})
    
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc

def delete_user(user_id: str) -> bool:
    user_id = _safe_objectid(user_id)
    if not user_id:
        return False

    user_result = users_collection.delete_one({"_id": user_id})
    _ = transcripts_collection.delete_many({"user_id": user_id})

    logger.info("User deleted.")


    return user_result.deleted_count > 0

def create_transcript(user_id: str,
                      text: str,
                      title: str,
                      language_code: str,
                      speakers: int,
                      duration: str,
                      status: str,
                      utterances,
                      confidence: float) -> str | None:
    user_id = _safe_objectid(user_id)
    if not user_id:
        return None

    doc = {
        "user_id": user_id,
        "text": text,
        "title": title,
        "language_code": language_code,
        "speakers": speakers,
        "duration": duration,
        "status": status,
        "created_at": datetime.now(),
        "utterances": utterances,
        "confidence": confidence,
        "notes": ""
    }
    
    result = transcripts_collection.insert_one(doc)

    logger.info("Transcription is stored for the user.")

    return str(result.inserted_id)

def update_transcript(transcript_id: str, text: str = None, title: str = None,
                      language_code: str = None, speakers: int = None,
                      duration: str = None, status: str = None, utterances =  None,
                      confidence = None, notes = None) -> bool:
    transcript_id = _safe_objectid(transcript_id)
    if not transcript_id:
        return False

    update_fields = {}

    if text is not None:
        update_fields["text"] = text

    if title is not None:
        update_fields["title"] = title

    if language_code is not None:
        update_fields["language_code"] = language_code

    if speakers is not None:
        update_fields["speakers"] = speakers

    if duration is not None:
        update_fields["duration"] = duration
    
    if status is not None:
        update_fields["status"] = status

    if utterances is not None:
        update_fields["utterances"] = utterances

    if confidence is not None:
        update_fields["confidence"] = confidence

    if notes is not None:
        update_fields["notes"] = notes

    if not update_fields:
        return False
    
    result = transcripts_collection.update_one(
        {"_id": transcript_id},
        {"$set": update_fields}
    )

    logger.info(f"Transcription updated: {transcript_id}.")

    return result.modified_count > 0

def get_transcripts_for_user(user_id: str, sort_mode: str = "descending") -> list[dict] | None:
    user_id = _safe_objectid(user_id)
    if not user_id:
        return None

    sort_value = -1
    if sort_mode.lower() == "ascending":
        sort_value = 1

    docs = transcripts_collection.find({"user_id": user_id}).sort("created_at", sort_value)

    logger.info("Transcriptions are collected for the user.")

    return [{**doc, "_id": str(doc["_id"]), "user_id": str(doc["user_id"])} for doc in docs]

def get_transcript_by_id(transcript_id: str) -> dict | None:
    transcript_id = _safe_objectid(transcript_id)
    if not transcript_id:
        return None
    
    doc = transcripts_collection.find_one({"_id": transcript_id}) 

    if doc:
        doc["_id"] = str(doc["_id"])
        doc["user_id"] = str(doc["user_id"])


    return doc

def delete_transcript(transcript_id: str) -> bool:
    transcript_id = _safe_objectid(transcript_id)
    if not transcript_id:
        return False
    
    transcript_result = transcripts_collection.delete_one({"_id": transcript_id})

    logger.info(f"Transcription deleted: {transcript_id}.")

    return transcript_result.deleted_count > 0