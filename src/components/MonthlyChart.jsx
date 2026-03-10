import React from 'react';
import { LineChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const tooltipFormatter = (value) => `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CHF`;

const MonthlyChart = ({ monthlyData, totalsChartData, chartType }) => {
  return (
    <div className="mb-6 p-4 bg-white rounded shadow">
      <h2 className="text-lg font-semibold mb-4">Financial Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Chart */}
        <div>
          <h3 className="text-md font-medium mb-2">Monthly Breakdown</h3>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart
                  data={monthlyData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={tooltipFormatter} />
                  <Legend />
                  <Bar dataKey="expenses" name="Expenses" fill="#FF8042" />
                  <Bar dataKey="income" name="Income" fill="#0088FE" />
                </BarChart>
              ) : (
                <LineChart
                  data={monthlyData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={tooltipFormatter} />
                  <Legend />
                  <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#FF8042" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="income" name="Income" stroke="#0088FE" activeDot={{ r: 8 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Totals Chart */}
        <div>
          <h3 className="text-md font-medium mb-2">Period Totals</h3>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={totalsChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={tooltipFormatter} />
                <Legend />
                <Bar dataKey="expenses" name="Total Expenses" fill="#FF8042" />
                <Bar dataKey="income" name="Total Income" fill="#0088FE" />
                <Bar dataKey="balance" name="Balance" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyChart;
