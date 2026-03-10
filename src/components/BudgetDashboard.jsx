import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../utils/formatting';

const getMonthSpan = (startDate, endDate) => {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
  return Math.max(1, months);
};

const BudgetDashboard = ({ budgets, setBudgets, categoryData, allCategories, editable, startDate, endDate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const monthSpan = useMemo(() => getMonthSpan(startDate, endDate), [startDate, endDate]);

  const budgetedCategories = Object.keys(budgets).filter(cat => budgets[cat] > 0);
  const availableCategories = (allCategories || []).filter(cat => !budgetedCategories.includes(cat));

  const handleAddBudget = () => {
    if (!newCategory || !newAmount || parseFloat(newAmount) <= 0) return;
    setBudgets(prev => ({ ...prev, [newCategory]: parseFloat(newAmount) }));
    setNewCategory('');
    setNewAmount('');
  };

  const handleUpdateAmount = (category, amount) => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) return;
    setBudgets(prev => ({ ...prev, [category]: value }));
  };

  const handleRemoveBudget = (category) => {
    setBudgets(prev => {
      const next = { ...prev };
      delete next[category];
      return next;
    });
  };

  // Build progress data sorted by % spent (highest first)
  // Scale budget by number of months in the filtered period
  // Include projected spend based on current spending rate
  const progressData = useMemo(() => {
    const now = new Date();
    const periodEnd = endDate ? new Date(endDate) : now;
    const periodStart = startDate ? new Date(startDate) : now;
    const totalDays = Math.max(1, (periodEnd - periodStart) / (1000 * 60 * 60 * 24) + 1);
    const daysElapsed = Math.max(1, Math.min(totalDays, (now - periodStart) / (1000 * 60 * 60 * 24) + 1));
    const isCurrentPeriod = now >= periodStart && now <= periodEnd;

    return budgetedCategories
      .map(category => {
        const spent = categoryData.find(c => c.name === category)?.value || 0;
        const scaledBudget = budgets[category] * monthSpan;
        const percent = scaledBudget > 0 ? spent / scaledBudget : 0;
        const projected = isCurrentPeriod ? (spent / daysElapsed) * totalDays : null;
        const projectedPercent = projected !== null && scaledBudget > 0 ? projected / scaledBudget : null;
        return { category, spent, budget: scaledBudget, monthlyBudget: budgets[category], percent, projected, projectedPercent };
      })
      .sort((a, b) => b.percent - a.percent);
  }, [budgetedCategories, categoryData, budgets, monthSpan, startDate, endDate]);

  const getBarColor = (percent) => {
    if (percent > 1) return 'bg-red-500';
    if (percent > 0.75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getBarBg = (percent) => {
    if (percent > 1) return 'bg-red-100';
    if (percent > 0.75) return 'bg-yellow-100';
    return 'bg-green-100';
  };

  // Read-only overview mode: just show progress bars (no edit controls)
  if (!editable) {
    if (budgetedCategories.length === 0) return null;

    return (
      <div className="mt-6 p-4 bg-white rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Budget Targets <span className="text-sm font-normal text-gray-500">({monthSpan === 1 ? 'this month' : `${monthSpan} months`})</span></h2>
        <div className="space-y-3">
          {progressData.map(({ category, spent, budget, percent, projected, projectedPercent }) => (
            <div key={category}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{category}</span>
                <span className={percent > 1 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                  {formatCurrency(spent)} / {formatCurrency(budget)} CHF
                  {percent > 1 && ` (+${formatCurrency(spent - budget)})`}
                </span>
              </div>
              <div className={`w-full h-3 rounded-full ${getBarBg(percent)} relative overflow-hidden`}>
                {projectedPercent !== null && projectedPercent > percent && (
                  <div
                    className="absolute h-3 rounded-full bg-current opacity-15"
                    style={{
                      width: `${Math.min(projectedPercent * 100, 150)}%`,
                      color: projectedPercent > 1 ? '#ef4444' : '#eab308',
                    }}
                  />
                )}
                <div
                  className={`h-3 rounded-full transition-all relative ${getBarColor(percent)}`}
                  style={{ width: `${Math.min(percent * 100, 150)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-0.5">
                <span className="text-gray-400">{(percent * 100).toFixed(0)}%</span>
                {projectedPercent !== null && (
                  <span className={projectedPercent > 1 ? 'text-red-500' : 'text-green-600'}>
                    {projectedPercent > 1
                      ? `Projected to exceed by ${formatCurrency(projected - budget)}`
                      : 'On track'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Editable mode (Settings tab)
  return (
    <div className="mt-6 p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Budget Targets <span className="text-sm font-normal text-gray-500">({monthSpan === 1 ? 'this month' : `${monthSpan} months`})</span></h2>
        {budgetedCategories.length > 0 && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded text-blue-800 text-sm"
          >
            {isEditing ? 'Done' : 'Edit'}
          </button>
        )}
      </div>

      {/* Progress bars */}
      {progressData.length > 0 && (
        <div className="space-y-3 mb-4">
          {progressData.map(({ category, spent, budget, percent, projected, projectedPercent }) => (
            <div key={category}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{category}</span>
                <span className={percent > 1 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                  {formatCurrency(spent)} / {formatCurrency(budget)} CHF
                  {percent > 1 && ` (+${formatCurrency(spent - budget)})`}
                </span>
              </div>
              <div className={`w-full h-3 rounded-full ${getBarBg(percent)} relative overflow-hidden`}>
                {projectedPercent !== null && projectedPercent > percent && (
                  <div
                    className="absolute h-3 rounded-full bg-current opacity-15"
                    style={{
                      width: `${Math.min(projectedPercent * 100, 150)}%`,
                      color: projectedPercent > 1 ? '#ef4444' : '#eab308',
                    }}
                  />
                )}
                <div
                  className={`h-3 rounded-full transition-all relative ${getBarColor(percent)}`}
                  style={{ width: `${Math.min(percent * 100, 150)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-0.5">
                <span className="text-gray-400">{(percent * 100).toFixed(0)}%</span>
                {projectedPercent !== null && (
                  <span className={projectedPercent > 1 ? 'text-red-500' : 'text-green-600'}>
                    {projectedPercent > 1
                      ? `Projected to exceed by ${formatCurrency(projected - budget)}`
                      : 'On track'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor (always accessible in settings) */}
      {(isEditing || budgetedCategories.length === 0) && (
        <div className={budgetedCategories.length > 0 ? 'border-t pt-4 mt-4' : ''}>
          {budgetedCategories.length === 0 && (
            <p className="text-gray-500 text-sm mb-3">No budget targets set. Add monthly spending targets per category.</p>
          )}

          {/* Existing budgets */}
          <div className="space-y-2 mb-3">
            {budgetedCategories.sort().map(category => (
              <div key={category} className="flex items-center space-x-2">
                <span className="text-sm w-40 truncate">{category}</span>
                <input
                  key={`${category}-${budgets[category]}`}
                  type="number"
                  defaultValue={budgets[category]}
                  onBlur={(e) => handleUpdateAmount(category, e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm w-28"
                  min="0"
                  step="10"
                />
                <span className="text-sm text-gray-500">CHF</span>
                <button
                  onClick={() => handleRemoveBudget(category)}
                  className="px-2 py-1 bg-red-100 hover:bg-red-200 rounded text-red-700 text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Add new budget */}
          {availableCategories.length > 0 && (
            <div className="flex items-center space-x-2">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm w-40"
              >
                <option value="">Select category...</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="Amount"
                className="border border-gray-300 rounded px-2 py-1 text-sm w-28"
                min="0"
                step="10"
              />
              <span className="text-sm text-gray-500">CHF</span>
              <button
                onClick={handleAddBudget}
                disabled={!newCategory || !newAmount || parseFloat(newAmount) <= 0}
                className={`px-3 py-1 rounded text-sm ${
                  !newCategory || !newAmount || parseFloat(newAmount) <= 0
                    ? 'bg-gray-200 text-gray-400'
                    : 'bg-green-100 hover:bg-green-200 text-green-800'
                }`}
              >
                Add
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BudgetDashboard;
