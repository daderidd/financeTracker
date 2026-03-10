import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { COLORS } from '../utils/constants';

const MonthlyCategoryBreakdown = ({ data, categoryData, visibleCategories, onToggleCategoryVisibility }) => {
  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-lg font-semibold mb-4">Monthly Spending by Category (CHF/day, 3-month rolling average)</h2>

      {/* Category Selection Buttons */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {categoryData.map((category, index) => (
            <button
              key={category.name}
              onClick={() => onToggleCategoryVisibility(category.name)}
              className={`px-2 py-1 text-xs rounded-full`}
              style={{
                backgroundColor: visibleCategories.includes(category.name) ? COLORS[index % COLORS.length] : '#e5e7eb',
                color: visibleCategories.includes(category.name) ? 'white' : '#374151'
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis label={{ value: 'CHF / day', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              formatter={(value) => `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CHF/day`}
              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
            />
            {categoryData.map((category, index) => (
              visibleCategories.includes(category.name) && (
                <Bar
                  key={category.name}
                  dataKey={category.name}
                  stackId="a"
                  fill={COLORS[index % COLORS.length]}
                />
              )
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-sm text-gray-500 text-center">
        Smoothed spending per day by category. Each bar shows the 3-month rolling average to reduce monthly volatility. Click category buttons to show/hide.
      </div>
    </div>
  );
};

export default MonthlyCategoryBreakdown;
