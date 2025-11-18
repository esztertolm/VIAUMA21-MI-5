from datetime import datetime
from bson.objectid import ObjectId
from db.mongodb_setup import db

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
    return str(result.inserted_id)

def update_user(user_id: str, oauth_id: str = None) -> bool:
    update_fields = {}

    if oauth_id is not None:
        update_fields["oauth_id"] = oauth_id

    if not update_fields:
        return False
    
    result = users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_fields}
    )

    return result.modified_count > 0

def get_user_by_oauth(oauth_id: str) -> dict | None:
    doc = users_collection.find_one({"oauth_id": oauth_id})

    if doc:
        doc["_id"] = str(doc["_id"])
    return doc

def get_user_by_id(user_id: str) -> dict | None:
    doc = users_collection.find_one({"_id": ObjectId(user_id)})
    
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc

def delete_user(user_id: str) -> bool:
    user_result = users_collection.delete_one({"_id": ObjectId(user_id)})
    _ = transcripts_collection.delete_many({"user_id": ObjectId(user_id)})

    return user_result.deleted_count > 0

def create_transcript(user_id: str, text: str, title: str, metadata: dict = None) -> str:
    doc = {
        "user_id": ObjectId(user_id),
        "text": text,
        "title": title,
        "metadata": metadata or {},
        "created_at": datetime.now()
    }
    
    result = transcripts_collection.insert_one(doc)
    return str(result.inserted_id)

def update_transcript(transcript_id: str, text: str = None, title: str = None, metadata: dict = None) -> bool:
    update_fields = {}

    if text is not None:
        update_fields["text"] = text

    if title is not None:
        update_fields["title"] = title

    if metadata is not None:
        update_fields["metadata"] = metadata

    if not update_fields:
        return False
    
    result = transcripts_collection.update_one(
        {"_id": ObjectId(transcript_id)},
        {"$set": update_fields}
    )

    return result.modified_count > 0

def get_transcripts_for_user(user_id: str, sort_mode: str = "descending") -> list[dict]:
    sort_mode = -1
    if sort_mode.lower() == "ascending":
        sort_mode = 1

    docs = transcripts_collection.find({"user_id": ObjectId(user_id)}.sort("created_at", sort_mode))
    return [{**doc, "_id": str(doc["_id"]), "user_id": str(doc("user_id"))} for doc in docs]

def get_transcript_by_id(transcript_id: str) -> dict | None:
    doc = transcripts_collection.find_one({"_id": transcript_id})

    if doc:
        doc["_id"] = str(doc["_id"])
        doc["user_id"] = str(doc["user_id"])
    return doc

def delete_transcript(transcript_id: str) -> bool:
    result = transcripts_collection.delete_one({"_id": ObjectId(transcript_id)})

    return result.deleted_count