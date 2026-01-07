from fastapi import APIRouter, Depends
from app.auth import get_current_user
from app.db import get_db

router = APIRouter()

@router.post("/expenses")
def add_expense(data: dict, user=Depends(get_current_user), db=Depends(get_db)):
    cur = db.cursor()
    cur.execute(
        """
        INSERT INTO expenses (expense_date, category, amount, comment, user_id)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (
            data["expense_date"],
            data["category"],
            data["amount"],
            data.get("comment"),
            user["sub"],
        ),
    )
    db.commit()
    return {"status": "expense added"}

@router.get("/expenses")
def get_expenses(user=Depends(get_current_user), db=Depends(get_db)):
    cur = db.cursor()
    cur.execute(
        """
        SELECT expense_date, category, amount, comment
        FROM expenses
        WHERE user_id = %s
        ORDER BY expense_date DESC
        """,
        (user["sub"],),
    )
    return cur.fetchall()
