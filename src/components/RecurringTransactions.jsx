import React, { useMemo, useState } from 'react';
import { detectRecurring } from '../utils/recurringDetection';
import { formatCurrency } from '../utils/formatting';

const RecurringTransactions = ({ transactions }) => {
  const [showInactive, setShowInactive] = useState(false);
  const recurring = useMemo(() => detectRecurring(transactions), [transactions]);

  const filtered = showInactive ? recurring : recurring.filter(r => r.isActive);
  const totalAnnual = filtered.reduce((sum, r) => sum + (r.type === 'expense' ? r.annualCost : 0), 0);

  if (recurring.length === 0) return null;

  const freqLabels = { weekly: 'Weekly', 'bi-weekly': 'Bi-weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' };

  return (
    <div className="mt-6 p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="text-lg font-semibold">Recurring Transactions</h2>
          <p className="text-sm text-gray-500">{filtered.length} detected patterns, ~{formatCurrency(totalAnnual)} CHF/year in expenses</p>
        </div>
        <label className="inline-flex items-center text-sm">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="form-checkbox h-4 w-4 text-blue-600 mr-1.5"
          />
          Show inactive
        </label>
      </div>

      <div className="max-h-80 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2 pr-2">Description</th>
              <th className="pb-2 pr-2 w-24">Frequency</th>
              <th className="pb-2 pr-2 w-24 text-right">Amount</th>
              <th className="pb-2 pr-2 w-28 text-right">Annual</th>
              <th className="pb-2 pr-2 w-20">Category</th>
              <th className="pb-2 w-16">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-1.5 pr-2">
                  <code className="bg-gray-100 px-1 rounded text-xs">{r.description.length > 50 ? r.description.slice(0, 50) + '...' : r.description}</code>
                </td>
                <td className="py-1.5 pr-2 text-gray-600">{freqLabels[r.frequency]}</td>
                <td className={`py-1.5 pr-2 text-right ${r.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                  {r.type === 'expense' ? '-' : '+'}{formatCurrency(r.avgAmount)}
                </td>
                <td className="py-1.5 pr-2 text-right font-medium">
                  {formatCurrency(r.annualCost)} CHF
                </td>
                <td className="py-1.5 pr-2 text-gray-500 text-xs">{r.category}</td>
                <td className="py-1.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {r.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecurringTransactions;
