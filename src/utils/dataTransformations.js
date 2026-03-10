import { formatMonth, formatRollingMeanDate, formatTooltipDate } from './formatting';

// Calculate totals for the selected period
export const computeTotals = (filteredTransactions) => {
  let totalExpenses = 0;
  let totalIncome = 0;

  filteredTransactions.forEach(transaction => {
    if (transaction.type === 'expense') {
      totalExpenses += Math.abs(transaction.value);
    } else if (transaction.type === 'income') {
      totalIncome += transaction.value;
    }
  });

  return {
    expenses: parseFloat(totalExpenses.toFixed(2)),
    income: parseFloat(totalIncome.toFixed(2)),
    balance: parseFloat((totalIncome - totalExpenses).toFixed(2))
  };
};

// Format data for the totals chart
export const computeTotalsChartData = (filteredTransactions) => {
  const totals = computeTotals(filteredTransactions);
  return [
    {
      name: 'Period Total',
      expenses: totals.expenses,
      income: totals.income,
      balance: totals.balance
    }
  ];
};

// Group transactions by month for the chart
export const computeMonthlyData = (filteredTransactions) => {
  const monthlyData = {};

  filteredTransactions.forEach(transaction => {
    if (!transaction.date) return;

    const yearMonth = transaction.date.substring(0, 7);

    if (!monthlyData[yearMonth]) {
      monthlyData[yearMonth] = {
        month: yearMonth,
        expenses: 0,
        income: 0
      };
    }

    if (transaction.type === 'expense') {
      monthlyData[yearMonth].expenses += Math.abs(transaction.value);
    } else if (transaction.type === 'income') {
      monthlyData[yearMonth].income += transaction.value;
    }
  });

  return Object.values(monthlyData)
    .map(month => {
      const [year, monthNum] = month.month.split('-');

      return {
        ...month,
        month: formatMonth(month.month),
        expenses: parseFloat(month.expenses.toFixed(2)),
        income: parseFloat(month.income.toFixed(2)),
        sortKey: new Date(parseInt(year), parseInt(monthNum) - 1, 1).getTime()
      };
    })
    .sort((a, b) => a.sortKey - b.sortKey);
};

// Group transactions by category for the pie chart
export const computeCategoryData = (filteredTransactions) => {
  const categories = {};

  filteredTransactions.forEach(transaction => {
    const categoryName = transaction.category?.name || 'Miscellaneous';

    if (!categories[categoryName]) {
      categories[categoryName] = {
        name: categoryName,
        value: 0,
        subcategories: {}
      };
    }

    const transactionValue = Math.abs(transaction.value);
    categories[categoryName].value += transactionValue;

    const subName = transaction.category?.sub || 'Other';
    if (!categories[categoryName].subcategories[subName]) {
      categories[categoryName].subcategories[subName] = 0;
    }

    categories[categoryName].subcategories[subName] += transactionValue;
  });

  return Object.values(categories)
    .map(category => ({
      ...category,
      value: parseFloat(category.value.toFixed(2)),
      subcategories: Object.entries(category.subcategories).map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2))
      }))
    }))
    .sort((a, b) => b.value - a.value);
};

// Get subcategory data for the selected category
export const computeSubcategoryData = (categoryData, activeCategory) => {
  if (!activeCategory) return [];

  const category = categoryData.find(c => c.name === activeCategory);
  return category ? category.subcategories.sort((a, b) => b.value - a.value) : [];
};

// Get monthly spending by category with 3-month rolling average (CHF/day)
export const computeMonthlyCategoryData = (filteredTransactions) => {
  const monthlyByCategory = {};

  filteredTransactions.forEach(transaction => {
    if (!transaction.date || transaction.type !== 'expense') return;

    const yearMonth = transaction.date.substring(0, 7);
    const categoryName = transaction.category?.name || 'Miscellaneous';

    if (!monthlyByCategory[yearMonth]) {
      monthlyByCategory[yearMonth] = {};
    }

    if (!monthlyByCategory[yearMonth][categoryName]) {
      monthlyByCategory[yearMonth][categoryName] = 0;
    }

    monthlyByCategory[yearMonth][categoryName] += Math.abs(transaction.value);
  });

  const allCategories = new Set();
  Object.values(monthlyByCategory).forEach(monthData => {
    Object.keys(monthData).forEach(cat => allCategories.add(cat));
  });

  const sortedMonths = Object.keys(monthlyByCategory).sort();

  const getDaysInMonth = (yearMonth) => {
    const [year, month] = yearMonth.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  };

  const dailyData = sortedMonths.map(yearMonth => {
    const daysInMonth = getDaysInMonth(yearMonth);
    const result = { month: yearMonth };

    allCategories.forEach(category => {
      const totalAmount = monthlyByCategory[yearMonth][category] || 0;
      result[category] = totalAmount / daysInMonth;
    });

    return result;
  });

  const smoothedData = dailyData.map((current, index) => {
    const result = { month: current.month };

    allCategories.forEach(category => {
      let sum = 0;
      let count = 0;

      for (let i = Math.max(0, index - 2); i <= index; i++) {
        sum += dailyData[i][category] || 0;
        count++;
      }

      result[category] = parseFloat((sum / count).toFixed(2));
    });

    return result;
  });

  return smoothedData.map(month => ({
    ...month,
    month: formatMonth(month.month)
  }));
};

