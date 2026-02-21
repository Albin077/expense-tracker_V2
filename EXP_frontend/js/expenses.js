const sb = window.supabaseClient;
const API = "http://127.0.0.1:8000";

/* ---------------------------
   HELPERS (Essential - do not remove)
---------------------------- */
function showLoader() {
    const l = document.getElementById("globalLoader");
    if (l) l.style.display = "flex";
}

function hideLoader() {
    const l = document.getElementById("globalLoader");
    if (l) l.style.display = "none";
}

async function disableWhileLoading(btn, fn) {
    if (btn) {
        btn.disabled = true;
        btn.dataset.originalText = btn.innerText;
        btn.innerText = "Loading...";
    }
    showLoader();
    try {
        await fn();
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = btn.dataset.originalText || "Submit";
        }
        hideLoader();
    }
}

async function requireLogin() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
        location.href = "login.html";
        return null;
    }
    return session;
}

/* ---------------------------
   LOAD DATA
---------------------------- */
async function loadExpenses(params = {}) {
    const session = await requireLogin();
    if (!session) return;

    // Remove empty params to prevent 422 errors
    Object.keys(params).forEach(key => !params[key] && delete params[key]);
    const query = new URLSearchParams(params).toString();

    const res = await fetch(`${API}/expenses?${query}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
    });

    const rows = await res.json();
    const tbody = document.getElementById("expenseBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    // Fix: Ensure rows is an array
    if (Array.isArray(rows)) {
        rows.forEach((r) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><input type="date" id="date-${r[0]}" value="${r[1] ?? ""}"></td>
                <td><input id="cat-${r[0]}" value="${r[2] ?? ""}"></td>
                <td><input type="number" id="amt-${r[0]}" value="${r[3] ?? ""}"></td>
                <td><input id="com-${r[0]}" value="${r[4] ?? ""}"></td>
                <td style="text-align: center; white-space: nowrap;">
                    <button class="action-btn" onclick="updateExpense(${r[0]})">💾</button>
                    <button class="action-btn" onclick="deleteExpense(${r[0]})">🗑</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    const addRow = document.createElement("tr");
    addRow.style.background = "#fcfcfc";
    addRow.innerHTML = `
        <td><input type="date" id="new-exp-date"></td>
        <td><input id="new-exp-cat" placeholder="Cat..."></td>
        <td><input type="number" id="new-exp-amt" placeholder="0"></td>
        <td><input id="new-exp-com" placeholder="..."></td>
        <td style="text-align: center;"><button class="action-btn" onclick="addExpense()">➕</button></td>
    `;
    tbody.appendChild(addRow);
}

async function addExpense() {
    const button = event.target;
    await disableWhileLoading(button, async () => {
        const session = await requireLogin();
        const res = await fetch(`${API}/expenses`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({
                expense_date: document.getElementById("new-exp-date").value,
                category: document.getElementById("new-exp-cat").value,
                amount: Number(document.getElementById("new-exp-amt").value),
                comment: document.getElementById("new-exp-com").value,
            }),
        });
        if (res.ok) { await loadExpenses(); await loadSpendingIncreaseInsight(); }
    });
}

async function updateExpense(id) {
    const button = event.target;
    await disableWhileLoading(button, async () => {
        const session = await requireLogin();
        const res = await fetch(`${API}/expenses/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({
                expense_date: document.getElementById(`date-${id}`).value,
                category: document.getElementById(`cat-${id}`).value,
                amount: Number(document.getElementById(`amt-${id}`).value),
                comment: document.getElementById(`com-${id}`).value,
            }),
        });
        if (res.ok) await loadSpendingIncreaseInsight();
    });
}

async function deleteExpense(id) {
    if (!confirm("Delete expense?")) return;
    const button = event.target;
    await disableWhileLoading(button, async () => {
        const session = await requireLogin();
        const res = await fetch(`${API}/expenses/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) { await loadExpenses(); await loadSpendingIncreaseInsight(); }
    });
}

async function loadSpendingIncreaseInsight() {
    const session = await requireLogin();
    const res = await fetch(`${API}/expenses/spending-increase`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    const el = document.getElementById("spendingIncrease");
    if (el) {
        if (data.length === 0) { el.innerHTML = "No spending increase ✅"; }
        else { el.innerHTML = data.map(d => `${d.category} ↑ ${d.percent}%`).join(" | "); }
    }
}

function applyFilters() {
    const params = {
        sort_by: document.getElementById("sortBy").value,
        order: document.getElementById("order").value,
        month: document.getElementById("month").value,
        search: document.getElementById("keyword").value.trim()
    };
    loadExpenses(params);
}

document.addEventListener("DOMContentLoaded", async () => {
    if (typeof loadTopNav === "function") await loadTopNav("expenses");
    await disableWhileLoading(null, async () => {
        await loadExpenses();
        await loadSpendingIncreaseInsight();
    });
});