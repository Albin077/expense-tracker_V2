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

/* ---------------- PROFILE DROPDOWN LOAD ---------------- */

async function loadSidebar() {
  const res = await fetch("/html/profiledropdown.html");
  document.getElementById("sidebarContainer").innerHTML =
    await res.text();
}

/* ---------------- PROFILE DROPDOWN CONTROL ---------------- */

function openSidebar() {
  document.getElementById("profileDropdown")?.classList.add("open");
  document
    .getElementById("profileOverlay")
    ?.style.setProperty("display", "block");
}

function closeSidebar() {
  document.getElementById("profileDropdown")?.classList.remove("open");
  document
    .getElementById("profileOverlay")
    ?.style.setProperty("display", "none");
}

/* alias used by HTML */
function closeProfileDropdown() {
  closeSidebar();
}

function goToProfile() {
  location.href = "profile.html";
}

/* ---------------- TOP BAR ---------------- */

async function setupTopBar() {
  const {
    data: { session },
  } = await sb.auth.getSession();

  const btn = document.getElementById("topRightBtn");
  if (!btn) return;

  /* ---------- NOT LOGGED IN ---------- */
  if (!session) {
    btn.innerText = "Login";
    btn.onclick = () => (location.href = "login.html");
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
  const {
    data: { session },
  } = await sb.auth.getSession();
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
      .filter((v) => v.toLowerCase().startsWith(q))
      .forEach((v) => {
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
  if (!session) return;

  const headers = {
    Authorization: `Bearer ${session.access_token}`,
  };

  const exp = await fetch(`${API}/expenses`, { headers });
  const expRows = await exp.json();

  expenseCategories = [
    ...new Set(expRows.map((r) => r[2]).filter(Boolean)),
  ];

  const inc = await fetch(`${API}/income`, { headers });
  const incRows = await inc.json();

  incomeSources = [
    ...new Set(incRows.map((r) => r[2]).filter(Boolean)),
  ];
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

/* ---------------- LOGOUT ---------------- */

async function logout() {
  await sb.auth.signOut();
  location.href = "login.html";
}

/* ---------------- INIT ---------------- */

document.addEventListener("DOMContentLoaded", async () => {
  showLoader();

  // ✅ load top navigation first
  if (typeof loadTopNav === "function") {
    await loadTopNav("Home", "home");
  }

  await loadSidebar();        // loads profile dropdown HTML
  await setupTopBar();        // login / avatar button
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

  hideLoader();
});

