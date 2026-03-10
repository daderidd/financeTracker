import { describe, it, expect } from 'vitest';
import { normalizeCategoryDescription, buildMappingsIndex, categorizeTransaction, learnFromEdit } from '../categorize';

describe('normalizeCategoryDescription', () => {
  it('combines all description fields and normalizes', () => {
    const tx = {
      _raw: {
        "Texte comptable": 'MIGROS Plainpalais',
        Description1: 'Genève 1205',
        Description2: '',
        Description3: '',
      },
      description: 'MIGROS Plainpalais - Genève 1205',
    };
    const result = normalizeCategoryDescription(tx);
    expect(result).toContain('migros');
    expect(result).toContain('plainpalais');
    expect(result).toContain('genève');
    expect(result).not.toContain('MIGROS'); // lowercased
  });

  it('strips punctuation but keeps accented chars', () => {
    const tx = { description: 'Café-Restaurant "Le Grütli" #123!' };
    const result = normalizeCategoryDescription(tx);
    expect(result).toContain('café');
    expect(result).toContain('grütli');
    expect(result).not.toContain('#');
    expect(result).not.toContain('"');
  });

  it('collapses whitespace', () => {
    const tx = { description: 'a   b     c' };
    expect(normalizeCategoryDescription(tx)).toBe('a b c');
  });

  it('handles empty/missing fields gracefully', () => {
    expect(normalizeCategoryDescription({})).toBe('');
    expect(normalizeCategoryDescription({ description: '' })).toBe('');
  });
});

describe('buildMappingsIndex', () => {
  it('creates a Map keyed by description', () => {
    const mappings = [
      { id: '1', description: 'migros plainpalais', category: 'Food', subcategory: 'Groceries', count: 3 },
      { id: '2', description: 'sbb cff ffs', category: 'Transport', subcategory: 'Train', count: 1 },
    ];
    const index = buildMappingsIndex(mappings);
    expect(index.size).toBe(2);
    expect(index.get('migros plainpalais').category).toBe('Food');
    expect(index.get('nonexistent')).toBeUndefined();
  });

  it('returns empty Map for empty array', () => {
    expect(buildMappingsIndex([]).size).toBe(0);
  });
});

