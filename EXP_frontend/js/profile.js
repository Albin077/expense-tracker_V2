const sb = window.supabaseClient;

async function requireLogin() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    location.href = "login.html";
    return null;
  }
  return session;
}

async function loadProfile() {
  const session = await requireLogin();
  if (!session) return;

  const name = session.user.user_metadata?.name || "";
  document.getElementById("displayName").value = name;
}

async function saveProfile() {
  await disableWhileLoading(null, async () => {
    const session = await requireLogin();
    if (!session) return;

    const name = document.getElementById("displayName").value.trim();

    await sb.auth.updateUser({
      data: { name }
    });

    alert("Profile updated");
  });
}

function goChangePassword() {
  location.href = "login.html";
}

async function logout() {
  await sb.auth.signOut();
  location.href = "login.html";
}

function showLoading() {
  document.getElementById("profileLoader").style.display = "block";
}

function hideLoading() {
  document.getElementById("profileLoader").style.display = "none";
}

document.addEventListener("DOMContentLoaded", loadProfile);
