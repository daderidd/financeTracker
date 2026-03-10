import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { COLORS } from '../utils/constants';
import { computeRollingMean } from '../utils/dataTransformations';

const RollingMeanChart = ({ filteredTransactions, visibleCategories, onToggleCategoryVisibility }) => {
  const [rollingMeanDays, setRollingMeanDays] = useState(30);

  const rollingMeanData = useMemo(
    () => computeRollingMean(filteredTransactions, rollingMeanDays),
    [filteredTransactions, rollingMeanDays]
  );

  // Get unique categories from filtered transactions
  const categories = [...new Set(
    filteredTransactions
      .filter(t => t.category && t.category.name)
      .map(t => t.category.name)
  )];

  return (
    <div className="mt-6 p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Category Rolling Mean</h2>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Rolling period:</label>
          <select
            value={rollingMeanDays}
            onChange={(e) => setRollingMeanDays(parseInt(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-800"
          >
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
          </select>
        </div>
      </div>

      {/* Category Selection Buttons */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((category, index) => (
            <button
              key={category}
              onClick={() => onToggleCategoryVisibility(category)}
              className={`px-2 py-1 text-xs rounded-full`}
              style={{
                backgroundColor: visibleCategories.includes(category) ? COLORS[index % COLORS.length] : '#e5e7eb',
                color: visibleCategories.includes(category) ? 'white' : '#374151'
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Rolling Mean Chart */}
      <div className="h-80">
        {rollingMeanData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={rollingMeanData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="formattedDate"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
                minTickGap={30}
                angle={-45}
                textAnchor="end"
                height={50}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis />
              <Tooltip
                formatter={(value) => `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CHF/day`}
                labelFormatter={(label, payload) => {
                  if (payload && payload.length > 0 && payload[0].payload) {
                    return `Date: ${payload[0].payload.fullDate}`;
                  }
                  return `Date: ${label}`;
                }}
              />
              <Legend />
              {categories.map((category, index) => (
                visibleCategories.includes(category) && (
                  <Line
                    key={category}
                    type="monotone"
                    dataKey={category}
                    name={category}
                    stroke={COLORS[index % COLORS.length]}
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                    dot={false}
                  />
                )
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">Select categories above to see their rolling mean spending.</p>
          </div>
        )}
      </div>

      <div className="mt-2 text-sm text-gray-500 text-center">
        Daily average spending per category over a rolling {rollingMeanDays}-day period.
      </div>
    </div>
  );
};

export default RollingMeanChart;
