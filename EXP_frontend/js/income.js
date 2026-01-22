const sb = window.supabaseClient;

let incomeRows = [];
let sortBy = "date";
let order = "desc";
let monthFilter = "";
let sortPanelVisible = false;

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

  const keyword = document.getElementById("incomeSearch").value;

  let url = `http://127.0.0.1:8000/income?sort_by=${sortBy}&order=${order}`;

  if (keyword) url += `&search=${encodeURIComponent(keyword)}`;
  if (monthFilter) url += `&month=${monthFilter}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  incomeRows = await res.json();
  renderIncome();
}

/* ---------------------------
   SORT PANEL TOGGLE
---------------------------- */
function toggleSortPanel() {
  sortPanelVisible = !sortPanelVisible;
  document.getElementById("sortPanel").style.display =
    sortPanelVisible ? "block" : "none";
}

/* ---------------------------
   SORT / FILTER
---------------------------- */
function setSort(field) {
  sortBy = field;
  loadIncome();
}

function toggleOrder() {
  order = order === "asc" ? "desc" : "asc";
  loadIncome();
}

function setMonth(val) {
  monthFilter = val;
  loadIncome();
}

/* ---------------------------
   RENDER
---------------------------- */
function renderIncome() {
  const tbody = document.getElementById("incomeBody");
  tbody.innerHTML = "";

  incomeRows.forEach((r) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><input type="date" id="date-${r[0]}" value="${r[1] ?? ""}"></td>
      <td><input id="src-${r[0]}" value="${r[2] ?? ""}"></td>
      <td><input type="number" id="amt-${r[0]}" value="${r[3] ?? ""}"></td>
      <td><input id="com-${r[0]}" value="${r[4] ?? ""}"></td>
      <td>
        <button onclick="updateIncome(${r[0]})">💾</button>
        <button onclick="deleteIncome(${r[0]})">🗑</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Add row
  const addRow = document.createElement("tr");
  addRow.innerHTML = `
    <td><input type="date" id="new-inc-date"></td>
    <td><input id="new-inc-src"></td>
    <td><input type="number" id="new-inc-amt"></td>
    <td><input id="new-inc-com"></td>
    <td><button onclick="addIncome()">➕</button></td>
  `;
  tbody.appendChild(addRow);
}

/* ---------------------------
   ADD / UPDATE / DELETE
---------------------------- */
async function addIncome() {
  const button = event.target;

  await disableWhileLoading(button, async () => {
    const session = await requireLogin();
    if (!session) return;

    const res = await fetch("http://127.0.0.1:8000/income", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        income_date: document.getElementById("new-inc-date").value,
        source: document.getElementById("new-inc-src").value,
        amount: Number(document.getElementById("new-inc-amt").value),
        comment: document.getElementById("new-inc-com").value,
      }),
    });

    if (res.status === 401) {
      alert("Session expired. Please login again.");
      location.href = "login.html";
      return;
    }

    if (!res.ok) {
      alert("Failed to add income");
      return;
    }

    loadIncome();
  });
}


async function updateIncome(id) {
  const button = event.target;

  await disableWhileLoading(button, async () => {
    const session = await requireLogin();
    if (!session) return;

    const res = await fetch(`http://127.0.0.1:8000/income/${id}`, {
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

    if (res.status === 401) {
      alert("Session expired. Please login again.");
      location.href = "login.html";
      return;
    }

    if (!res.ok) {
      alert("Failed to update income");
      return;
    }
  });
}

async function deleteIncome(id) {
  if (!confirm("Delete income?")) return;

  const button = event.target;

  await disableWhileLoading(button, async () => {
    const session = await requireLogin();
    if (!session) return;

    const res = await fetch(`http://127.0.0.1:8000/income/${id}`, {
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
      alert("Failed to delete income");
      return;
    }

    loadIncome();
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const fakeBtn = document.createElement("button");

  await disableWhileLoading(fakeBtn, async () => {
    await loadIncome();
  });
});

