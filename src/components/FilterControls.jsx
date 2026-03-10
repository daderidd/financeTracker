import React, { useState, useMemo } from 'react';

const FilterControls = ({
  startDate, setStartDate,
  endDate, setEndDate,
  timeFilter, setTimeFilter,
  chartType, setChartType,
  transactionTypeFilter, setTransactionTypeFilter,
  hideFromCharts, setHideFromCharts,
  searchTerm, setSearchTerm,
  minAmount, setMinAmount,
  maxAmount, setMaxAmount,
  onResetFilters,
}) => {
  const [expanded, setExpanded] = useState(false);

  const timeFilterLabels = {
    all: 'All Time', currentYear: 'Current Year', lastMonth: 'Last Month',
    last3Months: 'Last 3 Months', last6Months: 'Last 6 Months',
    last12Months: 'Last 12 Months', last2Years: 'Last 2 Years',
  };

  // Active filter badges
  const badges = useMemo(() => {
    const b = [];
    if (timeFilter !== 'all') b.push({ label: timeFilterLabels[timeFilter], onRemove: () => setTimeFilter('all') });
    if (searchTerm) b.push({ label: `Search: "${searchTerm}"`, onRemove: () => setSearchTerm('') });
    if (minAmount) b.push({ label: `Min: ${minAmount} CHF`, onRemove: () => setMinAmount('') });
    if (maxAmount) b.push({ label: `Max: ${maxAmount} CHF`, onRemove: () => setMaxAmount('') });
    if (!transactionTypeFilter.includes('expense')) b.push({ label: 'No expenses', onRemove: () => setTransactionTypeFilter(prev => [...prev, 'expense']) });
    if (!transactionTypeFilter.includes('income')) b.push({ label: 'No income', onRemove: () => setTransactionTypeFilter(prev => [...prev, 'income']) });
    if (hideFromCharts) b.push({ label: 'Hiding from charts', onRemove: () => setHideFromCharts(false) });
    return b;
  }, [timeFilter, searchTerm, minAmount, maxAmount, transactionTypeFilter, hideFromCharts]);

  return (
    <div className="mb-4 p-4 bg-white rounded shadow">
      {/* Primary row: always visible */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Start</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-800"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">End</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-800"
          />
        </div>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-800"
        >
          {Object.entries(timeFilterLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <div className="relative flex-1 min-w-[150px]">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search descriptions..."
            className="border border-gray-300 rounded px-2 py-1 text-sm w-full bg-white text-gray-800"
          />
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded border border-gray-200"
        >
          {expanded ? 'Less' : 'More filters'}
        </button>
        <button
          onClick={onResetFilters}
          className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 text-gray-700"
        >
          Reset
        </button>
      </div>

      {/* Active filter badges */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {badges.map((badge, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
              {badge.label}
              <button onClick={badge.onRemove} className="hover:text-blue-900 font-medium">x</button>
            </span>
          ))}
        </div>
      )}

      {/* Expanded filters */}
      {expanded && (
        <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Chart Type</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-800"
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Transaction Types</label>
            <div className="flex gap-3">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={transactionTypeFilter.includes('expense')}
                  onChange={(e) => {
                    if (e.target.checked) setTransactionTypeFilter(prev => [...prev, 'expense']);
                    else setTransactionTypeFilter(prev => prev.filter(t => t !== 'expense'));
                  }}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <span className="ml-1.5 text-sm text-gray-700">Expenses</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={transactionTypeFilter.includes('income')}
                  onChange={(e) => {
                    if (e.target.checked) setTransactionTypeFilter(prev => [...prev, 'income']);
                    else setTransactionTypeFilter(prev => prev.filter(t => t !== 'income'));
                  }}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <span className="ml-1.5 text-sm text-gray-700">Income</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Hide from charts</label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={hideFromCharts}
                onChange={(e) => setHideFromCharts(e.target.checked)}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <span className="ml-1.5 text-sm text-gray-700">Exclude hidden</span>
            </label>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Min (CHF)</label>
            <input
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="0"
              className="border border-gray-300 rounded px-2 py-1 text-sm w-24 bg-white text-gray-800"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Max (CHF)</label>
            <input
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              placeholder="..."
              className="border border-gray-300 rounded px-2 py-1 text-sm w-24 bg-white text-gray-800"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterControls;
