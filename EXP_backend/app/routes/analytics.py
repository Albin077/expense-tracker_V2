from fastapi import APIRouter, Depends
from app.auth import get_current_user
from app.db import get_db

router = APIRouter(prefix="/analytics")

@router.get("/summary")
def analytics_summary(user=Depends(get_current_user), db=Depends(get_db)):
    cur = db.cursor()

    cur.execute(
        "SELECT COALESCE(SUM(amount),0) FROM expenses WHERE user_id=%s",
        (user["sub"],),
    )
    total_expense = cur.fetchone()[0]

    cur.execute(
        "SELECT COALESCE(SUM(amount),0) FROM income WHERE user_id=%s",
        (user["sub"],),
    )
    total_income = cur.fetchone()[0]

    return {
        "total_expense": total_expense,
        "total_income": total_income
    }
