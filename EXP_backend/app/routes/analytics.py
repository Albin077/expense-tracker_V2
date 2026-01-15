from fastapi import APIRouter, Depends, Query
from datetime import date
from app.auth import get_current_user
from app.db import get_db

router = APIRouter(prefix="/analytics")


# -------------------------------------------------
# BASIC SUMMARY (DO NOT TOUCH – CORE KPI)
# -------------------------------------------------
@router.get("/summary")
def analytics_summary(
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()

    # Total Expense
    cur.execute(
        "SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id = %s",
        (user["sub"],),
    )
    total_expense = cur.fetchone()[0]

    # Total Income
    cur.execute(
        "SELECT COALESCE(SUM(amount), 0) FROM income WHERE user_id = %s",
        (user["sub"],),
    )
    total_income = cur.fetchone()[0]

    return {
        "total_expense": total_expense,
        "total_income": total_income,
        "balance": total_income - total_expense,
    }


# -------------------------------------------------
# KEYWORD-BASED EXPENSE ANALYTICS
# (comment search + group by category)
# -------------------------------------------------
@router.get("/search")
def analytics_search(
    keyword: str = Query(..., min_length=1),
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    month: int | None = Query(default=None),   # 1–12
    year: int | None = Query(default=None),
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()

    query = """
        SELECT
            e.category_id,
            COALESCE(SUM(e.amount), 0) AS total_amount
        FROM expenses e
        WHERE e.user_id = %s
          AND e.comment ILIKE %s
    """

    params = [user["sub"], f"%{keyword}%"]

    # Date range filter
    if from_date and to_date:
        query += " AND e.expense_date BETWEEN %s AND %s"
        params.extend([from_date, to_date])

    # Month filter
    if month:
        query += " AND EXTRACT(MONTH FROM e.expense_date) = %s"
        params.append(month)

    # Year filter
    if year:
        query += " AND EXTRACT(YEAR FROM e.expense_date) = %s"
        params.append(year)

    query += """
        GROUP BY e.category_id
        ORDER BY total_amount DESC
    """

    cur.execute(query, tuple(params))
    rows = cur.fetchall()

    return [
        {
            "category_id": r[0],
            "total": r[1],
        }
        for r in rows
    ]


# -------------------------------------------------
# MONTHLY REPORT (EXPENSE + INCOME)
# -------------------------------------------------
@router.get("/monthly")
def analytics_monthly(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()

    # Expenses by category
    cur.execute(
        """
        SELECT category_id, COALESCE(SUM(amount), 0)
        FROM expenses
        WHERE user_id = %s
          AND EXTRACT(MONTH FROM expense_date) = %s
          AND EXTRACT(YEAR FROM expense_date) = %s
        GROUP BY category_id
        ORDER BY SUM(amount) DESC
        """,
        (user["sub"], month, year),
    )
    expense_by_category = cur.fetchall()

    # Total income
    cur.execute(
        """
        SELECT COALESCE(SUM(amount), 0)
        FROM income
        WHERE user_id = %s
          AND EXTRACT(MONTH FROM income_date) = %s
          AND EXTRACT(YEAR FROM income_date) = %s
        """,
        (user["sub"], month, year),
    )
    total_income = cur.fetchone()[0]

    return {
        "month": month,
        "year": year,
        "total_income": total_income,
        "expenses_by_category": [
            {"category_id": r[0], "total": r[1]} for r in expense_by_category
        ],
    }


# -------------------------------------------------
# YEARLY INSIGHT
# -------------------------------------------------
@router.get("/yearly")
def analytics_yearly(
    year: int = Query(...),
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()

    cur.execute(
        """
        SELECT COALESCE(SUM(amount), 0)
        FROM expenses
        WHERE user_id = %s
          AND EXTRACT(YEAR FROM expense_date) = %s
        """,
        (user["sub"], year),
    )
    total_expense = cur.fetchone()[0]

    cur.execute(
        """
        SELECT COALESCE(SUM(amount), 0)
        FROM income
        WHERE user_id = %s
          AND EXTRACT(YEAR FROM income_date) = %s
        """,
        (user["sub"], year),
    )
    total_income = cur.fetchone()[0]

    return {
        "year": year,
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": total_income - total_expense,
    }


# -------------------------------------------------
# TREND (MONTHLY INCOME VS EXPENSE)
# -------------------------------------------------
@router.get("/trend")
def analytics_trend(
    year: int = Query(...),
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()

    cur.execute(
        """
        SELECT
            EXTRACT(MONTH FROM expense_date) AS month,
            SUM(amount)
        FROM expenses
        WHERE user_id = %s
          AND EXTRACT(YEAR FROM expense_date) = %s
        GROUP BY month
        ORDER BY month
        """,
        (user["sub"], year),
    )
    expenses = cur.fetchall()

    cur.execute(
        """
        SELECT
            EXTRACT(MONTH FROM income_date) AS month,
            SUM(amount)
        FROM income
        WHERE user_id = %s
          AND EXTRACT(YEAR FROM income_date) = %s
        GROUP BY month
        ORDER BY month
        """,
        (user["sub"], year),
    )
    income = cur.fetchall()

    return {
        "year": year,
        "expenses": [{"month": m, "total": t} for m, t in expenses],
        "income": [{"month": m, "total": t} for m, t in income],
    }
