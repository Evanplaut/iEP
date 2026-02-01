// ========================================
// FINANCE DASHBOARD APP WITH PIN PROTECTION
// ========================================

// ========================================
// PIN AUTHENTICATION
// ========================================

let sessionActive = false;
let activityTimer = null;
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Simple hash function for PIN storage
async function hashPin(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Initialize PIN screen
document.addEventListener('DOMContentLoaded', () => {
    checkPinStatus();
    setupActivityTracking();
});

function checkPinStatus() {
    const savedPin = localStorage.getItem('appPinHash');

    if (!savedPin) {
        // First time - show PIN setup
        document.getElementById('pinSetup').classList.remove('hidden');
        document.getElementById('pinSubtitle').textContent = 'Set up your PIN';
    } else {
        // Returning user - show PIN entry
        document.getElementById('pinEntry').classList.remove('hidden');
        document.getElementById('pinSubtitle').textContent = 'Enter your PIN';
    }
}

async function setupPin() {
    const pin = document.getElementById('setupPin').value;
    const confirm = document.getElementById('confirmPin').value;

    if (!pin || pin.length < 4) {
        alert('PIN must be at least 4 digits');
        return;
    }

    if (pin !== confirm) {
        alert('PINs do not match');
        return;
    }

    if (!/^\d+$/.test(pin)) {
        alert('PIN must contain only numbers');
        return;
    }

    const hashedPin = await hashPin(pin);
    localStorage.setItem('appPinHash', hashedPin);

    // Clear inputs
    document.getElementById('setupPin').value = '';
    document.getElementById('confirmPin').value = '';

    // Unlock app
    unlockApp();
}

async function verifyPin() {
    const pin = document.getElementById('entryPin').value;
    const savedPin = localStorage.getItem('appPinHash');

    if (!pin) {
        return;
    }

    const hashedPin = await hashPin(pin);

    if (hashedPin === savedPin) {
        document.getElementById('entryPin').value = '';
        document.getElementById('pinError').classList.add('hidden');
        unlockApp();
    } else {
        document.getElementById('pinError').classList.remove('hidden');
        document.getElementById('entryPin').value = '';
        document.getElementById('entryPin').focus();
    }
}

// Allow Enter key to submit PIN
document.addEventListener('DOMContentLoaded', () => {
    const setupPin = document.getElementById('setupPin');
    const confirmPin = document.getElementById('confirmPin');
    const entryPin = document.getElementById('entryPin');

    if (setupPin) {
        setupPin.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('confirmPin').focus();
            }
        });
    }

    if (confirmPin) {
        confirmPin.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                setupPin();
            }
        });
    }

    if (entryPin) {
        entryPin.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                verifyPin();
            }
        });
    }
});

function unlockApp() {
    sessionActive = true;
    document.getElementById('pinLockScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    resetActivityTimer();

    // Initialize main app
    loadData();
    initializeApp();
    renderView();
    updateAlertBanner();
}

function lockApp() {
    sessionActive = false;
    clearTimeout(activityTimer);
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('pinLockScreen').classList.remove('hidden');

    // Reset PIN entry
    document.getElementById('pinEntry').classList.remove('hidden');
    document.getElementById('pinSetup').classList.add('hidden');
    document.getElementById('pinSubtitle').textContent = 'Enter your PIN';
    document.getElementById('entryPin').value = '';
    document.getElementById('pinError').classList.add('hidden');

    // Clear any open modals
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

function setupActivityTracking() {
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, resetActivityTimer);
    });
}

function resetActivityTimer() {
    if (!sessionActive) return;

    clearTimeout(activityTimer);
    activityTimer = setTimeout(() => {
        if (sessionActive) {
            lockApp();
        }
    }, INACTIVITY_TIMEOUT);
}

// ========================================
// DATA MODEL
// ========================================

let appData = {
    accounts: [
        { id: 'td', name: 'TD Checking', type: 'asset', balance: 0 },
        { id: 'discover', name: 'Discover Card', type: 'liability', balance: 0 }
    ],
    transactions: [],
    rules: [],
    bills: [],
    alerts: [],
    categories: [
        'Groceries',
        'Dining & Restaurants',
        'Transportation',
        'Shopping',
        'Bills & Utilities',
        'Subscriptions',
        'Entertainment',
        'Health & Wellness',
        'Travel',
        'Income',
        'Other'
    ],
    categoryColors: {
        'Groceries': 'blue',
        'Dining & Restaurants': 'orange',
        'Transportation': 'green',
        'Shopping': 'pink',
        'Bills & Utilities': 'red',
        'Subscriptions': 'purple',
        'Entertainment': 'yellow',
        'Health & Wellness': 'green',
        'Travel': 'blue',
        'Income': 'green',
        'Other': 'purple'
    },
    merchantIcons: {
        // Groceries
        'whole foods': '🥬',
        'trader joe': '🛒',
        'safeway': '🛒',
        'kroger': '🛒',
        'walmart': '🏪',
        'target': '🎯',
        'costco': '📦',

        // Dining
        'starbucks': '☕',
        'mcdonald': '🍔',
        'chipotle': '🌯',
        'subway': '🥪',
        'pizza': '🍕',
        'restaurant': '🍽️',
        'cafe': '☕',
        'coffee': '☕',
        'burger': '🍔',
        'sushi': '🍱',
        'taco': '🌮',

        // Transportation
        'uber': '🚗',
        'lyft': '🚕',
        'shell': '⛽',
        'chevron': '⛽',
        'exxon': '⛽',
        'gas': '⛽',
        'parking': '🅿️',
        'transit': '🚇',

        // Shopping
        'amazon': '📦',
        'apple': '🍎',
        'best buy': '💻',
        'nike': '👟',
        'gap': '👕',
        'nordstrom': '👗',

        // Bills & Utilities
        'pg&e': '⚡',
        'at&t': '📱',
        'verizon': '📱',
        'comcast': '📡',
        'electric': '⚡',
        'water': '💧',
        'internet': '🌐',
        'phone': '📱',

        // Subscriptions
        'netflix': '🎬',
        'spotify': '🎵',
        'amazon prime': '📺',
        'youtube': '▶️',
        'apple music': '🎵',
        'gym': '💪',
        'fitness': '💪',

        // Entertainment
        'cinema': '🎬',
        'theater': '🎭',
        'concert': '🎵',
        'game': '🎮',

        // Health
        'pharmacy': '💊',
        'doctor': '🏥',
        'hospital': '🏥',
        'dentist': '🦷',

        // Travel
        'airline': '✈️',
        'hotel': '🏨',
        'airbnb': '🏠',

        // Income
        'paycheck': '💰',
        'salary': '💰',
        'deposit': '💰',

        // Default
        'default': '💳'
    },
    balanceHistory: [],
    settings: {
        showLiabilities: true,
        lastImportDate: null,
        lastBalanceUpdate: null
    }
};

let currentView = 'overview';
let currentTransaction = null;
let importedData = null;
let keypadValue = '0';
let receiptData = null;

// ========================================
// INITIALIZATION
// ========================================

