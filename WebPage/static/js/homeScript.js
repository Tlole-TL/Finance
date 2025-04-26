// homeScript.js
import { Storage } from './storage.js';
import { computeInsights } from './insights.js';
import { createOrUpdateChart } from './chartUtils.js';
import { CategoryManager } from './categories.js';

document.addEventListener('DOMContentLoaded', () => {
  // Chart instances
  let dashboardLineChart, categoryPieChart, monthlyBarChart;
  // Edit‐mode trackers
  let editIncomeIndex = null;
  let editExpenseIndex = null;

  // ─── Populate Category Selector ────────────────────────────────────────────
  const expenseSelect = document.getElementById('expenseCategory');
  // add a placeholder option
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select category';
  placeholder.disabled = true;
  placeholder.selected = true;
  expenseSelect.appendChild(placeholder);
  // then actual categories
  CategoryManager.list.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.name;
    opt.textContent = cat.name;
    expenseSelect.appendChild(opt);
  });

  // ─── 1) Initialize Charts ─────────────────────────────────────────────────
  const lineCtx = document.getElementById('dashboardLineChart').getContext('2d');
  dashboardLineChart = createOrUpdateChart(lineCtx, dashboardLineChart, {
    type: 'line',
    data: {
      labels: ['Income','Expenses'],
      datasets:[{
        label: 'Income vs Expenses',
        data: [0,0],
        borderColor: 'rgba(75,192,192,1)',
        fill: false
      }]
    },
    options:{ responsive:true, scales:{ y:{ beginAtZero:true } } }
  });

  const pieCtx = document.getElementById('categoryPieChart').getContext('2d');
  categoryPieChart = createOrUpdateChart(pieCtx, categoryPieChart, {
    type:'pie',
    data:{ labels:[], datasets:[{ data:[], backgroundColor:CategoryManager.list.map(c=>c.color) }]},
    options:{ responsive:true, plugins:{ legend:{ position:'bottom' } } }
  });

  const barCtx = document.getElementById('monthlyBarChart').getContext('2d');
  monthlyBarChart = createOrUpdateChart(barCtx, monthlyBarChart, {
    type:'bar',
    data:{ labels:[], datasets:[] },
    options:{
      responsive:true,
      scales:{ y:{ beginAtZero:true } },
      plugins:{ legend:{ position:'bottom' } }
    }
  });

  // ─── 2) Wire Up Controls ─────────────────────────────────────────────────
  document.getElementById('accountsBtn').addEventListener('click',    () => toggleSection('incomeSection'));
  document.getElementById('dashboardBtn').addEventListener('click',  () => toggleSection('dashboardSection'));
  document.getElementById('transactionsBtn').addEventListener('click',() => toggleSection('expenseSection'));
  document.getElementById('budgetsBtn').addEventListener('click',    () => toggleSection('budgetSection'));

  document.getElementById('addIncomeBtn').addEventListener('click',   handleAddIncome);
  document.getElementById('addExpenseBtn').addEventListener('click',  handleAddExpense);
  document.getElementById('saveBudgetBtn').addEventListener('click',  handleSaveBudget);
  document.getElementById('resetBtn').addEventListener('click',       handleReset);

  // ─── 3) Initial Render ─────────────────────────────────────────────────
  updateIncomeList();
  updateExpenseList();
  updateDashboardStats();
  updateBudgetSection();

  // ─── 4) Handlers & Helpers ────────────────────────────────────────────

  function handleAddIncome() {
    const entry = {
      amount:     parseFloat(document.getElementById('addIncome').value) || 0,
      type:       document.getElementById('incomeType').value,
      date:       document.getElementById('incomeDate').value,
      recurrence: document.getElementById('incomeRecurrence').value,
      tags:       document.getElementById('incomeTags').value.split(',').map(t=>t.trim()),
      note:       document.getElementById('incomeNote').value
    };
    const arr = Storage.get('incomes', []);
    if (editIncomeIndex !== null) {
      arr[editIncomeIndex] = entry;
      editIncomeIndex = null;
      document.getElementById('addIncomeBtn').textContent = 'Add Income';
    } else {
      arr.push(entry);
    }
    Storage.set('incomes', arr);
    // clear form
    ['addIncome','incomeTags','incomeNote'].forEach(id => document.getElementById(id).value = '');
    updateIncomeList(); updateDashboardStats(); updateBudgetSection();
  }

  function onEditIncome(evt) {
    const idx = +evt.currentTarget.dataset.index;
    const e = Storage.get('incomes', [])[idx];
    document.getElementById('addIncome').value        = e.amount;
    document.getElementById('incomeType').value       = e.type;
    document.getElementById('incomeDate').value       = e.date;
    document.getElementById('incomeRecurrence').value = e.recurrence;
    document.getElementById('incomeTags').value       = e.tags.join(',');
    document.getElementById('incomeNote').value       = e.note || '';
    document.getElementById('addIncomeBtn').textContent = 'Save Income';
    editIncomeIndex = idx;
  }

  function onDeleteIncome(evt) {
    const idx = +evt.currentTarget.dataset.index;
    if (!confirm('Delete this income entry?')) return;
    const arr = Storage.get('incomes', []);
    arr.splice(idx,1);
    Storage.set('incomes', arr);
    updateIncomeList(); updateDashboardStats(); updateBudgetSection();
  }

  function handleAddExpense() {
    const entry = {
      amount:     parseFloat(document.getElementById('addExpense').value) || 0,
      category:   document.getElementById('expenseCategory').value,
      date:       document.getElementById('expenseDate').value,
      recurrence: document.getElementById('expenseRecurrence').value,
      tags:       document.getElementById('expenseTags').value.split(',').map(t=>t.trim()),
      note:       document.getElementById('expenseNote').value
    };
    const arr = Storage.get('expenses', []);
    if (editExpenseIndex !== null) {
      arr[editExpenseIndex] = entry;
      editExpenseIndex = null;
      document.getElementById('addExpenseBtn').textContent = 'Add Expense';
    } else {
      arr.push(entry);
    }
    Storage.set('expenses', arr);
    ['addExpense','expenseTags','expenseNote'].forEach(id => document.getElementById(id).value = '');
    updateExpenseList(); updateDashboardStats(); updateBudgetSection();
  }

  function onEditExpense(evt) {
    const idx = +evt.currentTarget.dataset.index;
    const e = Storage.get('expenses', [])[idx];
    document.getElementById('addExpense').value        = e.amount;
    document.getElementById('expenseCategory').value  = e.category;
    document.getElementById('expenseDate').value      = e.date;
    document.getElementById('expenseRecurrence').value= e.recurrence;
    document.getElementById('expenseTags').value      = e.tags.join(',');
    document.getElementById('expenseNote').value      = e.note || '';
    document.getElementById('addExpenseBtn').textContent = 'Save Expense';
    editExpenseIndex = idx;
  }

  function onDeleteExpense(evt) {
    const idx = +evt.currentTarget.dataset.index;
    if (!confirm('Delete this expense entry?')) return;
    const arr = Storage.get('expenses', []);
    arr.splice(idx,1);
    Storage.set('expenses', arr);
    updateExpenseList(); updateDashboardStats(); updateBudgetSection();
  }

  function updateIncomeList() {
    const arr = Storage.get('incomes', []);
    const c = document.querySelector('.incomeListContainer');
    c.innerHTML = arr.map((i,idx)=>`
      <div class="incomeItem">
        <span class="tag">${i.type}</span>
        <strong>$${i.amount.toFixed(2)}</strong> on ${i.date}
        ${i.note?`<em>(${i.note})</em>`:''}
        <button class="editIncomeBtn" data-index="${idx}">Edit</button>
        <button class="deleteIncomeBtn" data-index="${idx}">Delete</button>
      </div>`).join('');
    c.querySelectorAll('.editIncomeBtn').forEach(b=>b.addEventListener('click',onEditIncome));
    c.querySelectorAll('.deleteIncomeBtn').forEach(b=>b.addEventListener('click',onDeleteIncome));
  }

  function updateExpenseList() {
    const arr = Storage.get('expenses', []);
    const c = document.querySelector('.expenseListContainer');
    if (!c) { console.error('.expenseListContainer missing!'); return; }
    c.innerHTML = arr.map((e,idx)=>`
      <div class="incomeItem">
        <span class="tag">${e.category}</span>
        <strong>$${e.amount.toFixed(2)}</strong> on ${e.date}
        ${e.note?`<em>(${e.note})</em>`:''}
        <button class="editExpenseBtn" data-index="${idx}">Edit</button>
        <button class="deleteExpenseBtn" data-index="${idx}">Delete</button>
      </div>`).join('');
    c.querySelectorAll('.editExpenseBtn').forEach(b=>b.addEventListener('click',onEditExpense));
    c.querySelectorAll('.deleteExpenseBtn').forEach(b=>b.addEventListener('click',onDeleteExpense));
  }

  function toggleSection(id) {
    document.querySelectorAll('section').forEach(s=>s.hidden = s.id!==id);
  }

  function updateDashboardStats() {
    const incomes  = Storage.get('incomes', []);
    const expenses = Storage.get('expenses', []);
    const totalI = incomes.reduce((a,i)=>a+i.amount,0);
    const totalE = expenses.reduce((a,e)=>a+e.amount,0);

    document.getElementById('totalIncome').textContent     = totalI.toFixed(2);
    document.getElementById('totalExpenses').textContent   = totalE.toFixed(2);
    document.getElementById('remainingIncome').textContent = (totalI-totalE).toFixed(2);
    document.getElementById('budgetTotalIncome').textContent = totalI.toFixed(2);

    dashboardLineChart.data.datasets[0].data = [totalI, totalE];
    dashboardLineChart.update();

    const byCat = expenses.reduce((o,e)=>{ o[e.category]=(o[e.category]||0)+e.amount; return o; }, {});
    categoryPieChart.data.labels = Object.keys(byCat);
    categoryPieChart.data.datasets[0].data = Object.values(byCat);
    categoryPieChart.update();

    // Recent Transactions
    document.getElementById('recentTransactions').innerHTML =
      [...incomes.slice(-3), ...expenses.slice(-3)]
        .sort((a,b)=> new Date(b.date)-new Date(a.date))
        .map(x=>`<li>${x.category||x.type}: $${x.amount.toFixed(2)} on ${x.date}</li>`)
        .join('');

    // Insights
    const ins = computeInsights(incomes, expenses);
    const ic = document.getElementById('insightsContainer');
    ic.innerHTML = '';
    ins.forEach(txt => {
      const d = document.createElement('div');
      d.className='insight';
      d.textContent=txt;
      ic.appendChild(d);
    });
  }

  function updateBudgetSection() {
    const budgetsArr = Storage.get('budgets', []);
    const expenses = Storage.get('expenses', []);
    const totalAlloc = budgetsArr.reduce((s,b)=>s+b.allocatedAmount,0);
    const totalI = parseFloat(document.getElementById('budgetTotalIncome').textContent) || 0;

    document.getElementById('budgetTotalAllocated').textContent = totalAlloc.toFixed(2);
    document.getElementById('budgetRemaining').textContent      = (totalI-totalAlloc).toFixed(2);

    // Pie: Budget distribution
    budgetPieChart.data.labels = budgetsArr.map(b=>b.category);
    budgetPieChart.data.datasets[0].data = budgetsArr.map(b=>b.allocatedAmount);
    budgetPieChart.update();

    // Bar: Allocated vs Actual
    const spentByCat = budgetsArr.reduce((acc,b)=>{
      acc[b.category] = expenses
        .filter(e=>e.category===b.category)
        .reduce((s,e)=>s+e.amount,0);
      return acc;
    }, {});
    monthlyBarChart.data.labels = budgetsArr.map(b=>b.category);
    monthlyBarChart.data.datasets = [
      { label:'Allocated', data:budgetsArr.map(b=>b.allocatedAmount) },
      { label:'Actual', data:budgetsArr.map(b=>spentByCat[b.category]||0) }
    ];
    monthlyBarChart.update();
  }

  function handleSaveBudget() {
    const inputs = document.querySelectorAll('.budgetInput');
    const arr = Array.from(inputs).map(inp=>({
      category: inp.dataset.cat,
      allocatedAmount: parseFloat(inp.value)||0
    }));
    Storage.set('budgets', arr);
    updateBudgetSection();
  }

  function handleReset() {
    if (!confirm('Reset all data?')) return;
    Storage.clearAll();
    updateIncomeList();
    updateExpenseList();
    updateDashboardStats();
    updateBudgetSection();
  }
});
