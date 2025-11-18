from fastapi import FastAPI
from .routes.auth import router as auth_router
from .routes.transcribe import router as transcribe_router

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import unified API router
# from api import router as api_router


app = FastAPI(
    title="Szoftverarchitektúrák transcription API",
    description="Speech-to-text transcription with speaker diarization using AssemblyAI",
    version="1.0.0",
)

# Include unified API routes
# app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth route-ok regisztrálása
app.include_router(auth_router)
app.include_router(transcribe_router)

@app.get("/")
def main():
    return {"message": "Backend is running"}