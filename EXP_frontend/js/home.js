const SUPABASE_URL = "https://dekmfqyokdfvtbpdghwb.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ------------------------------
// AUTH CHECK
// ------------------------------
async function requireLogin() {
  const { data } = await supabaseClient.auth.getSession();
  if (!data.session) {
    window.location.href = "login.html";
  }
  return data.session.access_token;
}

// ------------------------------
function goLogin() {
  window.location.href = "login.html";
}

// ------------------------------
async function addExpense() {
  const token = await requireLogin();

  await fetch("http://localhost:8000/expenses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      expense_date: edate.value,
      category: ecat.value,
      amount: eamt.value,
      comment: ecom.value,
    }),
  });

  loadExpenses();
}

// ------------------------------
async function loadExpenses() {
  const token = await requireLogin();

  const res = await fetch("http://localhost:8000/expenses", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  expenseTable.innerHTML = data
    .map(
      (r) =>
        `<tr>
          <td>${r[0]}</td>
          <td>${r[1]}</td>
          <td>${r[2]}</td>
          <td>${r[3] || ""}</td>
        </tr>`
    )
    .join("");
}

// ------------------------------
async function addIncome() {
  const token = await requireLogin();

  await fetch("http://localhost:8000/income", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      income_date: idate.value,
      source: isrc.value,
      amount: iamt.value,
      comment: icom.value,
    }),
  });

  loadIncome();
}

// ------------------------------
async function loadIncome() {
  const token = await requireLogin();

  const res = await fetch("http://localhost:8000/income", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  incomeTable.innerHTML = data
    .map(
      (r) =>
        `<tr>
          <td>${r[0]}</td>
          <td>${r[1]}</td>
          <td>${r[2]}</td>
          <td>${r[3] || ""}</td>
        </tr>`
    )
    .join("");
}

// ------------------------------
loadExpenses();
loadIncome();
