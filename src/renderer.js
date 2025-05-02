document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.content-section');
  const sidebarButtons = document.querySelectorAll('.sidebar-btn');

  function showSection(id) {
    sections.forEach(section => {
      section.classList.toggle('hidden', section.id !== id);
    });
    sidebarButtons.forEach(btn => {
      btn.classList.toggle('bg-gray-700', btn.dataset.target === id);
    });
  }

  sidebarButtons.forEach(button => {
    button.addEventListener('click', () => {
      showSection(button.dataset.target);
    });
  });

  // Show dashboard by default
  showSection('dashboard');

  // Data storage (in-memory for MVP)
  let accounts = [];
  let entries = [];
  let investments = [];
  let settings = {
    theme: 'dark',
    language: 'pt-BR',
    currency: 'BRL',
  };

  // Utility functions
  function formatCurrency(value) {
    return new Intl.NumberFormat(settings.language, {
      style: 'currency',
      currency: settings.currency,
    }).format(value);
  }

  // Dashboard charts
  const expensesPieCtx = document.getElementById('expenses-pie-chart').getContext('2d');
  const balanceLineCtx = document.getElementById('balance-line-chart').getContext('2d');

  let expensesPieChart = new Chart(expensesPieCtx, {
    type: 'pie',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [],
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
      },
    },
  });

  let balanceLineChart = new Chart(balanceLineCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Balance',
        data: [],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.3)',
        fill: true,
        tension: 0.3,
      }],
    },
    options: {
      responsive: true,
      scales: {
        x: { display: true },
        y: { display: true },
      },
    },
  });

  // Update dashboard data
  function updateDashboard() {
    // Calculate total balance
    let totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    document.getElementById('total-balance').textContent = formatCurrency(totalBalance);

    // Calculate expenses by category
    let expenseEntries = entries.filter(e => e.type === 'expense');
    let categoryTotals = {};
    expenseEntries.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });
    expensesPieChart.data.labels = Object.keys(categoryTotals);
    expensesPieChart.data.datasets[0].data = Object.values(categoryTotals);
    expensesPieChart.data.datasets[0].backgroundColor = expensesPieChart.data.labels.map(() => '#' + Math.floor(Math.random()*16777215).toString(16));
    expensesPieChart.update();

    // Balance evolution (simple cumulative sum by date)
    let sortedEntries = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
    let balanceByDate = {};
    let runningBalance = 0;
    sortedEntries.forEach(e => {
      runningBalance += e.type === 'income' ? e.amount : -e.amount;
      balanceByDate[e.date] = runningBalance;
    });
    balanceLineChart.data.labels = Object.keys(balanceByDate);
    balanceLineChart.data.datasets[0].data = Object.values(balanceByDate);
    balanceLineChart.update();
  }

  // Accounts section
  const accountsTableBody = document.getElementById('accounts-table-body');
  const addAccountBtn = document.getElementById('add-account-btn');

  function renderAccounts() {
    accountsTableBody.innerHTML = '';
    accounts.forEach((acc, idx) => {
      const tr = document.createElement('tr');
      tr.classList.add('border-b', 'border-gray-700');
      tr.innerHTML = `
        <td class="px-4 py-2">${acc.name}</td>
        <td class="px-4 py-2">${acc.type}</td>
        <td class="px-4 py-2">${formatCurrency(acc.balance)}</td>
      `;
      accountsTableBody.appendChild(tr);
    });
  }

  addAccountBtn.addEventListener('click', () => {
    const name = prompt('Account Name:');
    if (!name) return;
    const type = prompt('Account Type (e.g., Checking, Savings):');
    if (!type) return;
    const balanceStr = prompt('Initial Balance:');
    const balance = parseFloat(balanceStr);
    if (isNaN(balance)) {
      alert('Invalid balance');
      return;
    }
    accounts.push({ name, type, balance });
    renderAccounts();
    updateDashboard();
  });

  // Entries section
  const entryForm = document.getElementById('entry-form');

  entryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('entry-type').value;
    const amount = parseFloat(document.getElementById('entry-amount').value);
    const category = document.getElementById('entry-category').value.trim();
    const date = document.getElementById('entry-date').value;
    const description = document.getElementById('entry-description').value.trim();

    if (!amount || !category || !date) {
      alert('Please fill in all required fields');
      return;
    }

    entries.push({ type, amount, category, date, description });
    entryForm.reset();
    updateDashboard();
  });

  // Investments section
  const investmentsTableBody = document.getElementById('investments-table-body');

  function renderInvestments() {
    investmentsTableBody.innerHTML = '';
    investments.forEach(inv => {
      const tr = document.createElement('tr');
      tr.classList.add('border-b', 'border-gray-700');
      tr.innerHTML = `
        <td class="px-4 py-2">${inv.name}</td>
        <td class="px-4 py-2">${formatCurrency(inv.value)}</td>
        <td class="px-4 py-2">${inv.date}</td>
        <td class="px-4 py-2">${inv.type}</td>
        <td class="px-4 py-2">${inv.yield}</td>
      `;
      investmentsTableBody.appendChild(tr);
    });
  }

  // Settings section
  const settingsForm = document.getElementById('settings-form');
  const themeSelect = document.getElementById('theme-select');
  const languageSelect = document.getElementById('language-select');
  const currencySelect = document.getElementById('currency-select');

  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    settings.theme = themeSelect.value;
    settings.language = languageSelect.value;
    settings.currency = currencySelect.value;

    document.documentElement.setAttribute('data-theme', settings.theme);
    updateDashboard();
    alert('Settings saved');
  });

  // Initialize theme
  document.documentElement.setAttribute('data-theme', settings.theme);

  // Initial render
  renderAccounts();
  renderInvestments();
  updateDashboard();
});
