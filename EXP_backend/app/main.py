from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.auth import get_current_user

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "Backend running"}

@app.get("/protected")
def protected_route(user=Depends(get_current_user)):
    return {
        "message": "Access granted",
        "user_id": user["sub"],
        "email": user["email"],
    }
