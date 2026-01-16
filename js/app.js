/**
 * Main App Module - SPA Navigation, State Management & Event Handling
 * Orchestrates all features: calculator, dashboard, comparison, history, settings
 */

const App = (() => {
    // Application state
    let state = {
        currentView: 'dashboard',
        currentCalculation: null,
        scenarios: [],
        settings: StorageManager.getSettings()
    };

    // DOM elements cache
    const DOM = {
        nav: null,
        views: {},
        forms: {},
        buttons: {}
    };

    /**
     * Initialize the application
     */
    const init = () => {
        console.log('Initializing AgriProfit Calculator...');

        cacheDOM();
        setupEventListeners();
        applyTheme();
        loadInitialData();
        switchView('login'); // Start with login view

        console.log('AgriProfit Calculator initialized');
    };

    /**
     * Cache frequently used DOM elements
     */
    const cacheDOM = () => {
        // Cache views
        DOM.views = {
            login: document.getElementById('login'),
            dashboard: document.getElementById('dashboard'),
            calculator: document.getElementById('calculator'),
            comparison: document.getElementById('comparison'),
            history: document.getElementById('history'),
            settings: document.getElementById('settings')
        };

        // Cache forms
        DOM.forms = {
            calculator: document.getElementById('calculatorForm'),
            saveScenario: {
                modal: document.getElementById('saveScenarioModal'),
                name: document.getElementById('scenarioName'),
                description: document.getElementById('scenarioDescription')
            }
        };

        // Cache buttons
        DOM.buttons = {
            refreshPrice: document.getElementById('refreshPriceBtn'),
            saveScenario: document.getElementById('saveScenarioBtn'),
            resetForm: document.getElementById('resetFormBtn'),
            themeToggle: document.getElementById('themeToggle')
        };
    };

    /**
     * Setup all event listeners
     */
    const setupEventListeners = () => {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const viewName = link.dataset.view;
                switchView(viewName);
            });
        });

        // Theme toggle
        DOM.buttons.themeToggle.addEventListener('click', toggleTheme);

        // Login/Register events
        setupAuthEvents();

        // Calculator events
        setupCalculatorEvents();

        // Settings events
        setupSettingsEvents();

        // History events
        setupHistoryEvents();

        // Modal events
        setupModalEvents();

        // Prevent form submission
        DOM.forms.calculator.addEventListener('submit', (e) => {
            e.preventDefault();
            performCalculation();
        });
    };

    /**
     * Setup authentication events (Login/Register)
     */
    const setupAuthEvents = () => {
        // Auth tab switching
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = tab.dataset.tab;
                switchAuthTab(tabName);
            });
        });

        // Login form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                handleLogin();
            });
        }

        // Register form submission
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                handleRegister();
            });
        }
    };

    /**
     * Switch authentication tabs
     */
    const switchAuthTab = (tabName) => {
        // Update tab buttons
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            }
        });

        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });

        const selectedForm = tabName === 'login' ? 
            document.getElementById('loginForm') : 
            document.getElementById('registerForm');
        
        if (selectedForm) {
            selectedForm.classList.add('active');
        }
    };

    /**
     * Handle login form submission (demo)
     */
    const handleLogin = () => {
        const email = document.getElementById('loginEmail').value.trim() || 'User';
        const rememberMe = document.getElementById('rememberMe').checked;

        // Store login info if remember me is checked
        if (rememberMe) {
            StorageManager.saveSettings({ 
                lastLoginEmail: email 
            });
        }

        showToast(`Welcome! Signing in...`, 'success');
        
        // Switch to dashboard after 1 second
        setTimeout(() => {
            switchView('dashboard');
        }, 1000);
    };

    /**
     * Handle register form submission (demo)
     */
    const handleRegister = () => {
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirm = document.getElementById('regConfirm').value;
        const terms = document.getElementById('agreeTerms').checked;

        if (!name || !email || !password || !confirm) {
            showToast('Please fill in all fields', 'warning');
            return;
        }

        if (!email.includes('@')) {
            showToast('Please enter a valid email address', 'warning');
            return;
        }

        if (password !== confirm) {
            showToast('Passwords do not match', 'warning');
            return;
        }

        if (!terms) {
            showToast('You must agree to the Terms of Service', 'warning');
            return;
        }

        showToast(`Account created successfully! Welcome, ${name}!`, 'success');
        
        // Clear form and switch to login tab after 1 second
        setTimeout(() => {
            document.getElementById('registerForm').reset();
            switchAuthTab('login');
            showToast('Please log in with your new account', 'info');
        }, 1000);
    };

    /**
     * Setup calculator-specific events
     */
    const setupCalculatorEvents = () => {
        // Auto-calculate on input change
        const calculateFields = [
            'acreage', 'yieldPerAcre', 'marketPrice',
            'seedCost', 'fertilizerCost', 'chemicalCost',
            'laborCost', 'equipmentCost', 'miscCost'
        ];

        calculateFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('change', performCalculation);
                field.addEventListener('input', performCalculation);
            }
        });

        // Crop type change
        document.getElementById('cropType').addEventListener('change', (e) => {
            updateYieldUnit(e.target.value);
            fetchAndDisplayPrice(e.target.value);
        });

        // Refresh price button
        DOM.buttons.refreshPrice.addEventListener('click', () => {
            const cropType = document.getElementById('cropType').value;
            if (cropType) {
                fetchAndDisplayPrice(cropType, true);
            }
        });

        // Save scenario button
        DOM.buttons.saveScenario.addEventListener('click', openSaveScenarioModal);

        // Reset form button
        DOM.buttons.resetForm.addEventListener('click', resetCalculatorForm);
    };

    /**
     * Setup settings-specific events
     */
    const setupSettingsEvents = () => {
        const settingFields = ['unitPreference', 'currency', 'decimalPlaces', 'refreshInterval', 'cacheMode', 'themeMode'];

        settingFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                const currentValue = StorageManager.getSetting(fieldId);
                if (currentValue) {
                    field.value = currentValue;
                }
                field.addEventListener('change', (e) => {
                    updateSetting(fieldId, e.target.value);
                });
            }
        });

        // Auto-save checkbox
        const autoSaveCheckbox = document.getElementById('autoSave');
        if (autoSaveCheckbox) {
            autoSaveCheckbox.checked = StorageManager.getSetting('autoSave');
            autoSaveCheckbox.addEventListener('change', (e) => {
                updateSetting('autoSave', e.target.checked);
            });
        }

        // Save settings button
        document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
            showToast('Settings saved successfully!', 'success');
        });

        // Reset settings button
        document.getElementById('resetSettingsBtn')?.addEventListener('click', () => {
            if (confirm('Reset all settings to defaults?')) {
                StorageManager.resetSettings();
                state.settings = StorageManager.getSettings();
                location.reload();
            }
        });

        // Data export/import buttons
        document.getElementById('exportDataBtn')?.addEventListener('click', exportData);
        document.getElementById('importDataBtn')?.addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        document.getElementById('importFile')?.addEventListener('change', (e) => {
            importData(e.target.files[0]);
        });

        // Delete all data button
        document.getElementById('deleteAllDataBtn')?.addEventListener('click', () => {
            if (confirm('Are you sure? This will delete ALL your data permanently.')) {
                if (confirm('This action cannot be undone. Are you absolutely sure?')) {
                    StorageManager.clearAllData();
                    showToast('All data deleted', 'info');
                    location.reload();
                }
            }
        });

        // Clear history button
        document.getElementById('clearHistoryBtn')?.addEventListener('click', () => {
            if (confirm('Clear all history? This cannot be undone.')) {
                StorageManager.clearHistory();
                showToast('History cleared', 'info');
                loadHistoryView();
            }
        });

        // History search
        document.getElementById('historySearch')?.addEventListener('input', (e) => {
            filterHistoryResults(e.target.value);
        });
    };

    /**
     * Setup history-specific events
     */
    const setupHistoryEvents = () => {
        // Event delegation for history items
        document.addEventListener('click', (e) => {
            if (e.target.closest('.history-rename-btn')) {
                renameHistoryItem(e.target.closest('.history-item').dataset.id);
            }
            if (e.target.closest('.history-delete-btn')) {
                deleteHistoryItem(e.target.closest('.history-item').dataset.id);
            }
            if (e.target.closest('.history-export-btn')) {
                exportScenario(e.target.closest('.history-item').dataset.id);
            }
        });
    };

    /**
     * Setup modal event listeners
     */
    const setupModalEvents = () => {
        // Close modal buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });

        // Cancel buttons
        document.querySelectorAll('[id*="CancelBtn"], [id*="NoBtn"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });

        // Save scenario modal
        const confirmSaveBtn = document.getElementById('confirmSaveBtn');
        if (confirmSaveBtn) {
            confirmSaveBtn.addEventListener('click', confirmSaveScenario);
        }
    };

    /**
     * Switch between views
     */
    const switchView = (viewName) => {
        // Hide all views
        Object.values(DOM.views).forEach(view => {
            if (view) view.classList.remove('active');
        });

        // Show selected view
        if (DOM.views[viewName]) {
            DOM.views[viewName].classList.add('active');
        }

        // Hide navbar on login, show on other views
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (viewName === 'login') {
                navbar.style.display = 'none';
            } else {
                navbar.style.display = '';
            }
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.view === viewName) {
                link.classList.add('active');
            }
        });

        // Load view-specific content
        state.currentView = viewName;

        switch (viewName) {
            case 'dashboard':
                loadDashboardView();
                break;
            case 'comparison':
                loadComparisonView();
                break;
            case 'history':
                loadHistoryView();
                break;
            case 'calculator':
                loadCalculatorView();
                break;
        }
    };

    /**
     * Load and render dashboard
     */
    const loadDashboardView = () => {
        const scenarios = StorageManager.getScenarios();

        if (scenarios.length === 0) {
            document.getElementById('profitChart').innerHTML =
                '<p style="padding: 2rem; text-align: center; color: #999;">No calculations yet. Start in the Calculator!</p>';
            updateDashboardMetrics([]);
            return;
        }

        // Prepare chart data
        const labels = scenarios.map((s, i) => `${s.calculation?.data?.cropType || 'Crop'} ${i + 1}`);
        const values = scenarios.map(s => s.calculation?.data?.netProfit || 0);

        // Draw chart
        Charts.drawBarChart('profitCanvas', {}, {
            title: 'Net Profit by Scenario',
            labels: labels,
            values: values,
            colors: ['#2d5016', '#4a7023', '#8bc34a', '#8b6f47', '#d4c5b9', '#f5f1e8']
        });

        // Update metrics
        updateDashboardMetrics(scenarios);
    };

    /**
     * Update dashboard metrics
     */
    const updateDashboardMetrics = (scenarios) => {
        let totalAcres = 0;
        let totalProfit = 0;
        let topCrop = null;
        let maxProfit = -Infinity;

        scenarios.forEach(scenario => {
            const calc = scenario.calculation?.data;
            if (calc) {
                totalAcres += calc.acres;
                totalProfit += calc.netProfit;

                if (calc.netProfit > maxProfit) {
                    maxProfit = calc.netProfit;
                    topCrop = calc.cropType;
                }
            }
        });

        const avgProfitPerAcre = scenarios.length > 0
            ? totalProfit / scenarios.length
            : 0;

        // Update DOM
        document.getElementById('totalAcres').textContent = totalAcres.toFixed(1);
        document.getElementById('avgProfitAcre').textContent = '$' + avgProfitPerAcre.toFixed(2);
        document.getElementById('totalProfit').textContent = '$' + totalProfit.toFixed(2);
        document.getElementById('topCrop').textContent = topCrop || '—';
    };

    /**
     * Load calculator view
     */
    const loadCalculatorView = () => {
        // Restore last calculation if available
        const lastCalc = StorageManager.getLastCalculation();
        if (lastCalc) {
            restoreCalculation(lastCalc);
        }

        // Fetch price for default crop
        const defaultCrop = document.getElementById('cropType').value;
        if (defaultCrop) {
            fetchAndDisplayPrice(defaultCrop);
        }
    };

    /**
     * Load comparison view
     */
    const loadComparisonView = () => {
        const scenarios = StorageManager.getScenarios();

        if (scenarios.length === 0) {
            document.getElementById('comparisonTable').innerHTML =
                '<p class="placeholder">No scenarios to compare. Create one in the Calculator.</p>';
            return;
        }

        if (scenarios.length === 1) {
            document.getElementById('comparisonTable').innerHTML =
                '<p class="placeholder">Add more scenarios to enable comparison.</p>';
            return;
        }

        // Build comparison table
        let tableHTML = '<table><thead><tr><th>Crop</th><th>Acres</th><th>Revenue</th><th>Cost</th><th>Profit</th><th>Profit/Acre</th></tr></thead><tbody>';

        scenarios.forEach(scenario => {
            const calc = scenario.calculation?.data;
            if (calc) {
                tableHTML += `
                    <tr>
                        <td>${calc.cropType}</td>
                        <td>${calc.acres.toFixed(2)}</td>
                        <td>$${calc.revenue.toFixed(2)}</td>
                        <td>$${calc.totalCost.toFixed(2)}</td>
                        <td class="highlight">$${calc.netProfit.toFixed(2)}</td>
                        <td>$${calc.profitPerAcre.toFixed(2)}</td>
                    </tr>
                `;
            }
        });

        tableHTML += '</tbody></table>';
        document.getElementById('comparisonTable').innerHTML = tableHTML;

        // Draw comparison chart
        const labels = scenarios.map((s, i) => `${s.calculation?.data?.cropType || 'Crop'} ${i + 1}`);
        const values = scenarios.map(s => s.calculation?.data?.netProfit || 0);

        Charts.drawBarChart('comparisonCanvas', {}, {
            title: 'Profit Comparison',
            labels: labels,
            values: values,
            colors: ['#2d5016', '#4a7023', '#8bc34a', '#8b6f47', '#d4c5b9']
        });
    };

    /**
     * Load history view
     */
    const loadHistoryView = () => {
        const history = StorageManager.getHistory();

        if (history.length === 0) {
            document.getElementById('historyList').innerHTML =
                '<p class="placeholder">No calculation history yet.</p>';
            return;
        }

        let historyHTML = '';

        history.forEach(item => {
            const calc = item.calculation?.data;
            const date = new Date(item.addedAt);
            const timeAgo = getTimeAgo(date);

            historyHTML += `
                <div class="history-item" data-id="${item.id}">
                    <div class="history-item-content">
                        <h4>${item.name || `${calc?.cropType || 'Unknown'} Analysis`}</h4>
                        <div class="history-item-meta">
                            <span><strong>${calc?.acres || 0}</strong> acres</span>
                            <span><strong>$${calc?.netProfit?.toFixed(2) || 0}</strong> profit</span>
                            <span><strong>$${calc?.profitPerAcre?.toFixed(2) || 0}</strong> per acre</span>
                        </div>
                        ${item.description ? `<p class="history-item-description">${item.description}</p>` : ''}
                        <small style="color: #999;">${timeAgo}</small>
                    </div>
                    <div class="history-item-actions">
                        <button class="btn-secondary history-rename-btn" style="font-size: 0.875rem;">Rename</button>
                        <button class="btn-secondary history-export-btn" style="font-size: 0.875rem;">Export</button>
                        <button class="btn-danger history-delete-btn" style="font-size: 0.875rem;">Delete</button>
                    </div>
                </div>
            `;
        });

        document.getElementById('historyList').innerHTML = historyHTML;
    };

    /**
     * Perform profit calculation
     */
    const performCalculation = () => {
        const inputs = {
            cropType: document.getElementById('cropType').value,
            acreage: document.getElementById('acreage').value,
            yieldPerAcre: document.getElementById('yieldPerAcre').value,
            marketPrice: document.getElementById('marketPrice').value,
            seedCost: document.getElementById('seedCost').value,
            fertilizerCost: document.getElementById('fertilizerCost').value,
            chemicalCost: document.getElementById('chemicalCost').value,
            laborCost: document.getElementById('laborCost').value,
            equipmentCost: document.getElementById('equipmentCost').value,
            miscCost: document.getElementById('miscCost').value
        };

        // Validate
        const validation = Calculator.validateInputs(inputs);
        if (!validation.isValid) {
            // Show first error
            showToast(validation.errors[0], 'warning');
            clearResults();
            return;
        }

        // Calculate
        const calculation = Calculator.calculateProfitability(inputs);

        if (!calculation.success) {
            showToast(calculation.errors[0], 'error');
            clearResults();
            return;
        }

        // Store and display
        state.currentCalculation = calculation;
        StorageManager.saveLastCalculation(calculation);
        displayResults(calculation);
    };

    /**
     * Display calculation results
     */
    const displayResults = (calculation) => {
        const data = calculation.data;
        const decimals = state.settings.decimalPlaces || 2;

        document.getElementById('resultPrice').textContent = `$${data.marketPrice.toFixed(decimals)}`;
        document.getElementById('resultProduction').textContent = data.production.toFixed(decimals);
        document.getElementById('resultRevenue').textContent = `$${data.revenue.toFixed(decimals)}`;
        document.getElementById('resultCost').textContent = `$${data.totalCost.toFixed(decimals)}`;
        document.getElementById('resultProfit').textContent = `$${data.netProfit.toFixed(decimals)}`;
        document.getElementById('resultProfitAcre').textContent = `$${data.profitPerAcre.toFixed(decimals)}`;

        // Color code profit
        const profitElement = document.getElementById('resultProfit');
        profitElement.closest('.result-card').className = 'result-card ' + (data.netProfit >= 0 ? 'success' : 'danger');
    };

    /**
     * Clear result display
     */
    const clearResults = () => {
        const fields = ['Price', 'Production', 'Revenue', 'Cost', 'Profit', 'ProfitAcre'];
        fields.forEach(field => {
            const element = document.getElementById(`result${field}`);
            if (element) element.textContent = '—';
        });
    };

    /**
     * Reset calculator form
     */
    const resetCalculatorForm = () => {
        if (confirm('Reset the form? Your current values will be lost.')) {
            DOM.forms.calculator.reset();
            clearResults();
            state.currentCalculation = null;
            document.getElementById('cropType').dispatchEvent(new Event('change'));
        }
    };

    /**
     * Fetch and display market price
     */
    const fetchAndDisplayPrice = async (cropType, forceRefresh = false) => {
        const priceInput = document.getElementById('marketPrice');
        const priceLoader = document.getElementById('priceLoader');
        const priceError = document.getElementById('priceError');

        priceError.textContent = '';

        if (!forceRefresh) {
            // Try to use cached price
            const cachedPrice = ApiManager.getCachedPrice(cropType);
            if (cachedPrice) {
                priceInput.value = cachedPrice.toFixed(2);
                updatePriceTimestamp(cropType);
                performCalculation();
                return;
            }
        }

        // Show loader
        priceLoader.style.display = 'flex';

        try {
            const prices = await ApiManager.fetchPrices([cropType]);
            const price = prices[cropType.toLowerCase()];

            if (price) {
                priceInput.value = price.toFixed(2);
                updatePriceTimestamp(cropType);
                performCalculation();
                showToast(`${cropType} price updated: $${price.toFixed(2)}/bu`, 'info');
            }
        } catch (error) {
            console.error('Error fetching price:', error);
            priceError.textContent = 'Could not fetch live price. Using cached or default value.';

            // Use fallback
            const fallbackPrice = ApiManager.getFallbackPrice(cropType);
            if (fallbackPrice) {
                priceInput.value = fallbackPrice.toFixed(2);
                performCalculation();
            }
        } finally {
            priceLoader.style.display = 'none';
        }
    };

    /**
     * Update price timestamp display
     */
    const updatePriceTimestamp = (cropType) => {
        const timestamp = ApiManager.getLastUpdateTime(cropType);
        document.getElementById('priceTimestamp').textContent = `Updated ${timestamp}`;
    };

    /**
     * Update yield unit based on crop
     */
    const updateYieldUnit = (cropType) => {
        const yieldUnit = document.getElementById('yieldUnit');

        // Most crops in bushels, but alfalfa in tons
        if (cropType.toLowerCase() === 'alfalfa') {
            yieldUnit.textContent = 'ton/acre';
        } else {
            yieldUnit.textContent = 'bu/acre';
        }
    };

    /**
     * Open save scenario modal
     */
    const openSaveScenarioModal = () => {
        if (!state.currentCalculation) {
            showToast('Please complete a calculation first', 'warning');
            return;
        }

        const modal = document.getElementById('saveScenarioModal');
        const cropType = state.currentCalculation.data.cropType;

        DOM.forms.saveScenario.name.value = `${cropType} - ${new Date().toLocaleDateString()}`;
        DOM.forms.saveScenario.description.value = '';

        modal.classList.add('active');
    };

    /**
     * Confirm and save scenario
     */
    const confirmSaveScenario = () => {
        const name = DOM.forms.saveScenario.name.value.trim();
        const description = DOM.forms.saveScenario.description.value.trim();

        if (!name) {
            showToast('Please enter a scenario name', 'warning');
            return;
        }

        const scenario = {
            id: null,
            name: name,
            description: description,
            calculation: state.currentCalculation,
            savedAt: new Date().toISOString()
        };

        if (StorageManager.saveScenario(scenario)) {
            showToast('Scenario saved successfully!', 'success');
            document.getElementById('saveScenarioModal').classList.remove('active');
        } else {
            showToast('Error saving scenario', 'error');
        }
    };

    /**
     * Restore calculation to form
     */
    const restoreCalculation = (calculation) => {
        if (!calculation || !calculation.data) return;

        const data = calculation.data;

        document.getElementById('cropType').value = data.cropType;
        document.getElementById('acreage').value = data.acres;
        document.getElementById('yieldPerAcre').value = data.yieldPerAcre;
        document.getElementById('marketPrice').value = data.marketPrice;
        document.getElementById('seedCost').value = data.costBreakdown.seedCost;
        document.getElementById('fertilizerCost').value = data.costBreakdown.fertilizerCost;
        document.getElementById('chemicalCost').value = data.costBreakdown.chemicalCost;
        document.getElementById('laborCost').value = data.costBreakdown.laborCost;
        document.getElementById('equipmentCost').value = data.costBreakdown.equipmentCost;
        document.getElementById('miscCost').value = data.costBreakdown.miscCost;

        displayResults(calculation);
        updateYieldUnit(data.cropType);
    };

    /**
     * Delete history item
     */
    const deleteHistoryItem = (id) => {
        if (confirm('Delete this history item?')) {
            StorageManager.deleteHistoryItem(id);
            loadHistoryView();
            showToast('Item deleted', 'info');
        }
    };

    /**
     * Rename history item
     */
    const renameHistoryItem = (id) => {
        const item = StorageManager.getHistory().find(h => h.id === id);
        if (!item) return;

        const newName = prompt('New scenario name:', item.name || '');
        if (newName && newName.trim()) {
            StorageManager.updateScenario(id, { name: newName.trim() });
            loadHistoryView();
            showToast('Renamed successfully', 'success');
        }
    };

    /**
     * Filter history results
     */
    const filterHistoryResults = (query) => {
        if (!query.trim()) {
            loadHistoryView();
            return;
        }

        const results = StorageManager.searchHistory(query);
        let historyHTML = '';

        if (results.length === 0) {
            historyHTML = '<p class="placeholder">No results found</p>';
        } else {
            results.forEach(item => {
                const calc = item.calculation?.data;
                const date = new Date(item.addedAt);
                const timeAgo = getTimeAgo(date);

                historyHTML += `
                    <div class="history-item" data-id="${item.id}">
                        <div class="history-item-content">
                            <h4>${item.name || `${calc?.cropType || 'Unknown'} Analysis`}</h4>
                            <div class="history-item-meta">
                                <span><strong>${calc?.acres || 0}</strong> acres</span>
                                <span><strong>$${calc?.netProfit?.toFixed(2) || 0}</strong> profit</span>
                                <span><strong>$${calc?.profitPerAcre?.toFixed(2) || 0}</strong> per acre</span>
                            </div>
                            <small style="color: #999;">${timeAgo}</small>
                        </div>
                        <div class="history-item-actions">
                            <button class="btn-secondary history-rename-btn" style="font-size: 0.875rem;">Rename</button>
                            <button class="btn-danger history-delete-btn" style="font-size: 0.875rem;">Delete</button>
                        </div>
                    </div>
                `;
            });
        }

        document.getElementById('historyList').innerHTML = historyHTML;
    };

    /**
     * Export scenario as JSON
     */
    const exportScenario = (id) => {
        const scenario = StorageManager.getScenario(id);
        if (!scenario) return;

        const dataStr = JSON.stringify(scenario, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${scenario.name || 'scenario'}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    /**
     * Export all data
     */
    const exportData = () => {
        const data = StorageManager.exportData();
        if (!data) {
            showToast('Error exporting data', 'error');
            return;
        }

        const dataBlob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `agriprofit-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);

        showToast('Data exported successfully', 'success');
    };

    /**
     * Import data
     */
    const importData = (file) => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = StorageManager.importData(e.target.result);
                if (result.success) {
                    showToast(result.message, 'success');
                    state.scenarios = StorageManager.getScenarios();
                    loadDashboardView();
                } else {
                    showToast(result.message, 'error');
                }
            } catch (error) {
                showToast('Error importing data', 'error');
            }
        };
        reader.readAsText(file);
    };

    /**
     * Update a setting
     */
    const updateSetting = (key, value) => {
        state.settings[key] = value;
        StorageManager.saveSettings({ [key]: value });
    };

    /**
     * Toggle dark/light theme
     */
    const toggleTheme = () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        updateSetting('themeMode', isDarkMode ? 'dark' : 'light');
        updateThemeIcon();
    };

    /**
     * Apply theme from settings
     */
    const applyTheme = () => {
        const themeMode = state.settings.themeMode || 'auto';

        if (themeMode === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) document.body.classList.add('dark-mode');
        } else if (themeMode === 'dark') {
            document.body.classList.add('dark-mode');
        }

        updateThemeIcon();
    };

    /**
     * Update theme toggle icon
     */
    const updateThemeIcon = () => {
        const icon = document.querySelector('.theme-icon');
        if (!icon) return;

        const isDark = document.body.classList.contains('dark-mode');
        icon.textContent = isDark ? '☀️' : '🌙';
    };

    /**
     * Load initial data from storage
     */
    const loadInitialData = () => {
        state.scenarios = StorageManager.getScenarios();
        state.settings = StorageManager.getSettings();
    };

    /**
     * Show toast notification
     */
    const showToast = (message, type = 'info') => {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    };

    /**
     * Get time ago string
     */
    const getTimeAgo = (date) => {
        const now = new Date();
        const ageMs = now - date;
        const ageMinutes = Math.floor(ageMs / 60000);
        const ageHours = Math.floor(ageMs / 3600000);
        const ageDays = Math.floor(ageMs / 86400000);

        if (ageMinutes < 1) {
            return 'just now';
        } else if (ageMinutes < 60) {
            return `${ageMinutes} minute${ageMinutes !== 1 ? 's' : ''} ago`;
        } else if (ageHours < 24) {
            return `${ageHours} hour${ageHours !== 1 ? 's' : ''} ago`;
        } else {
            return `${ageDays} day${ageDays !== 1 ? 's' : ''} ago`;
        }
    };

    // Public API
    return {
        init,
        switchView,
        performCalculation,
        showToast
    };
})();

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);
