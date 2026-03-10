import { formatCurrency } from './formatting';

// Generate a text summary for clipboard
export const generateTextReport = (totals, categoryData, startDate, endDate, budgets = {}) => {
  const lines = [];
  lines.push(`Expense Report: ${startDate} to ${endDate}`);
  lines.push('='.repeat(40));
  lines.push('');
  lines.push(`Total Expenses: ${formatCurrency(totals.expenses)} CHF`);
  lines.push(`Total Income:   ${formatCurrency(totals.income)} CHF`);
  lines.push(`Balance:        ${totals.balance >= 0 ? '+' : ''}${formatCurrency(totals.balance)} CHF`);
  lines.push('');
  lines.push('Category Breakdown:');
  lines.push('-'.repeat(40));

  const sorted = [...categoryData].sort((a, b) => b.value - a.value);
  sorted.forEach(cat => {
    const pct = totals.expenses > 0 ? ((cat.value / totals.expenses) * 100).toFixed(1) : '0.0';
    const budgetNote = budgets[cat.name]
      ? ` (budget: ${formatCurrency(budgets[cat.name])}/mo)`
      : '';
    lines.push(`  ${cat.name}: ${formatCurrency(cat.value)} CHF (${pct}%)${budgetNote}`);
  });

  return lines.join('\n');
};

// Generate CSV export of category data
export const generateCategoryCSV = (categoryData, totals) => {
  const rows = [['Category', 'Amount (CHF)', '% of Total']];
  const sorted = [...categoryData].sort((a, b) => b.value - a.value);
  sorted.forEach(cat => {
    const pct = totals.expenses > 0 ? ((cat.value / totals.expenses) * 100).toFixed(1) : '0.0';
    rows.push([cat.name, cat.value.toFixed(2), pct]);
  });
  rows.push(['', '', '']);
  rows.push(['Total Expenses', totals.expenses.toFixed(2), '100.0']);
  rows.push(['Total Income', totals.income.toFixed(2), '']);
  rows.push(['Balance', totals.balance.toFixed(2), '']);
  return rows.map(r => r.join(',')).join('\n');
};

// Copy text to clipboard
export const copyToClipboard = async (text) => {
  await navigator.clipboard.writeText(text);
};

// Download as file
export const downloadAsFile = (content, filename, mimeType = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(link);
};
