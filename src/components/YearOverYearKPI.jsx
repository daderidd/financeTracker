import React, { useState } from 'react';
import { getAvailableYears, computeYearOverYearComparison } from '../utils/dataTransformations';
import { formatCurrency } from '../utils/formatting';

const YearOverYearKPI = ({ transactions, hideFromCharts }) => {
  const [comparisonYear1, setComparisonYear1] = useState('');
  const [comparisonYear2, setComparisonYear2] = useState('');
  const [comparisonLevel, setComparisonLevel] = useState('category');

  const availableYears = getAvailableYears(transactions);
  const comparison = computeYearOverYearComparison(transactions, comparisonYear1, comparisonYear2, comparisonLevel, hideFromCharts);

  return (
    <div className="mb-6 p-4 bg-white rounded shadow">
      <h2 className="text-lg font-semibold mb-4">Year-over-Year Category Comparison</h2>

      {/* Year Selection and Level Toggle */}
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Compare Year:</label>
          <select
            value={comparisonYear1}
            onChange={(e) => setComparisonYear1(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">Select Year</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To Year:</label>
          <select
            value={comparisonYear2}
            onChange={(e) => setComparisonYear2(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">Select Year</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">View By:</label>
          <div className="flex gap-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="category"
                checked={comparisonLevel === 'category'}
                onChange={(e) => setComparisonLevel(e.target.value)}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700">Category</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="subcategory"
                checked={comparisonLevel === 'subcategory'}
                onChange={(e) => setComparisonLevel(e.target.value)}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700">Subcategory</span>
            </label>
          </div>
        </div>
      </div>

      {/* KPI Display */}
      {!comparison ? (
        <div className="text-gray-500 text-center py-8">
          Select two years to compare spending by category
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top 5 Increases */}
          <div>
            <h3 className="text-md font-medium mb-2 text-red-600">📈 Top 5 Spending Increases</h3>
            {comparison.increases.length > 0 ? (
              <div className="space-y-2">
                {comparison.increases.map((item, index) => (
                  <div key={item.category} className="border-l-4 border-red-500 pl-2 py-1 bg-red-50">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-sm text-gray-800">{index + 1}. {item.category}</span>
                      <span className="text-red-600 font-bold text-sm">
                        +{formatCurrency(item.absoluteChange)} CHF
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {comparisonYear1}: {formatCurrency(item.year1Amount)} CHF → {comparisonYear2}: {formatCurrency(item.year2Amount)} CHF
                    </div>
                    <div className="text-xs font-medium text-red-700 mt-0.5">
                      +{item.percentChange.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">No increases found</div>
            )}
          </div>

          {/* Top 5 Decreases */}
          <div>
            <h3 className="text-md font-medium mb-2 text-green-600">📉 Top 5 Spending Decreases</h3>
            {comparison.decreases.length > 0 ? (
              <div className="space-y-2">
                {comparison.decreases.map((item, index) => (
                  <div key={item.category} className="border-l-4 border-green-500 pl-2 py-1 bg-green-50">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-sm text-gray-800">{index + 1}. {item.category}</span>
                      <span className="text-green-600 font-bold text-sm">
                        {formatCurrency(item.absoluteChange)} CHF
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {comparisonYear1}: {formatCurrency(item.year1Amount)} CHF → {comparisonYear2}: {formatCurrency(item.year2Amount)} CHF
                    </div>
                    <div className="text-xs font-medium text-green-700 mt-0.5">
                      {item.percentChange.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">No decreases found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default YearOverYearKPI;
