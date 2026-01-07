from fastapi import APIRouter, Depends
from app.auth import get_current_user
from app.db import get_db

router = APIRouter()

@router.post("/income")
def add_income(data: dict, user=Depends(get_current_user), db=Depends(get_db)):
    cur = db.cursor()
    cur.execute(
        """
        INSERT INTO income (income_date, source, amount, comment, user_id)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (
            data["income_date"],
            data["source"],
            data["amount"],
            data.get("comment"),
            user["sub"],
        ),
    )
    db.commit()
    return {"status": "income added"}

@router.get("/income")
def get_income(user=Depends(get_current_user), db=Depends(get_db)):
    cur = db.cursor()
    cur.execute(
        """
        SELECT income_date, source, amount, comment
        FROM income
        WHERE user_id = %s
        ORDER BY income_date DESC
        """,
        (user["sub"],),
    )
    return cur.fetchall()
