import React, { useMemo } from 'react';
import { formatCurrency } from '../utils/formatting';
import { COLORS } from '../utils/constants';

const CashFlowDiagram = ({ totals, categoryData }) => {
  const { income, expenses, balance } = totals;

  const sorted = useMemo(() =>
    [...categoryData].sort((a, b) => b.value - a.value).slice(0, 8),
    [categoryData]
  );

  if (income === 0 && expenses === 0) return null;

  const maxBar = Math.max(income, expenses);
  const savingsRate = income > 0 ? ((balance / income) * 100).toFixed(1) : 0;

  return (
    <div className="mt-6 p-4 bg-white rounded shadow">
      <h2 className="text-lg font-semibold mb-4">Cash Flow</h2>

      <div className="space-y-4">
        {/* Income bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-green-700">Income</span>
            <span className="text-green-700">{formatCurrency(income)} CHF</span>
          </div>
          <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-6 bg-green-400 rounded-full"
              style={{ width: `${(income / maxBar) * 100}%` }}
            />
          </div>
        </div>

        {/* Expenses breakdown */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-red-700">Expenses</span>
            <span className="text-red-700">{formatCurrency(expenses)} CHF</span>
          </div>
          <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden flex">
            {sorted.map((cat, i) => {
              const pct = (cat.value / maxBar) * 100;
              if (pct < 1) return null;
              return (
                <div
                  key={cat.name}
                  className="h-6 first:rounded-l-full last:rounded-r-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: COLORS[i % COLORS.length],
                  }}
                  title={`${cat.name}: ${formatCurrency(cat.value)} CHF`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {sorted.map((cat, i) => (
              <span key={cat.name} className="text-xs text-gray-600 flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                {cat.name} ({((cat.value / expenses) * 100).toFixed(0)}%)
              </span>
            ))}
          </div>
        </div>

        {/* Balance / Savings */}
        <div className={`p-3 rounded-lg ${balance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex justify-between items-center">
            <div>
              <span className={`text-sm font-medium ${balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {balance >= 0 ? 'Net Savings' : 'Net Deficit'}
              </span>
              {income > 0 && (
                <span className="text-xs text-gray-500 ml-2">
                  ({savingsRate}% savings rate)
                </span>
              )}
            </div>
            <span className={`text-lg font-semibold ${balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {balance >= 0 ? '+' : ''}{formatCurrency(balance)} CHF
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashFlowDiagram;
