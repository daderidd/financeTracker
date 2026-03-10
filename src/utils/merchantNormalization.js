import { normalizeCategoryDescription } from './categorize';

// Common Swiss merchant brand prefixes for auto-clustering
const BRAND_PREFIXES = [
  'migros', 'coop', 'lidl', 'aldi', 'denner', 'spar', 'manor',
  'sbb cff ffs', 'tpg', 'swisscom', 'sunrise', 'salt',
  'cembra', 'viseca', 'twint',
  'netflix', 'spotify', 'apple', 'google', 'amazon', 'zalando',
  'ikea', 'decathlon', 'h m', 'zara', 'mango',
];

// Extract a canonical merchant name from a transaction description
export const extractMerchant = (transaction, merchantAliases = {}) => {
  const normalized = normalizeCategoryDescription(transaction);

  // Check user-defined aliases first
  for (const [pattern, canonical] of Object.entries(merchantAliases)) {
    if (normalized.includes(pattern.toLowerCase())) {
      return canonical;
    }
  }

  // Try known brand prefixes
  for (const prefix of BRAND_PREFIXES) {
    if (normalized.includes(prefix)) {
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
  }

  // Fallback: use first 3 tokens of the description (strip location suffixes)
  const tokens = normalized.split(/\s+/).filter(t => t.length > 1);
  if (tokens.length === 0) return 'Unknown';
  return tokens.slice(0, Math.min(3, tokens.length)).join(' ');
};

// Cluster transactions by merchant and compute spending stats
export const computeMerchantStats = (transactions, merchantAliases = {}) => {
  const merchants = {};

  transactions.forEach(t => {
    if (t.type !== 'expense' || t.hidden) return;
    const name = extractMerchant(t, merchantAliases);
    if (!merchants[name]) {
      merchants[name] = { name, totalSpent: 0, count: 0, category: t.category?.name || '' };
    }
    merchants[name].totalSpent += Math.abs(t.value);
    merchants[name].count++;
  });

  return Object.values(merchants)
    .sort((a, b) => b.totalSpent - a.totalSpent);
};

// Suggest merchant clusters that could be merged (similar names)
export const suggestMerges = (merchantStats) => {
  const suggestions = [];
  const seen = new Set();

  for (let i = 0; i < merchantStats.length && i < 50; i++) {
    for (let j = i + 1; j < merchantStats.length && j < 50; j++) {
      const a = merchantStats[i].name.toLowerCase();
      const b = merchantStats[j].name.toLowerCase();
      if (seen.has(`${a}|${b}`)) continue;

      // Check if one name starts with the other
      if (a.startsWith(b) || b.startsWith(a)) {
        suggestions.push([merchantStats[i].name, merchantStats[j].name]);
        seen.add(`${a}|${b}`);
      }
    }
  }

  return suggestions;
};
