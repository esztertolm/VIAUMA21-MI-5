from fastapi import FastAPI
import uvicorn

from db.mongodb_setup import db

app = FastAPI()

@app.get("/")
def root():
    collections = db.list_collection_names()
    return {
        "message": "MongoDB is running",
        "collections": collections
    }

@app.get("/test-db")
def test_db():
    try:
        test_collection = db["test_collection"]

        test_doc = {
            "name": "MongoDB test",
            "value": 123
        }
        insert_result = test_collection.insert_one(test_doc)
        inserted_id = insert_result.inserted_id

        retrieved_doc = test_collection.find_one({
            "_id": inserted_id
        })
        retrieved_doc["_id"] = str(retrieved_doc["_id"])

        delete_result = test_collection.delete_one({
            "_id": inserted_id
        })

        return {
            "success": True,
            "inserted_id": str(inserted_id),
            "retrieved_doc": retrieved_doc,
            "deleted_count": delete_result.deleted_count
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
    
if __name__ == "__main__":
    uvicorn.run(app, port=8080)