from fastapi import APIRouter, Depends
from app.auth import get_current_user
from app.db import get_db

router = APIRouter()


# ------------------------------
# ADD EXPENSE
# ------------------------------
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


# ------------------------------
# GET EXPENSES (WITH ID for editing)
# ------------------------------
@router.get("/expenses")
def get_expenses(user=Depends(get_current_user), db=Depends(get_db)):
    cur = db.cursor()
    cur.execute(
        """
        SELECT id, expense_date, category, amount, comment
        FROM expenses
        WHERE user_id = %s
        ORDER BY expense_date DESC
        """,
        (user["sub"],),
    )
    return cur.fetchall()


# ------------------------------
# UPDATE EXPENSE (INLINE EDIT)
# ------------------------------
@router.put("/expenses/{expense_id}")
def update_expense(
    expense_id: int,
    data: dict,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()
    cur.execute(
        """
        UPDATE expenses
        SET expense_date = %s,
            category = %s,
            amount = %s,
            comment = %s
        WHERE id = %s AND user_id = %s
        """,
        (
            data["expense_date"],
            data["category"],
            data["amount"],
            data.get("comment"),
            expense_id,
            user["sub"],
        ),
    )
    db.commit()
    return {"status": "expense updated"}


# ------------------------------
# DELETE EXPENSE
# ------------------------------
@router.delete("/expenses/{expense_id}")
def delete_expense(
    expense_id: int,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()
    cur.execute(
        """
        DELETE FROM expenses
        WHERE id = %s AND user_id = %s
        """,
        (expense_id, user["sub"]),
    )
    db.commit()
    return {"status": "expense deleted"}
