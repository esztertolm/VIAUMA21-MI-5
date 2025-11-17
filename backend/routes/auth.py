from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse, JSONResponse
import google_auth_oauthlib.flow
import requests
import os
from dotenv import load_dotenv
import db.repository as db

load_dotenv()

router = APIRouter(prefix="/auth", tags=["Auth"])

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")

SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]

CLIENT_CONFIG = {
    "web": {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": [REDIRECT_URI],
    }
}

# Csak lokális fejlesztéshez – engedélyezett HTTP
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"


@router.get("/")
def index():
    """Egyszerű link a login-hoz"""
    return {"message": "Auth service running", "login_url": "/auth/authorize"}


@router.get("/authorize")
def authorize():
    """Elindítja a Google OAuth flow-t"""
    flow = google_auth_oauthlib.flow.Flow.from_client_config(CLIENT_CONFIG, SCOPES)
    flow.redirect_uri = REDIRECT_URI

    auth_url, state = flow.authorization_url(
        access_type="offline", include_granted_scopes="true"
    )

    # A FastAPI-ban session-kezelés alapból nincs, 
    # ezért most csak visszaküldjük az auth URL-t
    return RedirectResponse(auth_url)


@router.get("/oauth2callback")
def oauth2callback(request: Request):
    """A Google visszahívja ide a usert"""
    flow = google_auth_oauthlib.flow.Flow.from_client_config(CLIENT_CONFIG, SCOPES)
    flow.redirect_uri = REDIRECT_URI

    flow.fetch_token(authorization_response=str(request.url))
    credentials = flow.credentials

    # Lekérjük a userinfót
    userinfo = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {credentials.token}"},
    ).json()

    return JSONResponse(userinfo)


@router.get("/logout")
def logout():
    """Egyszerű logout endpoint"""
    return {"message": "Logged out (no real session used in this demo)"}

@router.post("/register")
async def register(request: Request):
    """User regisztrálása."""
    body = await request.json()
    oauth_id = body.get("oauth_id")
    name = body.get("name")

    if not oauth_id or not name:
        return JSONResponse({"error": "Missing oauth_id or name"}, status_code=400)
    
    user_id = db.create_user(oauth_id=oauth_id, name=name)
    return {"user_id": user_id}