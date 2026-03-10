import React, { useCallback } from 'react';
import { LineChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';

const tooltipFormatter = (value) => `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CHF`;

const MonthlyChart = ({ monthlyData, totalsChartData, chartType, onDateRangeSelect }) => {
  const handleBrushChange = useCallback((range) => {
    if (!range || !monthlyData || monthlyData.length === 0) return;
    const { startIndex, endIndex } = range;
    const startMonth = monthlyData[startIndex]?.month;
    const endMonth = monthlyData[endIndex]?.month;
    if (startMonth && endMonth && onDateRangeSelect) {
      // Convert "Jan 2025" format to date string
      const parseMonth = (str) => {
        const [mon, year] = str.split(' ');
        const months = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
        return `${year}-${months[mon] || '01'}`;
      };
      const start = parseMonth(startMonth);
      const end = parseMonth(endMonth);
      onDateRangeSelect(`${start}-01`, `${end}-28`);
    }
  }, [monthlyData, onDateRangeSelect]);

  const ChartComponent = chartType === 'bar' ? BarChart : LineChart;

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
                  {monthlyData.length > 3 && (
                    <Brush dataKey="month" height={20} stroke="#8884d8" onChange={handleBrushChange} />
                  )}
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
                  {monthlyData.length > 3 && (
                    <Brush dataKey="month" height={20} stroke="#8884d8" onChange={handleBrushChange} />
                  )}
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