describe('categorizeTransaction', () => {
  const customRules = [
    { id: 'r1', keyword: 'netflix', category: 'Entertainment', subcategory: 'Streaming' },
  ];

  const learnedMappings = [
    { id: 'lm1', description: 'migros plainpalais genève 1205', category: 'Food', subcategory: 'Groceries', count: 5 },
    { id: 'lm2', description: 'sbb cff ffs bern ticket', category: 'Transport', subcategory: 'Train', count: 2 },
  ];
  const index = buildMappingsIndex(learnedMappings);

  it('Tier 1: custom rules match first', () => {
    const tx = { description: 'NETFLIX.COM subscription' };
    const result = categorizeTransaction(tx, customRules, index);
    expect(result.name).toBe('Entertainment');
    expect(result.sub).toBe('Streaming');
  });

  it('Tier 2a: exact learned mapping match', () => {
    const tx = { description: 'MIGROS Plainpalais - Genève 1205' };
    const result = categorizeTransaction(tx, [], index);
    expect(result.name).toBe('Food');
    expect(result.sub).toBe('Groceries');
  });

  it('Tier 2b: containment match (learned is substring of new)', () => {
    // New transaction has extra text beyond the learned pattern
    const tx = { description: 'SBB CFF FFS Bern Ticket REF-12345 03.2026' };
    const result = categorizeTransaction(tx, [], index);
    expect(result.name).toBe('Transport');
    expect(result.sub).toBe('Train');
  });

  it('Tier 2b: does NOT match when new transaction is substring of learned (one-directional)', () => {
    // Reverse containment removed to avoid false positives
    // "coop" is shorter than learned "sbb cff ffs bern ticket", so only exact or forward containment works
    const specificMappings = [
      { id: 'lm1', description: 'coop plan les ouates parking garage', category: 'Transport', subcategory: 'Parking', count: 1 },
    ];
    const specificIndex = buildMappingsIndex(specificMappings);
    const tx = { description: 'COOP Plan Les Ouates' }; // shorter than learned
    const result = categorizeTransaction(tx, [], specificIndex);
    // Should NOT match the parking-specific learned pattern
    expect(result.name).not.toBe('Transport');
  });

  it('Tier 2 takes priority over Tier 3 hardcoded rules', () => {
    // "retrait au bancomat" matches hardcoded ATM rule, but learned mapping should win
    const mappings = [
      { id: 'lm1', description: 'retrait au bancomat geneve rive', category: 'Cash', subcategory: 'ATM', count: 2 },
    ];
    const mappingIndex = buildMappingsIndex(mappings);
    const tx = {
      description: 'Retrait au bancomat Geneve Rive',
      _raw: { "Texte comptable": 'Retrait au bancomat Geneve Rive', Secteur: '' },
    };
    const result = categorizeTransaction(tx, [], mappingIndex);
    expect(result.name).toBe('Cash'); // learned, not 'ATM withdrawals' from hardcoded
  });

  it('Tier 2b: skips short learned descriptions to avoid greedy matches', () => {
    const shortMappings = [
      { id: 'short', description: 'bar', category: 'Wrong', subcategory: '', count: 1 },
    ];
    const shortIndex = buildMappingsIndex(shortMappings);
    // "bar" is only 3 chars, should be skipped for containment
    const tx = { description: "Barbara's Bakery Geneva" };
    const result = categorizeTransaction(tx, [], shortIndex);
    // Should fall through to hardcoded, not match "bar"
    expect(result.name).not.toBe('Wrong');
  });

  it('Tier 3: falls back to hardcoded rules', () => {
    const tx = {
      description: 'Retrait au bancomat',
      _raw: { "Texte comptable": 'Retrait au bancomat', Secteur: '' },
    };
    const result = categorizeTransaction(tx, [], new Map());
    expect(result.name).toBe('ATM withdrawals');
  });

  it('custom rules take priority over learned mappings', () => {
    const rules = [{ id: 'r1', keyword: 'migros', category: 'Override', subcategory: 'Test' }];
    const tx = { description: 'MIGROS Plainpalais Genève 1205' };
    const result = categorizeTransaction(tx, rules, index);
    expect(result.name).toBe('Override');
  });
});

describe('learnFromEdit', () => {
  it('creates a new mapping from a manual edit', () => {
    const tx = { description: 'MIGROS Geneva Store' };
    const result = learnFromEdit([], tx, 'Food', 'Groceries');
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('Food');
    expect(result[0].subcategory).toBe('Groceries');
    expect(result[0].count).toBe(1);
    expect(result[0].description).toContain('migros');
  });

  it('updates existing mapping and increments count', () => {
    const tx = { description: 'MIGROS Geneva Store' };
    const existing = learnFromEdit([], tx, 'Food', 'Groceries');
    const updated = learnFromEdit(existing, tx, 'Food', 'Supermarket');
    expect(updated).toHaveLength(1);
    expect(updated[0].subcategory).toBe('Supermarket');
    expect(updated[0].count).toBe(2);
  });

  it('skips trivially short descriptions', () => {
    const tx = { description: 'AB' };
    const result = learnFromEdit([], tx, 'Food', '');
    expect(result).toHaveLength(0);
  });

  it('does not modify other mappings', () => {
    const existing = [
      { id: 'lm1', description: 'coop geneva', category: 'Food', subcategory: 'Groceries', count: 1, lastUsed: '2026-01-01' },
    ];
    const tx = { description: 'MIGROS Geneva Store' };
    const result = learnFromEdit(existing, tx, 'Food', 'Groceries');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(existing[0]); // unchanged
  });
});
