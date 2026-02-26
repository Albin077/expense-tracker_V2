/* /js/profile.js */
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
  // Uses the global disableWhileLoading (Silver Dollar Coin)
  await disableWhileLoading(null, async () => {
    const session = await requireLogin();
    if (!session) return;

    // Load full-width TopNav
    if (typeof loadTopNav === "function") {
      await loadTopNav("profile");
    }

    const metadata = session.user.user_metadata;
    document.getElementById("displayName").value = metadata?.name || "";
    document.getElementById("userDisplayName").innerText = metadata?.name || "User";
    document.getElementById("userEmail").innerText = session.user.email;

    // Load signed avatar URL if path exists
    if (metadata?.avatar_path) {
      const { data } = await sb.storage
        .from("avatars")
        .createSignedUrl(metadata.avatar_path, 3600);
      if (data?.signedUrl) {
        document.getElementById("avatarImg").src = data.signedUrl;
      }
    }
  });
}

async function saveProfile() {
  const name = document.getElementById("displayName").value.trim();
  if (!name) return alert("Please enter a name");

  await disableWhileLoading(null, async () => {
    const { error } = await sb.auth.updateUser({
      data: { name: name }
    });

    if (error) {
      alert("Error: " + error.message);
    } else {
      document.getElementById("userDisplayName").innerText = name;
      alert("Profile updated!");
    }
  });
}

function goChangePassword() {
  location.href = "login.html";
}

async function logout() {
  await sb.auth.signOut();
  location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", loadProfile);