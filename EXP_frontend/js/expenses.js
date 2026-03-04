const sb = window.supabaseClient;
const API = "https://expense-tracker-v2-koc5.onrender.com";

/* HELPERS */
async function requireLogin(){
    const {data:{session}}=await sb.auth.getSession();
    if(!session){ location.href="/html/login.html"; return null; }
    return session;
}

/* LOAD */
async function loadExpenses(params={}){
    const session=await requireLogin();
    if(!session) return;

    Object.keys(params).forEach(k=>!params[k]&&delete params[k]);
    const query=new URLSearchParams(params).toString();

    const res=await fetch(`${API}/expenses?${query}`,{
        headers:{Authorization:`Bearer ${session.access_token}`}
    });

    const rows=await res.json();
    const tbody=document.getElementById("expenseBody");
    tbody.innerHTML="";

    if(Array.isArray(rows)){
        rows.forEach(r=>{
            const tr=document.createElement("tr");
            tr.innerHTML=`
                <td><input type="date" id="date-${r[0]}" value="${r[1]??""}"></td>
                <td><input id="cat-${r[0]}" value="${r[2]??""}"></td>
                <td><input type="number" id="amt-${r[0]}" value="${r[3]??""}"></td>
                <td><input id="acc-${r[0]}" value="${r[5]??""}"></td>
                <td><input id="com-${r[0]}" value="${r[4]??""}"></td>
                <td style="text-align:center;white-space:nowrap;">
                    <button class="action-btn" onclick="updateExpense(${r[0]})">💾</button>
                    <button class="action-btn" onclick="deleteExpense(${r[0]})">🗑</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    const addRow=document.createElement("tr");
    addRow.innerHTML=`
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
    const btn=event.target;

    const date=document.getElementById("new-exp-date").value;
    const cat=document.getElementById("new-exp-cat").value;
    const amt=document.getElementById("new-exp-amt").value;
    const acc=document.getElementById("new-exp-acc").value;

    if(!date||!cat||!amt||!acc){ alert("Enter required values"); return; }

    await disableWhileLoading(btn, async ()=>{
        const session=await requireLogin();

        const res=await fetch(`${API}/expenses`,{
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

        if(res.ok){ await loadExpenses(); await loadSpendingIncreaseInsight(); }
    });
}

/* UPDATE */
async function updateExpense(id){
    const btn=event.target;

    await disableWhileLoading(btn, async ()=>{
        const session=await requireLogin();

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
    const btn=event.target;

    await disableWhileLoading(btn, async ()=>{
        const session=await requireLogin();

        const res=await fetch(`${API}/expenses/${id}`,{
            method:"DELETE",
            headers:{Authorization:`Bearer ${session.access_token}`}
        });

        if(res.ok){ await loadExpenses(); await loadSpendingIncreaseInsight(); }
    });
}

/* INSIGHT */
async function loadSpendingIncreaseInsight(){
    const session=await requireLogin();
    const res=await fetch(`${API}/expenses/spending-increase`,{
        headers:{Authorization:`Bearer ${session.access_token}`}
    });
    if(!res.ok) return;

    const data=await res.json();
    const el=document.getElementById("spendingIncrease");
    if(!el) return;

    el.innerHTML=data.length===0
        ?"No spending increase ✅"
        :data.map(d=>`${d.category} ↑ ${d.percent}%`).join(" | ");
}

function applyFilters(){
    loadExpenses({
        sort_by:sortBy.value,
        order:order.value,
        month:month.value,
        search:keyword.value.trim()
    });
}

document.addEventListener("DOMContentLoaded", async ()=>{
    if(typeof loadTopNav==="function") await loadTopNav("expenses");

    await disableWhileLoading(null, async ()=>{
        await loadExpenses();
        await loadSpendingIncreaseInsight();
    });
});