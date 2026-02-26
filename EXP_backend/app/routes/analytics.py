from fastapi import APIRouter, Depends, Query
from datetime import date
from app.auth import get_current_user
from app.db import get_db
from fastapi_cache.decorator import cache
from datetime import date
from fastapi import Query


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
        "SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id = %s",
        (user["sub"],),
    )
    total_expense = cur.fetchone()[0]

    cur.execute(
        "SELECT COALESCE(SUM(amount), 0) FROM income WHERE user_id = %s",
        (user["sub"],),
    )
    total_income = cur.fetchone()[0]

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
        SELECT category, COALESCE(SUM(amount), 0)
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

    return [{"category": c, "total": t} for c, t in rows]


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

    # Expenses by category
    cur.execute(
        """
        SELECT category, SUM(amount)
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

    # Total income
    cur.execute(
        """
        SELECT COALESCE(SUM(amount), 0)
        FROM income
        WHERE user_id = %s
          AND income_date >= %s
          AND income_date < %s
        """,
        (user["sub"], start, end),
    )
    income = cur.fetchone()[0]

    return {
        "month": month,
        "year": year,
        "total_income": income,
        "expenses": [{"category": c, "total": t} for c, t in expenses],
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
        SELECT COALESCE(SUM(amount), 0)
        FROM expenses
        WHERE user_id = %s
          AND expense_date >= %s
          AND expense_date < %s
        """,
        (user["sub"], start, end),
    )
    expense = cur.fetchone()[0]

    cur.execute(
        """
        SELECT COALESCE(SUM(amount), 0)
        FROM income
        WHERE user_id = %s
          AND income_date >= %s
          AND income_date < %s
        """,
        (user["sub"], start, end),
    )
    income = cur.fetchone()[0]

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
        SELECT EXTRACT(MONTH FROM expense_date)::int, SUM(amount)
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
        SELECT EXTRACT(MONTH FROM income_date)::int, SUM(amount)
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
        "expenses": [{"month": m, "total": t} for m, t in expenses],
        "income": [{"month": m, "total": t} for m, t in income],
    }


# -------------------------------------------------
# CATEGORY YEARLY TREND (PETROL ETC.)
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
        SELECT EXTRACT(MONTH FROM expense_date)::int, SUM(amount)
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
        "monthly": [{"month": m, "total": t} for m, t in rows],
    }

# =================================================
# CHART CONTRACTS (DO NOT BREAK EXISTING APIs)
# =================================================

# 1️⃣ Monthly Income vs Expense (Chart-ready)
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
        SELECT COALESCE(SUM(amount),0)
        FROM income
        WHERE user_id=%s
          AND income_date >= %s
          AND income_date < %s
        """,
        (user["sub"], start_date, end_date),
    )
    income = cur.fetchone()[0]

    cur.execute(
        """
        SELECT COALESCE(SUM(amount),0)
        FROM expenses
        WHERE user_id=%s
          AND expense_date >= %s
          AND expense_date < %s
        """,
        (user["sub"], start_date, end_date),
    )
    expense = cur.fetchone()[0]

    return {
        "labels": ["Income", "Expense"],
        "data": [income, expense],
        "insight": "Income exceeded expenses"
        if income >= expense
        else "Expenses exceeded income",
    }


# 2️⃣ Monthly Expense by Category (Pie chart)
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
        SELECT category, SUM(amount)
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
        "labels": [r[0] for r in rows],
        "data": [r[1] for r in rows],
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
        SELECT category, COALESCE(SUM(amount), 0)
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
        "labels": [r[0] for r in rows],
        "data": [r[1] for r in rows],
    }



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
        SELECT EXTRACT(MONTH FROM income_date)::int, SUM(amount)
        FROM income
        WHERE user_id=%s AND income_date >= %s AND income_date < %s
        GROUP BY 1
        """,
        (user["sub"], date(year, 1, 1), date(year + 1, 1, 1)),
    )
    for m, t in cur.fetchall():
        income[m - 1] = t

    cur.execute(
        """
        SELECT EXTRACT(MONTH FROM expense_date)::int, SUM(amount)
        FROM expenses
        WHERE user_id=%s AND expense_date >= %s AND expense_date < %s
        GROUP BY 1
        """,
        (user["sub"], date(year, 1, 1), date(year + 1, 1, 1)),
    )
    for m, t in cur.fetchall():
        expense[m - 1] = t

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
        SELECT EXTRACT(MONTH FROM expense_date)::int, SUM(amount)
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

    for m, t in cur.fetchall():
        monthly[m - 1] = t

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
          SUM(amount)
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
        "labels": [r[0].strftime("%b %Y") for r in rows],
        "data": [r[1] for r in rows],
    }

