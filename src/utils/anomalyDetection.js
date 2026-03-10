// Detect spending anomalies by category (current month vs rolling 3-month average)
export const detectAnomalies = (transactions) => {
  if (!transactions || transactions.length === 0) return [];

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Group expenses by month and category
  const monthlyByCategory = {};
  transactions.forEach(t => {
    if (t.type !== 'expense' || !t.date || !t.category?.name) return;
    if (t.hidden) return;
    const month = t.date.slice(0, 7);
    const cat = t.category.name;
    if (!monthlyByCategory[cat]) monthlyByCategory[cat] = {};
    if (!monthlyByCategory[cat][month]) monthlyByCategory[cat][month] = 0;
    monthlyByCategory[cat][month] += Math.abs(t.value);
  });

  // Get sorted months
  const allMonths = [...new Set(transactions.filter(t => t.date).map(t => t.date.slice(0, 7)))].sort();
  const currentMonthIdx = allMonths.indexOf(currentMonth);
  if (currentMonthIdx < 1) return []; // need at least 1 prior month

  // Compare current month to previous months average
  const priorMonths = allMonths.slice(Math.max(0, currentMonthIdx - 3), currentMonthIdx);
  if (priorMonths.length === 0) return [];

  const anomalies = [];

  for (const [cat, months] of Object.entries(monthlyByCategory)) {
    const currentSpend = months[currentMonth] || 0;
    if (currentSpend === 0) continue;

    const priorSpends = priorMonths.map(m => months[m] || 0);
    const avg = priorSpends.reduce((a, b) => a + b, 0) / priorSpends.length;
    if (avg === 0) continue;

    const percentChange = ((currentSpend - avg) / avg) * 100;

    if (Math.abs(percentChange) >= 30) {
      anomalies.push({
        category: cat,
        currentSpend,
        averageSpend: avg,
        percentChange,
        direction: percentChange > 0 ? 'up' : 'down',
      });
    }
  }

  // Sort by absolute change magnitude
  anomalies.sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange));
  return anomalies.slice(0, 5);
};

// Detect individual unusual transactions (> 3x category median)
export const detectUnusualTransactions = (transactions) => {
  if (!transactions || transactions.length === 0) return [];

  // Group expense amounts by category
  const byCategory = {};
  transactions.forEach(t => {
    if (t.type !== 'expense' || !t.category?.name || t.hidden) return;
    const cat = t.category.name;
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push({ amount: Math.abs(t.value), transaction: t });
  });

  const unusual = [];

  for (const [cat, items] of Object.entries(byCategory)) {
    if (items.length < 5) continue; // need enough data
    const amounts = items.map(i => i.amount).sort((a, b) => a - b);
    const median = amounts[Math.floor(amounts.length / 2)];
    if (median === 0) continue;

    items.forEach(({ amount, transaction }) => {
      if (amount > median * 3 && amount > 50) {
        unusual.push({
          transaction,
          category: cat,
          amount,
          median,
          ratio: amount / median,
        });
      }
    });
  }

  unusual.sort((a, b) => b.ratio - a.ratio);
  return unusual.slice(0, 5);
};