// Compute rolling mean spending per category over N days
// Uses a sliding window approach for O(n) per category instead of O(n²)
export const computeRollingMean = (filteredTransactions, rollingMeanDays) => {
  if (filteredTransactions.length === 0) {
    return [];
  }

  // Pre-compute timestamps once and sort
  const withTimestamps = filteredTransactions
    .filter(t => t.date)
    .map(t => ({ ...t, _ts: new Date(t.date).getTime() }))
    .sort((a, b) => a._ts - b._ts);

  const uniqueDates = [...new Set(withTimestamps.map(t => t.date))].sort();
  const categories = [...new Set(
    withTimestamps
      .filter(t => t.category && t.category.name)
      .map(t => t.category.name)
  )];

  // Pre-group sorted transactions by category for sliding window
  const byCategory = {};
  categories.forEach(cat => {
    byCategory[cat] = withTimestamps.filter(t => t.category?.name === cat);
  });

  const windowMs = (rollingMeanDays - 1) * 86400000; // days to ms (inclusive window)
  const result = [];

  // Sliding window: track left pointer and running sum per category
  const leftIdx = {};
  const runningSum = {};
  categories.forEach(cat => {
    leftIdx[cat] = 0;
    runningSum[cat] = 0;
  });

  // Right pointer per category (transactions added up to current date)
  const rightIdx = {};
  categories.forEach(cat => {
    rightIdx[cat] = 0;
  });

  for (let i = 0; i < uniqueDates.length; i++) {
    const currentTs = new Date(uniqueDates[i]).getTime();
    const windowStart = currentTs - windowMs;

    const dateEntry = {
      date: uniqueDates[i],
      formattedDate: formatRollingMeanDate(uniqueDates[i]),
      fullDate: formatTooltipDate(uniqueDates[i]),
    };

    categories.forEach(category => {
      const catTransactions = byCategory[category];

      // Advance right pointer: add transactions up to currentTs
      while (rightIdx[category] < catTransactions.length &&
             catTransactions[rightIdx[category]]._ts <= currentTs) {
        runningSum[category] += Math.abs(catTransactions[rightIdx[category]].value);
        rightIdx[category]++;
      }

      // Advance left pointer: remove transactions before windowStart
      while (leftIdx[category] < catTransactions.length &&
             catTransactions[leftIdx[category]]._ts < windowStart) {
        runningSum[category] -= Math.abs(catTransactions[leftIdx[category]].value);
        leftIdx[category]++;
      }

      const mean = runningSum[category] / rollingMeanDays;
      dateEntry[category] = parseFloat(mean.toFixed(2));
    });

    result.push(dateEntry);
  }

  return result;
};

// Get all unique years from transactions
export const getAvailableYears = (transactions) => {
  const years = new Set();
  transactions.forEach(transaction => {
    if (transaction.date) {
      const year = transaction.date.substring(0, 4);
      years.add(year);
    }
  });
  return Array.from(years).sort((a, b) => b - a);
};

// Calculate year-over-year category/subcategory changes
export const computeYearOverYearComparison = (transactions, comparisonYear1, comparisonYear2, comparisonLevel, hideFromCharts) => {
  if (!comparisonYear1 || !comparisonYear2) return null;

  const getYearSpending = (year) => {
    const yearTransactions = transactions.filter(t =>
      t.date &&
      t.date.startsWith(year) &&
      t.type === 'expense' &&
      (!hideFromCharts || !t.hidden)
    );

    const spending = {};
    yearTransactions.forEach(transaction => {
      let key;
      if (comparisonLevel === 'subcategory') {
        const categoryName = transaction.category?.name || 'Miscellaneous';
        const subcategoryName = transaction.category?.sub || 'Other';
        key = `${categoryName} > ${subcategoryName}`;
      } else {
        key = transaction.category?.name || 'Miscellaneous';
      }

      spending[key] = (spending[key] || 0) + Math.abs(transaction.value);
    });

    return spending;
  };

  const year1Spending = getYearSpending(comparisonYear1);
  const year2Spending = getYearSpending(comparisonYear2);

  const allItems = new Set([...Object.keys(year1Spending), ...Object.keys(year2Spending)]);
  const changes = [];

  allItems.forEach(item => {
    const amount1 = year1Spending[item] || 0;
    const amount2 = year2Spending[item] || 0;
    const absoluteChange = amount2 - amount1;
    const percentChange = amount1 > 0 ? ((amount2 - amount1) / amount1) * 100 : (amount2 > 0 ? 100 : 0);

    changes.push({
      category: item,
      year1Amount: amount1,
      year2Amount: amount2,
      absoluteChange,
      percentChange
    });
  });

  changes.sort((a, b) => Math.abs(b.absoluteChange) - Math.abs(a.absoluteChange));

  const increases = changes.filter(c => c.absoluteChange > 0).slice(0, 5);
  const decreases = changes.filter(c => c.absoluteChange < 0).slice(0, 5);

  return { increases, decreases };
};

// Get all unique categories from transactions
export const getAllCategories = (transactions) => {
  const categories = [...new Set(
    transactions
      .filter(t => t.category && t.category.name)
      .map(t => t.category.name)
  )].sort();

  return categories;
};

// Get all unique subcategories for a specific category
export const getSubcategoriesForCategory = (transactions, categoryName) => {
  const subcategories = [...new Set(
    transactions
      .filter(t => t.category && t.category.name === categoryName && t.category.sub)
      .map(t => t.category.sub)
  )].filter(sub => sub).sort();

  return subcategories;
};
