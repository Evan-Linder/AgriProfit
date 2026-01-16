/**
 * Calculator Module - Profit Calculation Logic
 * Handles all agricultural profitability calculations
 */

const Calculator = (() => {
    /**
     * Validate calculator inputs before processing
     */
    const validateInputs = (inputs) => {
        const errors = [];

        // Validate crop type
        if (!inputs.cropType || inputs.cropType.trim() === '') {
            errors.push('Crop type is required');
        }

        // Validate acreage
        if (inputs.acreage === undefined || inputs.acreage === null || inputs.acreage === '') {
            errors.push('Acres planted is required');
        } else if (isNaN(parseFloat(inputs.acreage)) || parseFloat(inputs.acreage) <= 0) {
            errors.push('Acres planted must be greater than 0');
        }

        // Validate yield
        if (inputs.yieldPerAcre === undefined || inputs.yieldPerAcre === null || inputs.yieldPerAcre === '') {
            errors.push('Expected yield is required');
        } else if (isNaN(parseFloat(inputs.yieldPerAcre)) || parseFloat(inputs.yieldPerAcre) < 0) {
            errors.push('Expected yield cannot be negative');
        }

        // Validate market price
        if (inputs.marketPrice === undefined || inputs.marketPrice === null || inputs.marketPrice === '') {
            errors.push('Market price is required');
        } else if (isNaN(parseFloat(inputs.marketPrice)) || parseFloat(inputs.marketPrice) < 0) {
            errors.push('Market price cannot be negative');
        }

        // Validate costs (all optional, but must be non-negative if provided)
        const costFields = ['seedCost', 'fertilizerCost', 'chemicalCost', 'laborCost', 'equipmentCost', 'miscCost'];
        costFields.forEach(field => {
            if (inputs[field] !== undefined && inputs[field] !== null && inputs[field] !== '') {
                if (isNaN(parseFloat(inputs[field])) || parseFloat(inputs[field]) < 0) {
                    errors.push(`${field} cannot be negative`);
                }
            }
        });

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    };

    /**
     * Calculate total production in bushels/units
     * Formula: acres * yield_per_acre
     */
    const calculateProduction = (acres, yieldPerAcre) => {
        const acresNum = parseFloat(acres);
        const yieldNum = parseFloat(yieldPerAcre);
        return acresNum * yieldNum;
    };

    /**
     * Calculate total revenue
     * Formula: production * market_price
     */
    const calculateRevenue = (production, marketPrice) => {
        const prodNum = parseFloat(production);
        const priceNum = parseFloat(marketPrice);
        return prodNum * priceNum;
    };

    /**
     * Calculate total cost
     * Formula: sum(all_costs) * acres
     */
    const calculateTotalCost = (acres, costs) => {
        const acresNum = parseFloat(acres);

        // Sum all cost components
        const costPerAcre = Object.keys(costs).reduce((sum, costKey) => {
            const costValue = parseFloat(costs[costKey]) || 0;
            return sum + (costValue >= 0 ? costValue : 0);
        }, 0);

        return acresNum * costPerAcre;
    };

    /**
     * Calculate net profit
     * Formula: revenue - total_cost
     */
    const calculateNetProfit = (revenue, totalCost) => {
        const revNum = parseFloat(revenue);
        const costNum = parseFloat(totalCost);
        return revNum - costNum;
    };

    /**
     * Calculate profit per acre
     * Formula: net_profit / acres
     */
    const calculateProfitPerAcre = (netProfit, acres) => {
        const profitNum = parseFloat(netProfit);
        const acresNum = parseFloat(acres);

        if (acresNum === 0) {
            return 0;
        }

        return profitNum / acresNum;
    };

    /**
     * Calculate profit margin as percentage
     * Formula: (net_profit / revenue) * 100
     */
    const calculateProfitMargin = (netProfit, revenue) => {
        const profitNum = parseFloat(netProfit);
        const revNum = parseFloat(revenue);

        if (revNum === 0) {
            return 0;
        }

        return (profitNum / revNum) * 100;
    };

    /**
     * Calculate cost per bushel/unit
     * Formula: total_cost / production
     */
    const calculateCostPerUnit = (totalCost, production) => {
        const costNum = parseFloat(totalCost);
        const prodNum = parseFloat(production);

        if (prodNum === 0) {
            return 0;
        }

        return costNum / prodNum;
    };

    /**
     * Main calculation function - performs all calculations
     * Returns comprehensive profit analysis
     */
    const calculateProfitability = (inputs) => {
        // Validate inputs first
        const validation = validateInputs(inputs);
        if (!validation.isValid) {
            return {
                success: false,
                errors: validation.errors
            };
        }

        try {
            // Parse all input values
            const acres = parseFloat(inputs.acreage);
            const yieldPerAcre = parseFloat(inputs.yieldPerAcre);
            const marketPrice = parseFloat(inputs.marketPrice);

            // Cost inputs
            const costs = {
                seedCost: parseFloat(inputs.seedCost) || 0,
                fertilizerCost: parseFloat(inputs.fertilizerCost) || 0,
                chemicalCost: parseFloat(inputs.chemicalCost) || 0,
                laborCost: parseFloat(inputs.laborCost) || 0,
                equipmentCost: parseFloat(inputs.equipmentCost) || 0,
                miscCost: parseFloat(inputs.miscCost) || 0
            };

            // Perform calculations
            const production = calculateProduction(acres, yieldPerAcre);
            const revenue = calculateRevenue(production, marketPrice);
            const totalCost = calculateTotalCost(acres, costs);
            const netProfit = calculateNetProfit(revenue, totalCost);
            const profitPerAcre = calculateProfitPerAcre(netProfit, acres);
            const profitMargin = calculateProfitMargin(netProfit, revenue);
            const costPerUnit = calculateCostPerUnit(totalCost, production);

            return {
                success: true,
                data: {
                    // Input summary
                    cropType: inputs.cropType,
                    acres: acres,
                    yieldPerAcre: yieldPerAcre,
                    marketPrice: marketPrice,

                    // Production metrics
                    production: production,

                    // Financial metrics
                    revenue: revenue,
                    totalCost: totalCost,

                    // Cost breakdown
                    costBreakdown: costs,
                    costPerAcre: totalCost / acres,
                    costPerUnit: costPerUnit,

                    // Profit metrics
                    netProfit: netProfit,
                    profitPerAcre: profitPerAcre,
                    profitMargin: profitMargin,

                    // Timestamp
                    calculatedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('Calculation error:', error);
            return {
                success: false,
                errors: ['An error occurred during calculation. Please check your inputs.']
            };
        }
    };

    /**
     * Perform "what-if" analysis
     * Calculates profit with a percentage change to market price
     */
    const whatIfPriceChange = (calculation, priceChangePercent) => {
        if (!calculation.success || !calculation.data) {
            return null;
        }

        const originalPrice = calculation.data.marketPrice;
        const newPrice = originalPrice * (1 + (priceChangePercent / 100));

        // Create modified inputs
        const modifiedInputs = {
            cropType: calculation.data.cropType,
            acreage: calculation.data.acres,
            yieldPerAcre: calculation.data.yieldPerAcre,
            marketPrice: newPrice,
            seedCost: calculation.data.costBreakdown.seedCost,
            fertilizerCost: calculation.data.costBreakdown.fertilizerCost,
            chemicalCost: calculation.data.costBreakdown.chemicalCost,
            laborCost: calculation.data.costBreakdown.laborCost,
            equipmentCost: calculation.data.costBreakdown.equipmentCost,
            miscCost: calculation.data.costBreakdown.miscCost
        };

        const newCalculation = calculateProfitability(modifiedInputs);

        return {
            originalCalculation: calculation,
            newCalculation: newCalculation,
            scenarioName: `${priceChangePercent > 0 ? '+' : ''}${priceChangePercent}% Price Change`,
            priceChange: {
                originalPrice: originalPrice,
                newPrice: newPrice,
                changePercent: priceChangePercent
            }
        };
    };

    /**
     * Compare multiple scenarios
     */
    const compareScenarios = (scenarios) => {
        if (!Array.isArray(scenarios) || scenarios.length === 0) {
            return null;
        }

        // Filter valid scenarios
        const validScenarios = scenarios.filter(s => s.calculation && s.calculation.success);

        if (validScenarios.length === 0) {
            return null;
        }

        // Find best profit
        const bestProfit = validScenarios.reduce((best, current) => {
            return current.calculation.data.netProfit > best.calculation.data.netProfit
                ? current
                : best;
        });

        // Find best profit per acre
        const bestProfitPerAcre = validScenarios.reduce((best, current) => {
            return current.calculation.data.profitPerAcre > best.calculation.data.profitPerAcre
                ? current
                : best;
        });

        return {
            totalScenarios: validScenarios.length,
            bestProfit: bestProfit,
            bestProfitPerAcre: bestProfitPerAcre,
            scenarios: validScenarios,
            comparison: {
                totalRevenue: validScenarios.reduce((sum, s) => sum + s.calculation.data.revenue, 0),
                totalCost: validScenarios.reduce((sum, s) => sum + s.calculation.data.totalCost, 0),
                totalProfit: validScenarios.reduce((sum, s) => sum + s.calculation.data.netProfit, 0),
                averageProfitPerAcre: validScenarios.reduce((sum, s) => sum + s.calculation.data.profitPerAcre, 0) / validScenarios.length
            }
        };
    };

    /**
     * Format calculator result for display
     */
    const formatResult = (result, decimalPlaces = 2) => {
        if (!result.success || !result.data) {
            return null;
        }

        const d = result.data;
        const round = (num) => Math.round(num * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);

        return {
            cropType: d.cropType,
            acres: round(d.acres),
            yieldPerAcre: round(d.yieldPerAcre),
            marketPrice: round(d.marketPrice),
            production: round(d.production),
            revenue: round(d.revenue),
            totalCost: round(d.totalCost),
            costPerAcre: round(d.costPerAcre),
            costPerUnit: round(d.costPerUnit),
            costBreakdown: {
                seedCost: round(d.costBreakdown.seedCost),
                fertilizerCost: round(d.costBreakdown.fertilizerCost),
                chemicalCost: round(d.costBreakdown.chemicalCost),
                laborCost: round(d.costBreakdown.laborCost),
                equipmentCost: round(d.costBreakdown.equipmentCost),
                miscCost: round(d.costBreakdown.miscCost)
            },
            netProfit: round(d.netProfit),
            profitPerAcre: round(d.profitPerAcre),
            profitMargin: round(d.profitMargin),
            calculatedAt: d.calculatedAt
        };
    };

    // Public API
    return {
        validateInputs,
        calculateProfitability,
        whatIfPriceChange,
        compareScenarios,
        formatResult,
        // Helper functions
        calculateProduction,
        calculateRevenue,
        calculateTotalCost,
        calculateNetProfit,
        calculateProfitPerAcre,
        calculateProfitMargin,
        calculateCostPerUnit
    };
})();
