// Function to normalize description for comparison (extract core payee info)
export const normalizeDescription = (description) => {
  if (!description) return '';

  // Take first 50 chars and normalize:
  // - Remove punctuation/separators that vary between exports (;,-)
  // - Collapse multiple spaces
  // - Convert to lowercase
  const normalized = description
    .toLowerCase()
    .substring(0, 50)
    .replace(/[;,\-]+/g, ' ')  // Replace separators with space
    .replace(/\s+/g, ' ')      // Collapse multiple spaces
    .trim();

  return normalized;
};

// Function to create a unique key for duplicate detection
export const createTransactionKey = (transaction) => {
  const date = transaction.date || '';
  const amount = transaction.amount || 0;
  const descNormalized = normalizeDescription(transaction.description);

  const key = `${date}|${amount}|${descNormalized}`;
  return key;
};

// Function to merge multiple transaction arrays, marking suspected duplicates as hidden
export const mergeTransactions = (transactionArrays) => {
  const seenKeys = new Map();
  const allTransactions = [];
  let duplicateCount = 0;

  for (let i = 0; i < transactionArrays.length; i++) {
    const transactions = transactionArrays[i];
    console.log(`Processing file ${i + 1}, ${transactions.length} transactions`);

    for (const transaction of transactions) {
      const key = createTransactionKey(transaction);

      if (!seenKeys.has(key)) {
        seenKeys.set(key, allTransactions.length);
        allTransactions.push(transaction);
      } else {
        duplicateCount++;
        const firstIndex = seenKeys.get(key);
        const firstTransaction = allTransactions[firstIndex];

        console.log(`Suspected duplicate found:`);
        console.log(`  First:  ${firstTransaction.date} - ${firstTransaction.description.substring(0, 60)}...`);
        console.log(`  Second: ${transaction.date} - ${transaction.description.substring(0, 60)}...`);

        allTransactions.push({
          ...transaction,
          hidden: true,
          hiddenReason: 'suspected_duplicate'
        });
      }
    }
  }

  console.log(`Total suspected duplicates marked as hidden: ${duplicateCount}`);

  allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  return allTransactions;
};

// Sort transactions based on the sort configuration
export const sortTransactions = (transactionsToSort, sortConfig) => {
  const sortableTransactions = [...transactionsToSort];

  if (sortConfig.key) {
    sortableTransactions.sort((a, b) => {
      if (sortConfig.key === 'amount' || sortConfig.key === 'value') {
        const aValue = parseFloat(a[sortConfig.key]) || 0;
        const bValue = parseFloat(b[sortConfig.key]) || 0;

        if (sortConfig.direction === 'ascending') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      } else if (sortConfig.key === 'date') {
        const aDate = new Date(a.date || '1970-01-01');
        const bDate = new Date(b.date || '1970-01-01');

        if (sortConfig.direction === 'ascending') {
          return aDate - bDate;
        } else {
          return bDate - aDate;
        }
      } else if (sortConfig.key === 'category') {
        const aCategory = a.category?.name || '';
        const bCategory = b.category?.name || '';

        if (sortConfig.direction === 'ascending') {
          return aCategory.localeCompare(bCategory);
        } else {
          return bCategory.localeCompare(aCategory);
        }
      } else if (sortConfig.key === 'subcategory') {
        const aSubcategory = a.category?.sub || '';
        const bSubcategory = b.category?.sub || '';

        if (sortConfig.direction === 'ascending') {
          return aSubcategory.localeCompare(bSubcategory);
        } else {
          return bSubcategory.localeCompare(aSubcategory);
        }
      } else {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';

        if (sortConfig.direction === 'ascending') {
          return aValue.toString().localeCompare(bValue.toString());
        } else {
          return bValue.toString().localeCompare(aValue.toString());
        }
      }
    });
  }

  return sortableTransactions;
};
