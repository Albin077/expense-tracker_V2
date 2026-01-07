import os
from jose import jwt, JWTError
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
if not SUPABASE_JWT_SECRET:
    raise RuntimeError("SUPABASE_JWT_SECRET missing")

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )

        print("AUTHENTICATED USER:", payload)
        return payload

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
