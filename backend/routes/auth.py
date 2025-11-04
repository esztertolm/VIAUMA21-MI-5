from flask import Blueprint, redirect, request, session, jsonify, url_for
import google_auth_oauthlib.flow
import requests
import os

auth_bp = Blueprint("auth", __name__)

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")

SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]

# Itt készítjük el a Google OAuth konfigurációt .env alapján
CLIENT_CONFIG = {
    "web": {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": [REDIRECT_URI]
    }
}

# ============ ROUTES ============

@auth_bp.route("/")
def index():
    return '<a href="/authorize">Bejelentkezés Google-lel</a>'

@auth_bp.route("/authorize")
def authorize():
    # OAuth2 flow inicializálása a környezeti adatokkal
    flow = google_auth_oauthlib.flow.Flow.from_client_config(CLIENT_CONFIG, SCOPES)
    flow.redirect_uri = url_for("auth.oauth2callback", _external=True)
    auth_url, state = flow.authorization_url(
        access_type="offline", include_granted_scopes="true"
    )
    session["state"] = state
    return redirect(auth_url)

@auth_bp.route("/oauth2callback")
def oauth2callback():
    state = session["state"]
    flow = google_auth_oauthlib.flow.Flow.from_client_config(
        CLIENT_CONFIG, SCOPES, state=state
    )
    flow.redirect_uri = url_for("auth.oauth2callback", _external=True)

    # Token lekérése a Google-től
    flow.fetch_token(authorization_response=request.url)
    credentials = flow.credentials

    # Felhasználói adatok lekérése
    userinfo = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {credentials.token}"}
    ).json()

    session["user"] = userinfo
    return jsonify(userinfo)

@auth_bp.route("/logout")
def logout():
    session.clear()
    return redirect("/")
