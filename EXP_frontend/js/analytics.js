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
   CHART 1 — INCOME vs EXPENSE (UNCHANGED)
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

  const year = yearSelect.value;
  const range = parseInt(rangeSelect.value);
  const type = typeSelect.value;

  const res = await fetch(
    `${API}/analytics/chart/yearly-trend?year=${year}`,
    { headers }
  );
  const data = await res.json();

  incomeExpenseChart?.destroy();
  incomeExpenseChart = new Chart(
    document.getElementById("incomeExpenseChart"),
    {
      type,
      data: {
        labels: data.labels.slice(-range),
        datasets: [
          { label: "Income", data: data.income.slice(-range) },
          { label: "Expense", data: data.expense.slice(-range) }
        ]
      }
    }
  );
}

/* =========================
   CHART 2 — EXPENSE BY CATEGORY (DATE RANGE)
========================= */
let categoryChart;

async function loadCategoryChart() {
  const headers = await getHeaders();
  if (!headers) return;

  const fromDate = document.getElementById("catFrom").value;
  const toDate = document.getElementById("catTo").value;
  const type = document.getElementById("catType").value;

  if (!fromDate || !toDate) {
    alert("Select date range");
    return;
  }

  const res = await fetch(
    `${API}/analytics/chart/expense-category-range?from_date=${fromDate}&to_date=${toDate}`,
    { headers }
  );

  const data = await res.json();

  categoryChart?.destroy();
  categoryChart = new Chart(
    document.getElementById("categoryChart"),
    {
      type,
      data: {
        labels: data.labels,
        datasets: [{
          label: "Expenses",
          data: data.data
        }]
      }
    }
  );
}

/* =========================
   CHART 3 — KEYWORD RANGE (UNCHANGED)
========================= */
let keywordChart;

