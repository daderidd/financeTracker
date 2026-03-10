import React from 'react';
import { formatCurrency } from '../utils/formatting';

const SummaryBar = ({ totals, transactionCount, budgets, categoryData, startDate, endDate }) => {
  // Count over-budget categories
  const overBudgetCount = Object.keys(budgets).filter(cat => {
    if (!budgets[cat] || budgets[cat] <= 0) return false;
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    const monthSpan = (start && end)
      ? Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1)
      : 1;
    const spent = categoryData.find(c => c.name === cat)?.value || 0;
    return spent > budgets[cat] * monthSpan;
  }).length;

  const chips = [
    { label: 'Expenses', value: formatCurrency(totals.expenses), color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Income', value: formatCurrency(totals.income), color: 'text-green-600', bg: 'bg-green-50' },
    {
      label: 'Balance',
      value: formatCurrency(Math.abs(totals.balance)),
      prefix: totals.balance >= 0 ? '+' : '-',
      color: totals.balance >= 0 ? 'text-green-700' : 'text-red-700',
      bg: totals.balance >= 0 ? 'bg-green-50' : 'bg-red-50',
    },
    { label: 'Transactions', value: transactionCount.toLocaleString(), color: 'text-gray-700', bg: 'bg-gray-50' },
  ];

  if (Object.keys(budgets).length > 0) {
    chips.push({
      label: 'Over Budget',
      value: overBudgetCount.toString(),
      color: overBudgetCount > 0 ? 'text-amber-700' : 'text-green-700',
      bg: overBudgetCount > 0 ? 'bg-amber-50' : 'bg-green-50',
    });
  }

  return (
    <div className="flex flex-wrap gap-3 mt-4">
      {chips.map(chip => (
        <div key={chip.label} className={`${chip.bg} rounded-lg px-4 py-2 min-w-[120px]`}>
          <div className="text-xs text-gray-500">{chip.label}</div>
          <div className={`text-lg font-semibold ${chip.color}`}>
            {chip.prefix || ''}{chip.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryBar;
