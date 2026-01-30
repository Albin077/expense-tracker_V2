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
  btn.innerText = "Loading...";
  showLoader();

  try {
    await fn();
  } finally {
    btn.disabled = false;
    btn.innerText = btn.dataset.original || "Submit";
    hideLoader();
  }
}

/* ---------------- SIDEBAR LOAD ---------------- */

async function loadSidebar() {
  const res = await fetch("sidebar.html");
  document.getElementById("sidebarContainer").innerHTML =
    await res.text();
}

/* ---------------- SIDEBAR CONTROL ---------------- */

function openSidebar() {
  document.getElementById("sidebar")?.classList.add("open");
  document.getElementById("sidebarOverlay")?.style.setProperty("display","block");
}

function closeSidebar() {
  document.getElementById("sidebar")?.classList.remove("open");
  document.getElementById("sidebarOverlay")?.style.setProperty("display","none");
}

function goToProfile() {
  location.href = "profile.html";
}

/* ---------------- TOP BAR ---------------- */

async function setupTopBar() {

  const { data: { session } } = await sb.auth.getSession();
  const btn = document.getElementById("topRightBtn");

  if (!btn) return;

  /* ---------- NOT LOGGED IN ---------- */
  if (!session) {
    btn.innerText = "Login";
    btn.onclick = () => location.href = "login.html";
    return;
  }

  /* ---------- LOGGED IN ---------- */
  btn.innerText = "👤";
  btn.onclick = openSidebar;

  const nameEl = document.getElementById("sidebarName");
  const avatarEl = document.getElementById("sidebarAvatar");

  if (nameEl) {
    nameEl.innerText =
      session.user.user_metadata?.name || "User";
  }

  /* ---------- AVATAR LOGIC ---------- */

  if (!avatarEl) return;

  try {

    if (session.user.user_metadata?.avatar_path) {

      const { data } = await sb.storage
        .from("avatars")
        .createSignedUrl(
          session.user.user_metadata.avatar_path,
          3600
        );

      if (data?.signedUrl) {
        avatarEl.src = data.signedUrl;
        return;
      }
    }

    /* fallback avatar (NO local file = no 404) */
    avatarEl.src =
      "https://ui-avatars.com/api/?name=" +
      encodeURIComponent(
        session.user.user_metadata?.name || "User"
      );

  } catch (err) {
    console.error("Avatar load failed", err);
  }
}

/* ---------------- CHECK SESSION (NO REDIRECT) ---------------- */

async function getSession() {
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

/* ---------------- LOGIN GUARD ---------------- */

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
      .filter(v => v.toLowerCase().startsWith(q))
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

/* ---------------- LOAD AUTOCOMPLETE ---------------- */

async function loadAutocompleteData() {

  const session = await getSession();

  /* allow dummy homepage */
  if (!session) return;

  const headers = {
    Authorization: `Bearer ${session.access_token}`
  };

  const exp = await fetch(`${API}/expenses`, { headers });
  const expRows = await exp.json();

  expenseCategories =
    [...new Set(expRows.map(r => r[2]).filter(Boolean))];

  const inc = await fetch(`${API}/income`, { headers });
  const incRows = await inc.json();

  incomeSources =
    [...new Set(incRows.map(r => r[2]).filter(Boolean))];
}

/* ---------------- ADD EXPENSE ---------------- */

async function addExpense(btn) {

  btn.dataset.original = btn.innerText;

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
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        expense_date: expDate.value,
        category: expCategory.value,
        amount: expAmount.value,
        comment: expComment.value
      })
    });

    location.reload();
  });
}

/* ---------------- ADD INCOME ---------------- */

async function addIncome(btn) {

  btn.dataset.original = btn.innerText;

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
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        income_date: incDate.value,
        source: incSource.value,
        amount: incAmount.value,
        comment: incComment.value
      })
    });

    location.reload();
  });
}

/* ---------------- LOGOUT ---------------- */

async function logout() {
  await sb.auth.signOut();
  location.href = "login.html";
}

/* ---------------- INIT ---------------- */

document.addEventListener("DOMContentLoaded", async () => {

  showLoader();

  await loadSidebar();
  await setupTopBar();
  await loadAutocompleteData();

  setupAutocomplete("expCategory","expCategoryList",expenseCategories);
  setupAutocomplete("incSource","incSourceList",incomeSources);

  hideLoader();
});
