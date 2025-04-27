// homeScript.js
import { Storage } from './storage.js';
import { computeInsights } from './insights.js';
import { createOrUpdateChart } from './chartUtils.js';
import { CategoryManager } from './categories.js';

document.addEventListener('DOMContentLoaded', () => {
  // ─── State ───────────────────────────────────────────────────────────────
  let dashboardLineChart, categoryPieChart, monthlyBarChart, budgetPieChart;
  let editIncomeIndex = null, editExpenseIndex = null;
  const navIds = ['accountsBtn','dashboardBtn','transactionsBtn','budgetsBtn'];

  // ─── Populate Expense Category Dropdown ───────────────────────────────────
  const expenseSelect = document.getElementById('expenseCategory');
  expenseSelect.innerHTML =
    '<option value="">Select category</option>' +
    CategoryManager.list.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

  // ─── Render Budget Inputs ────────────────────────────────────────────────
  function renderBudgetInputs() {
    const container = document.querySelector('.budgetInputsContainer');
    container.innerHTML = CategoryManager.list.map(cat => `
      <div class="budgetRow">
        <label>${cat.name}</label>
        <input
          type="number" step="0.01" min="0"
          class="budgetInput"
          data-cat="${cat.name}"
          placeholder="0.00"
        />
      </div>
    `).join('');
  }

  // ─── Initialize Charts ───────────────────────────────────────────────────
  function initCharts() {
    // line chart
    const lineCtx = document.getElementById('dashboardLineChart').getContext('2d');
    dashboardLineChart = createOrUpdateChart(lineCtx, dashboardLineChart, {
      type:'line',
      data:{ labels:['Income','Expenses'], datasets:[{
        label:'Income vs Expenses',
        data:[0,0],
        borderColor:'rgba(75,192,192,1)',
        fill:false
      }]},
      options:{ responsive:true, scales:{ y:{ beginAtZero:true } } }
    });
    // category pie
    const pieCtx = document.getElementById('categoryPieChart').getContext('2d');
    categoryPieChart = createOrUpdateChart(pieCtx, categoryPieChart, {
      type:'pie',
      data:{ labels:[], datasets:[{
        data:[],
        backgroundColor:CategoryManager.list.map(c=>c.color)
      }]},
      options:{ responsive:true, plugins:{ legend:{ position:'bottom' } } }
    });
    // monthly bar
    const barCtx = document.getElementById('monthlyBarChart').getContext('2d');
    monthlyBarChart = createOrUpdateChart(barCtx, monthlyBarChart, {
      type:'bar',
      data:{ labels:[], datasets:[] },
      options:{ responsive:true,
        scales:{ y:{ beginAtZero:true } },
        plugins:{ legend:{ position:'bottom' } }
      }
    });
    // budget pie
    const budgetPieCtx = document.getElementById('budgetPieChart').getContext('2d');
    budgetPieChart = createOrUpdateChart(budgetPieCtx, budgetPieChart, {
      type:'pie',
      data:{ labels:[], datasets:[{
        data:[],
        backgroundColor:CategoryManager.list.map(c=>c.color)
      }]},
      options:{ responsive:true, plugins:{ legend:{ position:'bottom' } } }
    });
  }

  // ─── Section Toggle & Nav Active State ───────────────────────────────────
  function setActiveNav(id) {
    navIds.forEach(nid =>
      document.getElementById(nid).classList.toggle('active', nid === id)
    );
  }
  function toggleSection(sectionId) {
    document.querySelectorAll('section').forEach(s => {
      s.hidden = s.id !== sectionId;
    });
  }

  // ─── Wire Up Nav Buttons ─────────────────────────────────────────────────
  document.getElementById('accountsBtn').addEventListener('click', () => {
    setActiveNav('accountsBtn');
    toggleSection('incomeSection');
  });
  document.getElementById('dashboardBtn').addEventListener('click', () => {
    setActiveNav('dashboardBtn');
    toggleSection('dashboardSection');
  });
  document.getElementById('transactionsBtn').addEventListener('click', () => {
    setActiveNav('transactionsBtn');
    toggleSection('expenseSection');
  });
  document.getElementById('budgetsBtn').addEventListener('click', () => {
    setActiveNav('budgetsBtn');
    toggleSection('budgetSection');
  });

  // ─── Wire Up Control Buttons ──────────────────────────────────────────────
  document.getElementById('addIncomeBtn').addEventListener('click', handleAddIncome);
  document.getElementById('addExpenseBtn').addEventListener('click', handleAddExpense);
  document.getElementById('saveBudgetBtn').addEventListener('click', handleSaveBudget);
  document.getElementById('resetBtn').addEventListener('click', handleReset);

  // ─── Handlers ────────────────────────────────────────────────────────────
  function handleAddIncome() {
    const amount = parseFloat(document.getElementById('addIncome').value) || 0;
    if (amount <= 0) {
      alert('Please enter an income amount greater than zero.');
      return;
    }
    const entry = {
      amount,
      type: document.getElementById('incomeType').value,
      date: document.getElementById('incomeDate').value,
      recurrence: document.getElementById('incomeRecurrence').value,
      tags: document.getElementById('incomeTags').value
        .split(',').map(t => t.trim()).filter(t => t),
      note: document.getElementById('incomeNote').value
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

    console.log('Incomes now:', arr);    // ← debug line

    // reset inputs
    ['addIncome','incomeTags','incomeNote'].forEach(id => document.getElementById(id).value = '');
    updateUI();
  }

  function handleAddExpense() {
    const amount = parseFloat(document.getElementById('addExpense').value) || 0;
    const category = document.getElementById('expenseCategory').value;
    if (amount <= 0) {
      alert('Please enter an expense amount greater than zero.');
      return;
    }
    if (!category) {
      alert('Please select an expense category.');
      return;
    }
    const entry = {
      amount,
      category,
      date: document.getElementById('expenseDate').value,
      recurrence: document.getElementById('expenseRecurrence').value,
      tags: document.getElementById('expenseTags').value
        .split(',').map(t => t.trim()).filter(t => t),
      note: document.getElementById('expenseNote').value
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
    document.getElementById('expenseCategory').value = '';
    updateUI();
  }

  function handleSaveBudget() {
    const inputs = document.querySelectorAll('.budgetInput');
    const totalIncome = parseFloat(document.getElementById('budgetTotalIncome').textContent) || 0;
    const budgets = [], allocs = [];
    inputs.forEach(inp => {
      const amt = parseFloat(inp.value) || 0;
      if (amt > 0) {
        budgets.push({ category: inp.dataset.cat, allocatedAmount: amt });
        allocs.push(amt);
      }
    });
    const totalAlloc = allocs.reduce((a,b) => a + b, 0);
    if (totalAlloc > totalIncome) {
      alert(`You can’t allocate more than your total income ($${totalIncome.toFixed(2)}).`);
      return;
    }
    Storage.set('budgets', budgets);
    updateBudgetSection();
    highlightButton(document.getElementById('saveBudgetBtn'));
  }

  function handleReset() {
    if (!confirm('Reset all data?')) return;
    Storage.clearAll();
    renderBudgetInputs();
    updateUI();
  }

  // ─── UI Update Routines ─────────────────────────────────────────────────
  function updateIncomeList() {
    const arr = Storage.get('incomes', []);
    const c = document.querySelector('.incomeListContainer');
    if (!c) { console.error('No element with class .incomeListContainer!'); return; }
    c.innerHTML = arr.map((i, idx) => `
      <div class="incomeItem">
        <span class="tag">${i.type}</span>
        <strong>$${i.amount.toFixed(2)}</strong> on ${i.date}
        ${i.note ? `<em>(${i.note})</em>` : ''}
        <button class="editIncomeBtn" data-index="${idx}">Edit</button>
        <button class="deleteIncomeBtn" data-index="${idx}">Delete</button>
      </div>
    `).join('');
    c.querySelectorAll('.editIncomeBtn').forEach(b => b.addEventListener('click', onEditIncome));
    c.querySelectorAll('.deleteIncomeBtn').forEach(b => b.addEventListener('click', onDeleteIncome));
  }

  function updateExpenseList() {
    const arr = Storage.get('expenses', []);
    const c = document.querySelector('.expenseListContainer');
    if (!c) { console.error('No element with class .expenseListContainer!'); return; }
    c.innerHTML = arr.map((e, idx) => `
      <div class="incomeItem">
        <span class="tag">${e.category}</span>
        <strong>$${e.amount.toFixed(2)}</strong> on ${e.date}
        ${e.note ? `<em>(${e.note})</em>` : ''}
        <button class="editExpenseBtn" data-index="${idx}">Edit</button>
        <button class="deleteExpenseBtn" data-index="${idx}">Delete</button>
      </div>
    `).join('');
    c.querySelectorAll('.editExpenseBtn').forEach(b => b.addEventListener('click', onEditExpense));
    c.querySelectorAll('.deleteExpenseBtn').forEach(b => b.addEventListener('click', onDeleteExpense));
  }

  function updateDashboardStats() {
    const incomes = Storage.get('incomes', []), expenses = Storage.get('expenses', []);
    const totalI = incomes.reduce((a,i) => a + i.amount, 0);
    const totalE = expenses.reduce((a,e) => a + e.amount, 0);
    document.getElementById('totalIncome').textContent    = totalI.toFixed(2);
    document.getElementById('totalExpenses').textContent  = totalE.toFixed(2);
    document.getElementById('remainingIncome').textContent = (totalI - totalE).toFixed(2);
    document.getElementById('budgetTotalIncome').textContent = totalI.toFixed(2);
    dashboardLineChart.data.datasets[0].data = [totalI, totalE];
    dashboardLineChart.update();

    const byCat = expenses.reduce((o,e) => {
      o[e.category] = (o[e.category]||0) + e.amount; return o;
    }, {});
    categoryPieChart.data.labels   = Object.keys(byCat);
    categoryPieChart.data.datasets[0].data = Object.values(byCat);
    categoryPieChart.update();

    document.getElementById('recentTransactions').innerHTML =
      [...incomes.slice(-3), ...expenses.slice(-3)]
        .sort((a,b)=>new Date(b.date)-new Date(a.date))
        .map(x=>`<li>${x.category||x.type}: $${x.amount.toFixed(2)} on ${x.date}</li>`)
        .join('');

    const ins = computeInsights(incomes, expenses);
    const ic = document.getElementById('insightsContainer');
    ic.innerHTML = ''; ins.forEach(txt => {
      const d = document.createElement('div');
      d.className = 'insight'; d.textContent = txt;
      ic.appendChild(d);
    });
  }

  function updateBudgetSection() {
    const budgetsArr = Storage.get('budgets', []);
    const expenses   = Storage.get('expenses', []);
    const totalI     = parseFloat(document.getElementById('budgetTotalIncome').textContent) || 0;
    const totalAlloc = budgetsArr.reduce((s,b) => s + b.allocatedAmount, 0);
    document.getElementById('budgetTotalAllocated').textContent = totalAlloc.toFixed(2);
    document.getElementById('budgetRemaining').textContent      = (totalI - totalAlloc).toFixed(2);

    budgetPieChart.data.labels   = budgetsArr.map(b=>b.category);
    budgetPieChart.data.datasets[0].data = budgetsArr.map(b=>b.allocatedAmount);
    budgetPieChart.update();

    const spentByCat = budgetsArr.reduce((acc,b) => {
      acc[b.category] = expenses
        .filter(e=>e.category===b.category)
        .reduce((s,e)=>s + e.amount,0);
      return acc;
    }, {});
    monthlyBarChart.data.labels = budgetsArr.map(b=>b.category);
    monthlyBarChart.data.datasets = [
      { label:'Allocated', data:budgetsArr.map(b=>b.allocatedAmount) },
      { label:'Actual',    data:budgetsArr.map(b=>spentByCat[b.category]||0) }
    ];
    monthlyBarChart.update();
  }

  // ─── Edit/Delete Callbacks ───────────────────────────────────────────────
  function onEditIncome(evt) {
    editIncomeIndex = +evt.currentTarget.dataset.index;
    const e = Storage.get('incomes', [])[editIncomeIndex];
    document.getElementById('addIncome').value       = e.amount;
    document.getElementById('incomeType').value     = e.type;
    document.getElementById('incomeDate').value     = e.date;
    document.getElementById('incomeRecurrence').value = e.recurrence;
    document.getElementById('incomeTags').value     = e.tags.join(',');
    document.getElementById('incomeNote').value     = e.note || '';
    document.getElementById('addIncomeBtn').textContent = 'Save Income';
  }

  function onDeleteIncome(evt) {
    const idx = +evt.currentTarget.dataset.index;
    if (!confirm('Delete this income entry?')) return;
    const arr = Storage.get('incomes', []);
    arr.splice(idx,1);
    Storage.set('incomes',arr);
    updateUI();
  }

  function onEditExpense(evt) {
    editExpenseIndex = +evt.currentTarget.dataset.index;
    const e = Storage.get('expenses', [])[editExpenseIndex];
    document.getElementById('addExpense').value       = e.amount;
    document.getElementById('expenseCategory').value  = e.category;
    document.getElementById('expenseDate').value      = e.date;
    document.getElementById('expenseRecurrence').value = e.recurrence;
    document.getElementById('expenseTags').value      = e.tags.join(',');
    document.getElementById('expenseNote').value      = e.note || '';
    document.getElementById('addExpenseBtn').textContent = 'Save Expense';
  }

  function onDeleteExpense(evt) {
    const idx = +evt.currentTarget.dataset.index;
    if (!confirm('Delete this expense entry?')) return;
    const arr = Storage.get('expenses', []);
    arr.splice(idx,1);
    Storage.set('expenses',arr);
    updateUI();
  }

  function highlightButton(button) {
    button.classList.add('saved-highlight');
    setTimeout(() => button.classList.remove('saved-highlight'), 1500);
  }

  // ─── Kick everything off ─────────────────────────────────────────────────
  function updateUI() {
    updateIncomeList();
    updateExpenseList();
    updateDashboardStats();
    updateBudgetSection();
  }

  initCharts();
  renderBudgetInputs();
  updateUI();
  setActiveNav('accountsBtn');
  toggleSection('incomeSection');
});
