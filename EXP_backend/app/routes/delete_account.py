from fastapi import APIRouter, Depends
from app.auth import get_current_user
import requests
import os
from app.db import get_db

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

@router.delete("/delete-account")
def delete_account(user=Depends(get_current_user), db=Depends(get_db)):

    user_id = user["sub"]

    # ----------------------
    # DELETE USER DATA
    # ----------------------

    db.execute("DELETE FROM expenses WHERE user_id = %s", (user_id,))
    db.execute("DELETE FROM income WHERE user_id = %s", (user_id,))
    db.commit()

    # ----------------------
    # DELETE AVATAR FILES
    # ----------------------

    requests.delete(
        f"{SUPABASE_URL}/storage/v1/object/avatars/{user_id}",
        headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}"
        }
    )

    # ----------------------
    # DELETE AUTH USER
    # ----------------------

    r = requests.delete(
        f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}",
        headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}"
        }
    )

    if r.status_code != 200:
        return {"error": "user deletion failed"}

    return {"status": "account deleted"}