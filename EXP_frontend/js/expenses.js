const sb = window.supabaseClient;
const API = "https://expense-tracker-v2-koc5.onrender.com";

/* HELPERS */
async function requireLogin(){
    const {data:{session}} = await sb.auth.getSession();
    if(!session){
        location.href="/html/login.html";
        return null;
    }
    return session;
}

/* CREATE FILTER UI */
function createFilters(){
    const bar = document.querySelector(".filter-bar");

    bar.innerHTML = `
        <select id="sortBy">
            <option value="">Sort By</option>
            <option value="expense_date">Date</option>
            <option value="amount">Amount</option>
            <option value="category">Category</option>
        </select>

        <select id="order">
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
        </select>

        <select id="month">
            <option value="">All Months</option>
            <option value="1">Jan</option>
            <option value="2">Feb</option>
            <option value="3">Mar</option>
            <option value="4">Apr</option>
            <option value="5">May</option>
            <option value="6">Jun</option>
            <option value="7">Jul</option>
            <option value="8">Aug</option>
            <option value="9">Sep</option>
            <option value="10">Oct</option>
            <option value="11">Nov</option>
            <option value="12">Dec</option>
        </select>

        <input id="keyword" placeholder="Search category/comment">

        <button onclick="applyFilters()">Apply</button>
    `;
}

/* LOAD EXPENSES */
async function loadExpenses(params={}){
    const session = await requireLogin();
    if(!session) return;

    Object.keys(params).forEach(k => !params[k] && delete params[k]);
    const query = new URLSearchParams(params).toString();

    const res = await fetch(`${API}/expenses?${query}`,{
        headers:{Authorization:`Bearer ${session.access_token}`}
    });

    const rows = await res.json();
    const tbody = document.getElementById("expenseBody");
    tbody.innerHTML = "";

    if(Array.isArray(rows)){
        rows.forEach(r=>{
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td><input type="date" id="date-${r.id}" value="${r.expense_date ?? ""}"></td>
                <td><input id="cat-${r.id}" value="${r.category ?? ""}"></td>
                <td><input type="number" id="amt-${r.id}" value="${r.amount ?? ""}"></td>
                <td><input id="acc-${r.id}" value="${r.account ?? ""}"></td>
                <td><input id="com-${r.id}" value="${r.comment ?? ""}"></td>
                <td style="text-align:center;white-space:nowrap;">
                    <button class="action-btn" onclick="updateExpense(${r.id})">💾</button>
                    <button class="action-btn" onclick="deleteExpense(${r.id})">🗑</button>
                </td>
            `;

            tbody.appendChild(tr);
        });
    }

    /* ADD NEW ROW */
    const addRow = document.createElement("tr");

    addRow.innerHTML = `
        <td><input type="date" id="new-exp-date"></td>
        <td><input id="new-exp-cat"></td>
        <td><input type="number" id="new-exp-amt"></td>
        <td><input id="new-exp-acc"></td>
        <td><input id="new-exp-com"></td>
        <td style="text-align:center;">
            <button class="action-btn" onclick="addExpense()">➕</button>
        </td>
    `;

    tbody.appendChild(addRow);
}

/* ADD */
async function addExpense(){
    const btn = event.target;

    const date = document.getElementById("new-exp-date").value;
    const cat  = document.getElementById("new-exp-cat").value;
    const amt  = document.getElementById("new-exp-amt").value;
    const acc  = document.getElementById("new-exp-acc").value;

    if(!date || !cat || !amt || !acc){
        alert("Enter required values");
        return;
    }

    await disableWhileLoading(btn, async ()=>{
        const session = await requireLogin();

        const res = await fetch(`${API}/expenses`,{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                Authorization:`Bearer ${session.access_token}`
            },
            body:JSON.stringify({
                expense_date:date,
                category:cat,
                amount:Number(amt),
                account:acc,
                comment:document.getElementById("new-exp-com").value
            })
        });

        if(res.ok){
            await loadExpenses();
            await loadSpendingIncreaseInsight();
        }
    });
}

/* UPDATE */
async function updateExpense(id){
    const btn = event.target;

    await disableWhileLoading(btn, async ()=>{
        const session = await requireLogin();

        await fetch(`${API}/expenses/${id}`,{
            method:"PUT",
            headers:{
                "Content-Type":"application/json",
                Authorization:`Bearer ${session.access_token}`
            },
            body:JSON.stringify({
                expense_date:document.getElementById(`date-${id}`).value,
                category:document.getElementById(`cat-${id}`).value,
                amount:Number(document.getElementById(`amt-${id}`).value),
                account:document.getElementById(`acc-${id}`).value,
                comment:document.getElementById(`com-${id}`).value
            })
        });

        await loadSpendingIncreaseInsight();
    });
}

/* DELETE */
async function deleteExpense(id){
    if(!confirm("Delete expense?")) return;

    const btn = event.target;

    await disableWhileLoading(btn, async ()=>{
        const session = await requireLogin();

        const res = await fetch(`${API}/expenses/${id}`,{
            method:"DELETE",
            headers:{Authorization:`Bearer ${session.access_token}`}
        });

        if(res.ok){
            await loadExpenses();
            await loadSpendingIncreaseInsight();
        }
    });
}

/* INSIGHT */
async function loadSpendingIncreaseInsight(){
    const session = await requireLogin();

    const res = await fetch(`${API}/expenses/spending-increase`,{
        headers:{Authorization:`Bearer ${session.access_token}`}
    });

    if(!res.ok) return;

    const data = await res.json();
    const el = document.getElementById("spendingIncrease");

    if(!el) return;

    el.innerHTML = data.length===0
        ? "No spending increase ✅"
        : data.map(d=>`${d.category} ↑ ${d.percent}%`).join(" | ");
}

/* APPLY FILTERS */
function applyFilters(){
    loadExpenses({
        sort_by:document.getElementById("sortBy").value,
        order:document.getElementById("order").value,
        month:document.getElementById("month").value,
        search:document.getElementById("keyword").value.trim()
    });
}

/* PAGE LOAD */
document.addEventListener("DOMContentLoaded", async ()=>{

    if(typeof loadTopNav==="function")
        await loadTopNav("expenses");

    createFilters();

    await disableWhileLoading(null, async ()=>{
        await loadExpenses();
        await loadSpendingIncreaseInsight();
    });

});