from pydantic import Field, BaseModel
from typing import Optional

class UserRegisterRequest(BaseModel):
    oauth_id: str

class UserSaveTranscriptRequest(BaseModel):
    user_id: str
    text: str
    title: str
    language_code: str
    speakers: int
    duration: str
    status: str
    utterances: Optional[list[dict]] = Field(default_factory=list)
    confidence: Optional[float] = None

class UserUpdateTranscriptRequest(BaseModel):
    transcript_id: str
    text: str = None
    title: str = None
    language_code: str = None
    speakers: int = None
    duration: str = None
    status: str = None
    utterances: Optional[list[dict]] = None
    confidence: Optional[float] = None
    notes: str = None