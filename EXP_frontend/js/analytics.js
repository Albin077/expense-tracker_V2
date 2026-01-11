// js/analytics.js
const sb = window.supabaseClient;

async function loadAnalytics() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return location.href = "login.html";

  const res = await fetch("http://127.0.0.1:8000/analytics/summary", {
    headers: {
      Authorization: `Bearer ${session.access_token}`
    }
  });

  const data = await res.json();
  console.log("Analytics:", data);
}

loadAnalytics();
