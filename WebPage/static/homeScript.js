

document.addEventListener("DOMContentLoaded", () => {
    const content = document.getElementById("content");
    const buttons = document.querySelectorAll(".nav-panel button");
    let incomeEntries = [];

    function activateButton(id) {
        buttons.forEach(b => b.classList.remove("active"));
        document.getElementById(id).classList.add("active");
    }

    function renderIncomeList() {
        const list = document.getElementById("incomeList");
        list.innerHTML = "";
        incomeEntries.forEach((e, i) => {
            const div = document.createElement("div");
            div.className = "income-entry";
            div.innerHTML = `
                <p><strong>${e.name}</strong> – $${e.amount.toLocaleString()} (${e.recurrence})</p>
                <p>Date: ${e.date}</p>
                <button data-idx="${i}" class="remove-btn">Remove</button>
            `;
            list.appendChild(div);
        });

        document.querySelectorAll(".remove-btn").forEach(btn =>
            btn.addEventListener("click", ev => {
                incomeEntries.splice(+ev.target.dataset.idx, 1);
                updateAccounts();
            })
        );
    }

    function aggregate(range) {
        const now = new Date(), iso = d => d.toISOString().slice(0, 10);
        let labels = [], data = [];
        console.log("Aggregating data for range:", range);

        if (range === "weekly") {
            const days = [...Array(7)].map((_, i) => {
                const d = new Date(now);
                d.setDate(now.getDate() - (6 - i));
                return d;
            });
            labels = days.map(d => d.toLocaleDateString("en-US", { weekday: "short" }));
            data = days.map(d => {
                console.log("Checking entries for date:", iso(d), "Available entries:", incomeEntries.map(e => e.date));
                return incomeEntries.filter(e => e.date === iso(d)).reduce((s, e) => s + e.amount, 0);
            });
        } else if (range === "monthly") {
            labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
            data = labels.map((_, w) => {
                const start = new Date(now);
                start.setDate(now.getDate() - (27 - w * 7));
                const end = new Date(start);
                end.setDate(start.getDate() + 6);
                console.log("Filtering monthly entries between:", start, "and", end);
                return incomeEntries.filter(e => {
                    const d = new Date(e.date);
                    return d >= start && d <= end;
                }).reduce((s, e) => s + e.amount, 0);
            });
        } else if (range === "ytd") {
            const cm = now.getMonth();
            labels = [...Array(cm + 1)].map((_, m) =>
                new Date(now.getFullYear(), m).toLocaleDateString("en-US", { month: "short" })
            );
            data = labels.map((_, m) => incomeEntries.filter(e => new Date(e.date).getMonth() === m).reduce((s, e) => s + e.amount, 0));
        } else {
            const yrs = [...new Set(incomeEntries.map(e => new Date(e.date).getFullYear()))].sort();
            labels = yrs.map(String);
            data = yrs.map(y => incomeEntries.filter(e => new Date(e.date).getFullYear() === y).reduce((s, e) => s + e.amount, 0));
        }

        console.log("Generated labels:", labels, "Data:", data);
        return { labels, data };
    }

    function renderChart(range) {
        const { labels, data } = aggregate(range);
        console.log("Rendering chart with labels:", labels, "and data:", data);

        const ctx = document.getElementById("incomeChart").getContext("2d");
        if (window.incomeChart instanceof Chart) {
            console.log("Destroying existing chart...");
            window.incomeChart.destroy();
        } else {
            console.log("No valid chart instance to destroy.");
        }

        window.incomeChart = new Chart(ctx, {
            type: "bar",
            data: { labels, datasets: [{
                label: "Income",
                data,
                backgroundColor: "rgba(5, 249, 241, 0.98)",
                borderColor: "rgb(4, 146, 247)",
                borderWidth: 2
                
            }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
        });
    }

    function updateAccounts() {
        console.log("Updating accounts. Current income entries:", incomeEntries);
        renderIncomeList();
        renderChart(document.getElementById("timeRange").value);
    }

    document.getElementById("accountsBtn").addEventListener("click", () => {
        activateButton("accountsBtn");
        content.innerHTML = `
            <h2>Accounts</h2>
            <div class="input-fields">
                <input id="incomeName" type="text" placeholder="Income Source Name"/>
                <input id="incomeAmount" type="number" placeholder="Amount"/>
                <select id="incomeRecurrence">
                    <option value="one-time">One-time</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                </select>
                <input id="incomeDate" type="date"/>
                <button id="submitIncome">Add Income</button>
            </div>
            <div id="incomeList"></div>
            <label for="timeRange">View:</label>
            <select id="timeRange">
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="ytd">Year to Date</option>
                <option value="all">All-time</option>
            </select>
            <div class="chart-container">
                <canvas id="incomeChart"></canvas>
            </div>
        `;

        document.getElementById("submitIncome").addEventListener("click", () => {
            const n = document.getElementById("incomeName").value.trim();
            const a = parseFloat(document.getElementById("incomeAmount").value);
            const r = document.getElementById("incomeRecurrence").value;
            const d = document.getElementById("incomeDate").value;
            if (n && !isNaN(a) && d) {
                incomeEntries.push({ name: n, amount: a, recurrence: r, date: d });
                updateAccounts();
            } else alert("Fill in all fields.");
        });

        document.getElementById("timeRange").addEventListener("change", updateAccounts);
        updateAccounts();
    });

    document.getElementById("dashboardBtn").addEventListener("click", () => {
        activateButton("dashboardBtn");
        content.innerHTML = `<h2>Dashboard</h2><p>Dashboard section will be implemented here.</p>`;
    });

    document.getElementById("transactionsBtn").addEventListener("click", () => {
        activateButton("transactionsBtn");
        content.innerHTML = `<h2>Transactions</h2><p>Recent transactions will appear here.</p>`;
    });

    document.getElementById("budgetsBtn").addEventListener("click", () => {
        activateButton("budgetsBtn");
        content.innerHTML = `<h2>Budgets</h2><p>Track and manage your budget allocation.</p>`;
    });

    document.getElementById("accountsBtn").click();
});