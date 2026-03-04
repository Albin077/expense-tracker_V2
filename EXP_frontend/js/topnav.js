async function loadTopNav(pageKey) {
  const container = document.getElementById("topnavContainer");
  if (!container) return;

  /* ---------------- LOAD TOPNAV HTML ---------------- */
  const res = await fetch("/html/topnav.html");
  container.innerHTML = await res.text();

  /* ---------------- HIGHLIGHT ACTIVE PAGE ---------------- */
  document.querySelectorAll(".topnav-center a").forEach(a => {
    if (a.dataset.page === pageKey) {
      a.classList.add("active");
    }
  });

  /* ---------------- ENSURE DROPDOWN CONTAINER EXISTS ---------------- */
  let sidebarContainer = document.getElementById("sidebarContainer");

  if (!sidebarContainer) {
    sidebarContainer = document.createElement("div");
    sidebarContainer.id = "sidebarContainer";
    document.body.appendChild(sidebarContainer);
  }

  /* ---------------- LOAD DROPDOWN HTML ---------------- */
  const dropdownRes = await fetch("/html/profiledropdown.html");
  sidebarContainer.innerHTML = await dropdownRes.text();

  /* ---------------- SYNC AVATAR (TOP RIGHT ICON) ---------------- */
  const avatarImg = document.getElementById("topAvatar");
  const fallback = document.getElementById("topAvatarFallback");
  const btn = document.getElementById("topRightBtn");

  // Default state
  if (avatarImg) avatarImg.style.display = "none";
  if (fallback) fallback.style.display = "inline";

  try {
    const {
      data: { session },
    } = await window.supabaseClient.auth.getSession();

    /* ---------- NOT LOGGED IN ---------- */
    if (!session) {
      if (btn) {
        btn.onclick = () => (location.href = "/html/login.html");
      }
      return;
    }

    /* ---------- LOGGED IN ---------- */
    if (btn) {
      btn.onclick = openSidebar;
    }

    let avatarLoaded = false;

    // Uploaded avatar
    if (session.user.user_metadata?.avatar_path) {
      const { data } = await window.supabaseClient.storage
        .from("avatars")
        .createSignedUrl(
          session.user.user_metadata.avatar_path,
          3600
        );

      if (data?.signedUrl && avatarImg) {
        avatarImg.src = data.signedUrl;
        avatarImg.style.display = "block";
        if (fallback) fallback.style.display = "none";
        avatarLoaded = true;
      }
    }

    // Fallback initials
    if (!avatarLoaded && avatarImg) {
      avatarImg.src =
        "https://ui-avatars.com/api/?name=" +
        encodeURIComponent(
          session.user.user_metadata?.name || "User"
        );

      avatarImg.style.display = "block";
      if (fallback) fallback.style.display = "none";
    }

    /* ---------------- UPDATE DROPDOWN CONTENT ---------------- */
    const nameEl = document.getElementById("sidebarName");
    const avatarEl = document.getElementById("sidebarAvatar");

    if (nameEl) {
      nameEl.innerText =
        session.user.user_metadata?.name || "User";
    }

    if (avatarEl) {
      if (avatarLoaded) {
        avatarEl.src = avatarImg.src;
      } else {
        avatarEl.src =
          "https://ui-avatars.com/api/?name=" +
          encodeURIComponent(
            session.user.user_metadata?.name || "User"
          );
      }
    }

  } catch (err) {
    console.warn("TopNav avatar error:", err);
  }
}

/* ---------------- DROPDOWN CONTROL ---------------- */

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

function closeProfileDropdown() {
  closeSidebar();
}

function goToProfile() {
  location.href = "/html/profile.html";
}

async function logout() {
  await window.supabaseClient.auth.signOut();
  location.href = "/html/login.html";
}