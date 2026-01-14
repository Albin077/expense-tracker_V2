// js/income.js
const sb = window.supabaseClient;

async function requireLogin() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    location.href = "login.html";
    return null;
  }
  return session;
}

async function loadIncome() {
  const session = await requireLogin();
  if (!session) return;

  const res = await fetch("http://127.0.0.1:8000/income", {
    headers: { Authorization: `Bearer ${session.access_token}` }
  });

  const rows = await res.json();
  const tbody = document.getElementById("incomeBody");
  tbody.innerHTML = "";

  rows.forEach(r => {
    // r = [date, source, amount, comment, id]
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <input type="date" id="date-${r[0]}" value="${r[1] ?? ""}">
      </td>
      <td>
        <input id="src-${r[0]}" value="${r[2] ?? ""}">
      </td>
      <td>
        <input type="number" id="amt-${r[0]}" value="${r[3] ?? ""}">
      </td>
      <td>
        <input id="com-${r[0]}" value="${r[4] ?? ""}">
      </td>
      <td>
        <button onclick="updateIncome(${r[0]})">💾</button>
        <button onclick="deleteIncome(${r[0]})">🗑</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

async function updateIncome(id) {
  const session = await requireLogin();
  if (!session) return;

  await fetch(`http://127.0.0.1:8000/income/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      income_date: document.getElementById(`date-${id}`).value,
      source: document.getElementById(`src-${id}`).value,
      amount: document.getElementById(`amt-${id}`).value,
      comment: document.getElementById(`com-${id}`).value
    })
  });

  alert("Income updated ✅");
}

async function deleteIncome(id) {
  if (!confirm("Delete income?")) return;

  const session = await requireLogin();
  if (!session) return;

  await fetch(`http://127.0.0.1:8000/income/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${session.access_token}` }
  });

  loadIncome();
}

loadIncome();
