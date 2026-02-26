
// js/supabaseClient.js
if (!window.supabaseClient) {
  const SUPABASE_URL = "https://dekmfqyokdfvtbpdghwb.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRla21mcXlva2RmdnRicGRnaHdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNDk1MTAsImV4cCI6MjA4MTcyNTUxMH0.oUcUmtb9oHe24DK9esF9coaFPAOfMd8rjCdcXlrcLVc";

  window.supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
}

/* ============================
   GLOBAL LOADER HELPERS
   (DO NOT REMOVE)
============================ */

function showLoader() {
  const el = document.getElementById("globalLoader");
  if (el) el.style.display = "flex";
}

function hideLoader() {
  const el = document.getElementById("globalLoader");
  if (el) el.style.display = "none";
}

/* ============================
   DISABLE BUTTON WHILE LOADING
   (STABLE PERMANENT HELPER)
============================ */

function disableWhileLoading(button, task) {
  if (button) button.disabled = true;
  showLoader();

  return Promise.resolve(task())
    .finally(() => {
      if (button) button.disabled = false;
      hideLoader();
    });
}

/* ============================
   AUTO-INJECTOR
   (Creates the HTML for the loader)
============================ */
document.addEventListener("DOMContentLoaded", () => {
    // Only create it if it doesn't exist yet
    if (!document.getElementById("globalLoader")) {
        const loader = document.createElement("div");
        loader.id = "globalLoader";
        // This matches the .spinner class in your loader.css
        loader.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(loader);
    }
});