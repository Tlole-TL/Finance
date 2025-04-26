

// chartUtils.js
export function createOrUpdateChart(ctx, existingChart, config) {
    if (existingChart) existingChart.destroy();
    return new Chart(ctx, config);
  }
  