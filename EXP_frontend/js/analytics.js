const sb = window.supabaseClient;
const API = "https://expense-tracker-v2-koc5.onrender.com";

// --- CLASSY SOLID PALETTE (High Visibility) ---
const classyColors = {
    primary: '#7B96D4',   // Faded Slate Blue
    secondary: '#D47B96', // Faded Rose
    accent: '#7BD4B9',    // Faded Mint
    highlight: '#D4B97B', // Faded Ochre
    muted: '#A8A8A8',     // Faded Grey
    white: '#ffffff',
    grid: '#444444'
};

// --- GLOBAL STABLE CONFIG (Zero Animations) ---
if (window.Chart) {
    Chart.defaults.font.family = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    Chart.defaults.color = '#e0e0e0';
    
    // Explicitly disable all animation loops to prevent "this._fn" errors
    Chart.defaults.animation = false;
    Chart.defaults.transitions = {
        active: { animation: { duration: 0 } },
        resize: { animation: { duration: 0 } }
    };

    Chart.defaults.interaction = {
        mode: 'index',
        intersect: false,
    };
}

/* =========================
   AUTH & HEADERS
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
   CLEANUP UTILITY
========================= */
function safeDestroy(chartInstance) {
    if (chartInstance) {
        chartInstance.destroy();
    }
}

/* =========================
   CHART 1 — INCOME vs EXPENSE
========================= */
let incomeExpenseChart = null;

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

    const res = await fetch(`${API}/analytics/chart/yearly-trend?year=${yearSelect.value}`, { headers });
    const data = await res.json();
    const range = parseInt(rangeSelect.value);

    safeDestroy(incomeExpenseChart);

    const ctx = document.getElementById("incomeExpenseChart").getContext('2d');
    incomeExpenseChart = new Chart(ctx, {
        type: typeSelect.value,
        data: {
            labels: data.labels.slice(-range),
            datasets: [
                { 
                    label: "Income", 
                    data: data.income.slice(-range), 
                    backgroundColor: classyColors.primary, 
                    borderColor: classyColors.primary, 
                    borderRadius: 8,
                    tension: 0
                },
                { 
                    label: "Expense", 
                    data: data.expense.slice(-range), 
                    backgroundColor: classyColors.secondary, 
                    borderColor: classyColors.secondary, 
                    borderRadius: 8,
                    tension: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: classyColors.grid } },
                x: { grid: { display: false } }
            }
        }
    });
}

/* =========================
   CHART 2 — CATEGORY (Radar Fix)
========================= */
let categoryChart = null;

