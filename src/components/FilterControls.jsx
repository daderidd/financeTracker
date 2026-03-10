import React from 'react';

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
  return (
    <div className="mb-6 p-4 bg-white rounded shadow">
      <h2 className="text-lg font-semibold mb-2">Filter Transactions</h2>

      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 bg-white text-gray-800"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 bg-white text-gray-800"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Time Period</label>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 bg-white text-gray-800"
          >
            <option value="all">All Time</option>
            <option value="currentYear">Current Year</option>
            <option value="lastMonth">Last Month</option>
            <option value="last3Months">Last 3 Months</option>
            <option value="last6Months">Last 6 Months</option>
            <option value="last12Months">Last 12 Months</option>
            <option value="last2Years">Last 2 Years</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Chart Type</label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 bg-white text-gray-800"
          >
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Transaction Types</label>
          <div className="flex gap-2">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={transactionTypeFilter.includes('expense')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setTransactionTypeFilter(prev => [...prev, 'expense']);
                  } else {
                    setTransactionTypeFilter(prev => prev.filter(type => type !== 'expense'));
                  }
                }}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700">Expenses</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={transactionTypeFilter.includes('income')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setTransactionTypeFilter(prev => [...prev, 'income']);
                  } else {
                    setTransactionTypeFilter(prev => prev.filter(type => type !== 'income'));
                  }
                }}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700">Income</span>
            </label>
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Chart Options</label>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={hideFromCharts}
              onChange={(e) => setHideFromCharts(e.target.checked)}
              className="form-checkbox h-4 w-4 text-blue-600"
            />
            <span className="ml-2 text-sm text-gray-700">Hide selected transactions from charts</span>
          </label>
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Search in Description</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter search term..."
            className="border border-gray-300 rounded px-2 py-1 bg-white text-gray-800"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Min Amount (CHF)</label>
          <input
            type="number"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            placeholder="Min"
            className="border border-gray-300 rounded px-2 py-1 bg-white text-gray-800"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Max Amount (CHF)</label>
          <input
            type="number"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            placeholder="Max"
            className="border border-gray-300 rounded px-2 py-1 bg-white text-gray-800"
          />
        </div>

        <div className="flex flex-col justify-end">
          <button
            onClick={onResetFilters}
            className="px-4 py-1 bg-gray-200 rounded hover:bg-gray-300 text-gray-800"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterControls;