function initializeApp() {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    const txnDateInput = document.getElementById('txnDate');
    if (txnDateInput) {
        txnDateInput.value = today;
    }

    // Populate category dropdowns
    populateCategoryDropdowns();

    // Event Listeners - Navigation
    document.querySelectorAll('.nav-item, .nav-btn').forEach(item => {
        item.addEventListener('click', (e) => {
            const view = e.currentTarget.dataset.view;
            navigateTo(view);
        });
    });

    // FAB Button
    const fabBtn = document.getElementById('fabBtn');
    if (fabBtn) {
        fabBtn.addEventListener('click', openQuickAdd);
    }

    // Quick Add Form
    const quickAddForm = document.getElementById('quickAddForm');
    if (quickAddForm) {
        quickAddForm.addEventListener('submit', handleQuickAdd);
    }

    // Account toggles in quick add
    document.querySelectorAll('#quickAddModal .toggle-btn[data-account]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#quickAddModal .toggle-btn[data-account]').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });
    });

    // Type toggles in quick add
    document.querySelectorAll('#quickAddModal .toggle-btn[data-type]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#quickAddModal .toggle-btn[data-type]').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });
    });

    // Edit Transaction Form
    const editForm = document.getElementById('editTransactionForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditTransaction);
    }

    // Add Bill Form
    const billForm = document.getElementById('addBillForm');
    if (billForm) {
        billForm.addEventListener('submit', handleAddBill);
    }

    // Alert Banner Click
    const alertBanner = document.getElementById('alertBanner');
    if (alertBanner) {
        alertBanner.addEventListener('click', () => {
            navigateTo('settings');
            setTimeout(() => {
                document.getElementById('alertsList')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });
    }

    // Numeric Keypad
    document.querySelectorAll('.keypad-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            handleKeypadPress(e.currentTarget.dataset.key);
        });
    });

    // Receipt Camera Button
    const receiptCameraBtn = document.getElementById('receiptCameraBtn');
    if (receiptCameraBtn) {
        receiptCameraBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('receiptInput').click();
        });
    }

    const receiptInput = document.getElementById('receiptInput');
    if (receiptInput) {
        receiptInput.addEventListener('change', handleReceiptCapture);
    }

    const editReceiptCameraBtn = document.getElementById('editReceiptCameraBtn');
    if (editReceiptCameraBtn) {
        editReceiptCameraBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('editReceiptInput').click();
        });
    }

    const editReceiptInput = document.getElementById('editReceiptInput');
    if (editReceiptInput) {
        editReceiptInput.addEventListener('change', handleEditReceiptCapture);
    }
}

function populateCategoryDropdowns() {
    const dropdowns = [
        document.getElementById('txnCategory'),
        document.getElementById('editTxnCategory')
    ];

    dropdowns.forEach(dropdown => {
        if (dropdown) {
            dropdown.innerHTML = '';
            appData.categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                dropdown.appendChild(option);
            });
        }
    });
}

// ========================================
// NAVIGATION
// ========================================

function navigateTo(view) {
    currentView = view;

    // Update active states
    document.querySelectorAll('.nav-item, .nav-btn').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === view) {
            item.classList.add('active');
        }
    });

    renderView();
}

function renderView() {
    const container = document.getElementById('viewContainer');
    if (!container) return;

    switch (currentView) {
        case 'overview':
            container.innerHTML = renderOverview();
            // Render charts after DOM is ready
            setTimeout(() => {
                renderBalanceLineChart('balanceTrendChart', currentPeriod);
                renderCategoryPieChart('categoryPieChart', currentPeriod);
            }, 0);
            break;
        case 'accounts':
            container.innerHTML = renderAccounts();
            break;
        case 'transactions':
            container.innerHTML = renderTransactions();
            attachTransactionListeners();
            break;
        case 'categories':
            container.innerHTML = renderCategories();
            break;
        case 'bills':
            container.innerHTML = renderBills();
            break;
        case 'rules':
            container.innerHTML = renderRules();
            break;
        case 'settings':
            container.innerHTML = renderSettings();
            attachSettingsListeners();
            break;
    }
}

// ========================================
// OVERVIEW VIEW
// ========================================

