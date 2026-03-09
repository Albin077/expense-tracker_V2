from fastapi import APIRouter, Depends
from datetime import date
from decimal import Decimal

from app.auth import get_current_user
from app.db import get_db

router = APIRouter()


# ------------------------------
# Helper to convert DB rows
# ------------------------------
def format_expense(row):
    return {
        "id": row[0],
        "expense_date": str(row[1]),
        "category": row[2],
        "amount": float(row[3]) if isinstance(row[3], Decimal) else row[3],
        "comment": row[4],
        "account": row[5],
    }


# ------------------------------
# ADD EXPENSE
# ------------------------------
@router.post("/expenses")
def add_expense(data: dict, user=Depends(get_current_user), db=Depends(get_db)):
    required = ["expense_date", "category", "amount"]

    for field in required:
        if not data.get(field):
            return {"error": f"{field} is required"}

    cur = db.cursor()

    cur.execute(
        """
        INSERT INTO expenses (expense_date, category, amount, comment, account, user_id)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            data["expense_date"],
            data["category"],
            data["amount"],
            data.get("comment"),
            data.get("account"),
            user["sub"],
        ),
    )

    db.commit()

    return {"status": "expense added"}


# ------------------------------
# GET EXPENSES
# ------------------------------
@router.get("/expenses")
def get_expenses(
    sort_by: str = "date",
    order: str = "desc",
    month: int | None = None,
    category: str | None = None,
    keyword: str | None = None,
    search: str | None = None,
    user=Depends(get_current_user),
    db=Depends(get_db),
):

    cur = db.cursor()

    sort_map = {
        "date": "expense_date",
        "amount": "amount",
        "category": "category",
    }

    sort_column = sort_map.get(sort_by, "expense_date")
    order_sql = "ASC" if order.lower() == "asc" else "DESC"

    query = """
        SELECT id, expense_date, category, amount, comment, account
        FROM expenses
        WHERE user_id = %s
    """

    params = [user["sub"]]

    # Month filter
    if month:
        query += " AND EXTRACT(MONTH FROM expense_date) = %s"
        params.append(month)

    # Category filter
    if category:
        query += " AND category = %s"
        params.append(category)

    # Search
    term = keyword or search
    if term:
        query += """
            AND (
                category ILIKE %s
                OR comment ILIKE %s
                OR account ILIKE %s
                OR amount::TEXT ILIKE %s
            )
        """
        kw = f"%{term}%"
        params.extend([kw, kw, kw, kw])

    query += f" ORDER BY {sort_column} {order_sql}"

    cur.execute(query, params)

    rows = cur.fetchall()

    return [format_expense(r) for r in rows]


# ------------------------------
# UPDATE EXPENSE
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
            comment = %s,
            account = %s
        WHERE id = %s AND user_id = %s
        """,
        (
            data["expense_date"],
            data["category"],
            data["amount"],
            data.get("comment"),
            data.get("account"),
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
        "DELETE FROM expenses WHERE id = %s AND user_id = %s",
        (expense_id, user["sub"]),
    )

    db.commit()

    return {"status": "expense deleted"}


# ------------------------------
# SPENDING INCREASE INSIGHT
# ------------------------------
@router.get("/expenses/spending-increase")
def spending_increase(user=Depends(get_current_user), db=Depends(get_db)):

    cur = db.cursor()

    today = date.today()
    cur_month = today.month
    cur_year = today.year

    prev_month = cur_month - 1
    prev_year = cur_year

    if prev_month == 0:
        prev_month = 12
        prev_year -= 1

    query = """
        SELECT category,
               SUM(CASE
                   WHEN EXTRACT(MONTH FROM expense_date) = %s
                    AND EXTRACT(YEAR FROM expense_date) = %s
                   THEN amount ELSE 0 END) AS current_total,
               SUM(CASE
                   WHEN EXTRACT(MONTH FROM expense_date) = %s
                    AND EXTRACT(YEAR FROM expense_date) = %s
                   THEN amount ELSE 0 END) AS previous_total
        FROM expenses
        WHERE user_id = %s
        GROUP BY category
    """

    cur.execute(
        query,
        (
            cur_month,
            cur_year,
            prev_month,
            prev_year,
            user["sub"],
        ),
    )

    rows = cur.fetchall()

    result = []

    for category, current, previous in rows:

        current = float(current or 0)
        previous = float(previous or 0)

        if previous > 0 and current > previous:
            percent = ((current - previous) / previous) * 100

            result.append(
                {
                    "category": category,
                    "percent": round(percent, 1),
                }
            )

    return result