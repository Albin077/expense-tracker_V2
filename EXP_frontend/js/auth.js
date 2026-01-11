// js/auth.js
const sb = window.supabaseClient;

function emailInput() {
  return document.getElementById("email");
}
function passwordInput() {
  return document.getElementById("password");
}
function setStatus(msg) {
  document.getElementById("status").innerText = msg;
}

async function signup() {
  const { error } = await sb.auth.signUp({
    email: emailInput().value,
    password: passwordInput().value
  });
  if (error) return setStatus(error.message);
  setStatus("Signup successful ✅");
}

async function login() {
  const { error } = await sb.auth.signInWithPassword({
    email: emailInput().value,
    password: passwordInput().value
  });
  if (error) return setStatus(error.message);
  location.href = "home.html";
}

async function logout() {
  await sb.auth.signOut();
  location.href = "login.html";
}