function renderOverview() {
    const tdBalance = appData.accounts.find(a => a.id === 'td').balance;
    const discoverBalance = appData.accounts.find(a => a.id === 'discover').balance;
    const netWorth = tdBalance - discoverBalance;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlySpend = calculateMonthlySpend(currentMonth, currentYear);
    const topCategory = getTopCategory(currentMonth, currentYear);
    const subscriptionBurn = calculateSubscriptionBurn();

    const balanceStale = !appData.settings.lastBalanceUpdate ||
        (Date.now() - new Date(appData.settings.lastBalanceUpdate).getTime()) > 24 * 60 * 60 * 1000;

    const balanceTrend = calculateBalanceTrend();
    const cashFlow = calculateCashFlow(currentPeriod);
    const financialHealth = calculateFinancialHealth();
    const insights = getSpendingInsights();

    return `
        <div class="overview-view">
            ${balanceStale ? `
                <div class="card" style="background: var(--accent-warning); color: var(--bg-primary);">
                    <strong>Update balances</strong> — Net worth may be stale. Update in Settings.
                </div>
            ` : ''}

            <!-- Financial Health Score -->
            <div class="card financial-health-card">
                <div class="health-content">
                    <div class="health-score-circle" style="--score: ${financialHealth.score}; --color: ${financialHealth.color}">
                        <div class="score-value">${financialHealth.score}</div>
                        <div class="score-label">${financialHealth.rating}</div>
                    </div>
                    <div class="health-details">
                        <h3 class="health-title">Financial Health</h3>
                        <p class="health-message">${financialHealth.message}</p>
                        <div class="health-factors">
                            <div class="factor">
                                <span class="factor-label">Savings Rate</span>
                                <span class="factor-value">${cashFlow.savingsRate.toFixed(0)}%</span>
                            </div>
                            <div class="factor">
                                <span class="factor-label">Net Worth</span>
                                <span class="factor-value">${formatCurrency(netWorth)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Spending Insights -->
            ${insights.length > 0 ? `
                <div class="insights-section">
                    <h3 class="section-title">💡 Insights</h3>
                    <div class="insights-grid">
                        ${insights.map(insight => `
                            <div class="insight-card ${insight.type}">
                                <div class="insight-icon">${insight.icon}</div>
                                <div class="insight-content">
                                    <div class="insight-title">${insight.title}</div>
                                    <div class="insight-description">${insight.description}</div>
                                    <div class="insight-value">${insight.value}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Main Stats -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Net Worth</div>
                    <div class="stat-value ${netWorth >= 0 ? 'positive' : 'negative'}">
                        ${formatCurrency(netWorth)}
                    </div>
                    ${balanceTrend.change !== 0 ? `
                        <div class="balance-trend ${balanceTrend.direction}">
                            <span class="trend-arrow">${balanceTrend.direction === 'up' ? '↑' : '↓'}</span>
                            <span class="trend-amount">${formatCurrency(Math.abs(balanceTrend.change))}</span>
                            <span class="trend-percent">(${Math.abs(balanceTrend.percentChange).toFixed(1)}%) this month</span>
                        </div>
                    ` : ''}
                </div>

                <div class="stat-card">
                    <div class="stat-label">Cash Flow</div>
                    <div class="stat-value ${cashFlow.netCashFlow >= 0 ? 'positive' : 'negative'}" id="cashFlowValue">
                        ${formatCurrency(cashFlow.netCashFlow)}
                    </div>
                    <div class="stat-change">
                        Income: ${formatCurrency(cashFlow.income)} | Expenses: ${formatCurrency(cashFlow.expenses)}
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-label">Savings Rate</div>
                    <div class="stat-value ${cashFlow.savingsRate >= 0 ? 'positive' : 'negative'}" id="savingsRateValue">
                        ${cashFlow.savingsRate.toFixed(1)}%
                    </div>
                    <div class="stat-change">
                        ${cashFlow.savingsRate >= 20 ? '💰 Excellent' : cashFlow.savingsRate >= 10 ? '👍 Good' : '📊 Building'}
                    </div>
                </div>
            </div>

            <!-- Period Selector -->
            <div class="period-selector">
                <button class="period-btn ${currentPeriod === '1M' ? 'active' : ''}" data-period="1M" onclick="setPeriod('1M')">1M</button>
                <button class="period-btn ${currentPeriod === '3M' ? 'active' : ''}" data-period="3M" onclick="setPeriod('3M')">3M</button>
                <button class="period-btn ${currentPeriod === '1Y' ? 'active' : ''}" data-period="1Y" onclick="setPeriod('1Y')">1Y</button>
                <button class="period-btn ${currentPeriod === 'YTD' ? 'active' : ''}" data-period="YTD" onclick="setPeriod('YTD')">YTD</button>
                <button class="period-btn ${currentPeriod === 'MAX' ? 'active' : ''}" data-period="MAX" onclick="setPeriod('MAX')">MAX</button>
            </div>

            <!-- Balance Trend Chart -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Balance Trend</h3>
                </div>
                <div class="chart-container">
                    <canvas id="balanceTrendChart"></canvas>
                </div>
            </div>

            <!-- Analytics Grid -->
            <div class="analytics-grid">
                <!-- Category Breakdown -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Spending Breakdown</h3>
                    </div>
                    <div class="chart-container pie-chart-container">
                        <canvas id="categoryPieChart"></canvas>
                    </div>
                </div>

                <!-- Quick Stats -->
                <div class="quick-stats">
                    <div class="stat-card">
                        <div class="stat-label">Top Category</div>
                        <div class="stat-value" style="font-size: 18px;">${topCategory.category}</div>
                        <div class="stat-change">${formatCurrency(topCategory.amount)}</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-label">Monthly Spend MTD</div>
                        <div class="stat-value">${formatCurrency(monthlySpend)}</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-label">Subscriptions</div>
                        <div class="stat-value">${formatCurrency(subscriptionBurn)}/mo</div>
                    </div>
                </div>
            </div>

            <!-- Recent Transactions -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Recent Transactions</h3>
                </div>
                ${renderRecentTransactions(8)}
            </div>
        </div>
    `;
}

function toggleLiabilities() {
    appData.settings.showLiabilities = !appData.settings.showLiabilities;
    saveData();
    renderView();
}

// ========================================
// ACCOUNTS VIEW
// ========================================

function renderAccounts() {
    return `
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Accounts</h2>
            </div>
            ${appData.accounts.map(account => `
                <div class="account-item">
                    <div>
                        <div class="account-name">${account.name}</div>
                        <div class="account-type">${account.type}</div>
                    </div>
                    <div class="account-balance ${account.balance >= 0 ? 'positive' : 'negative'}">
                        ${formatCurrency(account.balance)}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ========================================
// TRANSACTIONS VIEW
// ========================================

function renderTransactions() {
    const grouped = {};

    appData.transactions.forEach(txn => {
        const date = formatDate(txn.date, 'YYYY-MM-DD');
        if (!grouped[date]) {
            grouped[date] = [];
        }
        grouped[date].push(txn);
    });

    const sortedDates = Object.keys(grouped).sort().reverse();

    return `
        <div class="transactions-view">
            ${sortedDates.length === 0 ? `
                <div class="empty-state">
                    <p>No transactions yet</p>
                </div>
            ` : ''}
            ${sortedDates.map(date => `
                <div class="transaction-group">
                    <div class="group-date">${formatDate(date, 'MMM DD, YYYY')}</div>
                    ${grouped[date].map(txn => `
                        <div class="transaction-item" data-txn-id="${txn.id}">
                            <div class="txn-merchant-icon">${getMerchantIcon(txn.merchant)}</div>
                            <div class="txn-info">
                                <div class="txn-merchant">${txn.merchant}</div>
                                <div class="txn-category-row">
                                    <span class="txn-category">${txn.category}</span>
                                    ${txn.receipt ? '<span class="receipt-indicator">📎</span>' : ''}
                                </div>
                            </div>
                            <div class="txn-amount ${txn.type === 'expense' ? 'negative' : 'positive'}">
                                ${txn.type === 'expense' ? '-' : '+'}${formatCurrency(Math.abs(txn.amount))}
                            </div>
                            <div class="txn-actions">
                                <button class="btn-icon edit-txn" data-txn-id="${txn.id}" title="Edit">✎</button>
                                <button class="btn-icon delete-txn" data-txn-id="${txn.id}" title="Delete">✕</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        </div>
    `;
}

function attachTransactionListeners() {
    document.querySelectorAll('.edit-txn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const txnId = e.target.dataset.txnId;
            openEditModal(txnId);
        });
    });

    document.querySelectorAll('.delete-txn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const txnId = e.target.dataset.txnId;
            if (confirm('Delete this transaction?')) {
                deleteTransaction(txnId);
            }
        });
    });
}

// ========================================
// CATEGORIES VIEW
// ========================================