async function loadCategoryChart() {
    const headers = await getHeaders();
    if (!headers) return;

    const fromDate = document.getElementById("catFrom").value;
    const toDate = document.getElementById("catTo").value;
    const type = document.getElementById("catType").value;

    const res = await fetch(`${API}/analytics/chart/expense-category-range?from_date=${fromDate}&to_date=${toDate}`, { headers });
    const data = await res.json();

    safeDestroy(categoryChart);

    const isCircular = (type === 'pie' || type === 'doughnut' || type === 'radar');

    categoryChart = new Chart(document.getElementById("categoryChart"), {
        type: type,
        data: {
            labels: data.labels,
            datasets: [{
                label: "Expenses",
                data: data.data,
                backgroundColor: type === 'radar' 
                    ? 'rgba(123, 150, 212, 0.6)' 
                    : [classyColors.primary, classyColors.secondary, classyColors.accent, classyColors.highlight, classyColors.muted],
                borderColor: '#ffffff',
                borderWidth: 2,
                pointBackgroundColor: '#ffffff',
                pointRadius: 5
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            scales: isCircular ? {
                r: { 
                    display: type === 'radar',
                    grid: { color: '#666' },
                    angleLines: { color: '#666' },
                    pointLabels: { color: '#ffffff', font: { size: 12, weight: 'bold' } }
                },
                x: { display: false }, y: { display: false }
            } : {
                y: { beginAtZero: true, grid: { color: classyColors.grid } }
            },
            plugins: {
                legend: { position: isCircular ? 'right' : 'top' }
            }
        }
    });
}

/* =========================
   CHART 3 — KEYWORD (With Total Calculation)
========================= */
let keywordChart = null;

async function loadKeywordRangeChart() {
    const headers = await getHeaders();
    const keyword = kwInput.value.trim();
    if (!headers || !keyword) return;

    const res = await fetch(`${API}/analytics/chart/keyword-range-trend?keyword=${encodeURIComponent(keyword)}&from_date=${kwFrom.value}&to_date=${kwTo.value}`, { headers });
    const data = await res.json();

    // CALC TOTAL: Sum up all values in the range
    const totalAmount = data.data.reduce((sum, val) => sum + Number(val), 0);
    const totalDisplay = document.getElementById("kwTotalDisplay");
    if (totalDisplay) {
        totalDisplay.innerText = `Total: ₹${totalAmount.toLocaleString()}`;
    }

    safeDestroy(keywordChart);
    keywordChart = new Chart(document.getElementById("keywordRangeChart"), {
        type: kwType.value,
        data: {
            labels: data.labels,
            datasets: [{
                label: `Spending on "${keyword}"`,
                data: data.data,
                backgroundColor: classyColors.highlight,
                borderColor: classyColors.highlight,
                tension: 0,
                fill: kwType.value === 'line',
                pointRadius: 5
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: classyColors.grid } },
                x: { grid: { display: false } }
            }
        }
    });
}

/* =========================
   CHART 4 — ACCOUNT ANALYTICS
========================= */

let accountDistributionChart = null;
let accountTrendChart = null;

async function loadAccountCharts(){

    const type = document.getElementById("accType").value;

    // Always destroy both first (prevents overlap)
    safeDestroy(accountDistributionChart);
    safeDestroy(accountTrendChart);

    if(type === "bar"){
        await loadAccountDistribution();

        // Hide trend canvas
        document.getElementById("accountTrendChart").parentElement.style.display = "none";
        document.getElementById("accountDistributionChart").parentElement.style.display = "block";
    }
    else if(type === "trend"){
        await loadAccountTrend();

        // Hide distribution canvas
        document.getElementById("accountDistributionChart").parentElement.style.display = "none";
        document.getElementById("accountTrendChart").parentElement.style.display = "block";
    }

    await loadAccountInsight();
}

async function loadAccountDistribution() {
    const headers = await getHeaders();
    if (!headers) return;

    const from = document.getElementById("accFrom").value;
    if (!from) return;

    const d = new Date(from);

    const res = await fetch(
        `${API}/analytics/chart/account-distribution?month=${d.getMonth()+1}&year=${d.getFullYear()}`,
        { headers }
    );

    const data = await res.json();

    safeDestroy(accountDistributionChart);

    const type = document.getElementById("accType").value;

    accountDistributionChart = new Chart(
        document.getElementById("accountDistributionChart"),
        {
            type: type, // bar / line / pie etc
            data: {
                labels: data.labels || [],
                datasets: [{
                    label: "Account Spending",
                    data: data.data || [],
                    backgroundColor: [
                        classyColors.primary,
                        classyColors.secondary,
                        classyColors.accent,
                        classyColors.highlight,
                        classyColors.muted
                    ],
                    borderColor: classyColors.primary,
                    borderWidth: 2,
                    tension: 0,
                    fill: type === "line",
                    borderRadius: type === "bar" ? 8 : 0,
                    pointRadius: type === "line" ? 4 : 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "bottom" }
                },
                scales: (type === "bar" || type === "line") ? {
                    y: { beginAtZero: true, grid: { color: classyColors.grid } },
                    x: { grid: { display: false } }
                } : {}
            }
        }
    );
}
async function loadAccountTrend() {
    const headers = await getHeaders();
    if (!headers) return;

    const from = document.getElementById("accFrom").value;
    if(!from) return;

    const year = new Date(from).getFullYear();

    const res = await fetch(`${API}/analytics/chart/account-trend?year=${year}`, { headers });
    const data = await res.json();

    safeDestroy(accountTrendChart);

    accountTrendChart = new Chart(document.getElementById("accountTrendChart"), {
        type:"line",
        data:{
            labels:data.labels,
            datasets:data.datasets.map((d,i)=>({
                label:d.label,
                data:d.data,
                tension:0,
                borderColor:Object.values(classyColors)[i%5],
                backgroundColor:Object.values(classyColors)[i%5]
            }))
        },
        options:{ responsive:true, maintainAspectRatio:false, scales:{y:{beginAtZero:true}} }
    });
}

async function loadAccountInsight(){
    const headers = await getHeaders();
    if (!headers) return;

    const from = document.getElementById("accFrom").value;
    if(!from) return;

    const d = new Date(from);

    const res = await fetch(`${API}/analytics/chart/account-insight?month=${d.getMonth()+1}&year=${d.getFullYear()}`, { headers });
    const data = await res.json();

    const el = document.getElementById("accountInsightText");
    if(el) el.innerText = data.text;
}


/* =========================
   INSIGHTS & UTILS
========================= */

async function loadIncomeExpenseInsight() {
    const headers = await getHeaders();
    if (!headers) return;
    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    const res = await fetch(`${API}/analytics/chart/yearly-trend?year=${year}`, { headers });
    const data = await res.json();
    const el = document.getElementById("incomeExpenseText");
    const diff = data.income[month] - data.expense[month];
    
    if (el) {
        el.innerHTML = diff < 0 
            ? `Expenses exceeded income by <span class="text-red">₹${Math.abs(diff)}</span>` 
            : `Income exceeded expenses by <span class="text-green">₹${diff}</span>`;
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
        fetch(`${API}/analytics/chart/monthly-expense-category?month=${prevMonth}&year=${prevYear}` , { headers })
    ]);

    const curData = await curRes.json();
    const prevData = await prevRes.json();
    const prevMap = {};
    prevData.labels.forEach((c, i) => { prevMap[c] = Number(prevData.data[i]); });

    const increases = [];
    curData.labels.forEach((c, i) => {
        if (prevMap.hasOwnProperty(c)) {
            const prevAmount = prevMap[c];
            const currAmount = Number(curData.data[i]);
            if (currAmount > prevAmount && prevAmount > 0) {
                const pct = ((currAmount - prevAmount) / prevAmount) * 100;
                increases.push(`${c} ↑ ${pct.toFixed(1)}%`);
            }
        }
    });

    const el = document.getElementById("spendingIncreaseText");
    if (el) {
        el.innerHTML = increases.length
            ? increases.map(i => `<div class="negative text-red">${i} vs last month</div>`).join("")
            : `<span style="color:#888">Stability maintained this month</span>`;
    }
}

