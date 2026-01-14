// js/income.js
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
   LOAD INCOME
---------------------------- */
async function loadIncome() {
  const session = await requireLogin();
  if (!session) return;

  const res = await fetch("http://127.0.0.1:8000/income", {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  const rows = await res.json();
  const tbody = document.getElementById("incomeBody");
  tbody.innerHTML = "";

  /* ---------------------------
     EXISTING INCOME ROWS
  ---------------------------- */
  rows.forEach((r) => {
    // r = [id, income_date, source, amount, comment]
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

  /* ---------------------------
     INLINE ADD INCOME ROW
  ---------------------------- */
  const addRow = document.createElement("tr");

  addRow.innerHTML = `
    <td>
      <input type="date" id="new-inc-date">
    </td>
    <td>
      <input id="new-inc-src" placeholder="Source">
    </td>
    <td>
      <input type="number" id="new-inc-amt" placeholder="Amount">
    </td>
    <td>
      <input id="new-inc-com" placeholder="Comment">
    </td>
    <td>
      <button onclick="addIncome()">➕</button>
    </td>
  `;

  tbody.appendChild(addRow);
}

/* ---------------------------
   ADD INCOME
---------------------------- */
async function addIncome() {
  const session = await requireLogin();
  if (!session) return;

  const date = document.getElementById("new-inc-date").value;
  const src = document.getElementById("new-inc-src").value;
  const amt = document.getElementById("new-inc-amt").value;
  const com = document.getElementById("new-inc-com").value;

  if (!date || !src || !amt) {
    alert("Date, Source & Amount are required");
    return;
  }

  await fetch("http://127.0.0.1:8000/income", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      income_date: date,
      source: src,
      amount: Number(amt),
      comment: com,
    }),
  });

  loadIncome();
}

/* ---------------------------
   UPDATE INCOME
---------------------------- */
async function updateIncome(id) {
  const session = await requireLogin();
  if (!session) return;

  await fetch(`http://127.0.0.1:8000/income/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      income_date: document.getElementById(`date-${id}`).value,
      source: document.getElementById(`src-${id}`).value,
      amount: Number(document.getElementById(`amt-${id}`).value),
      comment: document.getElementById(`com-${id}`).value,
    }),
  });

  alert("Income updated ✅");
}

/* ---------------------------
   DELETE INCOME
---------------------------- */
async function deleteIncome(id) {
  if (!confirm("Delete income?")) return;

  const session = await requireLogin();
  if (!session) return;

  await fetch(`http://127.0.0.1:8000/income/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  loadIncome();
}

/* ---------------------------
   INIT
---------------------------- */
loadIncome();