function renderCategories() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const categorySpends = {};
    appData.categories.forEach(cat => {
        categorySpends[cat] = 0;
    });

    appData.transactions.forEach(txn => {
        const txnDate = new Date(txn.date);
        if (txnDate.getMonth() === currentMonth && txnDate.getFullYear() === currentYear && txn.type === 'expense') {
            if (categorySpends.hasOwnProperty(txn.category)) {
                categorySpends[txn.category] += txn.amount;
            }
        }
    });

    const sortedCategories = Object.entries(categorySpends)
        .sort(([, a], [, b]) => b - a)
        .filter(([, amount]) => amount > 0);

    const totalSpend = Object.values(categorySpends).reduce((sum, amount) => sum + amount, 0);

    // Color mapping for bars
    const categoryColorMap = {
        'Groceries': '#0a84ff',
        'Dining & Restaurants': '#ff9f0a',
        'Transportation': '#30d158',
        'Shopping': '#ff2d55',
        'Bills & Utilities': '#ff453a',
        'Subscriptions': '#bf5af0',
        'Entertainment': '#ffd60a',
        'Health & Wellness': '#30d158',
        'Travel': '#0a84ff',
        'Income': '#30d158',
        'Other': '#bf5af0'
    };

    return `
        <div class="categories-view">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Spending by Category</h2>
                    <div class="card-subtitle">This Month</div>
                </div>
                ${sortedCategories.length === 0 ? `
                    <div class="empty-state">
                        <p>No spending this month</p>
                    </div>
                ` : ''}
                <div class="budget-bars">
                    ${sortedCategories.map(([category, amount]) => {
                        const percentage = totalSpend > 0 ? (amount / totalSpend * 100) : 0;
                        const barColor = categoryColorMap[category] || '#bf5af0';
                        return `
                            <div class="budget-item">
                                <div class="budget-header">
                                    <div class="budget-category">
                                        <span class="category-dot" style="background: ${barColor};"></span>
                                        <span class="category-name">${category}</span>
                                    </div>
                                    <div class="budget-stats">
                                        <span class="budget-amount">${formatCurrency(amount)}</span>
                                        <span class="budget-percentage">${percentage.toFixed(0)}%</span>
                                    </div>
                                </div>
                                <div class="budget-progress">
                                    <div class="budget-progress-fill" style="width: ${percentage}%; background: ${barColor};"></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="budget-total">
                    <span class="total-label">Total Spending</span>
                    <span class="total-amount">${formatCurrency(totalSpend)}</span>
                </div>
            </div>
        </div>
    `;
}

// ========================================
// BILLS VIEW
// ========================================

function renderBills() {
    return `
        <div class="bills-view">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Bills & Subscriptions</h2>
                    <button class="btn-small btn-primary" onclick="openAddBillModal()">+ Add Bill</button>
                </div>
                ${appData.bills.length === 0 ? `
                    <div class="empty-state">
                        <p>No bills added yet</p>
                    </div>
                ` : ''}
                ${appData.bills.map(bill => `
                    <div class="bill-item">
                        <div class="bill-info">
                            <div class="bill-name">${bill.name}</div>
                            <div class="bill-details">
                                <span class="bill-amount">${formatCurrency(bill.amount)}</span>
                                <span class="bill-frequency">${bill.frequency}</span>
                            </div>
                        </div>
                        <div class="bill-actions">
                            <button class="btn-icon delete-bill" data-bill-id="${bill.id}" title="Delete">✕</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ========================================
// RULES VIEW
// ========================================

function renderRules() {
    return `
        <div class="rules-view">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Categorization Rules</h2>
                </div>
                <p>No rules configured yet. Rules help automatically categorize transactions.</p>
            </div>
        </div>
    `;
}

// ========================================
// SETTINGS VIEW
// ========================================

function renderSettings() {
    return `
        <div class="settings-view">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Account Balances</h3>
                </div>
                <p class="card-subtitle">Last updated: ${appData.settings.lastBalanceUpdate ? formatDate(appData.settings.lastBalanceUpdate, 'MMM DD, YYYY HH:mm') : 'Never'}</p>
                ${appData.accounts.map(account => `
                    <div class="settings-group">
                        <label class="setting-label">${account.name}</label>
                        <input
                            type="number"
                            class="input-field balance-input"
                            data-account-id="${account.id}"
                            value="${account.balance}"
                            step="0.01"
                            placeholder="0.00"
                        />
                    </div>
                `).join('')}
                <button class="btn btn-primary" id="saveBalancesBtn" style="width: 100%; margin-top: 16px;">
                    Save Balances
                </button>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Import/Export</h3>
                </div>
                <button class="btn btn-secondary" id="exportBtn" style="width: 100%; margin-bottom: 8px;">
                    Export Data (JSON)
                </button>
                <button class="btn btn-secondary" id="importBtn" style="width: 100%; margin-bottom: 8px;">
                    Import Transactions (CSV)
                </button>
                <input type="file" id="csvImportFile" accept=".csv" style="display: none;" />
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Categories</h3>
                </div>
                <div id="categoriesList"></div>
                <div class="settings-group" style="margin-top: 16px;">
                    <input
                        type="text"
                        id="newCategoryInput"
                        class="input-field"
                        placeholder="New category name"
                    />
                </div>
                <button class="btn btn-secondary" id="addCategoryBtn" style="width: 100%; margin-top: 8px;">
                    Add Category
                </button>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Alerts</h3>
                </div>
                <div id="alertsList"></div>
                <button class="btn btn-secondary" id="clearAlertsBtn" style="width: 100%; margin-top: 16px;">
                    Clear All Alerts
                </button>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Session</h3>
                </div>
                <button class="btn btn-danger" id="lockAppBtn" style="width: 100%;">
                    Lock App (Reset PIN)
                </button>
            </div>
        </div>
    `;
}

function attachSettingsListeners() {
    // Balance updates
    document.getElementById('saveBalancesBtn')?.addEventListener('click', saveBalances);

    // Export/Import
    document.getElementById('exportBtn')?.addEventListener('click', exportData);
    document.getElementById('importBtn')?.addEventListener('click', () => {
        document.getElementById('csvImportFile').click();
    });
    document.getElementById('csvImportFile')?.addEventListener('change', handleCsvImport);

    // Categories
    document.getElementById('addCategoryBtn')?.addEventListener('click', addCategory);
    document.getElementById('newCategoryInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addCategory();
        }
    });

    // Delete bill buttons
    document.querySelectorAll('.delete-bill').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const billId = e.target.dataset.billId;
            if (confirm('Delete this bill?')) {
                deleteBill(billId);
            }
        });
    });

    // Clear alerts
    document.getElementById('clearAlertsBtn')?.addEventListener('click', clearAllAlerts);

    // Lock app
    document.getElementById('lockAppBtn')?.addEventListener('click', lockApp);

    // Render categories and alerts lists
    renderCategoriesList();
    renderAlertsList();
}

function renderCategoriesList() {
    const list = document.getElementById('categoriesList');
    if (!list) return;

    list.innerHTML = appData.categories.map(cat => `
        <div class="category-list-item">
            <span>${cat}</span>
            <button class="btn-icon" onclick="removeCategory('${cat}')" title="Remove">✕</button>
        </div>
    `).join('');
}

function renderAlertsList() {
    const list = document.getElementById('alertsList');
    if (!list) return;

    if (appData.alerts.length === 0) {
        list.innerHTML = '<p>No alerts</p>';
        return;
    }

    list.innerHTML = appData.alerts.map(alert => `
        <div class="alert-item" style="background: ${alert.type === 'warning' ? 'var(--accent-warning)' : 'var(--accent-error)'}; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
            <strong>${alert.title}</strong>
            <p style="margin: 4px 0 0 0; font-size: 12px;">${alert.message}</p>
        </div>
    `).join('');
}

// ========================================
// NUMERIC KEYPAD
// ========================================

function handleKeypadPress(key) {
    if (key === 'clear') {
        keypadValue = '0';
    } else if (key === '.') {
        if (!keypadValue.includes('.')) {
            if (keypadValue === '0') {
                keypadValue = '0.';
            } else {
                keypadValue += '.';
            }
        }
    } else {
        if (keypadValue === '0') {
            keypadValue = key;
        } else {
            keypadValue += key;
        }
    }
    updateKeypadDisplay();
}

function updateKeypadDisplay() {
    const display = document.getElementById('amountDisplay');
    if (display) {
        const num = parseFloat(keypadValue) || 0;
        display.textContent = formatCurrency(num);
        document.getElementById('txnAmount').value = num > 0 ? num.toFixed(2) : '';
    }
}

// ========================================
// RECEIPT PHOTO CAPTURE
// ========================================

function handleReceiptCapture(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        receiptData = event.target.result;
        const thumbnail = document.getElementById('receiptThumbnail');
        const thumb = document.getElementById('receiptThumb');
        if (thumbnail && thumb) {
            thumb.src = receiptData;
            thumbnail.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
}

function handleEditReceiptCapture(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        if (currentTransaction) {
            currentTransaction.receipt = event.target.result;
        }
        const thumbnail = document.getElementById('editReceiptThumbnail');
        const thumb = document.getElementById('editReceiptThumb');
        if (thumbnail && thumb) {
            thumb.src = event.target.result;
            thumbnail.style.display = 'block';
            thumb.addEventListener('click', () => openReceiptViewer(event.target.result));
        }
    };
    reader.readAsDataURL(file);
}

function openReceiptViewer(imageData) {
    const modal = document.getElementById('receiptViewerModal');
    const img = document.getElementById('receiptViewerImage');
    if (modal && img) {
        img.src = imageData;
        modal.classList.add('active');
    }
}

function closeReceiptViewer() {
    const modal = document.getElementById('receiptViewerModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// ========================================
// QUICK ADD MODAL
// ========================================

function openQuickAdd() {
    const modal = document.getElementById('quickAddModal');
    if (modal) {
        modal.classList.add('active');
        // Reset keypad
        keypadValue = '0';
        updateKeypadDisplay();
        receiptData = null;
        document.getElementById('receiptThumbnail').style.display = 'none';
    }
}

function closeQuickAdd() {
    const modal = document.getElementById('quickAddModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function handleQuickAdd(e) {
    e.preventDefault();

    const amount = parseFloat(document.getElementById('quickAddAmount').value);
    const merchant = document.getElementById('quickAddMerchant').value;
    const type = document.querySelector('#quickAddModal .toggle-btn[data-type].active')?.dataset.type || 'expense';
    const account = document.querySelector('#quickAddModal .toggle-btn[data-account].active')?.dataset.account || 'td';
    const category = document.getElementById('quickAddCategory').value || 'Other';

    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    if (!merchant) {
        alert('Please enter a merchant name');
        return;
    }

    const transaction = {
        id: generateId(),
        date: new Date().toISOString(),
        merchant,
        amount,
        type,
        account,
        category,
        notes: '',
        receipt: receiptData || null
    };

    // Check for duplicates
    if (!checkDuplicate(transaction)) {
        appData.transactions.push(transaction);
        updateAccountBalance(account, amount, type);
        saveData();

        // Reset form and state
        document.getElementById('quickAddForm').reset();
        keypadValue = '0';
        receiptData = null;
        closeQuickAdd();
        renderView();
        updateAlertBanner();
    }
}

// ========================================
// EDIT TRANSACTION MODAL
// ========================================

function openEditModal(txnId) {
    currentTransaction = appData.transactions.find(t => t.id === txnId);
    if (!currentTransaction) return;

    document.getElementById('editTxnId').value = currentTransaction.id;
    document.getElementById('editTxnDate').value = formatDate(currentTransaction.date, 'YYYY-MM-DD');
    document.getElementById('editTxnMerchant').value = currentTransaction.merchant;
    document.getElementById('editTxnAmount').value = currentTransaction.amount;
    document.getElementById('editTxnCategory').value = currentTransaction.category;
    document.getElementById('editTxnNotes').value = currentTransaction.notes || '';

    const typeButtons = document.querySelectorAll('#editTransactionModal .toggle-btn[data-type]');
    typeButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === currentTransaction.type) {
            btn.classList.add('active');
        }
    });

    // Show receipt if it exists
    const receiptThumb = document.getElementById('editReceiptThumb');
    const receiptThumbnail = document.getElementById('editReceiptThumbnail');
    if (currentTransaction.receipt && receiptThumb && receiptThumbnail) {
        receiptThumb.src = currentTransaction.receipt;
        receiptThumbnail.style.display = 'block';
        receiptThumb.onclick = () => openReceiptViewer(currentTransaction.receipt);
    } else if (receiptThumbnail) {
        receiptThumbnail.style.display = 'none';
    }

    const modal = document.getElementById('editTransactionModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeEditModal() {
    const modal = document.getElementById('editTransactionModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function handleEditTransaction(e) {
    e.preventDefault();

    const txnId = document.getElementById('editTxnId').value;
    const amount = parseFloat(document.getElementById('editTxnAmount').value);
    const merchant = document.getElementById('editTxnMerchant').value;
    const category = document.getElementById('editTxnCategory').value;
    const notes = document.getElementById('editTxnNotes').value;
    const type = document.querySelector('#editTransactionModal .toggle-btn[data-type].active')?.dataset.type || 'expense';
    const date = document.getElementById('editTxnDate').value;

    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    if (!merchant) {
        alert('Please enter a merchant name');
        return;
    }

    const txnIndex = appData.transactions.findIndex(t => t.id === txnId);
    if (txnIndex === -1) return;

    const oldTxn = appData.transactions[txnIndex];

    // Reverse old balance change
    updateAccountBalance(oldTxn.account, oldTxn.amount, oldTxn.type, true);

    // Update transaction
    appData.transactions[txnIndex] = {
        ...oldTxn,
        date: new Date(date).toISOString(),
        merchant,
        amount,
        type,
        category,
        notes,
        receipt: currentTransaction.receipt || oldTxn.receipt || null
    };

    // Apply new balance change
    updateAccountBalance(oldTxn.account, amount, type);

    saveData();
    closeEditModal();
    renderView();
    updateAlertBanner();
}

function deleteTransaction(txnId) {
    const txnIndex = appData.transactions.findIndex(t => t.id === txnId);
    if (txnIndex === -1) return;

    const txn = appData.transactions[txnIndex];

    // Reverse balance change
    updateAccountBalance(txn.account, txn.amount, txn.type, true);

    appData.transactions.splice(txnIndex, 1);
    saveData();
    renderView();
    updateAlertBanner();
}

// ========================================
// BILLS MANAGEMENT
// ========================================

function openAddBillModal() {
    const modal = document.getElementById('addBillModal');
    if (modal) {
        modal.classList.add('active');
        document.getElementById('billName').focus();
    }
}

function closeAddBillModal() {
    const modal = document.getElementById('addBillModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function handleAddBill(e) {
    e.preventDefault();

    const name = document.getElementById('billName').value;
    const amount = parseFloat(document.getElementById('billAmount').value);
    const frequency = document.getElementById('billFrequency').value || 'monthly';

    if (!name) {
        alert('Please enter a bill name');
        return;
    }

    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    const bill = {
        id: generateId(),
        name,
        amount,
        frequency
    };

    appData.bills.push(bill);
    saveData();

    document.getElementById('addBillForm').reset();
    closeAddBillModal();
    navigateTo('bills');
}

function deleteBill(billId) {
    const billIndex = appData.bills.findIndex(b => b.id === billId);
    if (billIndex === -1) return;

    appData.bills.splice(billIndex, 1);
    saveData();
    renderView();
}

// ========================================
// SETTINGS ACTIONS
// ========================================

function saveBalances() {
    document.querySelectorAll('.balance-input').forEach(input => {
        const accountId = input.dataset.accountId;
        const newBalance = parseFloat(input.value) || 0;

        const account = appData.accounts.find(a => a.id === accountId);
        if (account) {
            account.balance = newBalance;
        }
    });

    appData.settings.lastBalanceUpdate = new Date().toISOString();
    saveData();
    alert('Balances updated!');
    renderView();
}

function exportData() {
    const dataStr = JSON.stringify(appData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function handleCsvImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const csv = event.target.result;
        const lines = csv.trim().split('\n');

        if (lines.length < 2) {
            alert('Invalid CSV format');
            return;
        }

        const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
        const requiredFields = ['date', 'merchant', 'amount', 'type', 'category'];

        if (!requiredFields.every(field => headers.includes(field))) {
            alert('CSV must contain: date, merchant, amount, type, category');
            return;
        }

        let imported = 0;
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const row = {};

            headers.forEach((header, index) => {
                row[header] = values[index];
            });

            const date = parseDate(row.date);
            if (!date) continue;

            const transaction = {
                id: generateId(),
                date: date.toISOString(),
                merchant: row.merchant,
                amount: parseFloat(row.amount) || 0,
                type: row.type || 'expense',
                account: row.account || 'td',
                category: row.category || 'Other',
                notes: row.notes || ''
            };

            if (transaction.amount > 0 && transaction.merchant && !checkDuplicate(transaction)) {
                appData.transactions.push(transaction);
                imported++;
            }
        }

        appData.settings.lastImportDate = new Date().toISOString();
        saveData();
        alert(`Imported ${imported} transactions!`);

        // Reset file input
        e.target.value = '';
        renderView();
    };

    reader.readAsText(file);
}

function addCategory() {
    const input = document.getElementById('newCategoryInput');
    const categoryName = input.value.trim();

    if (!categoryName) {
        alert('Please enter a category name');
        return;
    }

    if (appData.categories.includes(categoryName)) {
        alert('Category already exists');
        return;
    }

    appData.categories.push(categoryName);
    appData.categories.sort();

    input.value = '';
    saveData();
    populateCategoryDropdowns();
    renderCategoriesList();
}

function removeCategory(category) {
    if (confirm(`Remove "${category}" category? Existing transactions won't be affected.`)) {
        const index = appData.categories.indexOf(category);
        if (index > -1) {
            appData.categories.splice(index, 1);
            saveData();
            populateCategoryDropdowns();
            renderCategoriesList();
        }
    }
}