@router.get("/insights")
def analytics_insights(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    cur = db.cursor()

    # ---------- date ranges ----------
    from datetime import date
    start = date(year, month, 1)
    end = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)

    prev_month = 12 if month == 1 else month - 1
    prev_year = year - 1 if month == 1 else year
    prev_start = date(prev_year, prev_month, 1)
    prev_end = date(prev_year + 1, 1, 1) if prev_month == 12 else date(prev_year, prev_month + 1, 1)

    # ---------- income & expense ----------
    cur.execute(
        "SELECT COALESCE(SUM(amount),0) FROM income WHERE user_id=%s AND income_date >= %s AND income_date < %s",
        (user["sub"], start, end),
    )
    income = cur.fetchone()[0]

    cur.execute(
        "SELECT COALESCE(SUM(amount),0) FROM expenses WHERE user_id=%s AND expense_date >= %s AND expense_date < %s",
        (user["sub"], start, end),
    )
    expense = cur.fetchone()[0]

    status_text = (
        f"Expenses exceeded income this month (Expense: {expense}, Income: {income})"
        if expense > income
        else f"Income exceeded expenses this month (Income: {income}, Expense: {expense})"
    )

    # ---------- category comparison ----------
    def get_category_totals(s, e):
        cur.execute(
            """
            SELECT category, SUM(amount)
            FROM expenses
            WHERE user_id=%s AND expense_date >= %s AND expense_date < %s
            GROUP BY category
            """,
            (user["sub"], s, e),
        )
        return dict(cur.fetchall())

    current = get_category_totals(start, end)
    previous = get_category_totals(prev_start, prev_end)

    increased = []
    new_categories = []

    for cat, val in current.items():
        if cat not in previous:
            new_categories.append(cat)
        elif previous[cat] > 0 and val > previous[cat]:
            pct = round(((val - previous[cat]) / previous[cat]) * 100, 1)
            increased.append({
                "category": cat,
                "percent": pct
            })

    # ---------- average monthly (yearly) ----------
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
        SELECT AVG(month_total)
        FROM (
          SELECT DATE_TRUNC('month', income_date), SUM(amount) AS month_total
          FROM income
          WHERE user_id=%s AND income_date >= %s AND income_date < %s
          GROUP BY 1
        ) t
        """,
        (user["sub"], date(year, 1, 1), date(year + 1, 1, 1)),
    )
    avg_income = cur.fetchone()[0] or 1

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
# =================================================
# 💳 ACCOUNT ANALYTICS (ADDED — NO CHANGES ABOVE)
# =================================================

# Account distribution (Pie / Bar)
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
        SELECT COALESCE(account,'Unknown'), SUM(amount)
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
        "labels": [r[0] for r in rows],
        "data": [r[1] for r in rows],
    }


# Account yearly trend (Line)
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
               EXTRACT(MONTH FROM expense_date)::int,
               SUM(amount)
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

    for acc, m, t in cur.fetchall():
        acc = acc or "Unknown"
        if acc not in data:
            data[acc] = [0] * 12
        data[acc][m - 1] = t

    return {
        "labels": ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
        "datasets": [{"label": k, "data": v} for k, v in data.items()],
    }


# Account insight (Credit vs Cash etc)
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
        SELECT account, SUM(amount)
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
            "text": f"{rows[0][0]} ₹{rows[0][1]} vs {rows[1][0]} ₹{rows[1][1]}"
        }

    return {"text": "Not enough data"}