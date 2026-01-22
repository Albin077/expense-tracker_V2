const sb = window.supabaseClient;

/* ---------------------------
   AUTH GUARD
---------------------------- */
async function requireLogin() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    location.href = "login.html";
    return null;
  }
  return session;
}

/* ---------------------------
   LOAD EXPENSES
---------------------------- */
async function loadExpenses(params = {}) {
  const session = await requireLogin();
  if (!session) return;

  const query = new URLSearchParams(params).toString();

  const res = await fetch(
    `http://127.0.0.1:8000/expenses?${query}`,
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    }
  );

  const rows = await res.json();
  const tbody = document.getElementById("expenseBody");
  tbody.innerHTML = "";

  rows.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="date" id="date-${r[0]}" value="${r[1] ?? ""}"></td>
      <td><input id="cat-${r[0]}" value="${r[2] ?? ""}"></td>
      <td><input type="number" id="amt-${r[0]}" value="${r[3] ?? ""}"></td>
      <td><input id="com-${r[0]}" value="${r[4] ?? ""}"></td>
      <td>
        <button onclick="updateExpense(${r[0]})">💾</button>
        <button onclick="deleteExpense(${r[0]})">🗑</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Add row
  const addRow = document.createElement("tr");
  addRow.innerHTML = `
    <td><input type="date" id="new-exp-date"></td>
    <td><input id="new-exp-cat"></td>
    <td><input type="number" id="new-exp-amt"></td>
    <td><input id="new-exp-com"></td>
    <td><button onclick="addExpense()">➕</button></td>
  `;
  tbody.appendChild(addRow);
}

/* ---------------------------
   ADD EXPENSE
---------------------------- */
async function addExpense() {
  const button = event.target;

  await disableWhileLoading(button, async () => {
    const session = await requireLogin();
    if (!session) return;

    const res = await fetch("http://127.0.0.1:8000/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        expense_date: document.getElementById("new-exp-date").value,
        category: document.getElementById("new-exp-cat").value,
        amount: Number(document.getElementById("new-exp-amt").value),
        comment: document.getElementById("new-exp-com").value,
      }),
    });

    if (res.status === 401) {
      alert("Session expired. Please login again.");
      location.href = "login.html";
      return;
    }

    if (!res.ok) {
      alert("Failed to add expense");
      return;
    }

    loadExpenses();
    loadSpendingIncreaseInsight();
  });
}

/* ---------------------------
   UPDATE EXPENSE
---------------------------- */
async function updateExpense(id) {
  const button = event.target;

  await disableWhileLoading(button, async () => {
    const session = await requireLogin();
    if (!session) return;

    const res = await fetch(`http://127.0.0.1:8000/expenses/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        expense_date: document.getElementById(`date-${id}`).value,
        category: document.getElementById(`cat-${id}`).value,
        amount: Number(document.getElementById(`amt-${id}`).value),
        comment: document.getElementById(`com-${id}`).value,
      }),
    });

    if (res.status === 401) {
      alert("Session expired. Please login again.");
      location.href = "login.html";
      return;
    }

    if (!res.ok) {
      alert("Failed to update expense");
      return;
    }

    loadSpendingIncreaseInsight();
  });
}

/* ---------------------------
   DELETE EXPENSE
---------------------------- */
async function deleteExpense(id) {
  if (!confirm("Delete expense?")) return;

  const button = event.target;

  await disableWhileLoading(button, async () => {
    const session = await requireLogin();
    if (!session) return;

    const res = await fetch(`http://127.0.0.1:8000/expenses/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (res.status === 401) {
      alert("Session expired. Please login again.");
      location.href = "login.html";
      return;
    }

    if (!res.ok) {
      alert("Failed to delete expense");
      return;
    }

    loadExpenses();
    loadSpendingIncreaseInsight();
  });
}


/* =====================================================
   📊 SPENDING INCREASE INSIGHT
===================================================== */
async function loadSpendingIncreaseInsight() {
  const session = await requireLogin();
  if (!session) return;

  const res = await fetch(
    "http://127.0.0.1:8000/expenses/spending-increase",
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    }
  );

  if (!res.ok) return;

  const data = await res.json();
  const el = document.getElementById("spendingIncrease");
  if (!el) return;

  if (data.length === 0) {
    el.innerHTML = "No spending increase compared to last month ✅";
    return;
  }

  el.innerHTML = data
    .map(d => `${d.category} ↑ ${d.percent}% vs last month`)
    .join("<br>");
}
/* ---------------------------
   APPLY FILTERS / SORTING
---------------------------- */
function applyFilters() {
  const sortBy = document.getElementById("sortBy").value;
  const order = document.getElementById("order").value;
  const month = document.getElementById("month").value;
  const keyword = document.getElementById("keyword").value.trim();

  const params = {};

  if (sortBy) params.sort_by = sortBy;
  if (order) params.order = order;
  if (month) params.month = month;
  if (keyword) params.search = keyword;

  loadExpenses(params);
}

/* ---------------------------
   INIT
---------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
  const fakeBtn = document.createElement("button");

  await disableWhileLoading(fakeBtn, async () => {
    await loadExpenses();
    await loadSpendingIncreaseInsight();
  });
});