// ========================================
// ALERTS SYSTEM
// ========================================

function updateAlertBanner() {
    const alertBanner = document.getElementById('alertBanner');
    if (!alertBanner) return;

    if (appData.alerts.length === 0) {
        alertBanner.classList.add('hidden');
        return;
    }

    const alert = appData.alerts[0];
    alertBanner.textContent = `⚠ ${alert.title}`;
    alertBanner.classList.remove('hidden');
}

function addAlert(title, message, type = 'warning') {
    const alert = {
        id: generateId(),
        title,
        message,
        type,
        timestamp: new Date().toISOString()
    };

    appData.alerts.push(alert);

    // Keep only last 10 alerts
    if (appData.alerts.length > 10) {
        appData.alerts.shift();
    }

    saveData();
    updateAlertBanner();
}

function clearAllAlerts() {
    if (confirm('Clear all alerts?')) {
        appData.alerts = [];
        saveData();
        renderView();
        updateAlertBanner();
    }
}

// ========================================
// CALCULATION FUNCTIONS
// ========================================

function calculateMonthlySpend(month, year) {
    return appData.transactions
        .filter(txn => {
            const txnDate = new Date(txn.date);
            return txnDate.getMonth() === month &&
                   txnDate.getFullYear() === year &&
                   txn.type === 'expense';
        })
        .reduce((sum, txn) => sum + txn.amount, 0);
}

