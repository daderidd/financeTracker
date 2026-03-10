import Papa from 'papaparse';
import { mapToCategory } from './categoryRules';

// Helper function to read file as text
export const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      resolve(event.target.result);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    // Detect encoding based on filename
    const encoding = file.name.includes('card_transactions') ? 'windows-1252' : 'utf-8';
    console.log(`Reading file "${file.name}" with encoding: ${encoding}`);
    reader.readAsText(file, encoding);
  });
};

// Helper function to extract names from description fields
export const extractName = (description) => {
  if (!description) return null;

  // Clean the description
  const cleanDesc = description.replace(/^"/, '').replace(/"$/, '').trim();

  // If empty after cleaning, return null
  if (!cleanDesc) return null;

  // Look for common patterns of names
  const addressPattern = /^([^,\d]+)(?:[,\s]+\d+.*)?$/;
  const match = cleanDesc.match(addressPattern);

  if (match && match[1]) {
    return match[1].trim();
  }

  // If no pattern match, just return the first part of the description (up to 30 chars)
  return cleanDesc.substring(0, Math.min(30, cleanDesc.length));
};

// Function to parse card transactions
export const parseCardTransactions = async (file) => {
  try {
    let text = await readFileAsText(file);

    // Remove UTF-8 BOM if present (EF BB BF)
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.slice(1);
    }

    // Detect delimiter: check if first line contains 'sep=' directive or use auto-detection
    const lines = text.split('\n');
    let delimiter = ','; // Default to comma for raw bank exports
    let startLine = 0;

    // Check if first line is a separator directive (sep=;)
    if (lines[0] && lines[0].trim().startsWith('sep=')) {
      delimiter = lines[0].trim().substring(4);
      startLine = 1; // Skip the sep= line
      console.log(`Found delimiter directive: ${delimiter}`);
    } else {
      // Auto-detect delimiter from first line
      if (lines[0] && lines[0].includes(';')) {
        delimiter = ';';
      }
      console.log(`Using auto-detected delimiter: ${delimiter}`);
    }

    // Reconstruct CSV starting from the header
    const csvContent = lines.slice(startLine).join('\n');

    // Parse with PapaParse
    const parsed = Papa.parse(csvContent, {
      delimiter: delimiter,
      header: true,
      skipEmptyLines: true,
      quoteChar: '"',
      escapeChar: '"'
    });

    return parsed.data.map(transaction => {
      // Convert date from DD.MM.YYYY to YYYY-MM-DD
      let date = '';
      if (transaction["Date d'achat"]) {
        const parts = transaction["Date d'achat"].split('.');
        if (parts.length === 3) {
          date = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      // Parse original amount
      const originalAmount = parseFloat((transaction.Montant || '0').replace(',', '.'));
      const exchangeRate = parseFloat((transaction.Cours || '0').replace(',', '.'));
      const originalCurrency = transaction["Monnaie originale"] || 'CHF';

      // Determine if it's an expense or income and get the actual CHF amount
      let type = 'expense';
      let value = 0;
      let amountInCHF = 0;

      // Try both with and without accents for Débit/Crédit columns
      const debitValue = transaction.Débit || transaction.Debit || '';
      const creditValue = transaction.Crédit || transaction.Credit || '';

      if (debitValue && debitValue.trim()) {
        type = 'expense';
        amountInCHF = parseFloat(debitValue.replace(',', '.'));
        value = -amountInCHF;
      } else if (creditValue && creditValue.trim()) {
        type = 'income';
        amountInCHF = parseFloat(creditValue.replace(',', '.'));
        value = amountInCHF;
      } else {
        type = 'expense';
        amountInCHF = originalAmount * exchangeRate;
        value = -(originalAmount * exchangeRate);
      }

      const description = transaction["Texte comptable"] || '';

      // Set hidden flag for transactions with source = "card" AND description = "TRANSFERT D'UN COMPTE"
      const hidden = description.trim() === "TRANSFERT D'UN COMPTE"||
                    description.includes("Paiement à une carte");

      return {
        id: `card-${Math.random().toString(36).substr(2, 9)}`,
        date,
        description,
        originalAmount,
        originalCurrency,
        amount: amountInCHF,
        value,
        type,
        category: mapToCategory(transaction),
        source: 'card',
        hidden,
        _raw: {
          "Texte comptable": transaction["Texte comptable"] || '',
          Secteur: transaction.Secteur || '',
        },
      };
    });
  } catch (error) {
    console.error('Error parsing card transactions:', error);
    throw new Error('Could not parse card transactions file');
  }
};

// Function to parse account transactions
export const parseAccountTransactions = async (file) => {
  try {
    console.log("Starting to parse account transactions");
    let text = await readFileAsText(file);
    console.log("File read successfully, content length:", text.length);

    // Remove UTF-8 BOM if present (EF BB BF)
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.slice(1);
      console.log("Removed UTF-8 BOM from file");
    }

    // Split into lines to find the header
    const lines = text.split('\n');

    // Find the header line (starts with "Date de transaction")
    let headerIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('Date de transaction')) {
        headerIndex = i;
        console.log(`Found header at line ${i + 1}`);
        break;
      }
    }

    if (headerIndex === -1) {
      throw new Error('Could not find header line starting with "Date de transaction"');
    }

    // Reconstruct CSV starting from the header line
    const csvText = lines.slice(headerIndex).join('\n');

    // Parse with PapaParse to properly handle quoted fields with semicolons
    const parsed = Papa.parse(csvText, {
      delimiter: ';',
      header: true,
      skipEmptyLines: true,
      quoteChar: '"',
      escapeChar: '"'
    });

    console.log("PapaParse completed, rows:", parsed.data.length);

    // Process all parsed rows
    const transactions = [];
    for (const transaction of parsed.data) {
      // Process date fields - use the Date de transaction field
      const dateField = "Date de transaction";
      let date = transaction[dateField] || '';

      // Skip entries without a valid date
      if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        continue;
      }

      // Process amount fields
      let type = 'unknown';
      let value = 0;
      let amount = 0;

      // Try both with and without accent for Débit/Crédit
      const debitValue = transaction.Débit || transaction.Debit || '';
      const creditValue = transaction.Crédit || transaction.Credit || '';

      if (debitValue && debitValue.trim()) {
        type = 'expense';
        const debitStr = debitValue.replace(/\s/g, '').replace(',', '.');
        value = -parseFloat(debitStr);
        amount = Math.abs(value);
      } else if (creditValue && creditValue.trim()) {
        type = 'income';
        const creditStr = creditValue.replace(/\s/g, '').replace(',', '.');
        value = parseFloat(creditStr);
        amount = value;
      }

      if (isNaN(value) || value === 0) {
        continue;
      }

      // Process description fields
      const desc1 = transaction.Description1 || '';
      const desc2 = transaction.Description2 || '';
      const desc3 = transaction.Description3 || '';

      // Extract recipient or sender information
      let recipient = null;
      let sender = null;

      if (type === 'expense') {
        recipient = extractName(desc1);
      } else if (type === 'income') {
        sender = extractName(desc1);
      }

      // Combine descriptions for display
      const description = [desc1, desc2, desc3]
        .filter(d => d.trim() !== '')
        .join(' - ');

      // Set hidden flag
      const hidden = description.trim() === "TRANSFERT D'UN COMPTE" ||
                    description.includes("Paiement à une carte");

      transactions.push({
        id: `account-${Math.random().toString(36).substr(2, 9)}`,
        date,
        description,
        amount,
        value,
        type,
        recipient,
        sender,
        category: mapToCategory({
          "Texte comptable": description,
          "Secteur": ""
        }),
        source: 'account',
        hidden,
        _raw: {
          "Texte comptable": description,
          Description1: desc1,
          Description2: desc2,
          Description3: desc3,
          Secteur: '',
        },
      });
    }

    console.log(`Successfully parsed ${transactions.length} account transactions`);
    return transactions;
  } catch (error) {
    console.error('Error parsing account transactions:', error);
    throw new Error(`Could not parse account transactions file: ${error.message}`);
  }
};

