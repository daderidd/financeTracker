import React, { useMemo, useState } from 'react';
import { detectAnomalies, detectUnusualTransactions } from '../utils/anomalyDetection';
import { formatCurrency } from '../utils/formatting';

const AnomalyAlerts = ({ transactions }) => {
  const [dismissed, setDismissed] = useState(new Set());

  const categoryAnomalies = useMemo(() => detectAnomalies(transactions), [transactions]);
  const unusualTransactions = useMemo(() => detectUnusualTransactions(transactions), [transactions]);

  const allAlerts = useMemo(() => {
    const alerts = [];
    categoryAnomalies.forEach((a, i) => {
      const id = `cat-${a.category}`;
      if (dismissed.has(id)) return;
      alerts.push({
        id,
        type: a.direction === 'up' ? 'warning' : 'info',
        message: a.direction === 'up'
          ? `${a.category} spending is up ${Math.round(a.percentChange)}% this month (${formatCurrency(a.currentSpend)} vs avg ${formatCurrency(a.averageSpend)})`
          : `${a.category} spending is down ${Math.round(Math.abs(a.percentChange))}% this month (${formatCurrency(a.currentSpend)} vs avg ${formatCurrency(a.averageSpend)})`,
      });
    });
    unusualTransactions.forEach((u) => {
      const id = `tx-${u.transaction.id}`;
      if (dismissed.has(id)) return;
      const desc = u.transaction.description?.slice(0, 40) || 'Transaction';
      alerts.push({
        id,
        type: 'warning',
        message: `"${desc}" (${formatCurrency(u.amount)}) is ${u.ratio.toFixed(1)}x the median for ${u.category}`,
      });
    });
    return alerts;
  }, [categoryAnomalies, unusualTransactions, dismissed]);

  if (allAlerts.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-sm font-medium text-gray-600">Heads Up</h3>
      {allAlerts.map(alert => (
        <div
          key={alert.id}
          className={`flex items-start gap-2 p-2 rounded text-sm ${
            alert.type === 'warning' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'
          }`}
        >
          <span className="flex-1">{alert.message}</span>
          <button
            onClick={() => setDismissed(prev => new Set([...prev, alert.id]))}
            className="text-xs opacity-50 hover:opacity-100 shrink-0"
          >
            dismiss
          </button>
        </div>
      ))}
    </div>
  );
};

export default AnomalyAlerts;
