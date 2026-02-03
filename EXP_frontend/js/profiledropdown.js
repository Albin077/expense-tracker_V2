// js/profiledropdown.js
// ⚠️ DO NOT DECLARE sb HERE

async function loadProfileDropdown() {
  const avatarEl = document.getElementById("sidebarAvatar");
  const nameEl = document.getElementById("sidebarName");

  if (!avatarEl || !nameEl) return;

  try {
    const { data: { session } } =
      await window.supabaseClient.auth.getSession();

    if (!session) return;

    // name
    nameEl.innerText =
      session.user.user_metadata?.name || "User";

    // avatar
    if (session.user.user_metadata?.avatar_path) {
      const { data } = await window.supabaseClient.storage
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

    // fallback (no local file, no 404)
    avatarEl.src =
      "https://ui-avatars.com/api/?name=" +
      encodeURIComponent(
        session.user.user_metadata?.name || "User"
      );

  } catch (e) {
    console.error("Profile dropdown error:", e);
  }
}

document.addEventListener("DOMContentLoaded", loadProfileDropdown);
