

export function computeInsights(expenses) {
    const byMonth = {};
    expenses.forEach((e) => {
      const m = e.date.slice(0, 7);
      byMonth[m] = (byMonth[m] || 0) + parseFloat(e.amount);
    });
    const months = Object.keys(byMonth).sort();
    if (months.length < 2) return [];
    const prev = months[months.length - 2],
      last = months[months.length - 1];
    const diff = byMonth[last] - byMonth[prev];
    const pct = (diff / byMonth[prev]) * 100;
    return [
      pct > 0
        ? `You spent ${pct.toFixed(0)}% more in ${last} vs ${prev}.`
        : `You spent ${Math.abs(pct).toFixed(0)}% less in ${last} vs ${prev}.`,
    ];
  }
  