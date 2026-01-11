// js/home.js
const sb = window.supabaseClient;

/* ---------- AUTH CHECK ---------- */
async function requireLogin() {
  const { data: { session } } = await sb.auth.getSession();

  if (!session) {
    location.href = "login.html";
    return null;
  }
  return session;
}

/* ---------- ADD EXPENSE ---------- */
async function addExpense() {
  const session = await requireLogin();
  if (!session) return;

  const expense_date = document.getElementById("expDate").value;
  const category     = document.getElementById("expCategory").value;
  const amount       = document.getElementById("expAmount").value;
  const comment      = document.getElementById("expComment").value;

  if (!expense_date || !category || !amount) {
    alert("Please fill all required expense fields");
    return;
  }

  const res = await fetch("http://127.0.0.1:8000/expenses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      expense_date,
      category,
      amount,
      comment
    })
  });

  if (!res.ok) {
    alert("Failed to add expense");
    return;
  }

  document.getElementById("expDate").value = "";
  document.getElementById("expCategory").value = "";
  document.getElementById("expAmount").value = "";
  document.getElementById("expComment").value = "";

  alert("Expense added ✅");
}

/* ---------- ADD INCOME ---------- */
async function addIncome() {
  const session = await requireLogin();
  if (!session) return;

  const income_date = document.getElementById("incDate").value;
  const source      = document.getElementById("incSource").value;
  const amount      = document.getElementById("incAmount").value;
  const comment     = document.getElementById("incComment").value;

  if (!income_date || !source || !amount) {
    alert("Please fill all required income fields");
    return;
  }

  const res = await fetch("http://127.0.0.1:8000/income", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      income_date,
      source,
      amount,
      comment
    })
  });

  if (!res.ok) {
    alert("Failed to add income");
    return;
  }

  document.getElementById("incDate").value = "";
  document.getElementById("incSource").value = "";
  document.getElementById("incAmount").value = "";
  document.getElementById("incComment").value = "";

  alert("Income added ✅");
}

/* ---------- RUN ON LOAD ---------- */
requireLogin();