function getTopCategory(month, year) {
    const categories = {};

    appData.transactions
        .filter(txn => {
            const txnDate = new Date(txn.date);
            return txnDate.getMonth() === month &&
                   txnDate.getFullYear() === year &&
                   txn.type === 'expense';
        })
        .forEach(txn => {
            categories[txn.category] = (categories[txn.category] || 0) + txn.amount;
        });

    const sorted = Object.entries(categories).sort(([, a], [, b]) => b - a);
    return sorted.length > 0 ? { category: sorted[0][0], amount: sorted[0][1] } : { category: 'None', amount: 0 };
}

function getLargestTransactionThisWeek() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weekTransactions = appData.transactions
        .filter(txn => {
            const txnDate = new Date(txn.date);
            return txnDate >= weekAgo && txn.type === 'expense';
        })
        .sort((a, b) => b.amount - a.amount);

    return weekTransactions.length > 0
        ? weekTransactions[0]
        : { merchant: 'None', amount: 0 };
}

function calculateSubscriptionBurn() {
    return appData.bills
        .filter(bill => bill.frequency === 'monthly')
        .reduce((sum, bill) => sum + bill.amount, 0);
}

function renderRecentTransactions(limit) {
    const recent = appData.transactions
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);

    if (recent.length === 0) {
        return '<div class="empty-state"><p>No transactions yet</p></div>';
    }

    return `
        <div class="transaction-list">
            ${recent.map(txn => `
                <div class="transaction-list-item">
                    <div class="txn-merchant-icon">${getMerchantIcon(txn.merchant)}</div>
                    <div class="txn-info">
                        <div class="txn-merchant">${txn.merchant}</div>
                        <div class="txn-category">${txn.category}</div>
                    </div>
                    <div class="txn-amount ${txn.type === 'expense' ? 'negative' : 'positive'}">
                        ${txn.type === 'expense' ? '-' : '+'}${formatCurrency(Math.abs(txn.amount))}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ========================================
// ANALYTICS & CHARTS
// ========================================

let currentPeriod = '1M'; // Default time period

function calculateBalanceTrend() {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const currentBalance = appData.accounts.find(a => a.id === 'td').balance -
                          appData.accounts.find(a => a.id === 'discover').balance;

    // Calculate balance at end of last month
    const transactionsThisMonth = appData.transactions.filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate.getMonth() === thisMonth && txnDate.getFullYear() === thisYear;
    });

    let lastMonthBalance = currentBalance;
    transactionsThisMonth.forEach(txn => {
        if (txn.type === 'expense') {
            lastMonthBalance += txn.amount;
        } else {
            lastMonthBalance -= txn.amount;
        }
    });

    const change = currentBalance - lastMonthBalance;
    const percentChange = lastMonthBalance !== 0 ? (change / Math.abs(lastMonthBalance)) * 100 : 0;

    return {
        current: currentBalance,
        previous: lastMonthBalance,
        change: change,
        percentChange: percentChange,
        direction: change >= 0 ? 'up' : 'down'
    };
}

function calculateCashFlow(period = '1M') {
    const { startDate, endDate } = getPeriodDates(period);

    const filtered = appData.transactions.filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate >= startDate && txnDate <= endDate;
    });

    const income = filtered
        .filter(txn => txn.type === 'income')
        .reduce((sum, txn) => sum + txn.amount, 0);

    const expenses = filtered
        .filter(txn => txn.type === 'expense')
        .reduce((sum, txn) => sum + txn.amount, 0);

    const netCashFlow = income - expenses;
    const savingsRate = income > 0 ? ((income - expenses) / income * 100) : 0;

    return { income, expenses, netCashFlow, savingsRate };
}

