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
def get_expenses(
    sort_by: str = "date",
    order: str = "desc",
    month: int | None = None,
    category: str | None = None,
    keyword: str | None = None,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()

    # ---- ALLOWED SORT FIELDS (security)
    sort_map = {
        "date": "expense_date",
        "amount": "amount",
        "category": "category",
    }
    sort_column = sort_map.get(sort_by, "expense_date")
    order = "ASC" if order.lower() == "asc" else "DESC"

    query = """
        SELECT id, expense_date, category, amount, comment
        FROM expenses
        WHERE user_id = %s
    """
    params = [user["sub"]]

    # ---- FILTERS
    if month:
        query += " AND EXTRACT(MONTH FROM expense_date) = %s"
        params.append(month)

    if category:
        query += " AND category = %s"
        params.append(category)

    if keyword:
        query += """
            AND (
                category ILIKE %s
                OR comment ILIKE %s
                OR amount::TEXT ILIKE %s
            )
        """
        kw = f"%{keyword}%"
        params.extend([kw, kw, kw])

    query += f" ORDER BY {sort_column} {order}"

    cur.execute(query, params)
    return cur.fetchall()

def get_expenses(
    sort_by: str = "date",          # date | category | amount
    order: str = "desc",            # asc | desc
    month: int | None = None,       # 1 - 12
    category: str | None = None,    # exact category
    keyword: str | None = None,     # search in comment
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()

    # ------------------------------
    # BASE QUERY
    # ------------------------------
    query = """
        SELECT id, expense_date, category, amount, comment
        FROM expenses
        WHERE user_id = %s
    """
    params = [user["sub"]]

    # ------------------------------
    # FILTERS
    # ------------------------------
    if month:
        query += " AND EXTRACT(MONTH FROM expense_date) = %s"
        params.append(month)

    if category:
        query += " AND category = %s"
        params.append(category)

    if keyword:
        query += " AND comment ILIKE %s"
        params.append(f"%{keyword}%")

    # ------------------------------
    # SORTING
    # ------------------------------
    sort_map = {
        "date": "expense_date",
        "category": "category",
        "amount": "amount",
    }

    sort_column = sort_map.get(sort_by, "expense_date")
    sort_order = "ASC" if order.lower() == "asc" else "DESC"

    query += f" ORDER BY {sort_column} {sort_order}"

    # ------------------------------
    # EXECUTE
    # ------------------------------
    cur.execute(query, tuple(params))
    return cur.fetchall()

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
