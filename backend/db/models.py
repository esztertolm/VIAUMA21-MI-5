from pydantic import BaseModel
from typing import Optional

class UserRegisterRequest(BaseModel):
    oauth_id: str

class UserSaveTranscriptRequest(BaseModel):
    user_id: str
    text: str
    title: str
    language: str
    participants: list[str]
    duration: str