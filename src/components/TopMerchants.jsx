import React, { useMemo } from 'react';
import { computeMerchantStats } from '../utils/merchantNormalization';
import { formatCurrency } from '../utils/formatting';

const TopMerchants = ({ transactions, merchantAliases }) => {
  const stats = useMemo(
    () => computeMerchantStats(transactions, merchantAliases),
    [transactions, merchantAliases]
  );

  const top10 = stats.slice(0, 10);
  if (top10.length === 0) return null;

  const maxSpent = top10[0]?.totalSpent || 1;

  return (
    <div className="mt-6 p-4 bg-white rounded shadow">
      <h2 className="text-lg font-semibold mb-3">Top Merchants</h2>
      <div className="space-y-2">
        {top10.map(m => (
          <div key={m.name}>
            <div className="flex justify-between text-sm mb-0.5">
              <span className="font-medium truncate mr-2">{m.name}</span>
              <span className="text-gray-600 whitespace-nowrap">{formatCurrency(m.totalSpent)} CHF ({m.count}x)</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full">
              <div
                className="h-2 bg-blue-400 rounded-full"
                style={{ width: `${(m.totalSpent / maxSpent) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopMerchants;
