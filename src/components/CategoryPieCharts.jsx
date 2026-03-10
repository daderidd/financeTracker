import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { COLORS } from '../utils/constants';
import { formatCurrency } from '../utils/formatting';

const CategoryPieCharts = ({
  categoryData,
  subcategoryData,
  activeCategory,
  categoryFilter,
  subcategoryFilter,
  totals,
  transactionTypeFilter,
  onCategoryClick,
  onClearFilters,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-4 bg-white rounded shadow">
        {/* Total above pie chart */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {transactionTypeFilter.includes('expense') && !transactionTypeFilter.includes('income')
              ? 'Expense Categories'
              : transactionTypeFilter.includes('income') && !transactionTypeFilter.includes('expense')
              ? 'Income Categories'
              : 'Categories'}
          </h2>

          <div className="text-lg font-bold">
            {transactionTypeFilter.includes('expense') && !transactionTypeFilter.includes('income')
              ? `Total: ${formatCurrency(totals.expenses)} CHF`
              : transactionTypeFilter.includes('income') && !transactionTypeFilter.includes('expense')
              ? `Total: ${formatCurrency(totals.income)} CHF`
              : `Total: ${formatCurrency(totals.expenses + totals.income)} CHF`}
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                onClick={(data) => {
                  onCategoryClick(data.name);
                }}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CHF`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-medium">Categories</h3>
            {(categoryFilter || subcategoryFilter) && (
              <button
                onClick={onClearFilters}
                className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded text-gray-800"
              >
                Clear Filters
              </button>
            )}
          </div>
          <div className="space-y-1">
            {categoryData.map((category, index) => (
              <div
                key={index}
                className={`flex justify-between p-2 rounded cursor-pointer hover:bg-gray-100 ${
                  categoryFilter === category.name ? 'bg-blue-100' :
                  activeCategory === category.name ? 'bg-blue-50' : ''
                }`}
                onClick={() => {
                  onCategoryClick(category.name);
                }}
              >
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span>{category.name}</span>
                </div>
                <span className="font-medium">{category.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CHF</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subcategories Section */}
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-lg font-semibold mb-4">
          {activeCategory ? (
            subcategoryFilter
              ? `${activeCategory} - ${subcategoryFilter} Transactions`
              : `${activeCategory} Subcategories`
          ) : 'Select a category to view subcategories'}
        </h2>

        {activeCategory ? (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subcategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {subcategoryData.map((entry, index) => (
                      <Cell key={`subcell-${index}`} fill={COLORS[(index + 5) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value.toFixed(2)} CHF`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4">
              <h3 className="text-md font-medium mb-2">Subcategories</h3>
              <div className="space-y-1">
                {subcategoryData.map((subcategory, index) => (
                  <div
                    key={index}
                    className="flex justify-between p-2 rounded"
                  >
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: COLORS[(index + 5) % COLORS.length] }}
                      />
                      <span>{subcategory.name}</span>
                    </div>
                    <span className="font-medium">{subcategory.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CHF</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Click on a category to view subcategories
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPieCharts;
