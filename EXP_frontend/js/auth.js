/* =====================
   SUPABASE CLIENT
===================== */
const sb = window.supabaseClient;

/* =====================
   DOM REFERENCES
===================== */
let title,
    loginBox, signupBox, changeBox,
    loginEmail, loginPassword,
    signupEmail, signupPassword,
    changeEmail, currentPassword, newPassword,
    loginHint, signupHint, changeHint;

/* =====================
   STATUS
===================== */
function setStatus(msg) {
  const el = document.getElementById("status");
  if (el) el.innerText = msg;
}

/* =====================
   UI SWITCHERS
===================== */
function hideAll() {
  loginBox?.classList.add("hidden");
  signupBox?.classList.add("hidden");
  changeBox?.classList.add("hidden");
}

function showLogin() {
  hideAll();

  loginBox?.classList.remove("hidden");
  title && (title.innerText = "Login");

  loginHint?.classList.remove("hidden");
  signupHint?.classList.add("hidden");
  changeHint?.classList.add("hidden");

  setStatus("");
}

function showSignup() {
  hideAll();

  signupBox?.classList.remove("hidden");
  title && (title.innerText = "Create Account");

  loginHint?.classList.add("hidden");
  signupHint?.classList.remove("hidden");
  changeHint?.classList.add("hidden");

  setStatus("");
}

function showChange() {
  hideAll();

  changeBox?.classList.remove("hidden");
  title && (title.innerText = "Change Password");

  loginHint?.classList.add("hidden");
  signupHint?.classList.add("hidden");
  changeHint?.classList.remove("hidden");

  setStatus("");
}

/* =====================
   AUTH ACTIONS
===================== */
async function login() {
  await disableWhileLoading(null, async () => {
    const { error } = await sb.auth.signInWithPassword({
      email: loginEmail.value,
      password: loginPassword.value
    });

    if (error) return setStatus(error.message);
    location.href = "home.html";
  });
}

async function signup() {
  await disableWhileLoading(null, async () => {
    const { error } = await sb.auth.signUp({
      email: signupEmail.value,
      password: signupPassword.value
    });

    if (error) return setStatus(error.message);
    setStatus("Account created ✅");
  });
}

async function changePassword() {
  await disableWhileLoading(null, async () => {
    const { error: loginError } = await sb.auth.signInWithPassword({
      email: changeEmail.value,
      password: currentPassword.value
    });

    if (loginError) {
      alert("Current password incorrect");
      return;
    }

    const { error } = await sb.auth.updateUser({
      password: newPassword.value
    });

    if (error) return alert(error.message);

    alert("Password changed successfully ✅");

    currentPassword.value = "";
    newPassword.value = "";
  });
}

async function logout() {
  await sb.auth.signOut();
  location.href = "login.html";
}

/* =====================
   INIT (DOM SAFE)
===================== */
document.addEventListener("DOMContentLoaded", () => {
  title = document.getElementById("title");

  loginBox = document.getElementById("loginBox");
  signupBox = document.getElementById("signupBox");
  changeBox = document.getElementById("changeBox");

  loginEmail = document.getElementById("loginEmail");
  loginPassword = document.getElementById("loginPassword");

  signupEmail = document.getElementById("signupEmail");
  signupPassword = document.getElementById("signupPassword");

  changeEmail = document.getElementById("changeEmail");
  currentPassword = document.getElementById("currentPassword");
  newPassword = document.getElementById("newPassword");

  loginHint = document.getElementById("loginHint");
  signupHint = document.getElementById("signupHint");
  changeHint = document.getElementById("changeHint");

  showLogin(); // ✅ now safe
});
