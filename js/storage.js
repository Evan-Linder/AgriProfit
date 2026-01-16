/**
 * Storage Module - LocalStorage Management
 * Handles persistence of scenarios, history, and settings
 */

const StorageManager = (() => {
    // Storage keys
    const KEYS = {
        SCENARIOS: 'agriprofit_scenarios',
        HISTORY: 'agriprofit_history',
        SETTINGS: 'agriprofit_settings',
        LAST_CALCULATION: 'agriprofit_last_calc'
    };

    // Default settings
    const DEFAULT_SETTINGS = {
        unitPreference: 'imperial',
        currency: 'usd',
        decimalPlaces: 2,
        refreshInterval: 15,
        cacheMode: 'smart',
        autoSave: true,
        themeMode: 'auto'
    };

    /**
     * Check if LocalStorage is available
     */
    const isStorageAvailable = () => {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    };

    /**
     * Save a calculation scenario
     */
    const saveScenario = (scenario) => {
        if (!isStorageAvailable()) {
            return false;
        }

        try {
            let scenarios = JSON.parse(localStorage.getItem(KEYS.SCENARIOS)) || [];

            // Generate unique ID if not provided
            if (!scenario.id) {
                scenario.id = generateId();
            }

            // Add timestamp if not provided
            if (!scenario.savedAt) {
                scenario.savedAt = new Date().toISOString();
            }

            // Check if updating existing scenario
            const existingIndex = scenarios.findIndex(s => s.id === scenario.id);
            if (existingIndex !== -1) {
                scenarios[existingIndex] = scenario;
            } else {
                scenarios.push(scenario);
            }

            localStorage.setItem(KEYS.SCENARIOS, JSON.stringify(scenarios));

            // Also add to history
            addToHistory(scenario);

            return true;
        } catch (error) {
            console.error('Error saving scenario:', error);
            return false;
        }
    };

    /**
     * Get all saved scenarios
     */
    const getScenarios = () => {
        if (!isStorageAvailable()) {
            return [];
        }

        try {
            return JSON.parse(localStorage.getItem(KEYS.SCENARIOS)) || [];
        } catch (error) {
            console.error('Error retrieving scenarios:', error);
            return [];
        }
    };

    /**
     * Get a specific scenario by ID
     */
    const getScenario = (id) => {
        const scenarios = getScenarios();
        return scenarios.find(s => s.id === id);
    };

    /**
     * Update a scenario
     */
    const updateScenario = (id, updates) => {
        try {
            let scenarios = getScenarios();
            const index = scenarios.findIndex(s => s.id === id);

            if (index === -1) {
                return false;
            }

            scenarios[index] = {
                ...scenarios[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };

            localStorage.setItem(KEYS.SCENARIOS, JSON.stringify(scenarios));
            return true;
        } catch (error) {
            console.error('Error updating scenario:', error);
            return false;
        }
    };

    /**
     * Rename a scenario
     */
    const renameScenario = (id, newName) => {
        return updateScenario(id, { name: newName });
    };

    /**
     * Delete a scenario
     */
    const deleteScenario = (id) => {
        if (!isStorageAvailable()) {
            return false;
        }

        try {
            let scenarios = getScenarios();
            scenarios = scenarios.filter(s => s.id !== id);
            localStorage.setItem(KEYS.SCENARIOS, JSON.stringify(scenarios));
            return true;
        } catch (error) {
            console.error('Error deleting scenario:', error);
            return false;
        }
    };

    /**
     * Delete all scenarios
     */
    const deleteAllScenarios = () => {
        if (!isStorageAvailable()) {
            return false;
        }

        try {
            localStorage.removeItem(KEYS.SCENARIOS);
            return true;
        } catch (error) {
            console.error('Error clearing scenarios:', error);
            return false;
        }
    };

    /**
     * Add calculation to history
     */
    const addToHistory = (calculation) => {
        if (!isStorageAvailable()) {
            return false;
        }

        try {
            let history = JSON.parse(localStorage.getItem(KEYS.HISTORY)) || [];

            // Limit history to last 100 items
            const maxHistoryItems = 100;

            const historyItem = {
                id: generateId(),
                ...calculation,
                addedAt: new Date().toISOString()
            };

            history.unshift(historyItem); // Add to beginning
            history = history.slice(0, maxHistoryItems); // Keep only last 100

            localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
            return true;
        } catch (error) {
            console.error('Error adding to history:', error);
            return false;
        }
    };

    /**
     * Get all history items
     */
    const getHistory = (limit = null) => {
        if (!isStorageAvailable()) {
            return [];
        }

        try {
            let history = JSON.parse(localStorage.getItem(KEYS.HISTORY)) || [];

            if (limit) {
                history = history.slice(0, limit);
            }

            return history;
        } catch (error) {
            console.error('Error retrieving history:', error);
            return [];
        }
    };

    /**
     * Search history by name or description
     */
    const searchHistory = (query) => {
        const history = getHistory();
        const lowerQuery = query.toLowerCase();

        return history.filter(item => {
            const name = (item.name || '').toLowerCase();
            const description = (item.description || '').toLowerCase();
            const cropType = (item.calculation?.data?.cropType || '').toLowerCase();

            return name.includes(lowerQuery) ||
                description.includes(lowerQuery) ||
                cropType.includes(lowerQuery);
        });
    };

    /**
     * Clear all history
     */
    const clearHistory = () => {
        if (!isStorageAvailable()) {
            return false;
        }

        try {
            localStorage.removeItem(KEYS.HISTORY);
            return true;
        } catch (error) {
            console.error('Error clearing history:', error);
            return false;
        }
    };

    /**
     * Delete specific history item
     */
    const deleteHistoryItem = (id) => {
        if (!isStorageAvailable()) {
            return false;
        }

        try {
            let history = getHistory();
            history = history.filter(item => item.id !== id);
            localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
            return true;
        } catch (error) {
            console.error('Error deleting history item:', error);
            return false;
        }
    };

    /**
     * Save settings
     */
    const saveSettings = (settings) => {
        if (!isStorageAvailable()) {
            return false;
        }

        try {
            const mergedSettings = {
                ...DEFAULT_SETTINGS,
                ...getSettings(),
                ...settings
            };

            localStorage.setItem(KEYS.SETTINGS, JSON.stringify(mergedSettings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    };

    /**
     * Get all settings
     */
    const getSettings = () => {
        if (!isStorageAvailable()) {
            return DEFAULT_SETTINGS;
        }

        try {
            const stored = JSON.parse(localStorage.getItem(KEYS.SETTINGS));
            return {
                ...DEFAULT_SETTINGS,
                ...stored
            };
        } catch (error) {
            console.error('Error retrieving settings:', error);
            return DEFAULT_SETTINGS;
        }
    };

    /**
     * Get a specific setting
     */
    const getSetting = (key) => {
        const settings = getSettings();
        return settings[key];
    };

    /**
     * Reset settings to default
     */
    const resetSettings = () => {
        if (!isStorageAvailable()) {
            return false;
        }

        try {
            localStorage.removeItem(KEYS.SETTINGS);
            return true;
        } catch (error) {
            console.error('Error resetting settings:', error);
            return false;
        }
    };

    /**
     * Save last calculation (quick access)
     */
    const saveLastCalculation = (calculation) => {
        if (!isStorageAvailable()) {
            return false;
        }

        try {
            localStorage.setItem(KEYS.LAST_CALCULATION, JSON.stringify(calculation));
            return true;
        } catch (error) {
            console.error('Error saving last calculation:', error);
            return false;
        }
    };

    /**
     * Get last calculation
     */
    const getLastCalculation = () => {
        if (!isStorageAvailable()) {
            return null;
        }

        try {
            return JSON.parse(localStorage.getItem(KEYS.LAST_CALCULATION));
        } catch (error) {
            console.error('Error retrieving last calculation:', error);
            return null;
        }
    };

    /**
     * Export all data as JSON
     */
    const exportData = () => {
        try {
            const data = {
                version: '1.0',
                exportedAt: new Date().toISOString(),
                scenarios: getScenarios(),
                history: getHistory(),
                settings: getSettings()
            };

            return JSON.stringify(data, null, 2);
        } catch (error) {
            console.error('Error exporting data:', error);
            return null;
        }
    };

    /**
     * Import data from JSON
     */
    const importData = (jsonString) => {
        try {
            const data = JSON.parse(jsonString);

            // Validate structure
            if (!data.version || !data.scenarios || !data.history || !data.settings) {
                throw new Error('Invalid import format');
            }

            // Import scenarios
            if (Array.isArray(data.scenarios)) {
                data.scenarios.forEach(scenario => {
                    saveScenario(scenario);
                });
            }

            // Import settings
            if (data.settings) {
                saveSettings(data.settings);
            }

            return {
                success: true,
                message: `Successfully imported ${data.scenarios.length} scenarios and settings`
            };
        } catch (error) {
            console.error('Error importing data:', error);
            return {
                success: false,
                message: 'Error importing data: ' + error.message
            };
        }
    };

    /**
     * Clear all data
     */
    const clearAllData = () => {
        if (!isStorageAvailable()) {
            return false;
        }

        try {
            Object.values(KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Error clearing all data:', error);
            return false;
        }
    };

    /**
     * Get storage usage info
     */
    const getStorageInfo = () => {
        try {
            const scenarios = getScenarios();
            const history = getHistory();
            const settings = getSettings();

            return {
                scenarioCount: scenarios.length,
                historyCount: history.length,
                totalSize: new Blob([
                    JSON.stringify(scenarios),
                    JSON.stringify(history),
                    JSON.stringify(settings)
                ]).size,
                storageAvailable: isStorageAvailable()
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return null;
        }
    };

    /**
     * Generate unique ID
     */
    const generateId = () => {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };

    // Public API
    return {
        // Scenarios
        saveScenario,
        getScenarios,
        getScenario,
        updateScenario,
        renameScenario,
        deleteScenario,
        deleteAllScenarios,

        // History
        addToHistory,
        getHistory,
        searchHistory,
        clearHistory,
        deleteHistoryItem,

        // Settings
        saveSettings,
        getSettings,
        getSetting,
        resetSettings,

        // Last Calculation
        saveLastCalculation,
        getLastCalculation,

        // Import/Export
        exportData,
        importData,

        // General
        clearAllData,
        getStorageInfo,
        isStorageAvailable,
        DEFAULT_SETTINGS
    };
})();
