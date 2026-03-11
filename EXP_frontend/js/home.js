const sb = window.supabaseClient;
const API = "https://expense-tracker-v2-koc5.onrender.com";

let expenseCategories = [];
let incomeSources = [];
let expenseAccounts = [];

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

/* ---------------- AUTH ---------------- */

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

        values
            .filter(v => v && v.toLowerCase().startsWith(q))
            .forEach(v => {

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

/* ---------------- LOAD AUTOCOMPLETE DATA ---------------- */

async function loadAutocompleteData() {

    const session = await getSession();
    if (!session) return;

    const headers = {
        Authorization: `Bearer ${session.access_token}`
    };

    try {

        /* ---------- EXPENSE DATA ---------- */

        const exp = await fetch(`${API}/expenses`, { headers });

        if (!exp.ok) throw new Error("Failed to fetch expenses");

        const expRows = await exp.json();

        expenseCategories = [
            ...new Set(
                expRows.map(r => r.category).filter(Boolean)
            )
        ];

        expenseAccounts = [
            ...new Set(
                expRows.map(r => r.account).filter(Boolean)
            )
        ];

        /* ---------- INCOME DATA ---------- */

        const inc = await fetch(`${API}/income`, { headers });

        if (!inc.ok) throw new Error("Failed to fetch income");

        const incRows = await inc.json();

        incomeSources = [
            ...new Set(
                incRows.map(r => r.source).filter(Boolean)
            )
        ];

    } catch (err) {

        console.error("Data load failed", err);

    }
}

/* ---------------- ADD EXPENSE ---------------- */

async function addExpense(btn) {

    return disableWhileLoading(btn, async () => {

        const session = await requireLoginSoft();
        if (!session) return;

        const date = expDate.value;
        const category = expCategory.value;
        const amount = expAmount.value;
        const comment = expComment.value;
        const account = expAccount.value;

        if (!date || !category || !amount) {
            alert("Please fill mandatory fields");
            return;
        }

        const res = await fetch(`${API}/expenses`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },

            body: JSON.stringify({
                expense_date: date,
                category,
                amount,
                comment,
                account
            }),

        });

        if (!res.ok) {

            console.error(await res.text());
            alert("Failed to add expense");
            return;

        }

        location.reload();

    });
}

/* ---------------- ADD INCOME ---------------- */

async function addIncome(btn) {

    return disableWhileLoading(btn, async () => {

        const session = await requireLoginSoft();
        if (!session) return;

        const date = incDate.value;
        const source = incSource.value;
        const amount = incAmount.value;
        const comment = incComment.value;

        if (!date || !source || !amount) {
            alert("Please fill mandatory fields");
            return;
        }

        const res = await fetch(`${API}/income`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },

            body: JSON.stringify({
                income_date: date,
                source,
                amount,
                comment,
            }),

        });

        if (!res.ok) {

            console.error(await res.text());
            alert("Failed to add income");
            return;

        }

        location.reload();

    });
}

/* ---------------- PAGE INIT ---------------- */

document.addEventListener("DOMContentLoaded", async () => {

    showLoader();

    try {

        if (typeof loadTopNav === "function")
            await loadTopNav("home");

        await loadAutocompleteData();

        setupAutocomplete(
            "expCategory",
            "expCategoryList",
            expenseCategories
        );

        setupAutocomplete(
            "expAccount",
            "expAccountList",
            expenseAccounts
        );

        setupAutocomplete(
            "incSource",
            "incSourceList",
            incomeSources
        );

    } finally {

        hideLoader();

    }

});
