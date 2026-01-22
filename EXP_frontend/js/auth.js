const sb = window.supabaseClient;

function setStatus(msg) {
  document.getElementById("status").innerText = msg;
}

/* =====================
   UI SWITCHERS
===================== */
function hideAll() {
  loginBox.classList.add("hidden");
  signupBox.classList.add("hidden");
  changeBox.classList.add("hidden");
}

function showLogin() {
  hideAll();
  loginBox.classList.remove("hidden");
  title.innerText = "Login";
}

function showSignup() {
  hideAll();
  signupBox.classList.remove("hidden");
  title.innerText = "Create Account";
}

function showChange() {
  hideAll();
  changeBox.classList.remove("hidden");
  title.innerText = "Change Password";
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
    const { error: loginError } =
      await sb.auth.signInWithPassword({
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
