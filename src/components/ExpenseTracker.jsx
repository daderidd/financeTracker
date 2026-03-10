import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTransactionFilters } from '../hooks/useTransactionFilters';
import { parseCardTransactions, parseAccountTransactions, loadTransactionsFromFile, saveTransactionsToFile } from '../utils/csvParsing';
import { mergeTransactions } from '../utils/transactionUtils';
import { computeTotals, computeTotalsChartData, computeMonthlyData, computeCategoryData, computeSubcategoryData, computeMonthlyCategoryData, getAllCategories, getSubcategoriesForCategory } from '../utils/dataTransformations';
import FileUpload from './FileUpload';
import FilterControls from './FilterControls';
import MonthlyChart from './MonthlyChart';
import YearOverYearKPI from './YearOverYearKPI';
import CategoryPieCharts from './CategoryPieCharts';
import RollingMeanChart from './RollingMeanChart';
import MonthlyCategoryBreakdown from './MonthlyCategoryBreakdown';
import TransactionsTable from './TransactionsTable';

const ExpenseTracker = () => {
  // Core data state
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [activeCategory, setActiveCategory] = useState(null);
  const [visibleCategories, setVisibleCategories] = useState([]);

  // Filter hook
  const filters = useTransactionFilters(transactions);

  // Sync visibleCategories when categoryFilter changes
  useEffect(() => {
    if (filters.categoryFilter) {
      setVisibleCategories(prev =>
        prev.includes(filters.categoryFilter) ? prev : [...prev, filters.categoryFilter]
      );
    }
  }, [filters.categoryFilter]);

  // Memoized derived data (for charts — excludes hidden if hideFromCharts)
  const filteredForCharts = useMemo(
    () => filters.getFilteredTransactions(!filters.hideFromCharts),
    [filters.getFilteredTransactions, filters.hideFromCharts]
  );

  // Memoized derived data (for table — includes hidden)
  const filteredForTable = useMemo(
    () => filters.getFilteredTransactions(true),
    [filters.getFilteredTransactions]
  );

  const monthlyData = useMemo(() => computeMonthlyData(filteredForCharts), [filteredForCharts]);
  const totals = useMemo(() => computeTotals(filteredForCharts), [filteredForCharts]);
  const totalsChartData = useMemo(() => computeTotalsChartData(filteredForCharts), [filteredForCharts]);
  const categoryData = useMemo(() => computeCategoryData(filteredForCharts), [filteredForCharts]);
  const subcategoryData = useMemo(() => computeSubcategoryData(categoryData, activeCategory), [categoryData, activeCategory]);
  const monthlyCategoryData = useMemo(() => computeMonthlyCategoryData(filteredForCharts), [filteredForCharts]);
  const allCategories = useMemo(() => getAllCategories(transactions), [transactions]);

  // Handlers
  const handleFileUpload = useCallback(async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      let newTransactions = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.name.includes('card_transactions')) {
          const cardTransactions = await parseCardTransactions(file);
          newTransactions = [...newTransactions, ...cardTransactions];
        } else if (file.name.includes('account_transactions')) {
          const accountTransactions = await parseAccountTransactions(file);
          newTransactions = [...newTransactions, ...accountTransactions];
        }
      }

      newTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(newTransactions);

      if (newTransactions.length > 0) {
        const dates = newTransactions
          .filter(t => t.date)
          .map(t => t.date)
          .sort();

        if (dates.length > 0) {
          filters.setStartDate(dates[0]);
          filters.setEndDate(dates[dates.length - 1]);
        }
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLoadFile = useCallback(async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const allTransactionArrays = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Loading file ${i + 1}/${files.length}: ${file.name}`);
        const loaded = await loadTransactionsFromFile(file);
        allTransactionArrays.push(loaded);
        console.log(`Loaded ${loaded.length} transactions from ${file.name}`);
      }

      const mergedTransactions = mergeTransactions(allTransactionArrays);

      const totalLoaded = allTransactionArrays.reduce((sum, arr) => sum + arr.length, 0);
      const suspectedDuplicates = mergedTransactions.filter(t => t.hiddenReason === 'suspected_duplicate').length;

      console.log(`Total transactions loaded: ${totalLoaded}`);
      console.log(`Suspected duplicates marked as hidden: ${suspectedDuplicates}`);
      console.log(`Final merged transactions: ${mergedTransactions.length}`);

      setTransactions(mergedTransactions);

      if (mergedTransactions.length > 0) {
        const dates = mergedTransactions
          .filter(t => t.date)
          .map(t => t.date)
          .sort();

        if (dates.length > 0) {
          filters.setStartDate(dates[0]);
          filters.setEndDate(dates[dates.length - 1]);
        }
      }

      setError(
        `Successfully loaded ${files.length} file(s): ${mergedTransactions.length} total transactions (${suspectedDuplicates} suspected duplicates auto-hidden - you can unhide if needed)`
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
      event.target.value = null;
    }
  }, []);

  const handleSave = useCallback(() => {
    saveTransactionsToFile(transactions);
  }, [transactions]);

  const toggleHidden = useCallback((id) => {
    setTransactions(prev =>
      prev.map(t => t.id === id ? { ...t, hidden: !t.hidden } : t)
    );
  }, []);

  const hideAllFilteredTransactions = useCallback((hideValue = true) => {
    const filteredIds = filteredForTable.map(t => t.id);
    setTransactions(prev =>
      prev.map(t => filteredIds.includes(t.id) ? { ...t, hidden: hideValue } : t)
    );
  }, [filteredForTable]);

  const updateTransactionCategory = useCallback((transactionId, categoryName, subcategoryName) => {
    setTransactions(prev =>
      prev.map(t =>
        t.id === transactionId
          ? { ...t, category: { name: categoryName, sub: subcategoryName } }
          : t
      )
    );
  }, []);

  const toggleCategoryVisibility = useCallback((category) => {
    setVisibleCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  }, []);

  const handleCategoryClick = useCallback((categoryName) => {
    setActiveCategory(categoryName);
    filters.setCategoryFilter(categoryName);
    filters.setSubcategoryFilter(null);
  }, []);

  const handleClearCategoryFilters = useCallback(() => {
    filters.clearCategoryFilters();
    setActiveCategory(null);
  }, []);

  const handleResetFilters = useCallback(() => {
    filters.resetFilters();
    setActiveCategory(null);
  }, []);

  const getSubcategoriesForCategoryFn = useCallback((categoryName) => {
    return getSubcategoriesForCategory(transactions, categoryName);
  }, [transactions]);

  return (
    <div className="flex flex-col w-full p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Expense Tracker</h1>

      <FileUpload
        transactions={transactions}
        isLoading={isLoading}
        error={error}
        onFileUpload={handleFileUpload}
        onLoadFile={handleLoadFile}
        onSave={handleSave}
      />

      {transactions.length > 0 && (
        <>
          <FilterControls
            startDate={filters.startDate}
            setStartDate={filters.setStartDate}
            endDate={filters.endDate}
            setEndDate={filters.setEndDate}
            timeFilter={filters.timeFilter}
            setTimeFilter={filters.setTimeFilter}
            chartType={chartType}
            setChartType={setChartType}
            transactionTypeFilter={filters.transactionTypeFilter}
            setTransactionTypeFilter={filters.setTransactionTypeFilter}
            hideFromCharts={filters.hideFromCharts}
            setHideFromCharts={filters.setHideFromCharts}
            searchTerm={filters.searchTerm}
            setSearchTerm={filters.setSearchTerm}
            minAmount={filters.minAmount}
            setMinAmount={filters.setMinAmount}
            maxAmount={filters.maxAmount}
            setMaxAmount={filters.setMaxAmount}
            onResetFilters={handleResetFilters}
          />

          <MonthlyChart
            monthlyData={monthlyData}
            totalsChartData={totalsChartData}
            chartType={chartType}
          />

          <YearOverYearKPI
            transactions={transactions}
            hideFromCharts={filters.hideFromCharts}
          />

          <CategoryPieCharts
            categoryData={categoryData}
            subcategoryData={subcategoryData}
            activeCategory={activeCategory}
            categoryFilter={filters.categoryFilter}
            subcategoryFilter={filters.subcategoryFilter}
            totals={totals}
            transactionTypeFilter={filters.transactionTypeFilter}
            onCategoryClick={handleCategoryClick}
            onClearFilters={handleClearCategoryFilters}
          />

          <RollingMeanChart
            filteredTransactions={filteredForCharts}
            visibleCategories={visibleCategories}
            onToggleCategoryVisibility={toggleCategoryVisibility}
          />

          <MonthlyCategoryBreakdown
            data={monthlyCategoryData}
            categoryData={categoryData}
            visibleCategories={visibleCategories}
            onToggleCategoryVisibility={toggleCategoryVisibility}
          />

          <TransactionsTable
            filteredTransactions={filteredForTable}
            onToggleHidden={toggleHidden}
            onHideAllFiltered={hideAllFilteredTransactions}
            categoryFilter={filters.categoryFilter}
            subcategoryFilter={filters.subcategoryFilter}
            onClearCategoryFilters={handleClearCategoryFilters}
            sortConfig={filters.sortConfig}
            onRequestSort={filters.requestSort}
            allCategories={allCategories}
            getSubcategoriesForCategory={getSubcategoriesForCategoryFn}
            onUpdateCategory={updateTransactionCategory}
          />
        </>
      )}
    </div>
  );
};

export default ExpenseTracker;
