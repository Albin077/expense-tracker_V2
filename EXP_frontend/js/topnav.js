async function loadTopNav(pageTitleText, pageKey) {
  const container = document.getElementById("topnavContainer");
  if (!container) return;

  const res = await fetch("/html/topnav.html");
  container.innerHTML = await res.text();

  // Set page title
  const titleEl = document.getElementById("pageTitle");
  if (titleEl) titleEl.innerText = pageTitleText;

  // Highlight active nav
  document.querySelectorAll(".topnav-center a").forEach(a => {
    if (a.dataset.page === pageKey) {
      a.classList.add("active");
    }
  });

  // Hook existing profile logic
  if (typeof setupTopBar === "function") {
    await setupTopBar();
  }
}
