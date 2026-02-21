const sb = window.supabaseClient;
const API = "http://127.0.0.1:8000";

let expenseCategories = [];
let incomeSources = [];

/* ---------------- LOADER ---------------- */
function showLoader() {
    const l = document.getElementById("globalLoader");
    if (l) l.style.display = "flex";
}

function hideLoader() {
    const l = document.getElementById("globalLoader");
    if (l) l.style.display = "none";
}

async function disableWhileLoading(btn, fn) {
    if (!btn) return fn();
    btn.disabled = true;
    const originalText = btn.innerText;
    btn.innerText = "Loading...";
    showLoader();
    try {
        await fn();
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
        hideLoader();
    }
}

async function getSession() {
    const { data: { session } } = await sb.auth.getSession();
    return session;
}

async function requireLoginSoft() {
    const session = await getSession();
    if (!session) {
        alert("Please login and continue");
        return null;
    }
    return session;
}

/* ---------------- AUTOCOMPLETE ---------------- */
function setupAutocomplete(inputId, listId, values) {
    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);
    if (!input || !list) return;

    input.addEventListener("input", () => {
        const q = input.value.toLowerCase();
        list.innerHTML = "";
        if (!q) return;
        values.filter(v => v.toLowerCase().startsWith(q)).forEach(v => {
            const item = document.createElement("div");
            item.className = "autocomplete-item";
            item.textContent = v;
            item.onclick = () => {
                input.value = v;
                list.innerHTML = "";
            };
            list.appendChild(item);
        });
    });
}

async function loadAutocompleteData() {
    const session = await getSession();
    if (!session) return;
    const headers = { Authorization: `Bearer ${session.access_token}` };
    try {
        const exp = await fetch(`${API}/expenses`, { headers });
        const expRows = await exp.json();
        expenseCategories = [...new Set(expRows.map(r => r[2]).filter(Boolean))];

        const inc = await fetch(`${API}/income`, { headers });
        const incRows = await inc.json();
        incomeSources = [...new Set(incRows.map(r => r[2]).filter(Boolean))];
    } catch (e) { console.error("Data load failed", e); }
}

/* ---------------- ADD ACTIONS ---------------- */
async function addExpense(btn) {
    return disableWhileLoading(btn, async () => {
        const session = await requireLoginSoft();
        if (!session) return;
        if (!expDate.value || !expCategory.value || !expAmount.value) {
            alert("Please fill all mandatory fields");
            return;
        }
        await fetch(`${API}/expenses`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                expense_date: expDate.value,
                category: expCategory.value,
                amount: expAmount.value,
                comment: expComment.value,
            }),
        });
        location.reload();
    });
}

async function addIncome(btn) {
    return disableWhileLoading(btn, async () => {
        const session = await requireLoginSoft();
        if (!session) return;
        if (!incDate.value || !incSource.value || !incAmount.value) {
            alert("Please fill all mandatory fields");
            return;
        }
        await fetch(`${API}/income`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                income_date: incDate.value,
                source: incSource.value,
                amount: incAmount.value,
                comment: incComment.value,
            }),
        });
        location.reload();
    });
}

/* ---------------- INIT ---------------- */
document.addEventListener("DOMContentLoaded", async () => {
    showLoader();
    if (typeof loadTopNav === "function") await loadTopNav("home");
    await loadAutocompleteData();
    setupAutocomplete("expCategory", "expCategoryList", expenseCategories);
    setupAutocomplete("incSource", "incSourceList", incomeSources);
    hideLoader();
});