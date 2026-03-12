from fastapi import APIRouter, Depends, Query
from datetime import date
from app.auth import get_current_user
from app.db import get_db
from fastapi_cache.decorator import cache

router = APIRouter(prefix="/analytics")


# -------------------------------------------------
# BASIC SUMMARY (CORE KPI)
# -------------------------------------------------
@router.get("/summary")
@cache(expire=300)
def analytics_summary(
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()

    cur.execute(
        "SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE user_id = %s",
        (user["sub"],),
    )
    total_expense = cur.fetchone()["total"]

    cur.execute(
        "SELECT COALESCE(SUM(amount), 0) AS total FROM income WHERE user_id = %s",
        (user["sub"],),
    )
    total_income = cur.fetchone()["total"]

    return {
        "total_expense": total_expense,
        "total_income": total_income,
        "balance": total_income - total_expense,
        "status": "expense_exceeded"
        if total_expense > total_income
        else "healthy",
    }


# -------------------------------------------------
# KEYWORD SEARCH (EXPENSE COMMENTS)
# -------------------------------------------------
@router.get("/search")
def analytics_search(
    keyword: str = Query(..., min_length=1),
    from_date: date | None = None,
    to_date: date | None = None,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()

    query = """
        SELECT category, COALESCE(SUM(amount), 0) AS total
        FROM expenses
        WHERE user_id = %s
          AND comment ILIKE %s
    """
    params = [user["sub"], f"%{keyword}%"]

    if from_date and to_date:
        query += " AND expense_date >= %s AND expense_date < %s"
        params.extend([from_date, to_date])

    query += """
        GROUP BY category
        ORDER BY SUM(amount) DESC
    """

    cur.execute(query, tuple(params))
    rows = cur.fetchall()

    return [{"category": r["category"], "total": r["total"]} for r in rows]


# -------------------------------------------------
# MONTHLY ANALYTICS
# -------------------------------------------------
@router.get("/monthly")
@cache(expire=300)
def analytics_monthly(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()

    start = date(year, month, 1)
    end = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)

    cur.execute(
        """
        SELECT category, SUM(amount) AS total
        FROM expenses
        WHERE user_id = %s
          AND expense_date >= %s
          AND expense_date < %s
        GROUP BY category
        ORDER BY SUM(amount) DESC
        """,
        (user["sub"], start, end),
    )
    expenses = cur.fetchall()

    cur.execute(
        """
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM income
        WHERE user_id = %s
          AND income_date >= %s
          AND income_date < %s
        """,
        (user["sub"], start, end),
    )
    income = cur.fetchone()["total"]

    return {
        "month": month,
        "year": year,
        "total_income": income,
        "expenses": [{"category": r["category"], "total": r["total"]} for r in expenses],
    }


# -------------------------------------------------
# YEARLY ANALYTICS
# -------------------------------------------------
@router.get("/yearly")
@cache(expire=300)
def analytics_yearly(
    year: int,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()

    start = date(year, 1, 1)
    end = date(year + 1, 1, 1)

    cur.execute(
        """
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM expenses
        WHERE user_id = %s
          AND expense_date >= %s
          AND expense_date < %s
        """,
        (user["sub"], start, end),
    )
    expense = cur.fetchone()["total"]

    cur.execute(
        """
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM income
        WHERE user_id = %s
          AND income_date >= %s
          AND income_date < %s
        """,
        (user["sub"], start, end),
    )
    income = cur.fetchone()["total"]

    return {
        "year": year,
        "total_income": income,
        "total_expense": expense,
        "balance": income - expense,
    }


# -------------------------------------------------
# MONTHLY TREND (FOR CHARTS)
# -------------------------------------------------
@router.get("/trend")
def analytics_trend(
    year: int,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()

    start = date(year, 1, 1)
    end = date(year + 1, 1, 1)

    cur.execute(
        """
        SELECT EXTRACT(MONTH FROM expense_date)::int AS month, SUM(amount) AS total
        FROM expenses
        WHERE user_id = %s
          AND expense_date >= %s
          AND expense_date < %s
        GROUP BY 1
        ORDER BY 1
        """,
        (user["sub"], start, end),
    )
    expenses = cur.fetchall()

    cur.execute(
        """
        SELECT EXTRACT(MONTH FROM income_date)::int AS month, SUM(amount) AS total
        FROM income
        WHERE user_id = %s
          AND income_date >= %s
          AND income_date < %s
        GROUP BY 1
        ORDER BY 1
        """,
        (user["sub"], start, end),
    )
    income = cur.fetchall()

    return {
        "year": year,
        "expenses": [{"month": r["month"], "total": r["total"]} for r in expenses],
        "income": [{"month": r["month"], "total": r["total"]} for r in income],
    }


# -------------------------------------------------
# CATEGORY YEARLY TREND
# -------------------------------------------------
@router.get("/category-trend")
def category_yearly_trend(
    category: str,
    year: int,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()

    start = date(year, 1, 1)
    end = date(year + 1, 1, 1)

    cur.execute(
        """
        SELECT EXTRACT(MONTH FROM expense_date)::int AS month, SUM(amount) AS total
        FROM expenses
        WHERE user_id = %s
          AND category ILIKE %s
          AND expense_date >= %s
          AND expense_date < %s
        GROUP BY 1
        ORDER BY 1
        """,
        (user["sub"], category, start, end),
    )
    rows = cur.fetchall()

    return {
        "category": category,
        "year": year,
        "monthly": [{"month": r["month"], "total": r["total"]} for r in rows],
    }


# =================================================
# CHART CONTRACTS (DO NOT BREAK EXISTING APIs)
# =================================================

# 1️⃣ Monthly Income vs Expense
@router.get("/chart/monthly-summary")
def chart_monthly_summary(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()

    start_date = date(year, month, 1)
    end_date = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)

    cur.execute(
        """
        SELECT COALESCE(SUM(amount),0) AS total
        FROM income
        WHERE user_id=%s
          AND income_date >= %s
          AND income_date < %s
        """,
        (user["sub"], start_date, end_date),
    )
    income = cur.fetchone()["total"]

    cur.execute(
        """
        SELECT COALESCE(SUM(amount),0) AS total
        FROM expenses
        WHERE user_id=%s
          AND expense_date >= %s
          AND expense_date < %s
        """,
        (user["sub"], start_date, end_date),
    )
    expense = cur.fetchone()["total"]

    return {
        "labels": ["Income", "Expense"],
        "data": [income, expense],
        "insight": "Income exceeded expenses"
        if income >= expense
        else "Expenses exceeded income",
    }


# 2️⃣ Monthly Expense by Category
@router.get("/chart/monthly-expense-category")
def chart_monthly_expense_category(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()

    start_date = date(year, month, 1)
    end_date = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)

    cur.execute(
        """
        SELECT category, SUM(amount) AS total
        FROM expenses
        WHERE user_id=%s
          AND expense_date >= %s
          AND expense_date < %s
        GROUP BY category
        ORDER BY SUM(amount) DESC
        """,
        (user["sub"], start_date, end_date),
    )

    rows = cur.fetchall()

    return {
        "labels": [r["category"] for r in rows],
        "data": [r["total"] for r in rows],
    }


@router.get("/chart/expense-category-range")
def expense_category_range(
    from_date: date = Query(...),
    to_date: date = Query(...),
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()

    cur.execute(
        """
        SELECT category, COALESCE(SUM(amount), 0) AS total
        FROM expenses
        WHERE user_id = %s
          AND expense_date >= %s
          AND expense_date <= %s
        GROUP BY category
        ORDER BY SUM(amount) DESC
        """,
        (user["sub"], from_date, to_date),
    )

    rows = cur.fetchall()

    return {
        "labels": [r["category"] for r in rows],
        "data": [r["total"] for r in rows],
    }
# --------------------------------------------------------------------------------------------------------

# 3️⃣ Yearly Trend (Income vs Expense line chart)
@router.get("/chart/yearly-trend")
def chart_yearly_trend(
    year: int = Query(...),
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()

    income = [0] * 12
    expense = [0] * 12

    cur.execute(
        """
        SELECT EXTRACT(MONTH FROM income_date)::int AS month, SUM(amount) AS total
        FROM income
        WHERE user_id=%s AND income_date >= %s AND income_date < %s
        GROUP BY 1
        """,
        (user["sub"], date(year, 1, 1), date(year + 1, 1, 1)),
    )
    for r in cur.fetchall():
        income[r["month"] - 1] = r["total"]

    cur.execute(
        """
        SELECT EXTRACT(MONTH FROM expense_date)::int AS month, SUM(amount) AS total
        FROM expenses
        WHERE user_id=%s AND expense_date >= %s AND expense_date < %s
        GROUP BY 1
        """,
        (user["sub"], date(year, 1, 1), date(year + 1, 1, 1)),
    )
    for r in cur.fetchall():
        expense[r["month"] - 1] = r["total"]

    return {
        "labels": ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
        "income": income,
        "expense": expense,
    }


# 4️⃣ Category Trend (Search-based)
@router.get("/chart/category-trend")
def chart_category_trend(
    keyword: str = Query(...),
    year: int = Query(...),
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()
    monthly = [0] * 12

    cur.execute(
        """
        SELECT EXTRACT(MONTH FROM expense_date)::int AS month, SUM(amount) AS total
        FROM expenses
        WHERE user_id=%s
          AND expense_date >= %s AND expense_date < %s
          AND comment ILIKE %s
        GROUP BY 1
        """,
        (
            user["sub"],
            date(year, 1, 1),
            date(year + 1, 1, 1),
            f"%{keyword}%",
        ),
    )

    for r in cur.fetchall():
        monthly[r["month"] - 1] = r["total"]

    return {
        "labels": ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
        "data": monthly,
        "peak_month": monthly.index(max(monthly)) + 1 if max(monthly) > 0 else None,
    }


@router.get("/chart/keyword-range-trend")
def keyword_range_trend(
    keyword: str = Query(...),
    from_date: date = Query(...),
    to_date: date = Query(...),
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()

    cur.execute(
        """
        SELECT
          DATE_TRUNC('month', expense_date)::date AS month,
          SUM(amount) AS total
        FROM expenses
        WHERE user_id = %s
          AND expense_date >= %s
          AND expense_date <= %s
          AND (
            category ILIKE %s
            OR comment ILIKE %s
          )
        GROUP BY 1
        ORDER BY 1
        """,
        (
            user["sub"],
            from_date,
            to_date,
            f"%{keyword}%",
            f"%{keyword}%",
        ),
    )

    rows = cur.fetchall()

    return {
        "labels": [r["month"].strftime("%b %Y") for r in rows],
        "data": [r["total"] for r in rows],
    }


@router.get("/insights")
def analytics_insights(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()

    from datetime import date

    start = date(year, month, 1)
    end = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)

    prev_month = 12 if month == 1 else month - 1
    prev_year = year - 1 if month == 1 else year
    prev_start = date(prev_year, prev_month, 1)
    prev_end = date(prev_year + 1, 1, 1) if prev_month == 12 else date(prev_year, prev_month + 1, 1)

    cur.execute(
        "SELECT COALESCE(SUM(amount),0) AS total FROM income WHERE user_id=%s AND income_date >= %s AND income_date < %s",
        (user["sub"], start, end),
    )
    income = cur.fetchone()["total"]

    cur.execute(
        "SELECT COALESCE(SUM(amount),0) AS total FROM expenses WHERE user_id=%s AND expense_date >= %s AND expense_date < %s",
        (user["sub"], start, end),
    )
    expense = cur.fetchone()["total"]

    status_text = (
        f"Expenses exceeded income this month (Expense: {expense}, Income: {income})"
        if expense > income
        else f"Income exceeded expenses this month (Income: {income}, Expense: {expense})"
    )

    def get_category_totals(s, e):
        cur.execute(
            """
            SELECT category, SUM(amount) AS total
            FROM expenses
            WHERE user_id=%s AND expense_date >= %s AND expense_date < %s
            GROUP BY category
            """,
            (user["sub"], s, e),
        )
        rows = cur.fetchall()
        return {r["category"]: r["total"] for r in rows}

    current = get_category_totals(start, end)
    previous = get_category_totals(prev_start, prev_end)

    increased = []
    new_categories = []

    for cat, val in current.items():
        if cat not in previous:
            new_categories.append(cat)
        elif previous[cat] > 0 and val > previous[cat]:
            pct = round(((val - previous[cat]) / previous[cat]) * 100, 1)
            increased.append({"category": cat, "percent": pct})

    cur.execute(
        """
        SELECT category, AVG(month_total)
        FROM (
          SELECT category, DATE_TRUNC('month', expense_date), SUM(amount) AS month_total
          FROM expenses
          WHERE user_id=%s AND expense_date >= %s AND expense_date < %s
          GROUP BY 1,2
        ) t
        GROUP BY category
        """,
        (user["sub"], date(year, 1, 1), date(year + 1, 1, 1)),
    )
    avg_expense = cur.fetchall()

    cur.execute(
        """
        SELECT AVG(month_total) AS total
        FROM (
          SELECT DATE_TRUNC('month', income_date), SUM(amount) AS month_total
          FROM income
          WHERE user_id=%s AND income_date >= %s AND income_date < %s
          GROUP BY 1
        ) t
        """,
        (user["sub"], date(year, 1, 1), date(year + 1, 1, 1)),
    )
    avg_income = cur.fetchone()["total"] or 1

    avg_table = [
        {
            "category": c,
            "avg_expense": round(v, 2),
            "percent_of_income": round((v / avg_income) * 100, 1),
        }
        for c, v in avg_expense
    ]

    return {
        "status": status_text,
        "increased_categories": increased,
        "new_categories": new_categories,
        "avg_table": avg_table,
    }


# Account distribution
@router.get("/chart/account-distribution")
def chart_account_distribution(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()

    start = date(year, month, 1)
    end = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)

    cur.execute(
        """
        SELECT COALESCE(account,'Unknown') AS account, SUM(amount) AS total
        FROM expenses
        WHERE user_id=%s
          AND expense_date >= %s
          AND expense_date < %s
        GROUP BY 1
        ORDER BY SUM(amount) DESC
        """,
        (user["sub"], start, end),
    )

    rows = cur.fetchall()

    return {
        "labels": [r["account"] for r in rows],
        "data": [r["total"] for r in rows],
    }


# Account yearly trend
@router.get("/chart/account-trend")
def chart_account_trend(
    year: int = Query(...),
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()

    cur.execute(
        """
        SELECT account,
               EXTRACT(MONTH FROM expense_date)::int AS month,
               SUM(amount) AS total
        FROM expenses
        WHERE user_id=%s
          AND expense_date >= %s
          AND expense_date < %s
        GROUP BY 1,2
        ORDER BY 1,2
        """,
        (user["sub"], date(year, 1, 1), date(year + 1, 1, 1)),
    )

    data = {}

    for r in cur.fetchall():
        acc = r["account"] or "Unknown"
        if acc not in data:
            data[acc] = [0] * 12
        data[acc][r["month"] - 1] = r["total"]

    return {
        "labels": ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
        "datasets": [{"label": k, "data": v} for k, v in data.items()],
    }


# Account insight
@router.get("/chart/account-insight")
def account_insight(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()

    start = date(year, month, 1)
    end = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)

    cur.execute(
        """
        SELECT account, SUM(amount) AS total
        FROM expenses
        WHERE user_id=%s
          AND expense_date >= %s
          AND expense_date < %s
        GROUP BY account
        ORDER BY SUM(amount) DESC
        """,
        (user["sub"], start, end),
    )

    rows = cur.fetchall()

    if len(rows) >= 2:
        return {
            "text": f"{rows[0]['account']} ₹{rows[0]['total']} vs {rows[1]['account']} ₹{rows[1]['total']}"
        }

    return {"text": "Not enough data"}