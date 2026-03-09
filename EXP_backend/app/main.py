from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend

from app.auth import get_current_user
from app.routes.expenses import router as expenses_router
from app.routes.income import router as income_router
from app.routes.analytics import router as analytics_router


app = FastAPI()


@app.on_event("startup")
async def startup():
    FastAPICache.init(InMemoryBackend())

# ------------------------------
# CORS
# ------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",  # local development
        "https://expense-tracker-v2-lyart.vercel.app"  # production frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------
# HEALTH CHECK
# ------------------------------
@app.get("/")
def root():
    return {"status": "Backend running"}

# ------------------------------
# ROUTERS
# ------------------------------
app.include_router(expenses_router)
app.include_router(income_router)
app.include_router(analytics_router)

# ------------------------------
# PROTECTED TEST
# ------------------------------
@app.get("/protected")
def protected_route(user=Depends(get_current_user)):
    return {
        "message": "Access granted",
        "user_id": user["sub"],
        "email": user["email"],
    }
