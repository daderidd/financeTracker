import { describe, it, expect } from 'vitest';
import { detectAnomalies, detectUnusualTransactions } from '../anomalyDetection';

const makeTransaction = (date, category, amount, opts = {}) => ({
  id: `t-${date}-${amount}`,
  date,
  type: 'expense',
  value: -amount,
  category: { name: category, sub: '' },
  description: opts.description || `${category} purchase`,
  hidden: false,
  ...opts,
});

describe('detectAnomalies', () => {
  it('returns empty for empty transactions', () => {
    expect(detectAnomalies([])).toEqual([]);
  });

  it('detects category spending increase >30%', () => {
    const now = new Date();
    const cm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prev1 = new Date(now.getFullYear(), now.getMonth() - 1, 15);
    const prev2 = new Date(now.getFullYear(), now.getMonth() - 2, 15);
    const pm1 = prev1.toISOString().slice(0, 10);
    const pm2 = prev2.toISOString().slice(0, 10);

    const transactions = [
      makeTransaction(pm1, 'Food', 100),
      makeTransaction(pm2, 'Food', 100),
      makeTransaction(`${cm}-05`, 'Food', 200), // 100% increase
    ];

    const anomalies = detectAnomalies(transactions);
    expect(anomalies.length).toBeGreaterThan(0);
    expect(anomalies[0].category).toBe('Food');
    expect(anomalies[0].direction).toBe('up');
  });

  it('skips hidden transactions', () => {
    const now = new Date();
    const cm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const transactions = [
      makeTransaction(`${cm}-05`, 'Food', 200, { hidden: true }),
    ];
    expect(detectAnomalies(transactions)).toEqual([]);
  });
});

describe('detectUnusualTransactions', () => {
  it('returns empty for few transactions', () => {
    expect(detectUnusualTransactions([
      makeTransaction('2025-01-01', 'Food', 50),
    ])).toEqual([]);
  });

  it('flags transactions >3x category median', () => {
    const transactions = [
      ...Array.from({ length: 10 }, (_, i) =>
        makeTransaction(`2025-01-${String(i + 1).padStart(2, '0')}`, 'Food', 20)
      ),
      makeTransaction('2025-01-15', 'Food', 200), // 10x median
    ];

    const unusual = detectUnusualTransactions(transactions);
    expect(unusual.length).toBe(1);
    expect(unusual[0].amount).toBe(200);
    expect(unusual[0].ratio).toBeGreaterThan(3);
  });
});
