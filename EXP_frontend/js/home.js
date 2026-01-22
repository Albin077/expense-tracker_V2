const sb = window.supabaseClient;
const API = "http://127.0.0.1:8000";

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
   LOAD EXISTING DATA
---------------------------- */
let expenseCategories = [];
let incomeSources = [];

async function loadAutocompleteData() {
  const session = await requireLogin();
  if (!session) return;

  const headers = {
    Authorization: `Bearer ${session.access_token}`
  };

  const expRes = await fetch(`${API}/expenses`, { headers });
  const expRows = await expRes.json();

  expenseCategories = [
    ...new Set(expRows.map(r => r[2]).filter(Boolean))
  ];

  const incRes = await fetch(`${API}/income`, { headers });
  const incRows = await incRes.json();

  incomeSources = [
    ...new Set(incRows.map(r => r[2]).filter(Boolean))
  ];
}

/* ---------------------------
   AUTOCOMPLETE ENGINE
---------------------------- */
function setupAutocomplete(inputId, listId, values) {
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);

  input.addEventListener("input", () => {
    const query = input.value.toLowerCase();
    list.innerHTML = "";
    if (!query) return;

    values
      .filter(v => v.toLowerCase().startsWith(query))
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

  document.addEventListener("click", e => {
    if (!list.contains(e.target) && e.target !== input) {
      list.innerHTML = "";
    }
  });
}

/* ---------------------------
   ADD EXPENSE (HOME)
---------------------------- */
async function addExpense(btn) {
  await disableWhileLoading(btn, async () => {
    const session = await requireLogin();
    if (!session) return;

    const expense_date = expDate.value;
    const category = expCategory.value.trim();
    const amount = expAmount.value;
    const comment = expComment.value;

    if (!expense_date || !category || !amount) {
      alert("Please fill all required expense fields");
      return;
    }

    await fetch(`${API}/expenses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        expense_date,
        category,
        amount,
        comment
      })
    });

    expDate.value = "";
    expCategory.value = "";
    expAmount.value = "";
    expComment.value = "";

    await loadAutocompleteData();
  });
}

/* ---------------------------
   ADD INCOME (HOME)
---------------------------- */
async function addIncome(btn) {
  await disableWhileLoading(btn, async () => {
    const session = await requireLogin();
    if (!session) return;

    const income_date = incDate.value;
    const source = incSource.value.trim();
    const amount = incAmount.value;
    const comment = incComment.value;

    if (!income_date || !source || !amount) {
      alert("Please fill all required income fields");
      return;
    }

    await fetch(`${API}/income`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        income_date,
        source,
        amount,
        comment
      })
    });

    incDate.value = "";
    incSource.value = "";
    incAmount.value = "";
    incComment.value = "";

    await loadAutocompleteData();
  });
}

async function logout() {
  await sb.auth.signOut();
  location.href = "login.html";
}

/* ---------------------------
   INIT (PAGE LOAD)
---------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
  await disableWhileLoading({ disabled: false }, async () => {
    await loadAutocompleteData();

    setupAutocomplete(
      "expCategory",
      "expCategoryList",
      expenseCategories
    );

    setupAutocomplete(
      "incSource",
      "incSourceList",
      incomeSources
    );
  });
});
