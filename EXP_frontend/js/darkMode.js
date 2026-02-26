// /js/darkMode.js

/**
 * Dark Mode Manager
 * - Applies dark mode globally based on saved preference
 * - Persists toggle state in localStorage
 * - Toggle exists only on profile page, effect applies to all pages
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1️⃣ Check localStorage for saved dark mode preference
  const savedDarkMode = localStorage.getItem("darkMode");
  const isDarkMode = savedDarkMode === "true";

  // Apply dark mode if previously enabled
  if (isDarkMode) {
    document.body.classList.add("dark-mode");
  }

  // 2️⃣ Attach toggle listener (only exists on profile page)
  const toggle = document.getElementById("darkModeToggle");
  if (toggle) {
    // Initialize toggle based on saved state
    toggle.checked = isDarkMode;

    toggle.addEventListener("change", () => {
      if (toggle.checked) {
        document.body.classList.add("dark-mode");
        localStorage.setItem("darkMode", "true");
      } else {
        document.body.classList.remove("dark-mode");
        localStorage.setItem("darkMode", "false");
      }
    });
  }
});