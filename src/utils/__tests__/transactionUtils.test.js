import { describe, it, expect } from 'vitest';
import { normalizeDescription, createTransactionKey, mergeTransactions, sortTransactions } from '../transactionUtils';

describe('normalizeDescription', () => {
  it('lowercases and trims', () => {
    expect(normalizeDescription('  HELLO WORLD  ')).toBe('hello world');
  });

  it('replaces separators with spaces', () => {
    expect(normalizeDescription('a;b,c-d')).toBe('a b c d');
  });

  it('collapses multiple spaces', () => {
    expect(normalizeDescription('a   b   c')).toBe('a b c');
  });

  it('truncates to 50 chars', () => {
    const long = 'a'.repeat(100);
    expect(normalizeDescription(long).length).toBe(50);
  });

  it('returns empty string for falsy input', () => {
    expect(normalizeDescription(null)).toBe('');
    expect(normalizeDescription('')).toBe('');
    expect(normalizeDescription(undefined)).toBe('');
  });
});

describe('createTransactionKey', () => {
  it('creates key from date, amount, and normalized description', () => {
    const key = createTransactionKey({
      date: '2024-01-15',
      amount: 50.00,
      description: 'MIGROS Grocery'
    });
    expect(key).toBe('2024-01-15|50|migros grocery');
  });

  it('handles missing fields', () => {
    const key = createTransactionKey({});
    expect(key).toBe('|0|');
  });
});

describe('mergeTransactions', () => {
  const tx1 = { id: '1', date: '2024-01-15', amount: 50, description: 'Test A', type: 'expense' };
  const tx2 = { id: '2', date: '2024-01-16', amount: 100, description: 'Test B', type: 'expense' };
  const tx1dup = { id: '3', date: '2024-01-15', amount: 50, description: 'Test A', type: 'expense' };

  it('merges unique transactions', () => {
    const result = mergeTransactions([[tx1], [tx2]]);
    expect(result).toHaveLength(2);
  });

  it('marks duplicates as hidden', () => {
    const result = mergeTransactions([[tx1], [tx1dup]]);
    expect(result).toHaveLength(2);
    const dup = result.find(t => t.id === '3');
    expect(dup.hidden).toBe(true);
    expect(dup.hiddenReason).toBe('suspected_duplicate');
  });

  it('sorts by date descending', () => {
    const result = mergeTransactions([[tx1, tx2]]);
    expect(result[0].date).toBe('2024-01-16');
    expect(result[1].date).toBe('2024-01-15');
  });

  it('handles empty arrays', () => {
    expect(mergeTransactions([])).toHaveLength(0);
    expect(mergeTransactions([[]])).toHaveLength(0);
  });
});

describe('sortTransactions', () => {
  const transactions = [
    { id: '1', date: '2024-01-15', amount: 50, description: 'B', category: { name: 'Food', sub: 'Groceries' } },
    { id: '2', date: '2024-02-10', amount: 100, description: 'A', category: { name: 'Transport', sub: 'Bus' } },
    { id: '3', date: '2024-01-20', amount: 25, description: 'C', category: null },
  ];

  it('sorts by date ascending', () => {
    const sorted = sortTransactions(transactions, { key: 'date', direction: 'ascending' });
    expect(sorted[0].date).toBe('2024-01-15');
    expect(sorted[2].date).toBe('2024-02-10');
  });

  it('sorts by date descending', () => {
    const sorted = sortTransactions(transactions, { key: 'date', direction: 'descending' });
    expect(sorted[0].date).toBe('2024-02-10');
  });

  it('sorts by amount ascending', () => {
    const sorted = sortTransactions(transactions, { key: 'amount', direction: 'ascending' });
    expect(sorted[0].amount).toBe(25);
    expect(sorted[2].amount).toBe(100);
  });

  it('sorts by category ascending', () => {
    const sorted = sortTransactions(transactions, { key: 'category', direction: 'ascending' });
    // null category sorts as empty string (first)
    expect(sorted[0].category).toBeNull();
    expect(sorted[1].category.name).toBe('Food');
    expect(sorted[2].category.name).toBe('Transport');
  });

  it('sorts by subcategory', () => {
    const sorted = sortTransactions(transactions, { key: 'subcategory', direction: 'ascending' });
    expect(sorted[0].category).toBeNull(); // empty sub
    expect(sorted[1].category.sub).toBe('Bus');
  });

  it('sorts by generic string field', () => {
    const sorted = sortTransactions(transactions, { key: 'description', direction: 'ascending' });
    expect(sorted[0].description).toBe('A');
    expect(sorted[2].description).toBe('C');
  });

  it('does not mutate original array', () => {
    const original = [...transactions];
    sortTransactions(transactions, { key: 'amount', direction: 'ascending' });
    expect(transactions[0].id).toBe(original[0].id);
  });
});
