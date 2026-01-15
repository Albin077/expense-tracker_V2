from fastapi import APIRouter, Depends, Query
from app.auth import get_current_user
from app.db import get_db

router = APIRouter()

ALLOWED_SORT_FIELDS = {
    "date": "income_date",
    "amount": "amount",
}

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
# GET INCOME (SEARCH / SORT / FILTER)
# ------------------------------
@router.get("/income")
def get_income(
    user=Depends(get_current_user),
    db=Depends(get_db),
    search: str | None = Query(default=None),
    sort_by: str = Query(default="date"),   # date | amount
    order: str = Query(default="desc"),     # asc | desc
    month: int | None = Query(default=None) # 1–12
):
    sort_column = ALLOWED_SORT_FIELDS.get(sort_by, "income_date")
    order_sql = "ASC" if order.lower() == "asc" else "DESC"

    query = """
        SELECT id, income_date, source, amount, comment
        FROM income
        WHERE user_id = %s
    """
    params = [user["sub"]]

    if search:
        query += " AND (source ILIKE %s OR comment ILIKE %s)"
        params.extend([f"%{search}%", f"%{search}%"])

    if month:
        query += " AND EXTRACT(MONTH FROM income_date) = %s"
        params.append(month)

    query += f" ORDER BY {sort_column} {order_sql}"

    cur = db.cursor()
    cur.execute(query, tuple(params))
    return cur.fetchall()


# ------------------------------
# UPDATE INCOME
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
        "DELETE FROM income WHERE id = %s AND user_id = %s",
        (income_id, user["sub"]),
    )
    db.commit()
    return {"status": "income deleted"}
