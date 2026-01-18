const sb = window.supabaseClient;
const API = "http://127.0.0.1:8000";

/* =========================
   AUTH
========================= */
async function getHeaders() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    location.href = "login.html";
    return null;
  }
  return { Authorization: `Bearer ${session.access_token}` };
}

/* =========================
   CHART 1 — INCOME vs EXPENSE
========================= */
let incomeExpenseChart;

function fillYears() {
  const yearSelect = document.getElementById("yearSelect");
  const now = new Date().getFullYear();

  for (let y = now - 5; y <= now; y++) {
    yearSelect.add(new Option(y, y));
  }
  yearSelect.value = now;
}

async function loadChart() {
  const headers = await getHeaders();
  if (!headers) return;

  const year = document.getElementById("yearSelect").value;
  const range = parseInt(document.getElementById("rangeSelect").value);
  const type = document.getElementById("typeSelect").value;

  const res = await fetch(
    `${API}/analytics/chart/yearly-trend?year=${year}`,
    { headers }
  );
  const data = await res.json();

  const labels = data.labels.slice(-range);
  const income = data.income.slice(-range);
  const expense = data.expense.slice(-range);

  incomeExpenseChart?.destroy();
  incomeExpenseChart = new Chart(
    document.getElementById("incomeExpenseChart"),
    {
      type,
      data: {
        labels,
        datasets: [
          { label: "Income", data: income, tension: 0.3 },
          { label: "Expense", data: expense, tension: 0.3 }
        ]
      }
    }
  );
}

/* =========================
   CHART 2 — EXPENSE BY CATEGORY
========================= */
let categoryChart;

function fillCategoryYears() {
  const sel = document.getElementById("catYear");
  const now = new Date().getFullYear();

  for (let y = now - 5; y <= now; y++) {
    sel.add(new Option(y, y));
  }
  sel.value = now;
}

async function loadCategoryChart() {
  const headers = await getHeaders();
  if (!headers) return;

  const year = document.getElementById("catYear").value;
  const month = document.getElementById("catMonth").value;
  const range = parseInt(document.getElementById("catRange").value);
  const type = document.getElementById("catType").value;

  let totals = {};

  // ✅ SINGLE MONTH
  if (month) {
    const res = await fetch(
      `${API}/analytics/chart/monthly-expense-category?month=${month}&year=${year}`,
      { headers }
    );
    const data = await res.json();

    data.labels.forEach((cat, i) => {
      totals[cat] = data.data[i];
    });

  } 
  // ✅ RANGE MODE (12 / 6 / 3)
  else {
    const now = new Date();

    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(year, now.getMonth() - i, 1);
      const m = d.getMonth() + 1;

      const res = await fetch(
        `${API}/analytics/chart/monthly-expense-category?month=${m}&year=${year}`,
        { headers }
      );
      const data = await res.json();

      data.labels.forEach((cat, idx) => {
        totals[cat] = (totals[cat] || 0) + data.data[idx];
      });
    }
  }

  const labels = Object.keys(totals);
  const values = Object.values(totals);

  categoryChart?.destroy();
  categoryChart = new Chart(
    document.getElementById("categoryChart"),
    {
      type,
      data: {
        labels,
        datasets: [{ label: "Expenses", data: values }]
      }
    }
  );
}

/* =========================
   INIT
========================= */
fillYears();
fillCategoryYears();
loadChart();
loadCategoryChart();