async function loadAvgExpenseTable() {
    const headers = await getHeaders();
    if (!headers) return;
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    const [catRes, yearRes] = await Promise.all([
        fetch(`${API}/analytics/chart/monthly-expense-category?month=${month}&year=${year}`, { headers }),
        fetch(`${API}/analytics/chart/yearly-trend?year=${year}`, { headers })
    ]);

    const catData = await catRes.json();
    const yearData = await yearRes.json();
    const income = yearData.income[new Date().getMonth()];
    const tbody = document.getElementById("avgExpenseTable");

    if (tbody) {
        tbody.innerHTML = "";
        catData.labels.forEach((cat, i) => {
            const amt = catData.data[i];
            const pct = income ? ((amt / income) * 100).toFixed(1) : 0;
            tbody.innerHTML += `
                <tr>
                    <td>${cat}</td>
                    <td>₹${amt}</td>
                    <td>${pct}%</td>
                </tr>`;
        });
    }
}

function setDefaultCategoryDates() {
    const d = new Date();
    const toStr = d.toISOString().split("T")[0];
    d.setMonth(d.getMonth() - 1);
    const fromStr = d.toISOString().split("T")[0];
    
    document.getElementById("catFrom").value = fromStr;
    document.getElementById("catTo").value = toStr;
    document.getElementById("kwFrom").value = fromStr;
    document.getElementById("kwTo").value = toStr;

    document.getElementById("accFrom").value = fromStr;
    document.getElementById("accTo").value = toStr;
}

function showLoader() { document.getElementById("globalLoader").style.display = "flex"; }
function hideLoader() { document.getElementById("globalLoader").style.display = "none"; }

/* =========================
   INITIALIZATION
========================= */
document.addEventListener("DOMContentLoaded", async () => {
    if (typeof loadTopNav === "function") await loadTopNav("analytics");
    
    // The global showLoader is now available from supabaseClient.js
    if (window.showLoader) showLoader(); 

    try {
        fillYears();
        setDefaultCategoryDates();
        
        // Hide the trend canvas by default
        const trendParent = document.getElementById("accountTrendChart").parentElement;
        if (trendParent) trendParent.style.display = "none";
        
        // Parallel load for efficiency
        await Promise.all([
            loadChart(),
            loadCategoryChart(),
            loadAccountCharts(),
            loadIncomeExpenseInsight(),
            loadSpendingIncreaseInsight(),
            loadAvgExpenseTable()
        ]);
    } catch (err) {
        console.error("Analytics Load Error:", err);
    } finally {
        // Keeping your nice 500ms delay to ensure Chart.js settles
        if (window.hideLoader) setTimeout(hideLoader, 500);
    }
});