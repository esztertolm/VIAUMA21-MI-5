from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse, JSONResponse
import google_auth_oauthlib.flow
import requests
import os
from dotenv import load_dotenv
import backend.db.repository as db
import backend.db.models as dbmodels
import json
import base64
from backend.utils.logger import logger

load_dotenv()

router = APIRouter(prefix="/auth", tags=["Auth"])

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

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
    logger.info("Authentication started.")
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
    """A Google visszadob ide, itt lekérjük a user info-t, majd átirányítjuk a frontend-re"""
    flow = google_auth_oauthlib.flow.Flow.from_client_config(CLIENT_CONFIG, SCOPES)
    flow.redirect_uri = REDIRECT_URI

    # Lekérjük a tokent a Google-től
    flow.fetch_token(authorization_response=str(request.url))
    credentials = flow.credentials

    userinfo = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {credentials.token}"}
    ).json()

    # Base64-eljük a user info-t, hogy átadhassuk query-ben
    userinfo_b64 = base64.urlsafe_b64encode(json.dumps(userinfo).encode()).decode()
    logger.info("Userinfo is directed to frontend.")
    # Redirect a frontend callback-re
    return RedirectResponse(f"{FRONTEND_URL}/oauth/callback?user={userinfo_b64}")



@router.get("/logout")
def logout():
    """Egyszerű logout endpoint"""
    logger.info("User logged out.")
    return {"message": "Logged out (no real session used in this demo)"}

@router.post("/register")
def register(request_data: dbmodels.UserRegisterRequest):
    """User regisztrálása."""
    user_id = db.create_user(
        oauth_id=request_data.oauth_id,
    )
    logger.info("User logged in.")

    return {"user_id": user_id}