function getPeriodDates(period) {
    const now = new Date();
    const endDate = now;
    let startDate;

    switch (period) {
        case '1M':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case '3M':
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            break;
        case '1Y':
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            break;
        case 'YTD':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        case 'MAX':
            startDate = appData.transactions.length > 0
                ? new Date(Math.min(...appData.transactions.map(t => new Date(t.date))))
                : new Date(now.getFullYear(), 0, 1);
            break;
        default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { startDate, endDate };
}

function renderBalanceLineChart(canvasId, period = '1M') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { startDate, endDate } = getPeriodDates(period);

    // Generate balance history points
    const dataPoints = [];
    const sortedTransactions = appData.transactions
        .filter(txn => {
            const txnDate = new Date(txn.date);
            return txnDate >= startDate && txnDate <= endDate;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Start with current balance and work backwards
    let runningBalance = appData.accounts.find(a => a.id === 'td').balance -
                        appData.accounts.find(a => a.id === 'discover').balance;

    // Calculate balance at start of period
    let startBalance = runningBalance;
    [...sortedTransactions].reverse().forEach(txn => {
        if (txn.type === 'expense') {
            startBalance += txn.amount;
        } else {
            startBalance -= txn.amount;
        }
    });

    // Build data points
    dataPoints.push({ date: new Date(startDate), balance: startBalance });

    let balance = startBalance;
    sortedTransactions.forEach(txn => {
        if (txn.type === 'expense') {
            balance -= txn.amount;
        } else {
            balance += txn.amount;
        }
        dataPoints.push({ date: new Date(txn.date), balance });
    });

    // Add current point
    dataPoints.push({ date: new Date(), balance: runningBalance });

    if (dataPoints.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#636366';
        ctx.font = '14px -apple-system';
        ctx.textAlign = 'center';
        ctx.fillText('No data for this period', canvas.width / 2, canvas.height / 2);
        return;
    }

    // Canvas dimensions
    const width = canvas.width = canvas.offsetWidth * 2;
    const height = canvas.height = canvas.offsetHeight * 2;
    const padding = { top: 40, right: 40, bottom: 50, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find min/max for scaling
    const balances = dataPoints.map(p => p.balance);
    const minBalance = Math.min(...balances);
    const maxBalance = Math.max(...balances);
    const balanceRange = maxBalance - minBalance;
    const yPadding = balanceRange * 0.1;

    // Scale functions
    const xScale = (date) => {
        const timeDiff = endDate - startDate;
        const pointDiff = date - startDate;
        return padding.left + (pointDiff / timeDiff) * chartWidth;
    };

    const yScale = (balance) => {
        return height - padding.bottom -
               ((balance - minBalance + yPadding) / (balanceRange + yPadding * 2)) * chartHeight;
    };

    // Draw grid lines
    ctx.strokeStyle = '#38383a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        // Y-axis labels
        const value = maxBalance + yPadding - (balanceRange + yPadding * 2) * (i / 4);
        ctx.fillStyle = '#8e8e93';
        ctx.font = '24px -apple-system';
        ctx.textAlign = 'right';
        ctx.fillText(formatCurrency(value), padding.left - 10, y + 8);
    }

    // Draw line
    ctx.strokeStyle = '#0a84ff';
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();
    dataPoints.forEach((point, i) => {
        const x = xScale(point.date);
        const y = yScale(point.balance);

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(10, 132, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(10, 132, 255, 0)');
    ctx.fillStyle = gradient;

    ctx.beginPath();
    dataPoints.forEach((point, i) => {
        const x = xScale(point.date);
        const y = yScale(point.balance);
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.lineTo(xScale(dataPoints[dataPoints.length - 1].date), height - padding.bottom);
    ctx.lineTo(xScale(dataPoints[0].date), height - padding.bottom);
    ctx.closePath();
    ctx.fill();

    // Draw dots
    ctx.fillStyle = '#0a84ff';
    dataPoints.forEach((point) => {
        const x = xScale(point.date);
        const y = yScale(point.balance);
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
    });

    // X-axis labels
    ctx.fillStyle = '#8e8e93';
    ctx.font = '24px -apple-system';
    ctx.textAlign = 'center';

    const numLabels = Math.min(5, dataPoints.length);
    for (let i = 0; i < numLabels; i++) {
        const index = Math.floor((dataPoints.length - 1) * i / (numLabels - 1));
        const point = dataPoints[index];
        const x = xScale(point.date);
        const label = formatDate(point.date, 'MMM DD');
        ctx.fillText(label, x, height - 20);
    }
}

function renderCategoryPieChart(canvasId, period = '1M') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { startDate, endDate } = getPeriodDates(period);

    // Calculate category totals
    const categoryTotals = {};
    appData.transactions
        .filter(txn => {
            const txnDate = new Date(txn.date);
            return txnDate >= startDate && txnDate <= endDate && txn.type === 'expense';
        })
        .forEach(txn => {
            categoryTotals[txn.category] = (categoryTotals[txn.category] || 0) + txn.amount;
        });

    const sortedCategories = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8); // Top 8 categories

    if (sortedCategories.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#636366';
        ctx.font = '14px -apple-system';
        ctx.textAlign = 'center';
        ctx.fillText('No spending data', canvas.width / 2, canvas.height / 2);
        return;
    }

    const width = canvas.width = canvas.offsetWidth * 2;
    const height = canvas.height = canvas.offsetHeight * 2;

    ctx.clearRect(0, 0, width, height);

    const centerX = width * 0.35;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;
    const innerRadius = radius * 0.5;

    // Color palette
    const colors = [
        '#0a84ff', '#30d158', '#ff453a', '#ff9f0a',
        '#bf5af0', '#ff2d55', '#ffd60a', '#64d2ff'
    ];

    const total = sortedCategories.reduce((sum, [, amount]) => sum + amount, 0);

    // Draw donut segments
    let startAngle = -Math.PI / 2;
    sortedCategories.forEach(([category, amount], i) => {
        const sliceAngle = (amount / total) * Math.PI * 2;
        const endAngle = startAngle + sliceAngle;

        // Draw outer arc
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
        ctx.closePath();
        ctx.fill();

        startAngle = endAngle;
    });

    // Draw legend
    const legendX = width * 0.6;
    const legendY = height * 0.15;
    const legendSpacing = 50;

    ctx.font = '28px -apple-system';
    ctx.textAlign = 'left';

    sortedCategories.forEach(([category, amount], i) => {
        const y = legendY + i * legendSpacing;
        const percentage = (amount / total * 100).toFixed(1);

        // Color box
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(legendX, y - 20, 30, 30);

        // Category name
        ctx.fillStyle = '#ffffff';
        ctx.fillText(category, legendX + 45, y);

        // Percentage
        ctx.fillStyle = '#8e8e93';
        ctx.fillText(`${percentage}%`, legendX + 45, y + 28);
    });
}

function setPeriod(period) {
    currentPeriod = period;

    // Update active button state
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.period === period) {
            btn.classList.add('active');
        }
    });

    // Re-render charts
    renderBalanceLineChart('balanceTrendChart', period);
    renderCategoryPieChart('categoryPieChart', period);

    // Update cash flow display
    updateCashFlowDisplay(period);
}

function updateCashFlowDisplay(period) {
    const { income, expenses, netCashFlow, savingsRate } = calculateCashFlow(period);

    const cashFlowEl = document.getElementById('cashFlowValue');
    const savingsRateEl = document.getElementById('savingsRateValue');
    const incomeEl = document.getElementById('incomeValue');
    const expensesEl = document.getElementById('expensesValue');

    if (cashFlowEl) cashFlowEl.textContent = formatCurrency(netCashFlow);
    if (savingsRateEl) savingsRateEl.textContent = `${savingsRate.toFixed(1)}%`;
    if (incomeEl) incomeEl.textContent = formatCurrency(income);
    if (expensesEl) expensesEl.textContent = formatCurrency(expenses);

    // Update color
    if (cashFlowEl) {
        cashFlowEl.className = 'stat-value ' + (netCashFlow >= 0 ? 'positive' : 'negative');
    }
    if (savingsRateEl) {
        savingsRateEl.className = 'stat-value ' + (savingsRate >= 0 ? 'positive' : 'negative');
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function checkDuplicate(transaction) {
    const threshold = 60; // 60 second window
    const now = new Date(transaction.date).getTime();

    const isDuplicate = appData.transactions.some(txn => {
        const txnTime = new Date(txn.date).getTime();
        return Math.abs(now - txnTime) < threshold * 1000 &&
               txn.merchant === transaction.merchant &&
               txn.amount === transaction.amount;
    });

    if (isDuplicate) {
        addAlert('Duplicate Transaction', 'This transaction looks like a duplicate and was not added.', 'warning');
        return true;
    }

    return false;
}

function parseDate(dateStr) {
    // Try multiple formats
    const formats = [
        /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
        /(\d{1,2})-(\d{1,2})-(\d{4})/ // MM-DD-YYYY
    ];

    for (const format of formats) {
        const match = dateStr.match(format);
        if (match) {
            if (format === formats[0]) {
                return new Date(`${match[1]}-${match[2]}-${match[3]}`);
            } else if (format === formats[1]) {
                return new Date(`${match[3]}-${match[1]}-${match[2]}`);
            } else {
                return new Date(`${match[3]}-${match[1]}-${match[2]}`);
            }
        }
    }

    return null;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(date, format = 'MMM DD, YYYY') {
    const d = new Date(date);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const replacements = {
        'YYYY': d.getFullYear(),
        'YY': String(d.getFullYear()).slice(-2),
        'MMMM': months[d.getMonth()],
        'MMM': months[d.getMonth()],
        'MM': String(d.getMonth() + 1).padStart(2, '0'),
        'M': d.getMonth() + 1,
        'DD': String(d.getDate()).padStart(2, '0'),
        'D': d.getDate(),
        'dddd': days[d.getDay()],
        'ddd': days[d.getDay()],
        'HH': String(d.getHours()).padStart(2, '0'),
        'H': d.getHours(),
        'mm': String(d.getMinutes()).padStart(2, '0'),
        'm': d.getMinutes(),
        'ss': String(d.getSeconds()).padStart(2, '0'),
        's': d.getSeconds()
    };

    let result = format;
    // Replace longer formats first to avoid partial replacements
    const sortedKeys = Object.keys(replacements).sort((a, b) => b.length - a.length);
    sortedKeys.forEach(key => {
        result = result.replace(new RegExp(key, 'g'), replacements[key]);
    });

    return result;
}

function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getMerchantIcon(merchant) {
    if (!merchant) return appData.merchantIcons['default'];

    const lowerMerchant = merchant.toLowerCase();

    // Check for exact or partial matches
    for (const [key, icon] of Object.entries(appData.merchantIcons)) {
        if (lowerMerchant.includes(key)) {
            return icon;
        }
    }

    return appData.merchantIcons['default'];
}

function calculateFinancialHealth() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Factor 1: Savings rate (40% weight)
    const cashFlow = calculateCashFlow('1M');
    const savingsRateScore = Math.min(100, Math.max(0, cashFlow.savingsRate * 2)); // 50% = 100 points

    // Factor 2: Spending consistency (30% weight)
    const last3MonthsSpend = [];
    for (let i = 0; i < 3; i++) {
        const month = currentMonth - i;
        const year = month < 0 ? currentYear - 1 : currentYear;
        const adjustedMonth = month < 0 ? 12 + month : month;
        last3MonthsSpend.push(calculateMonthlySpend(adjustedMonth, year));
    }
    const avgSpend = last3MonthsSpend.reduce((a, b) => a + b, 0) / last3MonthsSpend.length;
    const variance = last3MonthsSpend.reduce((sum, spend) => sum + Math.abs(spend - avgSpend), 0) / last3MonthsSpend.length;
    const consistencyScore = avgSpend > 0 ? Math.max(0, 100 - (variance / avgSpend * 100)) : 100;

    // Factor 3: Net worth trend (30% weight)
    const netWorth = appData.accounts.find(a => a.id === 'td').balance -
                     appData.accounts.find(a => a.id === 'discover').balance;
    const trend = calculateBalanceTrend();
    const netWorthScore = netWorth > 0 ?
        Math.min(100, 50 + trend.percentChange) :
        Math.max(0, 50 + trend.percentChange);

    // Calculate weighted score
    const totalScore = (savingsRateScore * 0.4) + (consistencyScore * 0.3) + (netWorthScore * 0.3);

    let rating, color, message;
    if (totalScore >= 80) {
        rating = 'Excellent';
        color = 'var(--accent-positive)';
        message = 'Your finances are in great shape! 🌟';
    } else if (totalScore >= 60) {
        rating = 'Good';
        color = 'var(--accent-blue)';
        message = 'You\'re doing well. Keep it up! 👍';
    } else if (totalScore >= 40) {
        rating = 'Fair';
        color = 'var(--accent-warning)';
        message = 'Room for improvement. Small changes matter! 💡';
    } else {
        rating = 'Needs Work';
        color = 'var(--accent-negative)';
        message = 'Let\'s build better habits together! 💪';
    }

    return { score: Math.round(totalScore), rating, color, message };
}

function getSpendingInsights() {
    const now = new Date();
    const insights = [];

    // Top merchant this month
    const merchantTotals = {};
    appData.transactions
        .filter(txn => {
            const txnDate = new Date(txn.date);
            return txnDate.getMonth() === now.getMonth() &&
                   txnDate.getFullYear() === now.getFullYear() &&
                   txn.type === 'expense';
        })
        .forEach(txn => {
            merchantTotals[txn.merchant] = (merchantTotals[txn.merchant] || 0) + txn.amount;
        });

    const sortedMerchants = Object.entries(merchantTotals).sort(([, a], [, b]) => b - a);
    if (sortedMerchants.length > 0) {
        const [merchant, amount] = sortedMerchants[0];
        insights.push({
            icon: getMerchantIcon(merchant),
            title: 'Top Merchant',
            description: merchant,
            value: formatCurrency(amount),
            type: 'merchant'
        });
    }

    // Unusual spending detection
    const thisMonthSpend = calculateMonthlySpend(now.getMonth(), now.getFullYear());
    const lastMonthSpend = calculateMonthlySpend(
        now.getMonth() === 0 ? 11 : now.getMonth() - 1,
        now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    );

    if (lastMonthSpend > 0) {
        const percentChange = ((thisMonthSpend - lastMonthSpend) / lastMonthSpend) * 100;
        if (Math.abs(percentChange) > 20) {
            insights.push({
                icon: percentChange > 0 ? '📈' : '📉',
                title: percentChange > 0 ? 'Spending Up' : 'Spending Down',
                description: `${Math.abs(percentChange).toFixed(0)}% vs last month`,
                value: formatCurrency(thisMonthSpend),
                type: percentChange > 0 ? 'warning' : 'positive'
            });
        }
    }

    // Frequent small purchases
    const smallPurchases = appData.transactions.filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate.getMonth() === now.getMonth() &&
               txnDate.getFullYear() === now.getFullYear() &&
               txn.amount < 10 &&
               txn.type === 'expense';
    });

    if (smallPurchases.length >= 10) {
        const total = smallPurchases.reduce((sum, txn) => sum + txn.amount, 0);
        insights.push({
            icon: '☕',
            title: 'Small Purchases',
            description: `${smallPurchases.length} purchases under $10`,
            value: formatCurrency(total),
            type: 'info'
        });
    }

    // Largest transaction this week
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const largestThisWeek = appData.transactions
        .filter(txn => {
            const txnDate = new Date(txn.date);
            return txnDate >= weekAgo && txn.type === 'expense';
        })
        .sort((a, b) => b.amount - a.amount)[0];

    if (largestThisWeek && largestThisWeek.amount > 100) {
        insights.push({
            icon: getMerchantIcon(largestThisWeek.merchant),
            title: 'Largest This Week',
            description: largestThisWeek.merchant,
            value: formatCurrency(largestThisWeek.amount),
            type: 'info'
        });
    }

    return insights.slice(0, 4); // Max 4 insights
}

function updateAccountBalance(accountId, amount, type, reverse = false) {
    const account = appData.accounts.find(a => a.id === accountId);
    if (!account) return;

    const multiplier = reverse ? -1 : 1;

    if (type === 'expense') {
        account.balance -= amount * multiplier;
    } else {
        account.balance += amount * multiplier;
    }
}

// ========================================
// DATA PERSISTENCE
// ========================================

function saveData() {
    try {
        localStorage.setItem('appData', JSON.stringify(appData));
    } catch (e) {
        console.error('Error saving data:', e);
        addAlert('Save Error', 'Could not save data to local storage.', 'error');
    }
}

function loadData() {
    try {
        const savedData = localStorage.getItem('appData');
        if (savedData) {
            appData = JSON.parse(savedData);
        }
    } catch (e) {
        console.error('Error loading data:', e);
        addAlert('Load Error', 'Could not load saved data.', 'error');
    }
}
