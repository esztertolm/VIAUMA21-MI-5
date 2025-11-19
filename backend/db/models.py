from pydantic import BaseModel
from typing import Optional

class UserRegisterRequest(BaseModel):
    oauth_id: str

class UserTranscriptionsRequest(BaseModel):
    user_id: str
    sort_mode: Optional[str] = "descending"