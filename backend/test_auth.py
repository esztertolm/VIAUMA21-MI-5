from fastapi import FastAPI
from routes.auth import router as auth_router
import uvicorn

app = FastAPI(title="Google OAuth with FastAPI")

# Auth route-ok regisztrálása
app.include_router(auth_router)

@app.get("/")
def root():
    return {"message": "FastAPI backend running"}

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8080)
