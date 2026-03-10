import { describe, it, expect } from 'vitest';
import { detectRecurring } from '../recurringDetection';

const makeRecurring = (baseDate, description, amount, count, intervalDays = 30) => {
  const txs = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i * intervalDays);
    txs.push({
      id: `t-${i}`,
      date: d.toISOString().slice(0, 10),
      description,
      value: -amount,
      type: 'expense',
      category: { name: 'Subscriptions', sub: '' },
      hidden: false,
      _raw: { 'Texte comptable': description },
    });
  }
  return txs;
};

describe('detectRecurring', () => {
  it('returns empty for empty transactions', () => {
    expect(detectRecurring([])).toEqual([]);
  });

  it('detects monthly recurring pattern', () => {
    const transactions = makeRecurring('2024-01-15', 'Netflix Monthly Subscription CHF', 15.90, 6, 30);
    const recurring = detectRecurring(transactions);
    expect(recurring.length).toBeGreaterThanOrEqual(1);
    const netflix = recurring.find(r => r.description.includes('netflix'));
    expect(netflix).toBeTruthy();
    expect(netflix.frequency).toBe('monthly');
  });

  it('does not detect irregular transactions', () => {
    const transactions = [
      { id: '1', date: '2024-01-01', description: 'Random Store Purchase', value: -50, type: 'expense', category: { name: 'Shopping', sub: '' }, hidden: false, _raw: { 'Texte comptable': 'Random Store Purchase' } },
      { id: '2', date: '2024-02-15', description: 'Random Store Purchase', value: -50, type: 'expense', category: { name: 'Shopping', sub: '' }, hidden: false, _raw: { 'Texte comptable': 'Random Store Purchase' } },
      { id: '3', date: '2024-06-20', description: 'Random Store Purchase', value: -50, type: 'expense', category: { name: 'Shopping', sub: '' }, hidden: false, _raw: { 'Texte comptable': 'Random Store Purchase' } },
    ];
    const recurring = detectRecurring(transactions);
    expect(recurring).toEqual([]);
  });

  it('calculates annual cost correctly for monthly', () => {
    const transactions = makeRecurring('2024-01-15', 'Gym Monthly Membership Fee', 50, 6, 30);
    const recurring = detectRecurring(transactions);
    const gym = recurring.find(r => r.description.includes('gym'));
    expect(gym).toBeTruthy();
    expect(gym.annualCost).toBeCloseTo(600, -1);
  });
});
