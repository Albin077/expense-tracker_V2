// ------------------------------
// Supabase Config
// ------------------------------
const SUPABASE_URL = "https://dekmfqyokdfvtbpdghwb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRla21mcXlva2RmdnRicGRnaHdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNDk1MTAsImV4cCI6MjA4MTcyNTUxMH0.oUcUmtb9oHe24DK9esF9coaFPAOfMd8rjCdcXlrcLVc";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ------------------------------
function setStatus(msg) {
  document.getElementById("status").innerText = msg;
}

// ------------------------------
async function signup() {
  const email = emailInput().value;
  const password = passwordInput().value;

  const { error } = await supabaseClient.auth.signUp({ email, password });

  if (error) return setStatus(error.message);
  setStatus("Signup successful");
}

// ------------------------------
async function login() {
  const email = emailInput().value;
  const password = passwordInput().value;

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) return setStatus(error.message);
  setStatus("Login successful");
}

// ------------------------------
async function logout() {
  await supabaseClient.auth.signOut();
  setStatus("Logged out");
}

// ------------------------------
async function testProtectedApi() {
  const { data } = await supabaseClient.auth.getSession();

  if (!data.session) {
    console.log("Not logged in");
    return;
  }

  const token = data.session.access_token;

  console.log(
    "ACCESS TOKEN (first 40 chars):",
    token.slice(0, 40)
  );

  const res = await fetch("http://localhost:8000/protected", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await res.json();
  console.log("BACKEND RESPONSE:", result);
}

// ------------------------------
function emailInput() {
  return document.getElementById("email");
}
function passwordInput() {
  return document.getElementById("password");
}