// Function to load transactions from a saved file
// Returns { transactions, budgets } — supports both legacy (plain array) and v2 envelope format
export const loadTransactionsFromFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);

        // Legacy format: plain array of transactions
        if (Array.isArray(parsed)) {
          const isValid = parsed.every(t => typeof t === 'object' && t !== null);
          if (!isValid) {
            reject(new Error('Invalid transaction data: some transactions have invalid format'));
            return;
          }
          resolve({ transactions: parsed, budgets: {}, customRules: [], learnedMappings: [] });
          return;
        }

        // V2 envelope format
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.transactions)) {
          const isValid = parsed.transactions.every(t => typeof t === 'object' && t !== null);
          if (!isValid) {
            reject(new Error('Invalid transaction data: some transactions have invalid format'));
            return;
          }
          const budgets = (parsed.budgets && typeof parsed.budgets === 'object' && !Array.isArray(parsed.budgets))
            ? parsed.budgets : {};
          const customRules = Array.isArray(parsed.customRules) ? parsed.customRules : [];
          const learnedMappings = Array.isArray(parsed.learnedMappings) ? parsed.learnedMappings : [];
          resolve({ transactions: parsed.transactions, budgets, customRules, learnedMappings });
          return;
        }

        reject(new Error('Invalid data format: expected an array or envelope object'));
      } catch (error) {
        reject(new Error(`Error parsing file: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    reader.readAsText(file);
  });
};

// Function to save the current state of transactions (and budgets) to a file
export const saveTransactionsToFile = (transactions, budgets = {}, customRules = [], learnedMappings = []) => {
  try {
    const envelope = { version: 2, transactions, budgets, customRules, learnedMappings };
    const dataToSave = JSON.stringify(envelope, null, 2);
    const blob = new Blob([dataToSave], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const now = new Date();
    const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    link.download = `expense_tracker_data_${dateString}.json`;

    document.body.appendChild(link);
    link.click();

    URL.revokeObjectURL(url);
    document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error('Error saving transactions:', error);
    return false;
  }
};
