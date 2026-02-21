const sb = window.supabaseClient;
const API = "http://127.0.0.1:8000";

let incomeRows = [];
let sortBy = "date";
let order = "desc";
let monthFilter = "";
let sortPanelVisible = false;

/* ---------------------------
    HELPERS
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
    const originalText = btn ? btn.innerText : "";
    if (btn) {
        btn.disabled = true;
        btn.innerText = "...";
    }
    showLoader();
    try {
        await fn();
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = originalText;
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
    LOAD INCOME
---------------------------- */
async function loadIncome() {
    const session = await requireLogin();
    if (!session) return;

    const keyword = document.getElementById("incomeSearch").value;
    let url = `${API}/income?sort_by=${sortBy}&order=${order}`;

    if (keyword) url += `&search=${encodeURIComponent(keyword)}`;
    if (monthFilter) url += `&month=${monthFilter}`;

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.access_token}` },
    });

    incomeRows = await res.json();
    renderIncome();
}

function toggleSortPanel() {
    sortPanelVisible = !sortPanelVisible;
    document.getElementById("sortPanel").style.display = sortPanelVisible ? "flex" : "none";
}

function setSort(field) { sortBy = field; loadIncome(); }
function toggleOrder() { order = order === "asc" ? "desc" : "asc"; loadIncome(); }
function setMonth(val) { monthFilter = val; loadIncome(); }

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
            <td style="text-align: center; white-space: nowrap;">
                <button class="action-btn" onclick="updateIncome(${r[0]})">💾</button>
                <button class="action-btn" onclick="deleteIncome(${r[0]})">🗑</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    const addRow = document.createElement("tr");
    addRow.style.background = "#fcfcfc";
    addRow.innerHTML = `
        <td><input type="date" id="new-inc-date"></td>
        <td><input id="new-inc-src" placeholder="Source..."></td>
        <td><input type="number" id="new-inc-amt" placeholder="0.00"></td>
        <td><input id="new-inc-com" placeholder="Note..."></td>
        <td style="text-align: center;">
            <button class="action-btn" onclick="addIncome()" style="color: #16a34a;">➕</button>
        </td>
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
        const res = await fetch(`${API}/income`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({
                income_date: document.getElementById("new-inc-date").value,
                source: document.getElementById("new-inc-src").value,
                amount: Number(document.getElementById("new-inc-amt").value),
                comment: document.getElementById("new-inc-com").value,
            }),
        });
        if (res.ok) loadIncome();
    });
}

async function updateIncome(id) {
    const button = event.target;
    await disableWhileLoading(button, async () => {
        const session = await requireLogin();
        await fetch(`${API}/income/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({
                income_date: document.getElementById(`date-${id}`).value,
                source: document.getElementById(`src-${id}`).value,
                amount: Number(document.getElementById(`amt-${id}`).value),
                comment: document.getElementById(`com-${id}`).value,
            }),
        });
    });
}

async function deleteIncome(id) {
    if (!confirm("Delete income?")) return;
    const button = event.target;
    await disableWhileLoading(button, async () => {
        const session = await requireLogin();
        const res = await fetch(`${API}/income/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) loadIncome();
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    if (typeof loadTopNav === "function") await loadTopNav("income");
    await loadIncome();
});