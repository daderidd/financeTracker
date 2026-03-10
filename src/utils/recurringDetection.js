import { normalizeCategoryDescription } from './categorize';

// Detect recurring transactions by clustering similar descriptions + amounts
export const detectRecurring = (transactions) => {
  if (!transactions || transactions.length === 0) return [];

  // Group by normalized description prefix (first 5+ tokens) and approximate amount
  const clusters = {};

  transactions.forEach(t => {
    if (!t.date || t.hidden) return;
    const desc = normalizeCategoryDescription(t);
    if (desc.length < 5) return;

    // Use first ~40 chars as key to cluster variations
    const key = desc.slice(0, 40).trim();
    const amount = Math.abs(t.value);
    // Round to nearest 5 CHF for clustering
    const amountBucket = Math.round(amount / 5) * 5;
    const clusterKey = `${key}|${amountBucket}`;

    if (!clusters[clusterKey]) {
      clusters[clusterKey] = { description: key, amounts: [], dates: [], transactions: [], type: t.type };
    }
    clusters[clusterKey].amounts.push(amount);
    clusters[clusterKey].dates.push(new Date(t.date));
    clusters[clusterKey].transactions.push(t);
  });

  const recurring = [];

  for (const [, cluster] of Object.entries(clusters)) {
    if (cluster.dates.length < 3) continue;

    // Sort by date
    const sorted = cluster.dates.sort((a, b) => a - b);

    // Calculate intervals between consecutive transactions (in days)
    const intervals = [];
    for (let i = 1; i < sorted.length; i++) {
      const days = Math.round((sorted[i] - sorted[i - 1]) / (1000 * 60 * 60 * 24));
      intervals.push(days);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const avgAmount = cluster.amounts.reduce((a, b) => a + b, 0) / cluster.amounts.length;

    // Determine frequency
    let frequency = null;
    if (avgInterval >= 25 && avgInterval <= 35) frequency = 'monthly';
    else if (avgInterval >= 12 && avgInterval <= 16) frequency = 'bi-weekly';
    else if (avgInterval >= 5 && avgInterval <= 9) frequency = 'weekly';
    else if (avgInterval >= 85 && avgInterval <= 95) frequency = 'quarterly';
    else if (avgInterval >= 350 && avgInterval <= 380) frequency = 'yearly';

    if (!frequency) continue;

    // Check regularity: coefficient of variation of intervals should be low
    const intervalStd = Math.sqrt(
      intervals.reduce((sum, d) => sum + (d - avgInterval) ** 2, 0) / intervals.length
    );
    if (intervalStd / avgInterval > 0.4) continue; // too irregular

    const annualCost = frequency === 'monthly' ? avgAmount * 12
      : frequency === 'bi-weekly' ? avgAmount * 26
      : frequency === 'weekly' ? avgAmount * 52
      : frequency === 'quarterly' ? avgAmount * 4
      : avgAmount;

    const lastDate = sorted[sorted.length - 1];
    const daysSinceLast = Math.round((new Date() - lastDate) / (1000 * 60 * 60 * 24));
    const isActive = daysSinceLast < avgInterval * 2;

    recurring.push({
      description: cluster.description,
      frequency,
      avgAmount,
      annualCost,
      occurrences: cluster.dates.length,
      lastDate: lastDate.toISOString().slice(0, 10),
      isActive,
      type: cluster.type,
      category: cluster.transactions[0]?.category?.name || 'Uncategorized',
    });
  }

  recurring.sort((a, b) => b.annualCost - a.annualCost);
  return recurring;
};
