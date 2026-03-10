import { describe, it, expect } from 'vitest';
import { mapToCategory, mapToCategoryWithCustomRules } from '../categoryRules';

const makeRawTransaction = (texteComptable, secteur = '') => ({
  "Texte comptable": texteComptable,
  Description1: '',
  Description2: '',
  Description3: '',
  Secteur: secteur,
});

describe('mapToCategory', () => {
  it('categorizes hospital salary', () => {
    const result = mapToCategory(makeRawTransaction('Hopitaux Universitaires de Geneve'));
    expect(result.name).toBe('Income');
    expect(result.sub).toBe('Salary');
  });

  it('categorizes trading platforms', () => {
    const result = mapToCategory(makeRawTransaction('Trading 212 deposit'));
    expect(result.name).toBe('Investments');
    expect(result.sub).toBe('Trading');
  });

  it('categorizes ATM withdrawals', () => {
    const result = mapToCategory(makeRawTransaction('Retrait au bancomat'));
    expect(result.name).toBe('ATM withdrawals');
  });

  it('returns Miscellaneous for unknown transactions', () => {
    const result = mapToCategory(makeRawTransaction('xyzzy random unknown'));
    expect(result.name).toBe('Miscellaneous');
  });

  it('handles empty description', () => {
    const result = mapToCategory(makeRawTransaction(''));
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('sub');
  });
});

describe('mapToCategoryWithCustomRules', () => {
  const customRules = [
    { id: '1', keyword: 'migros', category: 'Food', subcategory: 'Groceries' },
    { id: '2', keyword: 'sbb', category: 'Transport', subcategory: 'Train' },
  ];

  it('matches custom rules by keyword in description', () => {
    const tx = makeRawTransaction('MIGROS Geneva 123');
    const result = mapToCategoryWithCustomRules(tx, customRules);
    expect(result.name).toBe('Food');
    expect(result.sub).toBe('Groceries');
  });

  it('is case-insensitive', () => {
    const tx = makeRawTransaction('SBB ticket purchase');
    const result = mapToCategoryWithCustomRules(tx, customRules);
    expect(result.name).toBe('Transport');
    expect(result.sub).toBe('Train');
  });

  it('first matching rule wins', () => {
    const rules = [
      { id: '1', keyword: 'test', category: 'First', subcategory: '' },
      { id: '2', keyword: 'test', category: 'Second', subcategory: '' },
    ];
    const result = mapToCategoryWithCustomRules(makeRawTransaction('test something'), rules);
    expect(result.name).toBe('First');
  });

  it('falls back to hardcoded rules when no custom rule matches', () => {
    const tx = makeRawTransaction('Hopitaux Universitaires de Geneve');
    const result = mapToCategoryWithCustomRules(tx, customRules);
    expect(result.name).toBe('Income');
    expect(result.sub).toBe('Salary');
  });

  it('falls back to hardcoded rules with empty custom rules', () => {
    const tx = makeRawTransaction('Retrait au bancomat');
    const result = mapToCategoryWithCustomRules(tx, []);
    expect(result.name).toBe('ATM withdrawals');
  });

  it('matches against combined description field too', () => {
    const tx = { ...makeRawTransaction(''), description: 'some migros purchase' };
    const result = mapToCategoryWithCustomRules(tx, customRules);
    expect(result.name).toBe('Food');
  });

  it('handles empty subcategory in rule', () => {
    const rules = [{ id: '1', keyword: 'test', category: 'MyCategory', subcategory: '' }];
    const result = mapToCategoryWithCustomRules(makeRawTransaction('test'), rules);
    expect(result.name).toBe('MyCategory');
    expect(result.sub).toBe('');
  });
});
