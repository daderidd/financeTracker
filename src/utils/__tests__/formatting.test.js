import { describe, it, expect } from 'vitest';
import { formatMonth, formatCurrency, formatRollingMeanDate, formatTooltipDate } from '../formatting';

describe('formatMonth', () => {
  it('converts YYYY-MM to MMM YYYY', () => {
    expect(formatMonth('2024-01')).toBe('Jan 2024');
    expect(formatMonth('2024-12')).toBe('Dec 2024');
    expect(formatMonth('2023-06')).toBe('Jun 2023');
  });

  it('returns empty string for falsy input', () => {
    expect(formatMonth('')).toBe('');
    expect(formatMonth(null)).toBe('');
    expect(formatMonth(undefined)).toBe('');
  });
});

describe('formatCurrency', () => {
  it('formats numbers with 2 decimal places and separators', () => {
    expect(formatCurrency(1234.5)).toBe('1,234.50');
    expect(formatCurrency(0)).toBe('0.00');
    expect(formatCurrency(999999.99)).toBe('999,999.99');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatCurrency(1.999)).toBe('2.00');
    expect(formatCurrency(1.001)).toBe('1.00');
  });
});

describe('formatRollingMeanDate', () => {
  it('formats date string to "D MMM"', () => {
    const result = formatRollingMeanDate('2024-01-15');
    expect(result).toBe('15 Jan');
  });

  it('returns empty string for falsy input', () => {
    expect(formatRollingMeanDate('')).toBe('');
    expect(formatRollingMeanDate(null)).toBe('');
  });
});

describe('formatTooltipDate', () => {
  it('formats date string to "D MMM YYYY"', () => {
    const result = formatTooltipDate('2024-01-15');
    expect(result).toBe('15 Jan 2024');
  });

  it('returns empty string for falsy input', () => {
    expect(formatTooltipDate('')).toBe('');
  });
});
