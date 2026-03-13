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
  changeEmail, newPassword, confirmNewPassword;

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
  setStatus("");
}

function showSignup() {
  hideAll();
  signupBox?.classList.remove("hidden");
  title && (title.innerText = "Create Account");
  setStatus("");
}

function showChange() {
  hideAll();
  changeBox?.classList.remove("hidden");
  title && (title.innerText = "Set New Password");
  setStatus("");
}

/* =====================
   LOGIN
===================== */
async function login() {

  await disableWhileLoading(null, async () => {

    const { error } = await sb.auth.signInWithPassword({
      email: loginEmail.value,
      password: loginPassword.value
    });

    if (error) {
      setStatus("Invalid email or password");
      return;
    }

    location.href = "/html/home.html";

  });

}

/* =====================
   SIGNUP
===================== */
async function signup() {

  await disableWhileLoading(null, async () => {

    const { error } = await sb.auth.signUp({
      email: signupEmail.value,
      password: signupPassword.value,
      options: {
        emailRedirectTo: window.location.origin + "/html/login.html"
      }
    });

    if (error) {
      setStatus("Email already registered ⚠️");
      return;
    }

    setStatus("Account created ✅ Check your email");

  });

}

/* =====================
   FORGOT PASSWORD
===================== */
async function forgotPassword() {

  if (window.location.hash.includes("type=recovery") ||
      window.location.search.includes("type=recovery")) {
    showChange();
    return;
  }

  const email = loginEmail?.value;

  if (!email) {
    alert("Enter your email first");
    return;
  }

  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/html/login.html"
  });

  if (error) return alert(error.message);

  alert("Password reset email sent 📩");

}

/* =====================
   CHANGE PASSWORD
===================== */
async function changePassword() {

  if (!newPassword.value || !confirmNewPassword.value) {
    alert("Enter password");
    return;
  }

  if (newPassword.value !== confirmNewPassword.value) {
    alert("Passwords do not match");
    return;
  }

  /* ensure recovery session exists */
  const { data } = await sb.auth.getSession();

  if (!data.session) {
    alert("Password reset session expired. Please request reset again.");
    showLogin();
    return;
  }

  const { error } = await sb.auth.updateUser({
    password: newPassword.value
  });

  if (error) return alert(error.message);

  alert("Password updated successfully ✅");

  newPassword.value = "";
  confirmNewPassword.value = "";

  /* remove recovery hash */
  history.replaceState(null, null, window.location.pathname);

  showLogin();

}

/* =====================
   LOGOUT
===================== */
async function logout() {
  await sb.auth.signOut();
  location.href = "login.html";
}

/* =====================
   INIT
===================== */
document.addEventListener("DOMContentLoaded", async () => {

  title = document.getElementById("title");

  loginBox = document.getElementById("loginBox");
  signupBox = document.getElementById("signupBox");
  changeBox = document.getElementById("changeBox");

  loginEmail = document.getElementById("loginEmail");
  loginPassword = document.getElementById("loginPassword");

  signupEmail = document.getElementById("signupEmail");
  signupPassword = document.getElementById("signupPassword");

  changeEmail = document.getElementById("changeEmail");
  newPassword = document.getElementById("newPassword");
  confirmNewPassword = document.getElementById("confirmNewPassword");

  /* ⭐ Recovery redirect detection */
  if (window.location.hash.includes("type=recovery") ||
      window.location.search.includes("type=recovery")) {
    showChange();
    return;
  }

  const { data } = await sb.auth.getSession();

  if (data.session) {
    showChange();
  } else {
    showLogin();
  }

});