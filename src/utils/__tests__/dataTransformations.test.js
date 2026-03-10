import { describe, it, expect } from 'vitest';
import {
  computeTotals,
  computeTotalsChartData,
  computeMonthlyData,
  computeCategoryData,
  computeSubcategoryData,
  computeRollingMean,
  getAvailableYears,
  getAllCategories,
  getSubcategoriesForCategory,
} from '../dataTransformations';

const makeTransaction = (overrides = {}) => ({
  id: `t-${Math.random()}`,
  date: '2024-01-15',
  description: 'Test',
  amount: 100,
  value: -100,
  type: 'expense',
  category: { name: 'Food', sub: 'Groceries' },
  ...overrides,
});

describe('computeTotals', () => {
  it('sums expenses and income separately', () => {
    const transactions = [
      makeTransaction({ value: -100, type: 'expense' }),
      makeTransaction({ value: -50, type: 'expense' }),
      makeTransaction({ value: 200, type: 'income' }),
    ];
    const totals = computeTotals(transactions);
    expect(totals.expenses).toBe(150);
    expect(totals.income).toBe(200);
    expect(totals.balance).toBe(50);
  });

  it('returns zeros for empty array', () => {
    const totals = computeTotals([]);
    expect(totals.expenses).toBe(0);
    expect(totals.income).toBe(0);
    expect(totals.balance).toBe(0);
  });
});

describe('computeTotalsChartData', () => {
  it('returns array with single Period Total entry', () => {
    const data = computeTotalsChartData([
      makeTransaction({ value: -100, type: 'expense' }),
    ]);
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe('Period Total');
    expect(data[0].expenses).toBe(100);
  });
});

describe('computeMonthlyData', () => {
  it('groups transactions by month', () => {
    const transactions = [
      makeTransaction({ date: '2024-01-15', value: -100, type: 'expense' }),
      makeTransaction({ date: '2024-01-20', value: -50, type: 'expense' }),
      makeTransaction({ date: '2024-02-10', value: -75, type: 'expense' }),
    ];
    const monthly = computeMonthlyData(transactions);
    expect(monthly).toHaveLength(2);
    expect(monthly[0].expenses).toBe(150); // Jan (sorted chronologically)
    expect(monthly[1].expenses).toBe(75);  // Feb
  });

  it('sorts months chronologically', () => {
    const transactions = [
      makeTransaction({ date: '2024-03-01' }),
      makeTransaction({ date: '2024-01-01' }),
      makeTransaction({ date: '2024-02-01' }),
    ];
    const monthly = computeMonthlyData(transactions);
    expect(monthly[0].month).toContain('Jan');
    expect(monthly[2].month).toContain('Mar');
  });

  it('skips transactions without dates', () => {
    const monthly = computeMonthlyData([makeTransaction({ date: '' })]);
    expect(monthly).toHaveLength(0);
  });
});

describe('computeCategoryData', () => {
  it('groups by category with absolute values', () => {
    const transactions = [
      makeTransaction({ category: { name: 'Food', sub: 'Groceries' }, value: -100 }),
      makeTransaction({ category: { name: 'Food', sub: 'Restaurants' }, value: -50 }),
      makeTransaction({ category: { name: 'Transport', sub: 'Bus' }, value: -30 }),
    ];
    const data = computeCategoryData(transactions);
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe('Food'); // sorted by value desc
    expect(data[0].value).toBe(150);
    expect(data[1].name).toBe('Transport');
  });

  it('uses Miscellaneous for uncategorized transactions', () => {
    const data = computeCategoryData([makeTransaction({ category: null })]);
    expect(data[0].name).toBe('Miscellaneous');
  });

  it('includes subcategory breakdown', () => {
    const transactions = [
      makeTransaction({ category: { name: 'Food', sub: 'Groceries' }, value: -100 }),
      makeTransaction({ category: { name: 'Food', sub: 'Restaurants' }, value: -50 }),
    ];
    const data = computeCategoryData(transactions);
    expect(data[0].subcategories).toHaveLength(2);
  });
});

describe('computeSubcategoryData', () => {
  const categoryData = [
    { name: 'Food', value: 150, subcategories: [{ name: 'Groceries', value: 100 }, { name: 'Restaurants', value: 50 }] },
    { name: 'Transport', value: 30, subcategories: [{ name: 'Bus', value: 30 }] },
  ];

  it('returns subcategories for active category, sorted by value', () => {
    const data = computeSubcategoryData(categoryData, 'Food');
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe('Groceries');
    expect(data[0].value).toBe(100);
  });

  it('returns empty array when no active category', () => {
    expect(computeSubcategoryData(categoryData, null)).toEqual([]);
  });

  it('returns empty array for nonexistent category', () => {
    expect(computeSubcategoryData(categoryData, 'Nonexistent')).toEqual([]);
  });
});

describe('computeRollingMean', () => {
  it('returns empty array for empty input', () => {
    expect(computeRollingMean([], 30)).toEqual([]);
  });

  it('computes rolling mean per category', () => {
    const transactions = [
      makeTransaction({ date: '2024-01-01', value: -30, category: { name: 'Food', sub: '' } }),
      makeTransaction({ date: '2024-01-15', value: -60, category: { name: 'Food', sub: '' } }),
    ];
    const result = computeRollingMean(transactions, 30);
    expect(result.length).toBeGreaterThan(0);
    // Each entry should have a Food key
    expect(result[0]).toHaveProperty('Food');
    expect(result[0]).toHaveProperty('date');
    expect(result[0]).toHaveProperty('formattedDate');
  });

  it('filters out transactions without dates', () => {
    const transactions = [
      makeTransaction({ date: '', value: -30 }),
    ];
    const result = computeRollingMean(transactions, 30);
    expect(result).toEqual([]);
  });
});

describe('getAvailableYears', () => {
  it('returns unique years sorted descending', () => {
    const transactions = [
      makeTransaction({ date: '2024-01-15' }),
      makeTransaction({ date: '2023-06-10' }),
      makeTransaction({ date: '2024-08-01' }),
    ];
    const years = getAvailableYears(transactions);
    expect(years).toEqual(['2024', '2023']);
  });
});

describe('getAllCategories', () => {
  it('returns unique sorted category names', () => {
    const transactions = [
      makeTransaction({ category: { name: 'Transport', sub: '' } }),
      makeTransaction({ category: { name: 'Food', sub: '' } }),
      makeTransaction({ category: { name: 'Food', sub: '' } }),
    ];
    expect(getAllCategories(transactions)).toEqual(['Food', 'Transport']);
  });

  it('excludes transactions without categories', () => {
    const transactions = [
      makeTransaction({ category: null }),
      makeTransaction({ category: { name: 'Food', sub: '' } }),
    ];
    expect(getAllCategories(transactions)).toEqual(['Food']);
  });
});

describe('getSubcategoriesForCategory', () => {
  it('returns subcategories for a given category', () => {
    const transactions = [
      makeTransaction({ category: { name: 'Food', sub: 'Groceries' } }),
      makeTransaction({ category: { name: 'Food', sub: 'Restaurants' } }),
      makeTransaction({ category: { name: 'Food', sub: 'Groceries' } }),
      makeTransaction({ category: { name: 'Transport', sub: 'Bus' } }),
    ];
    const subs = getSubcategoriesForCategory(transactions, 'Food');
    expect(subs).toEqual(['Groceries', 'Restaurants']);
  });

  it('returns empty array for unknown category', () => {
    expect(getSubcategoriesForCategory([], 'Nonexistent')).toEqual([]);
  });
});
