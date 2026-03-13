/* /js/profile.js */
const sb = window.supabaseClient;

async function requireLogin() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    location.href = "/html/login.html";
    return null;
  }
  return session;
}

/* =========================
   LOAD PROFILE
========================= */
async function loadProfile() {

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

    // Load avatar if exists
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

/* =========================
   SAVE PROFILE NAME
========================= */
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

/* =========================
   AVATAR SELECT
========================= */
function selectAvatar() {
  const input = document.getElementById("avatarInput");
  if (input) input.click();
}

/* =========================
   AVATAR UPLOAD
========================= */
async function uploadAvatar(event) {

  const file = event.target.files[0];
  if (!file) return;

  const session = await requireLogin();
  if (!session) return;

  const userId = session.user.id;

  const filePath = `${userId}/${Date.now()}_${file.name}`;

  await disableWhileLoading(null, async () => {

    const { error } = await sb.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (error) {
      alert("Upload failed: " + error.message);
      return;
    }

    // Save path in user metadata
    await sb.auth.updateUser({
      data: { avatar_path: filePath }
    });

    // Generate signed URL
    const { data } = await sb.storage
      .from("avatars")
      .createSignedUrl(filePath, 3600);

    if (data?.signedUrl) {
      document.getElementById("avatarImg").src = data.signedUrl;
    }

  });

}

/* =========================
   PASSWORD / LOGOUT
========================= */
function goChangePassword() {
  location.href = "login.html";
}

async function logout() {
  await sb.auth.signOut();
  location.href = "login.html";
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {

  loadProfile();

  const avatarInput = document.getElementById("avatarInput");

  if (avatarInput) {
    avatarInput.addEventListener("change", uploadAvatar);
  }

});