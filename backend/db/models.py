from pydantic import BaseModel

class UserRegisterRequest(BaseModel):
    oauth_id: str