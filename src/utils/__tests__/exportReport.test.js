import { describe, it, expect } from 'vitest';
import { generateTextReport, generateCategoryCSV } from '../exportReport';

const totals = { expenses: 1000, income: 3000, balance: 2000 };
const categoryData = [
  { name: 'Food', value: 500 },
  { name: 'Transport', value: 300 },
  { name: 'Entertainment', value: 200 },
];

describe('generateTextReport', () => {
  it('includes date range and totals', () => {
    const report = generateTextReport(totals, categoryData, '2025-01-01', '2025-01-31');
    expect(report).toContain('2025-01-01');
    expect(report).toContain('2025-01-31');
    expect(report).toContain('1,000');
    expect(report).toContain('3,000');
  });

  it('lists categories with percentages', () => {
    const report = generateTextReport(totals, categoryData, '2025-01-01', '2025-01-31');
    expect(report).toContain('Food');
    expect(report).toContain('50.0%');
    expect(report).toContain('Transport');
  });

  it('includes budget notes when provided', () => {
    const report = generateTextReport(totals, categoryData, '2025-01-01', '2025-01-31', { Food: 400 });
    expect(report).toContain('budget: 400');
  });
});

describe('generateCategoryCSV', () => {
  it('produces valid CSV with headers', () => {
    const csv = generateCategoryCSV(categoryData, totals);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Category,Amount (CHF),% of Total');
    expect(lines.length).toBeGreaterThan(4);
  });

  it('includes totals at the bottom', () => {
    const csv = generateCategoryCSV(categoryData, totals);
    expect(csv).toContain('Total Expenses');
    expect(csv).toContain('1000.00');
  });
});
