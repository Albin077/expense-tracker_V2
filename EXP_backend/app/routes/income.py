from fastapi import APIRouter, Depends
from app.auth import get_current_user
from app.db import get_db

router = APIRouter()


# ------------------------------
# ADD INCOME
# ------------------------------
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


# ------------------------------
# GET INCOME (WITH ID for editing)
# ------------------------------
@router.get("/income")
def get_income(user=Depends(get_current_user), db=Depends(get_db)):
    cur = db.cursor()
    cur.execute(
        """
        SELECT id, income_date, source, amount, comment
        FROM income
        WHERE user_id = %s
        ORDER BY income_date DESC
        """,
        (user["sub"],),
    )
    return cur.fetchall()


# ------------------------------
# UPDATE INCOME (INLINE EDIT)
# ------------------------------
@router.put("/income/{income_id}")
def update_income(
    income_id: int,
    data: dict,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()
    cur.execute(
        """
        UPDATE income
        SET income_date = %s,
            source = %s,
            amount = %s,
            comment = %s
        WHERE id = %s AND user_id = %s
        """,
        (
            data["income_date"],
            data["source"],
            data["amount"],
            data.get("comment"),
            income_id,
            user["sub"],
        ),
    )
    db.commit()
    return {"status": "income updated"}


# ------------------------------
# DELETE INCOME
# ------------------------------
@router.delete("/income/{income_id}")
def delete_income(
    income_id: int,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()
    cur.execute(
        """
        DELETE FROM income
        WHERE id = %s AND user_id = %s
        """,
        (income_id, user["sub"]),
    )
    db.commit()
    return {"status": "income deleted"}
