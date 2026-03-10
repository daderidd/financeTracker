import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTransactionFilters } from '../hooks/useTransactionFilters';
import { parseCardTransactions, parseAccountTransactions, loadTransactionsFromFile, saveTransactionsToFile } from '../utils/csvParsing';
import { mergeTransactions } from '../utils/transactionUtils';
import { categorizeTransaction, buildMappingsIndex, learnFromEdit } from '../utils/categorize';
import { computeTotals, computeTotalsChartData, computeMonthlyData, computeCategoryData, computeSubcategoryData, computeMonthlyCategoryData, getAllCategories, getSubcategoriesForCategory } from '../utils/dataTransformations';
import { saveState, loadState } from '../utils/persistence';
import AnomalyAlerts from './AnomalyAlerts';
import CashFlowDiagram from './CashFlowDiagram';
import CommandPalette from './CommandPalette';
import ExportMenu from './ExportMenu';
import FileUpload from './FileUpload';
import FilterControls from './FilterControls';
import MonthlyChart from './MonthlyChart';
import RecurringTransactions from './RecurringTransactions';
import YearOverYearKPI from './YearOverYearKPI';
import CategoryPieCharts from './CategoryPieCharts';
import RollingMeanChart from './RollingMeanChart';
import MonthlyCategoryBreakdown from './MonthlyCategoryBreakdown';
import BudgetDashboard from './BudgetDashboard';
import CategoryRulesEditor from './CategoryRulesEditor';
import LearnedMappingsViewer from './LearnedMappingsViewer';
import SummaryBar from './SummaryBar';
import TopMerchants from './TopMerchants';
import Toast from './Toast';
import SplitTransactionModal from './SplitTransactionModal';
import TransactionsTable from './TransactionsTable';

