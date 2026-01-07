from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.auth import get_current_user
from app.db import get_db
import psycopg2

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------
# HEALTH CHECK
# ------------------------------

@app.get("/")
def root():
    return {"status": "Backend running"}

@app.get("/protected")
def protected_route(user=Depends(get_current_user)):
    return {
        "message": "Access granted",
        "user_id": user["sub"],
        "email": user["email"],
    }

# ------------------------------
# EXPENSES
# ------------------------------

@app.post("/expenses")
def add_expense(
    data: dict,
    user=Depends(get_current_user),
    conn=Depends(get_db),
):
    cur = conn.cursor()
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
    conn.commit()
    return {"status": "expense added"}

@app.get("/expenses")
def get_expenses(
    user=Depends(get_current_user),
    conn=Depends(get_db),
):
    cur = conn.cursor()
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

# ------------------------------
# INCOME
# ------------------------------

@app.post("/income")
def add_income(
    data: dict,
    user=Depends(get_current_user),
    conn=Depends(get_db),
):
    cur = conn.cursor()
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
    conn.commit()
    return {"status": "income added"}

@app.get("/income")
def get_income(
    user=Depends(get_current_user),
    conn=Depends(get_db),
):
    cur = conn.cursor()
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
