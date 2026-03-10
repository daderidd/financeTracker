import { mapToCategory } from './categoryRules';

// Normalize a transaction's description for matching.
// Combines all available description fields into a single lowercase string,
// keeping only letters, numbers, accented chars, and spaces.
export const normalizeCategoryDescription = (transaction) => {
  const raw = [
    transaction._raw?.["Texte comptable"] || transaction["Texte comptable"] || '',
    transaction._raw?.Description1 || transaction.Description1 || '',
    transaction._raw?.Description2 || transaction.Description2 || '',
    transaction._raw?.Description3 || transaction.Description3 || '',
    transaction.description || '',
  ].join(' ');

  return raw
    .toLowerCase()
    .replace(/[^a-z0-9àâäéèêëïîôùûüÿçœæ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Build a Map index from learnedMappings array for O(1) exact lookups.
export const buildMappingsIndex = (learnedMappings) => {
  return new Map(learnedMappings.map(m => [m.description, m]));
};

// Categorize a transaction through the full priority chain:
// 1. Custom rules (keyword substring match, ordered by priority)
// 2. Learned mappings — exact match, then containment (longest wins)
// 3. Hardcoded rules (mapToCategory fallback)
export const categorizeTransaction = (transaction, customRules, learnedMappingsIndex) => {
  const normalized = normalizeCategoryDescription(transaction);

  // Tier 1: Custom rules
  for (const rule of customRules) {
    const keyword = (rule.keyword || '').toLowerCase().trim();
    if (keyword && normalized.includes(keyword)) {
      return { name: rule.category, sub: rule.subcategory || '' };
    }
  }

  // Tier 2a: Learned mappings — exact match
  const exactMatch = learnedMappingsIndex.get(normalized);
  if (exactMatch) {
    return { name: exactMatch.category, sub: exactMatch.subcategory };
  }

  // Tier 2b: Learned mappings — containment match (longest known pattern wins)
  // Only checks if the new transaction contains a known pattern, not the reverse,
  // to avoid matching a short transaction against an overly specific learned pattern.
  // Requires >= 8 chars to avoid greedy matches on short strings.
  let bestMatch = null;
  let bestLength = 0;
  for (const [desc, mapping] of learnedMappingsIndex) {
    if (desc.length < 8) continue;
    if (desc.length > bestLength && normalized.includes(desc)) {
      bestMatch = mapping;
      bestLength = desc.length;
    }
  }
  if (bestMatch) {
    return { name: bestMatch.category, sub: bestMatch.subcategory };
  }

  // Tier 3: Hardcoded rules
  // Build a raw-like object for mapToCategory which expects specific field names
  const rawFields = transaction._raw || {
    "Texte comptable": transaction["Texte comptable"] || transaction.description || '',
    Description1: transaction.Description1 || '',
    Description2: transaction.Description2 || '',
    Description3: transaction.Description3 || '',
    Secteur: transaction.Secteur || '',
  };
  return mapToCategory(rawFields);
};

// Update or create a learned mapping from a manual category edit.
// Returns the new learnedMappings array.
export const learnFromEdit = (learnedMappings, transaction, categoryName, subcategoryName) => {
  const normalized = normalizeCategoryDescription(transaction);
  if (normalized.length < 3) return learnedMappings; // skip trivial descriptions

  const today = new Date().toISOString().slice(0, 10);
  const existing = learnedMappings.find(m => m.description === normalized);

  if (existing) {
    return learnedMappings.map(m =>
      m.description === normalized
        ? { ...m, category: categoryName, subcategory: subcategoryName, count: m.count + 1, lastUsed: today }
        : m
    );
  }

  return [...learnedMappings, {
    id: `lm-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    description: normalized,
    category: categoryName,
    subcategory: subcategoryName,
    count: 1,
    lastUsed: today,
  }];
};
