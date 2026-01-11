// js/expenses.js
const sb = window.supabaseClient;

async function requireLogin() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    location.href = "login.html";
    return null;
  }
  return session;
}

async function loadExpenses() {
  const session = await requireLogin();
  if (!session) return;

  const res = await fetch("http://127.0.0.1:8000/expenses", {
    headers: {
      Authorization: `Bearer ${session.access_token}`
    }
  });

  const rows = await res.json();
  const tbody = document.getElementById("expenseBody");
  tbody.innerHTML = "";

  rows.forEach(r => {
    /*
      r[0] = id
      r[3] = amount
      r[2] = category
      r[4] = comment
      r[1] = expense_date
    */

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <input type="date" value="${r[1] ?? ""}">
      </td>
      <td>
        <input id="cat-${r[0]}" value="${r[2] ?? ""}">
      </td>
      <td>
        <input type="number" id="amt-${r[3]}" value="${r[3] ?? ""}">
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
}

async function updateExpense(id) {
  const session = await requireLogin();
  if (!session) return;

  await fetch(`http://127.0.0.1:8000/expenses/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      category: document.getElementById(`cat-${id}`).value,
      amount: document.getElementById(`amt-${id}`).value,
      comment: document.getElementById(`com-${id}`).value
    })
  });

  alert("Expense updated ✅");
}

async function deleteExpense(id) {
  if (!confirm("Delete expense?")) return;

  const session = await requireLogin();
  if (!session) return;

  await fetch(`http://127.0.0.1:8000/expenses/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${session.access_token}`
    }
  });

  loadExpenses();
}

loadExpenses();
