// budget.js
import { Storage } from './storage.js';
import { createOrUpdateChart } from './chartUtils.js';
import { CategoryManager } from './categories.js';

document.addEventListener('DOMContentLoaded', () => {
  const totalIncomeSpan       = document.getElementById("budgetTotalIncome");
  const totalAllocatedSpan    = document.getElementById("budgetTotalAllocated");
  const remainingSpan         = document.getElementById("budgetRemaining");
  const alertsContainer       = document.getElementById("alertsContainer");
  const budgetInputsContainer = document.getElementById("budgetInputsContainer");
  let pieChart, lineChart;

  document.getElementById("budgetsBtn").addEventListener("click", initBudgetSection);
  document.getElementById("saveBudgetBtn").addEventListener("click", saveBudgets);
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (confirm("Reset EVERYTHING?")) {
      Storage.clearAll();
      location.reload();
    }
  });

  function initBudgetSection() {
    const savedBudgets = Storage.get("budgets", []);
    budgetInputsContainer.innerHTML = "";
    CategoryManager.list.forEach(cat => {
      const wrapper = document.createElement("div");
      wrapper.className = "budgetInputWrapper";
      const label = document.createElement("label");
      label.textContent = `${cat.name}: `;
      const input = document.createElement("input");
      input.type = "number";
      input.min = 0;
      input.step = 0.01;
      input.className = "budgetInput";
      input.dataset.cat = cat.name;
      const saved = savedBudgets.find(b => b.category === cat.name);
      input.value = saved ? saved.allocatedAmount : 0;
      label.appendChild(input);
      wrapper.appendChild(label);
      budgetInputsContainer.appendChild(wrapper);
    });

    updateBudgetStats();
    initCharts();
    drawBudgetCharts();
  }

  function saveBudgets() {
    const budgetsArr = CategoryManager.list.map(cat => {
      const val = parseFloat(document.querySelector(`.budgetInput[data-cat="${cat.name}"]`).value) || 0;
      return { category: cat.name, allocatedAmount: val };
    });
    const totalIncome    = calculateTotalIncome();
    const totalAllocated = budgetsArr.reduce((s,b) => s + b.allocatedAmount, 0);
    if (totalAllocated > totalIncome) {
      return alert(`You're allocating $${totalAllocated.toFixed(2)}, but only $${totalIncome.toFixed(2)} is available.`);
    }
    Storage.set("budgets", budgetsArr);
    updateBudgetStats();
    drawBudgetCharts();
  }

  function calculateTotalIncome() {
    return Storage.get("incomes", []).reduce((sum,i) => sum + parseFloat(i.amount||0), 0);
  }

  function calculateTotalAllocated() {
    return Storage.get("budgets", []).reduce((sum,b) => sum + parseFloat(b.allocatedAmount||0), 0);
  }

  function updateBudgetStats() {
    const totalIncome    = calculateTotalIncome();
    const totalAllocated = calculateTotalAllocated();
    totalIncomeSpan.textContent    = totalIncome.toFixed(2);
    totalAllocatedSpan.textContent = totalAllocated.toFixed(2);
    remainingSpan.textContent      = (totalIncome - totalAllocated).toFixed(2);
  }

  function initCharts() {
    const pieCtx  = document.getElementById("budgetPieChart").getContext("2d");
    pieChart = createOrUpdateChart(pieCtx, pieChart, {
      type: "pie",
      data: { labels: [], datasets: [{ data: [], backgroundColor: CategoryManager.list.map(c=>c.color) }] },
      options: { responsive: true, plugins: { legend: { position: "bottom" } } }
    });
    const lineCtx = document.getElementById("budgetLineChart").getContext("2d");
    lineChart = createOrUpdateChart(lineCtx, lineChart, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          { label: "Allocated Budget", data: [], borderColor: "#4caf50", fill: false },
          { label: "Expenses (Cumulative)", data: [], borderColor: "#f44336", fill: false }
        ]
      },
      options: { responsive: true, plugins: { legend: { position: "bottom" } }, scales: { y: { beginAtZero: true } } }
    });
  }

  function drawBudgetCharts() {
    updateBudgetStats();
    const expenses   = Storage.get("expenses", []);
    const budgetsArr = Storage.get("budgets", []);

    // Alerts
    alertsContainer.innerHTML = "";
    CategoryManager.list.forEach(cat => {
      const spent = expenses.filter(e => e.category === cat.name)
                            .reduce((s,e) => s + parseFloat(e.amount||0),0);
      const limit = budgetsArr.find(b => b.category === cat.name)?.allocatedAmount || 0;
      if (limit > 0 && spent/limit >= 0.8) {
        const div = document.createElement("div");
        div.className = "budgetAlert";
        div.textContent = `⚠️ ${cat.name}: ${Math.round((spent/limit)*100)}% used`;
        alertsContainer.appendChild(div);
        if (Notification.permission==="granted") {
          new Notification("Budget Alert", { body: div.textContent });
        } else if (Notification.permission!=="denied") {
          Notification.requestPermission().then(p=>{
            if (p==="granted") new Notification("Budget Alert", { body: div.textContent });
          });
        }
      }
    });

    // Update pie
    pieChart.data.labels            = budgetsArr.map(b => b.category);
    pieChart.data.datasets[0].data  = budgetsArr.map(b => b.allocatedAmount);
    pieChart.update();

    // Update line
    const dates = Array.from(new Set([
      ...Storage.get("incomes", []).map(i=>i.date),
      ...expenses.map(e=>e.date)
    ])).sort();
    let sum = 0;
    const expenseByDate = dates.reduce((o,d)=>{ o[d]=0; return o; }, {});
    expenses.forEach(e => expenseByDate[e.date] += parseFloat(e.amount||0));
    const cumExpenses = dates.map(d => (sum += expenseByDate[d], sum));
    const allocLine   = dates.map(() => calculateTotalAllocated());

    lineChart.data.labels              = dates.map(d=>new Date(d).toLocaleDateString());
    lineChart.data.datasets[0].data    = allocLine;
    lineChart.data.datasets[1].data    = cumExpenses;
    lineChart.update();
  }
});
