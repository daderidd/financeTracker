import { useState, useEffect, useCallback } from 'react';
import { sortTransactions } from '../utils/transactionUtils';

export const useTransactionFilters = (transactions) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState(['expense', 'income']);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [subcategoryFilter, setSubcategoryFilter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [hideFromCharts, setHideFromCharts] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });

  // Apply time filter when it changes
  const applyTimeFilter = () => {
    if (!transactions.length) return;

    const now = new Date();
    let newStartDate = '';

    switch (timeFilter) {
      case 'currentYear':
        newStartDate = `${now.getFullYear()}-01-01`;
        break;
      case 'lastMonth':
        now.setMonth(now.getMonth() - 1);
        newStartDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;
        now.setMonth(now.getMonth() + 1, 0);
        setEndDate(`${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`);
        break;
      case 'last3Months':
        now.setMonth(now.getMonth() - 3);
        newStartDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;
        break;
      case 'last6Months':
        now.setMonth(now.getMonth() - 6);
        newStartDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;
        break;
      case 'last12Months':
        now.setFullYear(now.getFullYear() - 1);
        newStartDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
        break;
      case 'last2Years':
        now.setFullYear(now.getFullYear() - 2);
        newStartDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
        break;
      default:
        // Reset to all transactions
        const dates = transactions
          .filter(t => t.date)
          .map(t => t.date)
          .sort();

        if (dates.length > 0) {
          newStartDate = dates[0];
          setEndDate(dates[dates.length - 1]);
        }
    }

    setStartDate(newStartDate);

    if (timeFilter !== 'lastMonth' && timeFilter !== 'all') {
      const today = new Date();
      setEndDate(`${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`);
    }
  };

  useEffect(() => {
    applyTimeFilter();
  }, [timeFilter]);

  // Filter transactions based on all filters
  const getFilteredTransactions = useCallback((includeHidden = true) => {
    const filtered = transactions.filter(transaction => {
      if (!transaction.date) return false;
      if (!includeHidden && transaction.hidden) return false;

      if (startDate && endDate) {
        if (transaction.date < startDate || transaction.date > endDate) {
          return false;
        }
      }

      if (!transactionTypeFilter.includes(transaction.type)) {
        return false;
      }

      if (categoryFilter && transaction.category?.name !== categoryFilter) {
        return false;
      }

      if (subcategoryFilter && transaction.category?.sub !== subcategoryFilter) {
        return false;
      }

      if (searchTerm && !transaction.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      if (minAmount !== '' && transaction.amount < parseFloat(minAmount)) {
        return false;
      }

      if (maxAmount !== '' && transaction.amount > parseFloat(maxAmount)) {
        return false;
      }

      return true;
    });

    return sortTransactions(filtered, sortConfig);
  }, [transactions, startDate, endDate, transactionTypeFilter, categoryFilter, subcategoryFilter, searchTerm, minAmount, maxAmount, sortConfig]);

  // Request sort when a column header is clicked
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Clear both category and subcategory filters
  const clearCategoryFilters = () => {
    setCategoryFilter(null);
    setSubcategoryFilter(null);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setMinAmount('');
    setMaxAmount('');
    setTransactionTypeFilter(['expense', 'income']);
    setTimeFilter('all');
    setCategoryFilter(null);
    setSubcategoryFilter(null);

    const dates = transactions
      .filter(t => t.date)
      .map(t => t.date)
      .sort();

    if (dates.length > 0) {
      setStartDate(dates[0]);
      setEndDate(dates[dates.length - 1]);
    }
  };

  return {
    // State
    startDate, setStartDate,
    endDate, setEndDate,
    timeFilter, setTimeFilter,
    transactionTypeFilter, setTransactionTypeFilter,
    categoryFilter, setCategoryFilter,
    subcategoryFilter, setSubcategoryFilter,
    searchTerm, setSearchTerm,
    minAmount, setMinAmount,
    maxAmount, setMaxAmount,
    hideFromCharts, setHideFromCharts,
    sortConfig,
    // Functions
    getFilteredTransactions,
    requestSort,
    clearCategoryFilters,
    resetFilters,
  };
};
