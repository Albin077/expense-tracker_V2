const SUPABASE_URL = "https://dekmfqyokdfvtbpdghwb.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

async function loadAnalytics() {
  const { data } = await supabaseClient.auth.getSession();

  // 🔒 Not logged in → go to login
  if (!data.session) {
    window.location.href = "login.html";
    return;
  }

  const token = data.session.access_token;

  const res = await fetch("http://localhost:8000/analytics/summary", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // 🔒 Token invalid / expired
  if (res.status === 401) {
    window.location.href = "login.html";
    return;
  }

  const result = await res.json();
  console.log(result);

  // TODO: render charts (later)
}

loadAnalytics();
