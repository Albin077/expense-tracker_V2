// js/expenses.js
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
async function loadExpenses() {
  const session = await requireLogin();
  if (!session) return;

  const res = await fetch("http://127.0.0.1:8000/expenses", {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  const rows = await res.json();
  const tbody = document.getElementById("expenseBody");
  tbody.innerHTML = "";

  /* ---------------------------
     EXISTING EXPENSE ROWS
  ---------------------------- */
  rows.forEach((r) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <input type="date" id="date-${r[0]}" value="${r[1] ?? ""}">
      </td>
      <td>
        <input id="cat-${r[0]}" value="${r[2] ?? ""}">
      </td>
      <td>
        <input type="number" id="amt-${r[0]}" value="${r[3] ?? ""}">
      </td>
      <td>
        <input id="com-${r[0]}" value="${r[4] ?? ""}">
      </td>
      <td>
        <button onclick="updateExpense(${r[0]})">💾</button>
        <button onclick="deleteExpense(${r[0]})">🗑</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  /* ---------------------------
     INLINE ADD EXPENSE ROW
  ---------------------------- */
  const addRow = document.createElement("tr");

  addRow.innerHTML = `
    <td>
      <input type="date" id="new-exp-date">
    </td>
    <td>
      <input id="new-exp-cat" placeholder="Category">
    </td>
    <td>
      <input type="number" id="new-exp-amt" placeholder="Amount">
    </td>
    <td>
      <input id="new-exp-com" placeholder="Comment">
    </td>
    <td>
      <button onclick="addExpense()">➕</button>
    </td>
  `;

  tbody.appendChild(addRow);
}

/* ---------------------------
   ADD EXPENSE
---------------------------- */
async function addExpense() {
  const session = await requireLogin();
  if (!session) return;

  const date = document.getElementById("new-exp-date").value;
  const cat = document.getElementById("new-exp-cat").value;
  const amt = document.getElementById("new-exp-amt").value;
  const com = document.getElementById("new-exp-com").value;

  if (!date || !cat || !amt) {
    alert("Date, Category & Amount are required");
    return;
  }

  await fetch("http://127.0.0.1:8000/expenses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      expense_date: date,
      category: cat,
      amount: Number(amt),
      comment: com,
    }),
  });

  loadExpenses();
}

/* ---------------------------
   UPDATE EXPENSE
---------------------------- */
async function updateExpense(id) {
  const session = await requireLogin();
  if (!session) return;

  await fetch(`http://127.0.0.1:8000/expenses/${id}`, {
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

  alert("Expense updated ✅");
}

/* ---------------------------
   DELETE EXPENSE
---------------------------- */
async function deleteExpense(id) {
  if (!confirm("Delete expense?")) return;

  const session = await requireLogin();
  if (!session) return;

  await fetch(`http://127.0.0.1:8000/expenses/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  loadExpenses();
}

/* ---------------------------
   INIT
---------------------------- */
loadExpenses();
