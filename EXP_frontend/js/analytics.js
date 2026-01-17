const sb = window.supabaseClient;
const API = "http://127.0.0.1:8000";

let ieChart, categoryChart, keywordChart;

/* ---------------- AUTH ---------------- */
async function headers() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    location.href = "login.html";
    return null;
  }
  return { Authorization: `Bearer ${session.access_token}` };
}

/* ---------------- DROPDOWNS ---------------- */
function fillDropdowns() {
  const now = new Date();
  const year = now.getFullYear();

  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  ["ieMonth","catMonth"].forEach(id => {
    const el = document.getElementById(id);
    months.forEach((m,i) => {
      el.add(new Option(m, i+1));
    });
    el.value = now.getMonth()+1;
  });

  ["ieYear","catYear","keyYear"].forEach(id => {
    const el = document.getElementById(id);
    for (let y = year-5; y <= year; y++) {
      el.add(new Option(y, y));
    }
    el.value = year;
  });
}

/* ---------------- CHART 1 ---------------- */
async function loadIncomeExpense() {
  const h = await headers(); if (!h) return;

  const month = ieMonth.value;
  const year = ieYear.value;

  const r = await fetch(
    `${API}/analytics/chart/monthly-summary?month=${month}&year=${year}`,
    { headers: h }
  );
  const d = await r.json();

  ieChart?.destroy();
  ieChart = new Chart(ieChartEl, {
    type: "bar",
    data: {
      labels: d.labels,
      datasets: [{ label: "Amount", data: d.data }]
    }
  });
}

/* ---------------- CHART 2 ---------------- */
async function loadCategory() {
  const h = await headers(); if (!h) return;

  const month = catMonth.value;
  const year = catYear.value;

  const r = await fetch(
    `${API}/analytics/chart/monthly-expense-category?month=${month}&year=${year}`,
    { headers: h }
  );
  const d = await r.json();

  categoryChart?.destroy();
  categoryChart = new Chart(categoryChartEl, {
    type: "pie",
    data: {
      labels: d.labels,
      datasets: [{ data: d.data }]
    }
  });
}

/* ---------------- CHART 3 ---------------- */
async function loadKeyword() {
  const h = await headers(); if (!h) return;

  const keyword = document.getElementById("keyword").value.trim();
  if (!keyword) return alert("Enter keyword");

  const year = keyYear.value;

  const r = await fetch(
    `${API}/analytics/chart/category-trend?keyword=${keyword}&year=${year}`,
    { headers: h }
  );
  const d = await r.json();

  keywordChart?.destroy();
  keywordChart = new Chart(keywordChartEl, {
    type: "bar",
    data: {
      labels: d.labels,
      datasets: [{ label: keyword, data: d.data }]
    }
  });
}

/* ---------------- INIT ---------------- */
const ieChartEl = document.getElementById("ieChart");
const categoryChartEl = document.getElementById("categoryChart");
const keywordChartEl = document.getElementById("keywordChart");

fillDropdowns();
loadIncomeExpense();
loadCategory();
