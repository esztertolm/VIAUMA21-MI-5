from pydantic import Field, BaseModel
from typing import Optional

class UserRegisterRequest(BaseModel):
    oauth_id: str

class UserSaveTranscriptRequest(BaseModel):
    user_id: str
    text: str
    title: str
    language: str
    speakers: int
    duration: str
    utterances: Optional[list[dict]] = Field(default_factory=list)
    confidence: Optional[float] = None