async function loadKeywordRangeChart() {
  const headers = await getHeaders();
  if (!headers) return;

  const keyword = kwInput.value.trim();
  const fromDate = kwFrom.value;
  const toDate = kwTo.value;
  const type = kwType.value;

  if (!keyword || !fromDate || !toDate) {
    alert("Keyword and date range required");
    return;
  }

  const res = await fetch(
    `${API}/analytics/chart/keyword-range-trend?keyword=${encodeURIComponent(keyword)}&from_date=${fromDate}&to_date=${toDate}`,
    { headers }
  );
  const data = await res.json();

  keywordChart?.destroy();
  keywordChart = new Chart(
    document.getElementById("keywordRangeChart"),
    {
      type,
      data: {
        labels: data.labels,
        datasets: [{
          label: `Spending on "${keyword}"`,
          data: data.data
        }]
      }
    }
  );
}
function setDefaultCategoryDates() {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 1);

  document.getElementById("catFrom").value =
    from.toISOString().split("T")[0];

  document.getElementById("catTo").value =
    to.toISOString().split("T")[0];
}
/* =========================
   INSIGHTS PANEL
========================= */
async function loadInsights() {
  const headers = await getHeaders();
  if (!headers) return;

  const year = document.getElementById("yearSelect").value;
  const month = new Date().getMonth() + 1; // current month

  const res = await fetch(
    `${API}/analytics/insights?month=${month}&year=${year}`,
    { headers }
  );

  const data = await res.json();

  // ---------- Status ----------
  document.getElementById("insightStatus").innerText = data.status;

  // ---------- Increased categories ----------
  const incList = document.getElementById("increaseList");
  incList.innerHTML = "";

  if (data.increased_categories.length === 0) {
    incList.innerHTML = "<li>No category increased</li>";
  } else {
    data.increased_categories.forEach(i => {
      const li = document.createElement("li");
      li.className = "increase";
      li.innerText = `${i.category} ↑ ${i.percent}% vs last month`;
      incList.appendChild(li);
    });
  }

  // ---------- New categories ----------
  const newList = document.getElementById("newCategoryList");
  newList.innerHTML = "";

  if (data.new_categories.length === 0) {
    newList.innerHTML = "<li>No new categories</li>";
  } else {
    data.new_categories.forEach(c => {
      const li = document.createElement("li");
      li.className = "new";
      li.innerText = `🆕 ${c}`;
      newList.appendChild(li);
    });
  }

  // ---------- Average table ----------
  const tbody = document.querySelector("#avgTable tbody");
  tbody.innerHTML = "";

  data.avg_table.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.category}</td>
      <td>${r.avg_expense}</td>
      <td>${r.percent_of_income}%</td>
    `;
    tbody.appendChild(tr);
  });
}
function getMonthRange(offset = 0) {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const last = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);

  return {
    from: first.toISOString().split("T")[0],
    to: last.toISOString().split("T")[0]
  };
}

async function loadIncomeExpenseInsight() {
  const headers = await getHeaders();
  if (!headers) return;

  const year = new Date().getFullYear();
  const month = new Date().getMonth();

  const res = await fetch(
    `${API}/analytics/chart/yearly-trend?year=${year}`,
    { headers }
  );
  const data = await res.json();

  const income = data.income[month];
  const expense = data.expense[month];

  const el = document.getElementById("incomeExpenseText");

  if (expense > income) {
    el.innerHTML = `Expenses exceeded income by ₹${expense - income}`;
    el.className = "text-red";
  } else {
    el.innerHTML = `Income exceeded expenses by ₹${income - expense}`;
    el.className = "text-green";
  }
}

async function loadSpendingIncreaseInsight() {
  const headers = await getHeaders();
  if (!headers) return;

  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear = now.getFullYear();

  const prevMonth = curMonth === 1 ? 12 : curMonth - 1;
  const prevYear = curMonth === 1 ? curYear - 1 : curYear;

  const [curRes, prevRes] = await Promise.all([
    fetch(`${API}/analytics/chart/monthly-expense-category?month=${curMonth}&year=${curYear}`, { headers }),
    fetch(`${API}/analytics/chart/monthly-expense-category?month=${prevMonth}&year=${prevYear}`, { headers })
  ]);

  const curData = await curRes.json();
  const prevData = await prevRes.json();

  const prevMap = {};
  prevData.labels.forEach((c, i) => {
    prevMap[c] = Number(prevData.data[i]); // ✅ force number
  });

  const increases = [];

  curData.labels.forEach((c, i) => {
    if (!prevMap.hasOwnProperty(c)) return; // ❌ skip new categories

    const prevAmount = prevMap[c];
    const currAmount = Number(curData.data[i]);

    // ❌ ignore zero or invalid previous values
    if (!prevAmount || prevAmount <= 0) return;

    if (currAmount > prevAmount) {
      const pct = ((currAmount - prevAmount) / prevAmount) * 100;
      increases.push(`${c} ↑ ${pct.toFixed(1)}% vs last month`);
    }
  });

  const el = document.getElementById("spendingIncreaseText"); // ✅ correct ID

  el.innerHTML = increases.length
    ? increases.map(i => `<div class="negative">${i}</div>`).join("")
    : `<span class="muted">No category increased compared to last month</span>`;
}




async function loadNewCategoryInsight() {
  const headers = await getHeaders();
  if (!headers) return;

  const cur = getMonthRange(0);
  const prev = getMonthRange(-1);

  const curData = await fetch(
    `${API}/analytics/chart/expense-category-range?from_date=${cur.from}&to_date=${cur.to}`,
    { headers }
  ).then(r => r.json());

  const prevData = await fetch(
    `${API}/analytics/chart/expense-category-range?from_date=${prev.from}&to_date=${prev.to}`,
    { headers }
  ).then(r => r.json());

  const newCats = curData.labels.filter(
    c => !prevData.labels.includes(c)
  );

  document.getElementById("newCategoryText").innerHTML =
    newCats.length
      ? `New category added: ${newCats.join(", ")}`
      : "No new categories this month";
}

async function loadAvgExpenseTable() {
  const headers = await getHeaders();
  if (!headers) return;

  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;

  const catRes = await fetch(
    `${API}/analytics/chart/monthly-expense-category?month=${month}&year=${year}`,
    { headers }
  );
  const catData = await catRes.json();

  const yearRes = await fetch(
    `${API}/analytics/chart/yearly-trend?year=${year}`,
    { headers }
  );
  const yearData = await yearRes.json();

  const income = yearData.income[new Date().getMonth()];
  const tbody = document.getElementById("avgExpenseTable");

  tbody.innerHTML = "";

  catData.labels.forEach((cat, i) => {
    const amt = catData.data[i];
    const pct = income ? ((amt / income) * 100).toFixed(1) : 0;

    tbody.innerHTML += `
      <tr>
        <td>${cat}</td>
        <td>₹${amt}</td>
        <td>${pct}%</td>
      </tr>
    `;
  });
}


/* =========================
   INIT
========================= */
fillYears();
loadChart();

setDefaultCategoryDates();  // 👈 MUST be before loadCategoryChart
loadCategoryChart();

loadIncomeExpenseInsight();
loadSpendingIncreaseInsight();
loadNewCategoryInsight();
loadAvgExpenseTable();

