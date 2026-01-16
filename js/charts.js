/**
 * Charts Module - Data Visualization
 * Creates charts and graphs using HTML5 Canvas (no external libraries)
 */

const Charts = (() => {
    /**
     * Simple bar chart renderer
     * Draws bars and labels on canvas
     */
    const drawBarChart = (canvasId, data, options = {}) => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const defaultOptions = {
            title: 'Chart',
            labels: [],
            values: [],
            colors: ['#2d5016', '#4a7023', '#8bc34a', '#8b6f47', '#d4c5b9', '#f5f1e8'],
            maxValue: null,
            showValues: true,
            height: 400,
            padding: 40
        };

        const opts = { ...defaultOptions, ...options };

        // Set canvas size
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = opts.height;

        // Get data bounds
        const maxValue = opts.maxValue || Math.max(...opts.values, 0) * 1.1;
        const minValue = Math.min(...opts.values, 0);

        // Calculate dimensions
        const chartWidth = canvas.width - (opts.padding * 2);
        const chartHeight = canvas.height - (opts.padding * 2);
        const barWidth = chartWidth / opts.labels.length;
        const barSpacing = barWidth * 0.1;
        const actualBarWidth = barWidth - barSpacing;

        // Clear canvas with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw title
        if (opts.title) {
            ctx.fillStyle = '#2d5016';
            ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
            ctx.textAlign = 'center';
            ctx.fillText(opts.title, canvas.width / 2, 25);
        }

        // Draw axes
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;

        // Vertical axis
        ctx.beginPath();
        ctx.moveTo(opts.padding, opts.padding);
        ctx.lineTo(opts.padding, canvas.height - opts.padding);
        ctx.stroke();

        // Horizontal axis
        ctx.beginPath();
        ctx.moveTo(opts.padding, canvas.height - opts.padding);
        ctx.lineTo(canvas.width - opts.padding, canvas.height - opts.padding);
        ctx.stroke();

        // Draw grid lines and Y-axis labels
        ctx.fillStyle = '#999999';
        ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        ctx.textAlign = 'right';

        const gridLines = 5;
        for (let i = 0; i <= gridLines; i++) {
            const y = opts.padding + (chartHeight / gridLines) * i;
            const value = maxValue - (maxValue / gridLines) * i;

            // Grid line
            ctx.strokeStyle = '#f0f0f0';
            ctx.beginPath();
            ctx.moveTo(opts.padding, y);
            ctx.lineTo(canvas.width - opts.padding, y);
            ctx.stroke();

            // Y-axis label
            ctx.fillStyle = '#999999';
            ctx.fillText(formatNumber(value), opts.padding - 10, y + 4);
        }

        // Draw bars
        opts.labels.forEach((label, index) => {
            const value = opts.values[index];
            const color = opts.colors[index % opts.colors.length];
            const x = opts.padding + (index * barWidth) + (barSpacing / 2);

            // Normalize value to fit chart height
            const barHeight = (value / maxValue) * chartHeight;
            const y = canvas.height - opts.padding - barHeight;

            // Draw bar
            ctx.fillStyle = color;
            ctx.fillRect(x, y, actualBarWidth, barHeight);

            // Draw bar border
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, actualBarWidth, barHeight);

            // Draw value on top of bar
            if (opts.showValues && value > 0) {
                ctx.fillStyle = '#2d5016';
                ctx.font = '11px bold -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
                ctx.textAlign = 'center';
                ctx.fillText(formatNumber(value), x + (actualBarWidth / 2), y - 5);
            }

            // Draw label below
            ctx.fillStyle = '#333333';
            ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
            ctx.textAlign = 'center';
            ctx.fillText(label, x + (actualBarWidth / 2), canvas.height - opts.padding + 20);
        });
    };

    /**
     * Simple pie chart renderer
     */
    const drawPieChart = (canvasId, data, options = {}) => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const defaultOptions = {
            title: 'Distribution',
            labels: [],
            values: [],
            colors: ['#2d5016', '#4a7023', '#8bc34a', '#8b6f47', '#d4c5b9'],
            height: 400
        };

        const opts = { ...defaultOptions, ...options };

        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = opts.height;

        // Draw background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate total
        const total = opts.values.reduce((sum, val) => sum + Math.abs(val), 0);
        if (total === 0) {
            ctx.fillStyle = '#999999';
            ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
            ctx.textAlign = 'center';
            ctx.fillText('No data to display', canvas.width / 2, canvas.height / 2);
            return;
        }

        // Chart center and radius
        const centerX = canvas.width * 0.5;
        const centerY = canvas.height * 0.55;
        const radius = Math.min(centerX, centerY) - 40;

        let currentAngle = -Math.PI / 2;

        // Draw slices
        opts.labels.forEach((label, index) => {
            const value = Math.abs(opts.values[index]);
            const sliceAngle = (value / total) * 2 * Math.PI;
            const color = opts.colors[index % opts.colors.length];

            // Draw slice
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.lineTo(centerX, centerY);
            ctx.fill();

            // Draw border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw label
            const labelAngle = currentAngle + (sliceAngle / 2);
            const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
            const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
            ctx.textAlign = 'center';
            const percent = Math.round((value / total) * 100);
            ctx.fillText(`${percent}%`, labelX, labelY);

            currentAngle += sliceAngle;
        });

        // Draw title
        ctx.fillStyle = '#2d5016';
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        ctx.textAlign = 'center';
        ctx.fillText(opts.title, canvas.width / 2, 25);

        // Draw legend
        const legendX = canvas.width - 160;
        const legendY = 40;
        const legendItemHeight = 20;

        opts.labels.forEach((label, index) => {
            const color = opts.colors[index % opts.colors.length];
            const value = opts.values[index];
            const percent = Math.round((Math.abs(value) / total) * 100);

            // Color box
            ctx.fillStyle = color;
            ctx.fillRect(legendX, legendY + (index * legendItemHeight), 12, 12);

            // Label
            ctx.fillStyle = '#333333';
            ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
            ctx.textAlign = 'left';
            ctx.fillText(`${label} (${percent}%)`, legendX + 18, legendY + (index * legendItemHeight) + 10);
        });
    };

    /**
     * Line chart renderer for trends
     */
    const drawLineChart = (canvasId, data, options = {}) => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const defaultOptions = {
            title: 'Trend',
            labels: [],
            values: [],
            color: '#2d5016',
            height: 400,
            padding: 40,
            showPoints: true
        };

        const opts = { ...defaultOptions, ...options };

        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = opts.height;

        // Clear background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (opts.values.length === 0) {
            ctx.fillStyle = '#999999';
            ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
            ctx.textAlign = 'center';
            ctx.fillText('No data to display', canvas.width / 2, canvas.height / 2);
            return;
        }

        // Get bounds
        const maxValue = Math.max(...opts.values) * 1.1;
        const minValue = Math.min(...opts.values) * 0.9;
        const range = maxValue - minValue;

        // Calculate dimensions
        const chartWidth = canvas.width - (opts.padding * 2);
        const chartHeight = canvas.height - (opts.padding * 2);
        const pointSpacing = chartWidth / (opts.values.length - 1 || 1);

        // Draw axes
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(opts.padding, opts.padding);
        ctx.lineTo(opts.padding, canvas.height - opts.padding);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(opts.padding, canvas.height - opts.padding);
        ctx.lineTo(canvas.width - opts.padding, canvas.height - opts.padding);
        ctx.stroke();

        // Draw line
        ctx.strokeStyle = opts.color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        opts.values.forEach((value, index) => {
            const x = opts.padding + (index * pointSpacing);
            const normalizedValue = (value - minValue) / range;
            const y = canvas.height - opts.padding - (normalizedValue * chartHeight);

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw points
        if (opts.showPoints) {
            opts.values.forEach((value, index) => {
                const x = opts.padding + (index * pointSpacing);
                const normalizedValue = (value - minValue) / range;
                const y = canvas.height - opts.padding - (normalizedValue * chartHeight);

                ctx.fillStyle = opts.color;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fill();

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
            });
        }

        // Draw labels
        ctx.fillStyle = '#333333';
        ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        ctx.textAlign = 'center';

        opts.labels.forEach((label, index) => {
            const x = opts.padding + (index * pointSpacing);
            ctx.fillText(label, x, canvas.height - opts.padding + 20);
        });

        // Draw title
        ctx.fillStyle = '#2d5016';
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        ctx.textAlign = 'center';
        ctx.fillText(opts.title, canvas.width / 2, 25);
    };

    /**
     * Format number for display
     */
    const formatNumber = (num) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        } else if (num >= 0) {
            return num.toFixed(2);
        } else {
            return num.toFixed(2);
        }
    };

    /**
     * Redraw canvas (useful for responsive sizing)
     */
    const redrawAllCharts = () => {
        const canvases = document.querySelectorAll('canvas');
        canvases.forEach(canvas => {
            // Re-render logic would be called here
        });
    };

    // Public API
    return {
        drawBarChart,
        drawPieChart,
        drawLineChart,
        formatNumber,
        redrawAllCharts
    };
})();

// Redraw charts on window resize
window.addEventListener('resize', () => {
    Charts.redrawAllCharts();
});