const ExpenseTracker = () => {
  // Core data state
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [customRules, setCustomRules] = useState([]);
  const [learnedMappings, setLearnedMappings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [activeCategory, setActiveCategory] = useState(null);
  const [visibleCategories, setVisibleCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [autoSaveStatus, setAutoSaveStatus] = useState(null); // 'saving' | 'saved' | 'error'
  const [toast, setToast] = useState(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [splittingTransaction, setSplittingTransaction] = useState(null);
  const hasHydrated = useRef(false);

  // Filter hook
  const filters = useTransactionFilters(transactions);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && transactions.length > 0) {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [transactions.length]);

  const commandActions = useMemo(() => [
    { id: 'overview', label: 'Go to Overview', keywords: 'tab budget chart', shortcut: '', onSelect: () => setActiveTab('overview') },
    { id: 'categories', label: 'Go to Categories', keywords: 'tab pie merchant', shortcut: '', onSelect: () => setActiveTab('categories') },
    { id: 'transactions', label: 'Go to Transactions', keywords: 'tab table list', shortcut: '', onSelect: () => setActiveTab('transactions') },
    { id: 'settings', label: 'Go to Settings', keywords: 'tab rules budget config', shortcut: '', onSelect: () => setActiveTab('settings') },
    { id: 'reset', label: 'Reset All Filters', keywords: 'clear', onSelect: () => { handleResetFilters(); } },
    { id: 'thisMonth', label: 'Filter: This Month', keywords: 'time period', onSelect: () => filters.setTimeFilter('lastMonth') },
    { id: 'last3m', label: 'Filter: Last 3 Months', keywords: 'time period', onSelect: () => filters.setTimeFilter('last3Months') },
    { id: 'last12m', label: 'Filter: Last 12 Months', keywords: 'time period', onSelect: () => filters.setTimeFilter('last12Months') },
    { id: 'allTime', label: 'Filter: All Time', keywords: 'time period', onSelect: () => filters.setTimeFilter('all') },
    { id: 'save', label: 'Export Backup (JSON)', keywords: 'download save', shortcut: 'Cmd+S', onSelect: () => handleSave() },
  ], []);

  // Auto-load from IndexedDB on mount
  useEffect(() => {
    loadState().then(saved => {
      if (saved && Array.isArray(saved.transactions) && saved.transactions.length > 0) {
        setTransactions(saved.transactions);
        if (saved.budgets) setBudgets(saved.budgets);
        if (saved.customRules) setCustomRules(saved.customRules);
        if (saved.learnedMappings) setLearnedMappings(saved.learnedMappings);

        const dates = saved.transactions.filter(t => t.date).map(t => t.date).sort();
        if (dates.length > 0) {
          filters.setStartDate(dates[0]);
          filters.setEndDate(dates[dates.length - 1]);
        }
        setAutoSaveStatus('saved');
      }
      hasHydrated.current = true;
    });
  }, []);

  // Auto-save to IndexedDB (debounced 2s)
  useEffect(() => {
    if (!hasHydrated.current || transactions.length === 0) return;
    const timer = setTimeout(() => {
      setAutoSaveStatus('saving');
      saveState({ version: 2, transactions, budgets, customRules, learnedMappings })
        .then(() => setAutoSaveStatus('saved'))
        .catch(() => setAutoSaveStatus('error'));
    }, 2000);
    return () => clearTimeout(timer);
  }, [transactions, budgets, customRules, learnedMappings]);

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
  const learnedMappingsIndex = useMemo(() => buildMappingsIndex(learnedMappings), [learnedMappings]);

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

      if (newTransactions.length === 0) {
        const names = Array.from(files).map(f => f.name).join(', ');
        setError(`No transactions found in: ${names}. Files must be named card_transactions*.csv or account_transactions*.csv.`);
        setIsLoading(false);
        return;
      }

      // Re-categorize using full chain (custom rules + learned mappings + hardcoded)
      newTransactions = newTransactions.map(t => ({
        ...t,
        category: categorizeTransaction(t, customRules, learnedMappingsIndex),
      }));

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
  }, [customRules, learnedMappingsIndex]);

  const handleLoadFile = useCallback(async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const allTransactionArrays = [];
      let mergedBudgets = {};
      let mergedRules = [];
      let mergedLearnedMappings = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Loading file ${i + 1}/${files.length}: ${file.name}`);
        const { transactions: loaded, budgets: fileBudgets, customRules: fileRules, learnedMappings: fileMappings } = await loadTransactionsFromFile(file);
        allTransactionArrays.push(loaded);
        mergedBudgets = { ...mergedBudgets, ...fileBudgets };
        if (fileRules?.length) {
          const existingKeys = new Set(mergedRules.map(r => `${r.keyword}|${r.category}|${r.subcategory}`));
          const newRules = fileRules.filter(r => !existingKeys.has(`${r.keyword}|${r.category}|${r.subcategory}`));
          mergedRules = [...mergedRules, ...newRules];
        }
        if (fileMappings?.length) {
          // Deduplicate by normalized description (first seen wins)
          const existingDescs = new Set(mergedLearnedMappings.map(m => m.description));
          const newMappings = fileMappings.filter(m => !existingDescs.has(m.description));
          mergedLearnedMappings = [...mergedLearnedMappings, ...newMappings];
        }
        console.log(`Loaded ${loaded.length} transactions from ${file.name}`);
      }

      const mergedTransactions = mergeTransactions(allTransactionArrays);

      const totalLoaded = allTransactionArrays.reduce((sum, arr) => sum + arr.length, 0);
      const suspectedDuplicates = mergedTransactions.filter(t => t.hiddenReason === 'suspected_duplicate').length;

      console.log(`Total transactions loaded: ${totalLoaded}`);
      console.log(`Suspected duplicates marked as hidden: ${suspectedDuplicates}`);
      console.log(`Final merged transactions: ${mergedTransactions.length}`);

      setTransactions(mergedTransactions);
      setBudgets(mergedBudgets);
      setCustomRules(mergedRules);
      setLearnedMappings(mergedLearnedMappings);

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
    saveTransactionsToFile(transactions, budgets, customRules, learnedMappings);
  }, [transactions, budgets, customRules, learnedMappings]);

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
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    const prevCategory = transaction.category;
    const prevMappings = learnedMappings;

    setLearnedMappings(prev => learnFromEdit(prev, transaction, categoryName, subcategoryName));
    setTransactions(prev =>
      prev.map(t =>
        t.id === transactionId
          ? { ...t, category: { name: categoryName, sub: subcategoryName } }
          : t
      )
    );

    const desc = transaction.description?.slice(0, 30) || 'Transaction';
    setToast({
      message: `"${desc}" → ${categoryName}${subcategoryName ? ` / ${subcategoryName}` : ''}`,
      onUndo: () => {
        setTransactions(prev =>
          prev.map(t => t.id === transactionId ? { ...t, category: prevCategory } : t)
        );
        setLearnedMappings(prevMappings);
      },
    });
  }, [transactions, learnedMappings]);

  const handleSplitTransaction = useCallback((transactionId, splits) => {
    setTransactions(prev => {
      const original = prev.find(t => t.id === transactionId);
      if (!original) return prev;

      // Hide the original and create split children
      const splitTxs = splits.map((split, i) => ({
        ...original,
        id: `${original.id}-split-${i}`,
        parentId: original.id,
        value: original.type === 'expense' ? -split.amount : split.amount,
        amount: split.amount,
        category: { name: split.category, sub: split.subcategory || '' },
        description: `${original.description} [${split.category}]`,
        isSplit: true,
      }));

      return prev
        .map(t => t.id === transactionId ? { ...t, hidden: true, hasSplits: true } : t)
        .concat(splitTxs);
    });
    setSplittingTransaction(null);
  }, []);

  const handleDateRangeSelect = useCallback((start, end) => {
    filters.setStartDate(start);
    filters.setEndDate(end);
    filters.setTimeFilter('all');
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

  const handleReapplyRules = useCallback(() => {
    setTransactions(prev => prev.map(t => ({
      ...t,
      category: categorizeTransaction(t, customRules, learnedMappingsIndex),
    })));
  }, [customRules, learnedMappingsIndex]);

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
        autoSaveStatus={autoSaveStatus}
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

          <div className="flex flex-wrap items-end justify-between gap-2">
            <SummaryBar
              totals={totals}
              transactionCount={filteredForCharts.length}
              budgets={budgets}
              categoryData={categoryData}
              startDate={filters.startDate}
              endDate={filters.endDate}
            />
            <ExportMenu
              totals={totals}
              categoryData={categoryData}
              startDate={filters.startDate}
              endDate={filters.endDate}
              budgets={budgets}
            />
          </div>

          {/* Tab navigation */}
          <div className="mt-4 border-b border-gray-200 overflow-x-auto">
            <div role="tablist" aria-label="Dashboard sections" className="flex space-x-1 min-w-max">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'categories', label: 'Categories' },
                { key: 'transactions', label: `Transactions (${filteredForTable.length})` },
                { key: 'settings', label: 'Settings' },
              ].map((tab, i, tabs) => (
                <button
                  key={tab.key}
                  role="tab"
                  id={`tab-${tab.key}`}
                  aria-selected={activeTab === tab.key}
                  aria-controls={`tabpanel-${tab.key}`}
                  tabIndex={activeTab === tab.key ? 0 : -1}
                  onClick={() => setActiveTab(tab.key)}
                  onKeyDown={(e) => {
                    const keys = tabs.map(t => t.key);
                    const idx = keys.indexOf(activeTab);
                    let newIdx;
                    if (e.key === 'ArrowRight') newIdx = (idx + 1) % keys.length;
                    else if (e.key === 'ArrowLeft') newIdx = (idx - 1 + keys.length) % keys.length;
                    else if (e.key === 'Home') newIdx = 0;
                    else if (e.key === 'End') newIdx = keys.length - 1;
                    else return;
                    e.preventDefault();
                    setActiveTab(keys[newIdx]);
                    document.getElementById(`tab-${keys[newIdx]}`)?.focus();
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                    activeTab === tab.key
                      ? 'bg-white text-blue-600 border border-gray-200 border-b-white -mb-px'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab panels — use display:none to preserve state across tab switches */}
          <div role="tabpanel" id="tabpanel-overview" aria-labelledby="tab-overview"
               style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
            <BudgetDashboard
              budgets={budgets}
              categoryData={categoryData}
              startDate={filters.startDate}
              endDate={filters.endDate}
            />

            <MonthlyChart
              monthlyData={monthlyData}
              totalsChartData={totalsChartData}
              chartType={chartType}
              onDateRangeSelect={handleDateRangeSelect}
            />

            <CashFlowDiagram totals={totals} categoryData={categoryData} />

            <AnomalyAlerts transactions={transactions} />

            <YearOverYearKPI
              transactions={transactions}
              hideFromCharts={filters.hideFromCharts}
            />

            <RecurringTransactions transactions={transactions} />
          </div>

          <div role="tabpanel" id="tabpanel-categories" aria-labelledby="tab-categories"
               style={{ display: activeTab === 'categories' ? 'block' : 'none' }}>
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

            <TopMerchants transactions={filteredForCharts} />
          </div>

          <div role="tabpanel" id="tabpanel-transactions" aria-labelledby="tab-transactions"
               style={{ display: activeTab === 'transactions' ? 'block' : 'none' }}>
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
              onSplitTransaction={(t) => setSplittingTransaction(t)}
            />
          </div>

          <div role="tabpanel" id="tabpanel-settings" aria-labelledby="tab-settings"
               style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
            <BudgetDashboard
              budgets={budgets}
              setBudgets={setBudgets}
              categoryData={categoryData}
              allCategories={allCategories}
              startDate={filters.startDate}
              endDate={filters.endDate}
              editable
            />

            <CategoryRulesEditor
              customRules={customRules}
              setCustomRules={setCustomRules}
              allCategories={allCategories}
              onReapplyRules={handleReapplyRules}
            />

            <LearnedMappingsViewer
              learnedMappings={learnedMappings}
              setLearnedMappings={setLearnedMappings}
              onReapplyRules={handleReapplyRules}
            />
          </div>
        </>
      )}

      {splittingTransaction && (
        <SplitTransactionModal
          transaction={splittingTransaction}
          allCategories={allCategories}
          getSubcategoriesForCategory={getSubcategoriesForCategoryFn}
          onSave={handleSplitTransaction}
          onClose={() => setSplittingTransaction(null)}
        />
      )}

      <CommandPalette
        actions={commandActions}
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {toast && (
        <Toast
          key={Date.now()}
          message={toast.message}
          onUndo={toast.onUndo}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ExpenseTracker;
