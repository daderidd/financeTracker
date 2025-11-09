import React, { useState, useEffect } from 'react';
import { LineChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Papa from 'papaparse';

// Main expense tracker component
const ExpenseTracker = () => {
  // State variables
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [chartType, setChartType] = useState('bar');
  const [activeCategory, setActiveCategory] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [subcategoryFilter, setSubcategoryFilter] = useState(null); // New state for subcategory filter
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });
  const [transactionTypeFilter, setTransactionTypeFilter] = useState(['expense', 'income']);
  const [displayCount, setDisplayCount] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [hideFromCharts, setHideFromCharts] = useState(true); // New state to control whether to hide transactions in charts

  // Add these state variables to your existing state declarations
  const [visibleCategories, setVisibleCategories] = useState([]);
  const [rollingMeanDays, setRollingMeanDays] = useState(30);
  const [rollingMeanData, setRollingMeanData] = useState([]);
  const [isComputingRollingMean, setIsComputingRollingMean] = useState(false);

  // State variables for defining new categories/subcategories
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  

  // NEW FUNCTION: Calculate totals for the selected period
  const getTotals = () => {
    // Use filtered transactions, excluding hidden ones if hideFromCharts is true
    const filteredTransactions = getFilteredTransactions(!hideFromCharts);
    
    let totalExpenses = 0;
    let totalIncome = 0;
    
    filteredTransactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        totalExpenses += Math.abs(transaction.value);
      } else if (transaction.type === 'income') {
        totalIncome += transaction.value;
      }
    });
    
    return {
      expenses: parseFloat(totalExpenses.toFixed(2)),
      income: parseFloat(totalIncome.toFixed(2)),
      balance: parseFloat((totalIncome - totalExpenses).toFixed(2))
    };
  };

  // NEW FUNCTION: Format data for the totals chart
  const getTotalsChartData = () => {
    const totals = getTotals();
    return [
      {
        name: 'Period Total',
        expenses: totals.expenses,
        income: totals.income,
        balance: totals.balance
      }
    ];
  };

  // Function to save the current state of transactions to a file
  const saveTransactionsToFile = () => {
    try {
      // Create a JSON string of the current transactions
      const dataToSave = JSON.stringify(transactions, null, 2);
      
      // Create a Blob with the data
      const blob = new Blob([dataToSave], { type: 'application/json' });
      
      // Create a temporary download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Set the filename with the current date
      const now = new Date();
      const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
      link.download = `expense_tracker_data_${dateString}.json`;
      
      // Trigger the download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      return true;
    } catch (error) {
      console.error('Error saving transactions:', error);
      return false;
    }
  };

  // Function to load transactions from a saved file
  const loadTransactionsFromFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const loadedTransactions = JSON.parse(event.target.result);
          
          // Validate the loaded data
          if (!Array.isArray(loadedTransactions)) {
            reject(new Error('Invalid data format: expected an array of transactions'));
            return;
          }
          
          // For saved datasets, we're more lenient with validation
          // as we assume the data was previously valid when saved
          // Just check for basic structure
          const isValid = loadedTransactions.every(transaction => {
            return typeof transaction === 'object' && transaction !== null;
          });
          
          if (!isValid) {
            reject(new Error('Invalid transaction data: some transactions have invalid format'));
            return;
          }
          
          // Set the transactions in state
          setTransactions(loadedTransactions);
          
          // Update date range based on loaded transactions
          if (loadedTransactions.length > 0) {
            const dates = loadedTransactions
              .filter(t => t.date)
              .map(t => t.date)
              .sort();
            
            if (dates.length > 0) {
              setStartDate(dates[0]);
              setEndDate(dates[dates.length - 1]);
            }
          }
          
          resolve(loadedTransactions.length);
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

  // Function to handle file selection for loading
  const handleLoadFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const transactionCount = await loadTransactionsFromFile(file);
      setError(`Successfully loaded ${transactionCount} transactions`);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
      // Reset the file input
      event.target.value = null;
    }
  };

  // Function to get all unique categories from transactions
  const getAllCategories = () => {
    const categories = [...new Set(
      transactions
        .filter(t => t.category && t.category.name)
        .map(t => t.category.name)
    )].sort();
    
    return categories;
  };

  // Function to get all unique subcategories for a specific category
  const getSubcategoriesForCategory = (categoryName) => {
    const subcategories = [...new Set(
      transactions
        .filter(t => t.category && t.category.name === categoryName && t.category.sub)
        .map(t => t.category.sub)
    )].filter(sub => sub).sort();
    
    return subcategories;
  };

  // Function to update transaction category
  const updateTransactionCategory = (transactionId, categoryName, subcategoryName) => {
    setTransactions(prevTransactions => 
      prevTransactions.map(transaction => 
        transaction.id === transactionId 
          ? { 
              ...transaction, 
              category: { 
                name: categoryName, 
                sub: subcategoryName 
              } 
            } 
          : transaction
      )
    );
    
    // Exit editing mode
    setEditingTransaction(null);
    setIsCreatingCategory(false);
    setNewCategoryName('');
    setNewSubcategoryName('');
  };

  // Function to handle creating a new category
  const handleCreateCategory = (transactionId) => {
    if (!newCategoryName.trim()) {
      return;
    }
    
    updateTransactionCategory(transactionId, newCategoryName.trim(), newSubcategoryName.trim());
  };
  
  const computeRollingMean = () => {
    setIsComputingRollingMean(true);
    
    // Use filtered transactions, excluding hidden ones if hideFromCharts is true
    const filteredTransactions = getFilteredTransactions(!hideFromCharts);
    
    // Ensure transactions are sorted by date
    const sortedTransactions = [...filteredTransactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    if (sortedTransactions.length === 0) {
      setRollingMeanData([]);
      setIsComputingRollingMean(false);
      return;
    }
    
    // Get unique dates from transactions
    const uniqueDates = [...new Set(sortedTransactions.map(t => t.date))].sort();
    
    // Get unique categories 
    const categories = [...new Set(
      sortedTransactions
        .filter(t => t.category && t.category.name)
        .map(t => t.category.name)
    )];
    
    // Initialize result array
    const result = [];
    
    // For each date, calculate the rolling mean for each category
    for (let i = 0; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i]);
      
      // Calculate the date range for the rolling window
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - rollingMeanDays + 1); // Start of rolling window
      
      const dateEntry = {
        date: uniqueDates[i],
        formattedDate: formatRollingMeanDate(uniqueDates[i]), // For x-axis display
        fullDate: formatTooltipDate(uniqueDates[i]),          // For tooltip display
      };
      
      // Calculate rolling mean for each category
      categories.forEach(category => {
        // Filter transactions in the rolling window for this category
        const windowTransactions = sortedTransactions.filter(t => {
          const transactionDate = new Date(t.date);
          return (
            transactionDate >= startDate && 
            transactionDate <= currentDate && 
            t.category?.name === category 
          );
        });
        
        // Calculate mean if there are transactions
        if (windowTransactions.length > 0) {
          const totalAmount = windowTransactions.reduce((sum, t) => sum + Math.abs(t.value), 0);
          const mean = totalAmount / rollingMeanDays; // Divide by window size for true rolling mean
          dateEntry[category] = parseFloat(mean.toFixed(2));
        } else {
          dateEntry[category] = 0;
        }
      });
      
      result.push(dateEntry);
    }
    
    setRollingMeanData(result);
    setIsComputingRollingMean(false);
  };
  // Update the formatRollingMeanDate function to include year information
  const formatRollingMeanDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const day = date.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    
    // For display on the X-axis, keep it compact
    return `${day} ${month}`;
  };

  // Add a new function for more detailed tooltip date formatting
  const formatTooltipDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const day = date.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    // For tooltip, include the year
    return `${day} ${month} ${year}`;
  };
  // Function to toggle category visibility in the rolling mean chart
  const toggleCategoryVisibility = (category) => {
    if (visibleCategories.includes(category)) {
      setVisibleCategories(visibleCategories.filter(c => c !== category));
    } else {
      setVisibleCategories([...visibleCategories, category]);
    }
  };

  // Add this useEffect to handle category filter changes
  useEffect(() => {
    if (categoryFilter) {
      // If a category is selected as a filter, ensure it's visible in the chart
      if (!visibleCategories.includes(categoryFilter)) {
        setVisibleCategories([...visibleCategories, categoryFilter]);
      }
    }
  }, [categoryFilter]);

  // Function to parse card transactions
  const parseCardTransactions = async (file) => {
    try {
      const text = await readFileAsText(file);
      
      // Skip the first line (sep=;) and start from the headers
      const lines = text.split('\n');
      const headerLine = lines[1];
      const dataLines = lines.slice(2).filter(line => line.trim() !== '');
      
      // Reconstruct the CSV content with headers
      const csvContent = [headerLine, ...dataLines].join('\n');
      
      // Parse with PapaParse
      const parsed = Papa.parse(csvContent, {
        delimiter: ';',
        header: true,
        skipEmptyLines: true
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
        
        if (transaction.Debit && transaction.Debit.trim()) {
          // Use Débit column for expenses (in CHF)
          type = 'expense';
          amountInCHF = parseFloat(transaction.Debit.replace(',', '.'));
          value = -amountInCHF;
        } else if (transaction.Credit && transaction.Credit.trim()) {
          // Use Crédit column for income (in CHF)
          type = 'income';
          amountInCHF = parseFloat(transaction.Credit.replace(',', '.'));
          value = amountInCHF;
        } else {
          // If no Débit/Crédit values, use the original amount
          type = 'expense'; // Default to expense
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
          amount: amountInCHF, // CHF amount for consistency
          value, // Positive for income, negative for expenses
          type,
          category: mapToCategory(transaction),
          source: 'card',
          hidden // Add hidden flag
        };
      });
    } catch (error) {
      console.error('Error parsing card transactions:', error);
      throw new Error('Could not parse card transactions file');
    }
  };
  // Helper function to format currency with number separators
  const formatCurrency = (value) => {
    return value.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  // Function to parse account transactions
  const parseAccountTransactions = async (file) => {
    // Same as original
    try {
      console.log("Starting to parse account transactions");
      const text = await readFileAsText(file);
      console.log("File read successfully, content length:", text.length);
      
      // Split into lines
      const lines = text.split('\n');
      console.log("Total lines in file:", lines.length);
      
      // The file format has been improved - header is now at the beginning
      const headerLine = lines[0];
      console.log("Header line:", headerLine);
      
      // Split the header into fields
      const headers = headerLine.split(';');
      const cleanHeaders = headers.map(h => h.trim().replace(/^"/, '').replace(/"$/, ''));
      console.log("Headers:", cleanHeaders);
      
      // Parse all data lines (excluding the header)
      const transactions = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines
        
        const values = line.split(';');
        if (values.length < 5) continue; // Skip lines with too few fields
        
        // Create transaction object
        const transaction = {};
        
        // Assign values to corresponding headers
        cleanHeaders.forEach((header, index) => {
          if (index < values.length && header) {
            transaction[header] = values[index].replace(/^"/, '').replace(/"$/, '');
          }
        });
        
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
        
        if (transaction.Debit && transaction.Debit.trim()) {
          type = 'expense';
          // Handle various number formats in European style (comma as decimal separator)
          const debitStr = transaction.Debit.replace(/\s/g, '').replace(',', '.');
          value = -parseFloat(debitStr);
          amount = Math.abs(value);
        } else if (transaction.Credit && transaction.Credit.trim()) {
          type = 'income';
          // Handle various number formats in European style (comma as decimal separator)
          const creditStr = transaction.Credit.replace(/\s/g, '').replace(',', '.');
          value = parseFloat(creditStr);
          amount = value;
        }
        
        if (isNaN(value) || value === 0) {
          // Skip transactions with invalid or zero amounts
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
          // For expenses, Description1 often contains the recipient
          recipient = extractName(desc1);
        } else if (type === 'income') {
          // For income, Description1 often contains the sender
          sender = extractName(desc1);
        }
        
        // Combine descriptions for display
        const description = [desc1, desc2, desc3]
          .filter(d => d.trim() !== '')
          .join(' - ');
        
        // Create the transaction object
        // Set hidden flag for account transactions with description = "TRANSFERT D'UN COMPTE"
        const hidden = description.trim() === "TRANSFERT D'UN COMPTE";
        
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
          hidden // Add hidden flag
        });
      }
      
      console.log(`Successfully parsed ${transactions.length} account transactions`);
      return transactions;
    } catch (error) {
      console.error('Error parsing account transactions:', error);
      throw new Error(`Could not parse account transactions file: ${error.message}`);
    }
  };
  
  // Helper function to extract names from description fields
  const extractName = (description) => {
    // Same as original
    if (!description) return null;
    
    // Clean the description
    const cleanDesc = description.replace(/^"/, '').replace(/"$/, '').trim();
    
    // If empty after cleaning, return null
    if (!cleanDesc) return null;
    
    // Look for common patterns of names
    // 1. Names often at the beginning of the string, followed by address or other info
    const addressPattern = /^([^,\d]+)(?:[,\s]+\d+.*)?$/;
    const match = cleanDesc.match(addressPattern);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // If no pattern match, just return the first part of the description (up to 30 chars)
    return cleanDesc.substring(0, Math.min(30, cleanDesc.length));
  };

  // Helper function to read file as text
  const readFileAsText = (file) => {
    // Same as original
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsText(file, file.name.endsWith('card_transactions.csv') ? 'windows-1252' : 'utf-8');
    });
  };

  // Function to map transactions to categories
  const mapToCategory = (transaction) => {
    // Same as original
    // Get all possible description fields
    const mainDescription = (transaction["Texte comptable"] || '').toLowerCase();
    const description1 = (transaction.Description1 || '').toLowerCase();
    const description2 = (transaction.Description2 || '').toLowerCase();
    const description3 = (transaction.Description3 || '').toLowerCase();
    const sector = (transaction.Secteur || '').toLowerCase();
    
    // Combine all descriptions for better matching
    const fullDescription = `${mainDescription} ${description1} ${description2} ${description3}`.toLowerCase();
    
    // Check for specialized categories based on your specific transactions
    
    // Hospital payments (salary)
    if (fullDescription.includes('hopitaux universitaires') || 
        fullDescription.includes('hôpitaux universitaires') ||
        (fullDescription.includes('geneve') && fullDescription.includes('perret-gentil'))) {
      return {
        name: 'Income',
        sub: 'Salary'
      };
    }
    
    // Investment platforms
    if (fullDescription.includes('trading 212') || 
        fullDescription.includes('ibkr') ||
        fullDescription.includes('interactive brokers')) {
      return {
        name: 'Investments',
        sub: 'Trading'
      };
    }
    if (fullDescription.includes('retrait au bancomat')) {
      return {
        name: 'ATM withdrawals',
        sub: ''
      };
    }
    
    
    // Retirement accounts
    if (fullDescription.includes('frankly') || 
        fullDescription.includes('truewealth') ||
        fullDescription.includes('pillar 3a') ||
        fullDescription.includes('pilier 3a')) {
      return {
        name: 'Retirement',
        sub: 'Pillar 3A'
      };
    }
    if (fullDescription.includes('"david nicolas de ridder",,,,') || 
        description1.includes('david nicolas de ridder') ||
        (transaction.recipient && transaction.recipient.toLowerCase().includes('david nicolas de ridder'))) {
      return {
        name: 'Investments',
        sub: 'Pension fund'
      };
    }
    // Taxes
    if (fullDescription.includes('"etat de genève",,,,,') || 
        description1.includes('"etat de genève",,,,,') ||
        (transaction.recipient && transaction.recipient.toLowerCase().includes('"etat de genève",,,,,'))) {
      return {
        name: 'Taxes',
        sub: ''
      };
    }

    // Rent payments
    if (fullDescription.includes('bordier schmidhauser') || 
        (fullDescription.includes('loyer') && fullDescription.includes('geneve'))) {
      return {
        name: 'Housing',
        sub: 'Rent'
      };
    }
    
    // Flights and airlines
    if (fullDescription.includes('qatar') || 
        fullDescription.includes('swiss air') ||
        fullDescription.includes('easyjet') ||
        fullDescription.includes('lufthansa') ||
        fullDescription.includes('air france') ||
        fullDescription.includes('skywestair') ||
        fullDescription.includes('british airways') ||
        fullDescription.includes('klm') ||
        fullDescription.includes('emirates')) {
      return {
        name: 'Travel',
        sub: 'Flights'
      };
    }
    
    // Check for common banking transactions
    if (fullDescription.includes('virement') || 
        fullDescription.includes('transfer') || 
        fullDescription.includes('versement') ||
        fullDescription.includes('credit') ||
        fullDescription.includes('crédit')) {
      // Try to identify source of income
      
      // Check for salary from hospitals first (highest priority)
      if (fullDescription.includes('hopitaux universitaires de geneve') ||
          fullDescription.includes('hôpitaux') ||
          fullDescription.includes('universite de geneve') ||
          fullDescription.includes('universitaires') ||
          fullDescription.includes('geneve') && fullDescription.includes('perret-gentil')) {
        return {
          name: 'Income',
          sub: 'Salary'
        };
      } else if (fullDescription.includes('salaire') || 
          fullDescription.includes('salary') || 
          fullDescription.includes('paie') ||
          fullDescription.includes('payroll')) {
        return {
          name: 'Income',
          sub: 'Salary'
        };
      } else if (fullDescription.includes('dividend') || 
                fullDescription.includes('dividende') ||
                fullDescription.includes('investment') ||
                fullDescription.includes('investissement')) {
        return {
          name: 'Income',
          sub: 'Investments'
        };
      } else {
        return {
          name: 'Income',
          sub: 'Transfer'
        };
      }
    }
    
    // Check for banking fees
    if (fullDescription.includes('frais') || 
        fullDescription.includes('fee') || 
        fullDescription.includes('commission') ||
        fullDescription.includes('intérêt') ||
        fullDescription.includes('interest')) {
      return {
        name: 'Banking',
        sub: 'Fees & Interest'
      };
    }
    
    // Health Insurance specific providers
    if (fullDescription.includes('assura') || 
        fullDescription.includes('groupe mutuel') ||
        fullDescription.includes('mutuel assurance') ||
        fullDescription.includes('css') ||
        fullDescription.includes('helsana') ||
        fullDescription.includes('sanitas') ||
        fullDescription.includes('swica') ||
        fullDescription.includes('concordia') ||
        fullDescription.includes('supra-1846') ||
        fullDescription.includes('visana')) {
      return {
        name: 'Insurance',
        sub: 'Health'
      };
    }
    
    // General Insurance
    if (fullDescription.includes('insurance') || 
        fullDescription.includes('assurance') ||
        fullDescription.includes('axa') ||
        fullDescription.includes('zurich') ||
        fullDescription.includes('baloise') ||
        fullDescription.includes('allianz') ||
        fullDescription.includes('generali') ||
        fullDescription.includes('helvetia')) {
      
      if (fullDescription.includes('car') || 
          fullDescription.includes('auto') ||
          fullDescription.includes('voiture') ||
          fullDescription.includes('vehicule')) {
        return {
          name: 'Insurance',
          sub: 'Car'
        };
      } else if (fullDescription.includes('health') || 
                fullDescription.includes('santé') ||
                fullDescription.includes('maladie') ||
                fullDescription.includes('medical')) {
        return {
          name: 'Insurance',
          sub: 'Health'
        };
      } else if (fullDescription.includes('home') || 
                fullDescription.includes('maison') ||
                fullDescription.includes('habitation') ||
                fullDescription.includes('household') ||
                fullDescription.includes('apartment')) {
        return {
          name: 'Insurance',
          sub: 'Home'
        };
      } else {
        return {
          name: 'Insurance',
          sub: 'Other'
        };
      }
    }
    
    // Subscription category
    if (fullDescription.includes('spotify') || 
        fullDescription.includes('netflix') || 
        fullDescription.includes('apple.com/bill') ||
        fullDescription.includes('amazon prime') ||
        fullDescription.includes('disney+') ||
        fullDescription.includes('hbo') ||
        fullDescription.includes('youtube') ||
        fullDescription.includes('twitch') ||
        fullDescription.includes('crunchyroll') ||
        fullDescription.includes('deezer') ||
        fullDescription.includes('spotify') ||
        fullDescription.includes('pandora') ||
        fullDescription.includes('tidal') ||
        fullDescription.includes('abonnement') ||
        fullDescription.includes('subscription') ||
        sector.includes('médias numériques')) {
      
      // Determine subscription type
      if (fullDescription.includes('spotify') || 
          fullDescription.includes('apple music') || 
          fullDescription.includes('deezer') ||
          fullDescription.includes('tidal') ||
          fullDescription.includes('pandora')) {
        return {
          name: 'Subscriptions',
          sub: 'Music'
        };
      } else if (fullDescription.includes('netflix') || 
                fullDescription.includes('disney+') || 
                fullDescription.includes('hbo') ||
                fullDescription.includes('amazon prime') ||
                fullDescription.includes('youtube premium') ||
                fullDescription.includes('crunchyroll')) {
        return {
          name: 'Subscriptions',
          sub: 'Video'
        };
      } else if (fullDescription.includes('apple.com')) {
        return {
          name: 'Subscriptions',
          sub: 'Apple Services'
        };
      } else if (fullDescription.includes('microsoft') || 
                fullDescription.includes('office') || 
                fullDescription.includes('adobe') ||
                fullDescription.includes('dropbox') ||
                fullDescription.includes('google')) {
        return {
          name: 'Subscriptions',
          sub: 'Software'
        };
      } else if (fullDescription.includes('claude') || 
                fullDescription.includes('chatgpt')) {
        return {
          name: 'Subscriptions',
          sub: 'AI'
        };
      } else {
        return {
          name: 'Subscriptions',
          sub: 'Other'
        };
      }
    }
    
    // Food delivery - Check this before general Uber check (for taxis)
    if (fullDescription.includes('uber *eats') || 
        fullDescription.includes('uber eats') || 
        fullDescription.includes('deliveroo') || 
        fullDescription.includes('just eat') ||
        fullDescription.includes('takeaway') ||
        fullDescription.includes('delivery') ||
        fullDescription.includes('livraison repas') ||
        fullDescription.includes('smood') ||
        fullDescription.includes('eat.ch') ||
        // Special check for Uber Eats in various formats
        (fullDescription.includes('uber') && fullDescription.includes('eats'))) {
      return {
        name: 'Food',
        sub: 'Takeaway'
      };
    }
    
    // Home category
    if (fullDescription.includes('migros') || 
        fullDescription.includes('coop') || 
        fullDescription.includes('denner') ||
        fullDescription.includes('aldi') || 
        fullDescription.includes('lidl') ||
        fullDescription.includes('manor') ||
        fullDescription.includes('globus') ||
        fullDescription.includes('spar') ||
        fullDescription.includes('volg') ||
        fullDescription.includes('carrefour') ||
        fullDescription.includes('casino') ||
        fullDescription.includes('monoprix') ||
        fullDescription.includes('grocery') ||
        fullDescription.includes('supermarket') ||
        fullDescription.includes('supermarché') ||
        sector.includes('alimentation') ||
        sector.includes('magasin d alimentation')) {
      return {
        name: 'Home',
        sub: 'Groceries'
      };
    }
    
    if (fullDescription.includes('ikea') || 
        fullDescription.includes('conforama') ||
        fullDescription.includes('home depot') ||
        fullDescription.includes('jumbo') ||
        fullDescription.includes('hornbach') ||
        fullDescription.includes('bauhaus') ||
        fullDescription.includes('möbel') ||
        fullDescription.includes('furniture') ||
        fullDescription.includes('meuble')) {
      return {
        name: 'Home',
        sub: 'Furniture'
      };
    }
    
    if (fullDescription.includes('swisscom') || 
        fullDescription.includes('salt') || 
        fullDescription.includes('sunrise') ||
        fullDescription.includes('internet') ||
        fullDescription.includes('téléphone') ||
        fullDescription.includes('phone bill') ||
        fullDescription.includes('telecommunications')) {
      return {
        name: 'Home',
        sub: 'Phone & TV'
      };
    }
    
    if (fullDescription.includes('eau') || 
        fullDescription.includes('water') || 
        fullDescription.includes('électricité') ||
        fullDescription.includes('electricity') ||
        fullDescription.includes('gaz') ||
        fullDescription.includes('gas') ||
        fullDescription.includes('service industriel') ||
        fullDescription.includes('utility') ||
        fullDescription.includes('chauffage') ||
        fullDescription.includes('heating')) {
      return {
        name: 'Home',
        sub: 'Utilities'
      };
    }
    
    // Restaurants & Takeaway
    if (fullDescription.includes('restaurant') || 
        fullDescription.includes('café') || 
        fullDescription.includes('cafe') ||
        fullDescription.includes('bar') ||
        fullDescription.includes('bistro') ||
        fullDescription.includes('brasserie') ||
        fullDescription.includes('mcdonalds') ||
        fullDescription.includes('burger king') ||
        fullDescription.includes('starbucks') ||
        fullDescription.includes('coffeeshop') ||
        sector.includes('restaurant') ||
        sector.includes('restauration')) {
      return {
        name: 'Food',
        sub: 'Restaurant'
      };
    }
    
    // Transport
    if (fullDescription.includes('cff') || 
        fullDescription.includes('sbb') || 
        fullDescription.includes('sncf') ||
        fullDescription.includes('tpg') ||
        fullDescription.includes('metro') ||
        fullDescription.includes('tram') ||
        fullDescription.includes('bus') ||
        fullDescription.includes('train') ||
        fullDescription.includes('transport public')) {
      return {
        name: 'Transport',
        sub: 'Public Transport'
      };
    }
    
    // Check for Uber TRIP specifically (for rides)
    if ((fullDescription.includes('uber *trip') || 
         fullDescription.includes('uber trip') ||
         fullDescription.includes('uber *one') ||
         (fullDescription.includes('uber') && !fullDescription.includes('eats') && !fullDescription.includes('eat'))) || 
        fullDescription.includes('taxi') ||
        fullDescription.includes('cabify') ||
        fullDescription.includes('lyft')) {
      return {
        name: 'Transport',
        sub: 'Taxi'
      };
    }
    
    if (fullDescription.includes('gas station') ||
        fullDescription.includes('essence') ||
        fullDescription.includes('petrol') ||
        fullDescription.includes('carburant') ||
        fullDescription.includes('shell') ||
        fullDescription.includes('bp ') ||
        fullDescription.includes('caltex') ||
        fullDescription.includes('migrol') ||
        fullDescription.includes('tamoil') ||
        fullDescription.includes('avia') ||
        fullDescription.includes('station service')) {
      return {
        name: 'Transport',
        sub: 'Fuel'
      };
    }
    
    if (fullDescription.includes('parking') ||
        fullDescription.includes('parkmeter') ||
        fullDescription.includes('parkhaus') ||
        fullDescription.includes('stationnement')) {
      return {
        name: 'Transport',
        sub: 'Parking'
      };
    }
    
    if (fullDescription.includes('mecanique') ||
        fullDescription.includes('garage') ||
        fullDescription.includes('auto repair') ||
        fullDescription.includes('car service') ||
        fullDescription.includes('entretien voiture')) {
      return {
        name: 'Transport',
        sub: 'Car Maintenance'
      };
    }
    
    // Clothes & Shopping
    if (fullDescription.includes('h&m') || 
        fullDescription.includes('zara') || 
        fullDescription.includes('mango') ||
        fullDescription.includes('c&a') ||
        fullDescription.includes('primark') ||
        fullDescription.includes('esprit') ||
        fullDescription.includes('pull and bear') ||
        fullDescription.includes('bershka') ||
        fullDescription.includes('massimo dutti') ||
        fullDescription.includes('uniqlo') ||
        sector.includes('vêtements') ||
        sector.includes('clothing')) {
      return {
        name: 'Shopping',
        sub: 'Clothes'
      };
    }
    
    if (fullDescription.includes('amazon') ||
        fullDescription.includes('aliexpress') ||
        fullDescription.includes('ebay') ||
        fullDescription.includes('zalando') ||
        fullDescription.includes('galaxus') ||
        fullDescription.includes('digitec') ||
        fullDescription.includes('online shopping')) {
      return {
        name: 'Shopping',
        sub: 'Online'
      };
    }
    
    if (fullDescription.includes('fnac') ||
        fullDescription.includes('mediamarkt') ||
        fullDescription.includes('interdiscount') ||
        fullDescription.includes('fust') ||
        fullDescription.includes('microspot') ||
        fullDescription.includes('brack') ||
        fullDescription.includes('electronic') ||
        fullDescription.includes('electronique')) {
      return {
        name: 'Shopping',
        sub: 'Electronics'
      };
    }
    
    // Health & Wellness
    if (fullDescription.includes('gym') || 
        fullDescription.includes('fitness') ||
        fullDescription.includes('sport') ||
        fullDescription.includes('crossfit') ||
        fullDescription.includes('yoga') ||
        fullDescription.includes('pilates') ||
        fullDescription.includes('tennis') ||
        fullDescription.includes('golf') ||
        fullDescription.includes('swimming') ||
        fullDescription.includes('natation')) {
      return {
        name: 'Health & Wellness',
        sub: 'Sport'
      };
    }
    
    if (fullDescription.includes('medecin') ||
        fullDescription.includes('doctor') ||
        fullDescription.includes('hopital') ||
        fullDescription.includes('hospital') ||
        fullDescription.includes('clinic') ||
        fullDescription.includes('clinique') ||
        fullDescription.includes('dentist') ||
        fullDescription.includes('dentiste') ||
        fullDescription.includes('medical') ||
        fullDescription.includes('médical')) {
      return {
        name: 'Health & Wellness',
        sub: 'Medical'
      };
    }
    
    if (fullDescription.includes('pharmacy') ||
        fullDescription.includes('pharmacie') ||
        fullDescription.includes('amavita') ||
        fullDescription.includes('sunkstore') ||
        fullDescription.includes('coop vitality') ||
        fullDescription.includes('medication') ||
        fullDescription.includes('médicament')) {
      return {
        name: 'Health & Wellness',
        sub: 'Pharmacy'
      };
    }
    
    // Housing
    if (fullDescription.includes('loyer') || 
        fullDescription.includes('location') ||
        fullDescription.includes('regies') ||
        fullDescription.includes('property management') ||
        fullDescription.includes('appartement payment')) {
      return {
        name: 'Housing',
        sub: 'Rent'
      };
    }
    
    if (fullDescription.includes('mortgage') ||
        fullDescription.includes('hypothèque') ||
        fullDescription.includes('hypotheque') ||
        fullDescription.includes('home loan')) {
      return {
        name: 'Housing',
        sub: 'Mortgage'
      };
    }
    
    // Entertainment
    if (fullDescription.includes('cinema') ||
        fullDescription.includes('movie') ||
        fullDescription.includes('film') ||
        fullDescription.includes('pathé') ||
        fullDescription.includes('arena cinemas')) {
      return {
        name: 'Entertainment',
        sub: 'Cinema'
      };
    }
    
    if (fullDescription.includes('concert') ||
        fullDescription.includes('festival') ||
        fullDescription.includes('ticket master') ||
        fullDescription.includes('show') ||
        fullDescription.includes('theatre') ||
        fullDescription.includes('théâtre') ||
        fullDescription.includes('opéra') ||
        fullDescription.includes('spectacle')) {
      return {
        name: 'Entertainment',
        sub: 'Events'
      };
    }
    
    // Travel
    if (fullDescription.includes('hotel') ||
        fullDescription.includes('airbnb') ||
        fullDescription.includes('booking.com') ||
        fullDescription.includes('lodging') ||
        fullDescription.includes('accommodation') ||
        fullDescription.includes('hébergement')) {
      return {
        name: 'Travel',
        sub: 'Accommodation'
      };
    }
    
    if (fullDescription.includes('airline') ||
        fullDescription.includes('flight') ||
        fullDescription.includes('swiss') ||
        fullDescription.includes('easyjet') ||
        fullDescription.includes('lufthansa') ||
        fullDescription.includes('air france') ||
        fullDescription.includes('british airways') ||
        fullDescription.includes('aérien')) {
      return {
        name: 'Travel',
        sub: 'Flights'
      };
    }
    
    // Use sector if available for unknown categories
    if (sector) {
      if (sector.includes('restaurant') || sector.includes('fast-food')) {
        return {
          name: 'Food',
          sub: 'Restaurant'
        };
      } else if (sector.includes('alimentation') || sector.includes('supermarché')) {
        return {
          name: 'Home',
          sub: 'Groceries'
        };
      } else if (sector.includes('vêtements') || sector.includes('clothing')) {
        return {
          name: 'Shopping',
          sub: 'Clothes'
        };
      } else if (sector.includes('médias') || sector.includes('musique') || sector.includes('livres')) {
        return {
          name: 'Entertainment',
          sub: 'Media'
        };
      } else if (sector.includes('voyage') || sector.includes('hôtel')) {
        return {
          name: 'Travel',
          sub: 'Accommodation'
        };
      } else {
        return {
          name: 'Miscellaneous',
          sub: sector.charAt(0).toUpperCase() + sector.slice(1)
        };
      }
    }
    
    // Try to extract info from description if nothing else matched
    if (fullDescription.includes('transfer') || fullDescription.includes('virement')) {
      return {
        name: 'Banking',
        sub: 'Transfer'
      };
    }
    
    // Default category
    return {
      name: 'Miscellaneous',
      sub: 'Other'
    };
  };

  // Function to handle file upload
  const handleFileUpload = async (event) => {
    // Same as original
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let newTransactions = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (file.name.includes('card_transactions')) {
          const cardTransactions = await parseCardTransactions(file);
          newTransactions = [...newTransactions, ...cardTransactions];
        } else if (file.name.includes('account_transactions')) {
          const accountTransactions = await parseAccountTransactions(file);
          newTransactions = [...newTransactions, ...accountTransactions];
        }
      }
      
      // Sort transactions by date
      newTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setTransactions(newTransactions);
      
      // Set date range based on transactions
      if (newTransactions.length > 0) {
        const dates = newTransactions
          .filter(t => t.date)
          .map(t => t.date)
          .sort();
        
        if (dates.length > 0) {
          setStartDate(dates[0]);
          setEndDate(dates[dates.length - 1]);
        }
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Sort transactions based on the sort configuration
  const sortTransactions = (transactionsToSort) => {
    const sortableTransactions = [...transactionsToSort];
    
    if (sortConfig.key) {
      sortableTransactions.sort((a, b) => {
        // Handle special cases for different data types
        if (sortConfig.key === 'amount' || sortConfig.key === 'value') {
          // For numeric values
          const aValue = parseFloat(a[sortConfig.key]) || 0;
          const bValue = parseFloat(b[sortConfig.key]) || 0;
          
          if (sortConfig.direction === 'ascending') {
            return aValue - bValue;
          } else {
            return bValue - aValue;
          }
        } else if (sortConfig.key === 'date') {
          // For dates
          const aDate = new Date(a.date || '1970-01-01');
          const bDate = new Date(b.date || '1970-01-01');
          
          if (sortConfig.direction === 'ascending') {
            return aDate - bDate;
          } else {
            return bDate - aDate;
          }
        } else if (sortConfig.key === 'category') {
          // For category objects
          const aCategory = a.category?.name || '';
          const bCategory = b.category?.name || '';
          
          if (sortConfig.direction === 'ascending') {
            return aCategory.localeCompare(bCategory);
          } else {
            return bCategory.localeCompare(aCategory);
          }
        } else if (sortConfig.key === 'subcategory') {
          // For subcategory objects
          const aSubcategory = a.category?.sub || '';
          const bSubcategory = b.category?.sub || '';
          
          if (sortConfig.direction === 'ascending') {
            return aSubcategory.localeCompare(bSubcategory);
          } else {
            return bSubcategory.localeCompare(aSubcategory);
          }
        } else {
          // For string values and other cases
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

  // Request sort when a column header is clicked
  const requestSort = (key) => {
    // Same as original
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Filter transactions based on all filters
  // Added an includeHidden parameter to control whether to include hidden transactions
  const getFilteredTransactions = (includeHidden = true) => {
    const filtered = transactions.filter(transaction => {
      // Skip transactions without a date
      if (!transaction.date) return false;
      
      // Filter out hidden transactions if includeHidden is false
      if (!includeHidden && transaction.hidden) return false;
      
      // Apply date range filter if both dates are set
      if (startDate && endDate) {
        if (transaction.date < startDate || transaction.date > endDate) {
          return false;
        }
      }
      
      // Filter by transaction type
      if (!transactionTypeFilter.includes(transaction.type)) {
        return false;
      }
      
      // Filter by category if a category filter is set
      if (categoryFilter && transaction.category?.name !== categoryFilter) {
        return false;
      }
      
      // Filter by subcategory if a subcategory filter is set
      if (subcategoryFilter && transaction.category?.sub !== subcategoryFilter) {
        return false;
      }
      
      // Filter by description search term (case insensitive)
      if (searchTerm && !transaction.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filter by minimum amount
      if (minAmount !== '' && transaction.amount < parseFloat(minAmount)) {
        return false;
      }
      
      // Filter by maximum amount
      if (maxAmount !== '' && transaction.amount > parseFloat(maxAmount)) {
        return false;
      }
      
      return true;
    });
    
    // Apply sorting to filtered transactions
    return sortTransactions(filtered);
  };
  
  // Toggle hidden status for a transaction
  const toggleHidden = (id) => {
    setTransactions(prevTransactions => 
      prevTransactions.map(transaction => 
        transaction.id === id ? { ...transaction, hidden: !transaction.hidden } : transaction
      )
    );
  };
  
  // NEW: Function to hide all currently filtered transactions
  const hideAllFilteredTransactions = (hideValue = true) => {
    // Get the IDs of all currently filtered transactions
    const filteredIds = getFilteredTransactions().map(transaction => transaction.id);
    
    // Update all transactions, setting hidden=true for the filtered ones
    setTransactions(prevTransactions => 
      prevTransactions.map(transaction => 
        filteredIds.includes(transaction.id) ? { ...transaction, hidden: hideValue } : transaction
      )
    );
  };

  // Function to apply time filter (last month, last 3 months, etc.)
  const applyTimeFilter = () => {
    // Same as original
    if (!transactions.length) return;
    
    const now = new Date();
    let newStartDate = '';
    
    switch (timeFilter) {
      case 'currentYear':
        newStartDate = `${now.getFullYear()}-01-01`;
        break;
      case 'lastMonth':
        now.setMonth(now.getMonth() - 1);
        newStartDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;
        now.setMonth(now.getMonth() + 1, 0); // Last day of the previous month
        setEndDate(`${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`);
        break;
      case 'last3Months':
        now.setMonth(now.getMonth() - 3);
        newStartDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;
        break;
      case 'last6Months':
        now.setMonth(now.getMonth() - 6);
        newStartDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;
        break;
      case 'last12Months':
        now.setFullYear(now.getFullYear() - 1);
        newStartDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
        break;
      case 'last2Years':
        now.setFullYear(now.getFullYear() - 2);
        newStartDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
        break;
      default:
        // Reset to all transactions
        const dates = transactions
          .filter(t => t.date)
          .map(t => t.date)
          .sort();
        
        if (dates.length > 0) {
          newStartDate = dates[0];
          setEndDate(dates[dates.length - 1]);
        }
    }
    
    setStartDate(newStartDate);
    
    if (timeFilter !== 'lastMonth' && timeFilter !== 'all') {
      // Set end date to current date for other filters
      const today = new Date();
      setEndDate(`${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`);
    }
  };

  // Effect to apply time filter when it changes
  useEffect(() => {
    applyTimeFilter();
  }, [timeFilter]);

  // Group transactions by month for the chart
  const getMonthlyData = () => {
    // Use filtered transactions, excluding hidden ones if hideFromCharts is true
    const filteredTransactions = getFilteredTransactions(!hideFromCharts);
    const monthlyData = {};
    
    filteredTransactions.forEach(transaction => {
      // Skip transactions without a date
      if (!transaction.date) return;
      
      // Get year-month (YYYY-MM)
      const yearMonth = transaction.date.substring(0, 7);
      
      if (!monthlyData[yearMonth]) {
        monthlyData[yearMonth] = {
          month: yearMonth,
          expenses: 0,
          income: 0
        };
      }
      
      if (transaction.type === 'expense') {
        monthlyData[yearMonth].expenses += Math.abs(transaction.value);
      } else if (transaction.type === 'income') {
        monthlyData[yearMonth].income += transaction.value;
      }
    });
    
    // Convert to array and sort by month chronologically
    return Object.values(monthlyData)
      .map(month => {
        // Parse year and month for proper sorting
        const [year, monthNum] = month.month.split('-');
        
        return {
          ...month,
          month: formatMonth(month.month), // Format month for display
          expenses: parseFloat(month.expenses.toFixed(2)),
          income: parseFloat(month.income.toFixed(2)),
          sortKey: new Date(parseInt(year), parseInt(monthNum) - 1, 1).getTime() // Use timestamp for sorting
        };
      })
      .sort((a, b) => a.sortKey - b.sortKey);
  };

  // Group transactions by category for the pie chart
  const getCategoryData = () => {
    // Use filtered transactions, excluding hidden ones if hideFromCharts is true
    const filteredTransactions = getFilteredTransactions(!hideFromCharts);
    const categories = {};
    
    // Process all transactions
    filteredTransactions.forEach(transaction => {
      const categoryName = transaction.category?.name || 'Miscellaneous';
      
      if (!categories[categoryName]) {
        categories[categoryName] = {
          name: categoryName,
          value: 0,
          subcategories: {}
        };
      }
      
      // Use the transaction value - positive for income, negative for expenses
      const transactionValue = Math.abs(transaction.value);
      categories[categoryName].value += transactionValue;
      
      const subName = transaction.category?.sub || 'Other';
      if (!categories[categoryName].subcategories[subName]) {
        categories[categoryName].subcategories[subName] = 0;
      }
      
      categories[categoryName].subcategories[subName] += transactionValue;
    });
    
    // Convert to array and format numbers
    return Object.values(categories)
      .map(category => ({
        ...category,
        value: parseFloat(category.value.toFixed(2)),
        subcategories: Object.entries(category.subcategories).map(([name, value]) => ({
          name,
          value: parseFloat(value.toFixed(2))
        }))
      }))
      .sort((a, b) => b.value - a.value);
  };

  // Get subcategory data for the selected category
  const getSubcategoryData = () => {
    if (!activeCategory) return [];
    
    const categoryData = getCategoryData();
    const category = categoryData.find(c => c.name === activeCategory);
    
    return category ? category.subcategories.sort((a, b) => b.value - a.value) : [];
  };
  
  // Apply a subcategory filter when clicking on a subcategory in the pie chart
  const handleSubcategoryClick = (subcategory) => {
    setSubcategoryFilter(subcategory.name);
  };
  
  // Clear both category and subcategory filters
  const clearCategoryFilters = () => {
    setCategoryFilter(null);
    setSubcategoryFilter(null);
    setActiveCategory(null);
  };

  // Helper to format month for display (YYYY-MM to MMM YYYY)
  const formatMonth = (yearMonth) => {
    // Same as original
    if (!yearMonth) return '';
    
    const [year, month] = yearMonth.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  // Colors for the charts
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
    '#82CA9D', '#FECBA6', '#9FB4FF', '#FFBCF3', '#C490D1'
  ];

  // Render the component
  return (
    <div className="flex flex-col w-full p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Expense Tracker</h1>
      
      {/* File Upload Section */}
      <div className="mb-6 p-4 bg-white rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Upload Transaction Files</h2>
        <p className="text-sm text-gray-600 mb-2">
          Upload your card_transactions.csv and account_transactions.csv files
        </p>
        <input 
          type="file" 
          multiple 
          onChange={handleFileUpload} 
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        
        {isLoading && (
          <div className="mt-2 text-blue-600">Loading transactions...</div>
        )}
        
        {error && (
          <div className="mt-2 text-red-600">{error}</div>
        )}
        
        {transactions.length > 0 && (
          <div className="mt-2 text-green-600">
            Loaded {transactions.length} transactions
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-4">
          <div>
            <h3 className="text-md font-semibold mb-2">Save/Load Dataset</h3>
            <div className="flex space-x-2">
              <button
                onClick={saveTransactionsToFile}
                disabled={transactions.length === 0}
                className={`px-4 py-2 rounded ${
                  transactions.length === 0 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                Save Current Dataset
              </button>
              
              <div className="relative">
                <button
                  onClick={() => document.getElementById('load-saved-dataset').click()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  Load Saved Dataset
                </button>
                <input
                  id="load-saved-dataset"
                  type="file"
                  accept=".json"
                  onChange={handleLoadFile}
                  className="hidden"
                />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Save your current dataset with all modifications (hidden transactions, etc.) for future sessions.
            </p>
          </div>
        </div>
      </div>
      
      {transactions.length > 0 && (
        <>
          {/* Date Filter Section */}
          <div className="mb-6 p-4 bg-white rounded shadow">
            <h2 className="text-lg font-semibold mb-2">Filter Transactions</h2>
            
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 bg-white text-gray-800"
                />
              </div>
              
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">End Date</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 bg-white text-gray-800"
                />
              </div>
              
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Time Period</label>
                <select 
                  value={timeFilter} 
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 bg-white text-gray-800"
                >
                  <option value="all">All Time</option>
                  <option value="currentYear">Current Year</option>
                  <option value="lastMonth">Last Month</option>
                  <option value="last3Months">Last 3 Months</option>
                  <option value="last6Months">Last 6 Months</option>
                  <option value="last12Months">Last 12 Months</option>
                  <option value="last2Years">Last 2 Years</option>
                </select>
              </div>
              
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Chart Type</label>
                <select 
                  value={chartType} 
                  onChange={(e) => setChartType(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 bg-white text-gray-800"
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                </select>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Transaction Types</label>
                <div className="flex gap-2">
                  <label className="inline-flex items-center">
                    <input 
                      type="checkbox" 
                      checked={transactionTypeFilter.includes('expense')} 
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTransactionTypeFilter(prev => [...prev, 'expense']);
                        } else {
                          setTransactionTypeFilter(prev => prev.filter(type => type !== 'expense'));
                        }
                      }}
                      className="form-checkbox h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Expenses</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input 
                      type="checkbox" 
                      checked={transactionTypeFilter.includes('income')} 
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTransactionTypeFilter(prev => [...prev, 'income']);
                        } else {
                          setTransactionTypeFilter(prev => prev.filter(type => type !== 'income'));
                        }
                      }}
                      className="form-checkbox h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Income</span>
                  </label>
                </div>
              </div>
              
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Chart Options</label>
                <label className="inline-flex items-center">
                  <input 
                    type="checkbox" 
                    checked={hideFromCharts} 
                    onChange={(e) => setHideFromCharts(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Hide selected transactions from charts</span>
                </label>
              </div>
              
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Search in Description</label>
                <input 
                  type="text" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter search term..."
                  className="border border-gray-300 rounded px-2 py-1 bg-white text-gray-800"
                />
              </div>
              
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Min Amount (CHF)</label>
                <input 
                  type="number" 
                  value={minAmount} 
                  onChange={(e) => setMinAmount(e.target.value)}
                  placeholder="Min"
                  className="border border-gray-300 rounded px-2 py-1 bg-white text-gray-800"
                />
              </div>
              
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Max Amount (CHF)</label>
                <input 
                  type="number" 
                  value={maxAmount} 
                  onChange={(e) => setMaxAmount(e.target.value)}
                  placeholder="Max"
                  className="border border-gray-300 rounded px-2 py-1 bg-white text-gray-800"
                />
              </div>
              
              <div className="flex flex-col justify-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setMinAmount('');
                    setMaxAmount('');
                    setTransactionTypeFilter(['expense', 'income']);
                    setTimeFilter('all');
                    setCategoryFilter(null);
                    setActiveCategory(null);
                    // Reset to default filters
                    const dates = transactions
                      .filter(t => t.date)
                      .map(t => t.date)
                      .sort();
                    
                    if (dates.length > 0) {
                      setStartDate(dates[0]);
                      setEndDate(dates[dates.length - 1]);
                    }
                  }}
                  className="px-4 py-1 bg-gray-200 rounded hover:bg-gray-300 text-gray-800"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
          
          {/* MODIFIED: Charts Section with two charts side by side */}
          <div className="mb-6 p-4 bg-white rounded shadow">
            <h2 className="text-lg font-semibold mb-4">Financial Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Monthly Chart */}
              <div>
                <h3 className="text-md font-medium mb-2">Monthly Breakdown</h3>
                <div className="h-64 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'bar' ? (
                      <BarChart
                        data={getMonthlyData()}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CHF`} />
                        <Legend />
                        <Bar dataKey="expenses" name="Expenses" fill="#FF8042" />
                        <Bar dataKey="income" name="Income" fill="#0088FE" />
                      </BarChart>
                    ) : (
                      <LineChart
                        data={getMonthlyData()}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CHF`} />
                        <Legend />
                        <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#FF8042" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="income" name="Income" stroke="#0088FE" activeDot={{ r: 8 }} />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* NEW: Totals Chart */}
              <div>
                <h3 className="text-md font-medium mb-2">Period Totals</h3>
                <div className="h-64 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getTotalsChartData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CHF`} />
                      <Legend />
                      <Bar dataKey="expenses" name="Total Expenses" fill="#FF8042" />
                      <Bar dataKey="income" name="Total Income" fill="#0088FE" />
                      <Bar dataKey="balance" name="Balance" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
          
          {/* MODIFIED: Categories Section with totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-white rounded shadow">
              {/* NEW: Added total above pie chart */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  {transactionTypeFilter.includes('expense') && !transactionTypeFilter.includes('income') 
                    ? 'Expense Categories' 
                    : transactionTypeFilter.includes('income') && !transactionTypeFilter.includes('expense')
                    ? 'Income Categories'
                    : 'Categories'}
                </h2>
                
                {/* Display total based on filters */}
                <div className="text-lg font-bold">
                  {transactionTypeFilter.includes('expense') && !transactionTypeFilter.includes('income') 
                    ? `Total: ${formatCurrency(getTotals().expenses)} CHF` 
                    : transactionTypeFilter.includes('income') && !transactionTypeFilter.includes('expense')
                    ? `Total: ${formatCurrency(getTotals().income)} CHF`
                    : `Total: ${formatCurrency(getTotals().expenses + getTotals().income)} CHF`}
                </div>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getCategoryData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      onClick={(data) => {
                        setActiveCategory(data.name);
                        setCategoryFilter(data.name);
                        setSubcategoryFilter(null); // Clear subcategory filter when changing category
                        setDisplayCount(20); // Reset display count when changing category
                      }}
                    >
                      {getCategoryData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CHF`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-md font-medium">Categories</h3>
                  {(categoryFilter || subcategoryFilter) && (
                    <button
                      onClick={clearCategoryFilters}
                      className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded text-gray-800"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  {getCategoryData().map((category, index) => (
                    <div 
                      key={index} 
                      className={`flex justify-between p-2 rounded cursor-pointer hover:bg-gray-100 ${
                        categoryFilter === category.name ? 'bg-blue-100' : 
                        activeCategory === category.name ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        setActiveCategory(category.name);
                        setCategoryFilter(category.name);
                        setDisplayCount(20); // Reset display count when changing category
                      }}
                    >
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span>{category.name}</span>
                      </div>
                      <span className="font-medium">{category.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CHF</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Subcategories Section - remains the same */}
            <div className="p-4 bg-white rounded shadow">
              <h2 className="text-lg font-semibold mb-4">
                {activeCategory ? (
                  subcategoryFilter 
                    ? `${activeCategory} - ${subcategoryFilter} Transactions` 
                    : `${activeCategory} Subcategories`
                ) : 'Select a category to view subcategories'}
              </h2>
              
              {activeCategory ? (
                <>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getSubcategoryData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getSubcategoryData().map((entry, index) => (
                            <Cell key={`subcell-${index}`} fill={COLORS[(index + 5) % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value.toFixed(2)} CHF`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-md font-medium mb-2">Subcategories</h3>
                    <div className="space-y-1">
                      {getSubcategoryData().map((subcategory, index) => (
                        <div 
                          key={index} 
                          className="flex justify-between p-2 rounded"
                        >
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: COLORS[(index + 5) % COLORS.length] }}
                            />
                            <span>{subcategory.name}</span>
                          </div>
                          <span className="font-medium">{subcategory.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CHF</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  Click on a category to view subcategories
                </div>
              )}
            </div>
          </div>

          {/* Add this JSX code after your pie charts section and before the transactions table */}
          {/* Replace your existing rolling mean chart section with this one */}
          <div className="mt-6 p-4 bg-white rounded shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Category Rolling Mean</h2>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Rolling period:</label>
                <select
                  value={rollingMeanDays}
                  onChange={(e) => setRollingMeanDays(parseInt(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-800"
                >
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                </select>
                
                {/* Compute button */}
                <button
                  onClick={computeRollingMean}
                  disabled={isComputingRollingMean}
                  className={`px-3 py-1 rounded text-white ${
                    isComputingRollingMean ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isComputingRollingMean ? 'Computing...' : 'Compute'}
                </button>
              </div>
            </div>
            
            {/* Category Selection Buttons */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {[...new Set(
                  getFilteredTransactions(!hideFromCharts)
                    .filter(t => t.category && t.category.name)
                    .map(t => t.category.name)
                )].map((category, index) => (
                  <button
                    key={category}
                    onClick={() => toggleCategoryVisibility(category)}
                    className={`px-2 py-1 text-xs rounded-full`}
                    style={{ 
                      backgroundColor: visibleCategories.includes(category) ? COLORS[index % COLORS.length] : '#e5e7eb',
                      color: visibleCategories.includes(category) ? 'white' : '#374151'
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Rolling Mean Chart */}
            <div className="h-80">
              {rollingMeanData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={rollingMeanData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="formattedDate" 
                      tick={{ fontSize: 12 }} 
                      interval="preserveStartEnd"
                      minTickGap={30}
                      angle={-45}
                      textAnchor="end"
                      height={50}
                      padding={{ left: 10, right: 10 }}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CHF/day`}
                      labelFormatter={(label, payload) => {
                        // Use the payload to get the full date with year
                        if (payload && payload.length > 0 && payload[0].payload) {
                          return `Date: ${payload[0].payload.fullDate}`;
                        }
                        return `Date: ${label}`;
                      }}
                    />
                    <Legend />
                    {[...new Set(
                      getFilteredTransactions(!hideFromCharts)
                        .filter(t => t.category && t.category.name)
                        .map(t => t.category.name)
                    )].map((category, index) => (
                      visibleCategories.includes(category) && (
                        <Line
                          key={category}
                          type="monotone"
                          dataKey={category}
                          name={category}
                          stroke={COLORS[index % COLORS.length]}
                          activeDot={{ r: 8 }}
                          strokeWidth={2}
                          dot={false}
                        />
                      )
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-gray-500 mb-4">Click the Compute button to calculate the rolling mean.</p>
                  <button
                    onClick={computeRollingMean}
                    disabled={isComputingRollingMean}
                    className={`px-4 py-2 rounded text-white ${
                      isComputingRollingMean ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isComputingRollingMean ? 'Computing...' : 'Compute Rolling Mean'}
                  </button>
                </div>
              )}
            </div>
            
            <div className="mt-2 text-sm text-gray-500 text-center">
              This chart shows the daily average spending for each category over a rolling {rollingMeanDays}-day period.
            </div>
          </div>
          {/* Transactions Table - remains the same */}
          <div className="mt-6 p-4 bg-white rounded shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {categoryFilter 
                  ? subcategoryFilter
                    ? `${categoryFilter} - ${subcategoryFilter} Transactions`
                    : `${categoryFilter} Transactions` 
                  : 'Recent Transactions'}
              </h2>
              <div className="flex space-x-2">
                {/* NEW: Button to hide all filtered transactions */}
                <button
                  onClick={() => hideAllFilteredTransactions(true)}
                  className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-red-800 text-sm"
                >
                  Hide Selected Transactions
                </button>
                
                {/* NEW: Button to unhide all filtered transactions */}
                <button
                  onClick={() => hideAllFilteredTransactions(false)}
                  className="px-3 py-1 bg-green-100 hover:bg-green-200 rounded text-green-800 text-sm"
                >
                  Unhide Selected Transactions
                </button>
                
                {(categoryFilter || subcategoryFilter) && (
                  <button
                    onClick={clearCategoryFilters}
                    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded text-blue-800 text-sm"
                  >
                    Clear Category Filters
                  </button>
                )}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex flex-col items-center">
                        <span>Hide</span>
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort('date')}
                    >
                      Date
                      {sortConfig.key === 'date' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort('description')}
                    >
                      Description
                      {sortConfig.key === 'description' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort('category')}
                    >
                      Category
                      {sortConfig.key === 'category' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort('subcategory')}
                    >
                      Subcategory
                      {sortConfig.key === 'subcategory' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort('amount')}
                    >
                      Amount
                      {sortConfig.key === 'amount' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort('type')}
                    >
                      Type
                      {sortConfig.key === 'type' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort('source')}
                    >
                      Source
                      {sortConfig.key === 'source' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipient/Sender
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredTransactions().slice(0, displayCount).map((transaction, index) => (
                    <tr key={index} className={`${transaction.type === 'expense' ? 'bg-red-50' : 'bg-green-50'} ${transaction.hidden ? 'opacity-60' : ''}`}>
                      <td className="px-3 py-4 whitespace-nowrap text-center">
                        <input 
                          type="checkbox" 
                          checked={transaction.hidden} 
                          onChange={() => toggleHidden(transaction.id)}
                          className="form-checkbox h-4 w-4 text-blue-600"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editingTransaction === transaction.id ? (
                          <div className="flex flex-col space-y-1">
                            {isCreatingCategory ? (
                              /* New Category Input */
                              <div className="flex flex-col space-y-1">
                                <input
                                  type="text"
                                  value={newCategoryName}
                                  onChange={(e) => setNewCategoryName(e.target.value)}
                                  placeholder="New category"
                                  className="border border-gray-300 rounded px-2 py-1 w-full text-sm bg-white text-gray-800"

                                  autoFocus
                                />
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => handleCreateCategory(transaction.id)}
                                    disabled={!newCategoryName.trim()}
                                    className={`px-2 py-1 rounded text-xs ${
                                      !newCategoryName.trim() ? 'bg-gray-300 text-gray-500' : 'bg-blue-500 text-white'
                                    }`}
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setIsCreatingCategory(false);
                                      setNewCategoryName('');
                                    }}
                                    className="px-2 py-1 bg-gray-300 rounded text-xs"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Category Dropdown */
                              <div>
                                <select
                                  value={transaction.category?.name || ''}
                                  onChange={(e) => {
                                    if (e.target.value === 'new') {
                                      setIsCreatingCategory(true);
                                    } else {
                                      updateTransactionCategory(
                                        transaction.id, 
                                        e.target.value, 
                                        getSubcategoriesForCategory(e.target.value)[0] || ''
                                      );
                                    }
                                  }}
                                  className="border border-gray-300 rounded px-2 py-1 w-full text-sm bg-white text-gray-800"

                                  autoFocus
                                >
                                  <option value="">Uncategorized</option>
                                  <option value="new">+ Create new category...</option>
                                  {getAllCategories().map(category => (
                                    <option key={category} value={category}>
                                      {category}
                                    </option>
                                  ))}
                                </select>
                                <div className="flex space-x-1 mt-1">
                                  <button
                                    onClick={() => setEditingTransaction(null)}
                                    className="px-2 py-1 bg-gray-300 rounded text-xs"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-blue-50 p-1 rounded"
                            onClick={() => setEditingTransaction(transaction.id)}
                          >
                            {transaction.category?.name || 'Uncategorized'}
                          </div>
                        )}
                      </td>

                      {/* Replace the Subcategory cell in the transaction table */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editingTransaction === transaction.id ? (
                          <div className="flex flex-col space-y-1">
                            {isCreatingCategory ? (
                              /* New Subcategory Input (only shown when creating new category) */
                              <input
                                type="text"
                                value={newSubcategoryName}
                                onChange={(e) => setNewSubcategoryName(e.target.value)}
                                placeholder="Subcategory (optional)"
                                className="border border-gray-300 rounded px-2 py-1 w-full text-sm bg-white text-gray-800"
                              />
                            ) : (
                              /* Subcategory Dropdown */
                              <select
                                value={transaction.category?.sub || ''}
                                onChange={(e) => {
                                  if (e.target.value === 'new') {
                                    setIsCreatingCategory(true);
                                    setNewCategoryName(transaction.category?.name || '');
                                  } else {
                                    updateTransactionCategory(
                                      transaction.id, 
                                      transaction.category?.name || '', 
                                      e.target.value
                                    );
                                  }
                                }}
                                className="border border-gray-300 rounded px-2 py-1 w-full text-sm bg-white text-gray-800"

                                disabled={!transaction.category?.name}
                              >
                                <option value="">None</option>
                                <option value="new">+ Create new subcategory...</option>
                                {transaction.category?.name && getSubcategoriesForCategory(transaction.category.name).map(subcategory => (
                                  <option key={subcategory} value={subcategory}>
                                    {subcategory}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-blue-50 p-1 rounded"
                            onClick={() => transaction.category?.name && setEditingTransaction(transaction.id)}
                          >
                            {transaction.category?.sub || ''}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CHF
                        {transaction.originalAmount && transaction.originalCurrency !== 'CHF' && (
                          <span className="ml-1 text-xs text-gray-500">
                            ({transaction.originalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {transaction.originalCurrency})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.type === 'expense' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.source}
                      </td>
                      {transaction.recipient && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.recipient}
                        </td>
                      )}
                      {transaction.sender && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.sender}
                        </td>
                      )}
                      {!transaction.recipient && !transaction.sender && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          -
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {getFilteredTransactions().length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No transactions found for the selected period
                </div>
              )}
              
              {getFilteredTransactions().length > displayCount && (
                <div className="text-center py-4">
                  <button 
                    onClick={() => setDisplayCount(prevCount => Math.min(prevCount + 20, getFilteredTransactions().length))}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
                  >
                    Show More Transactions
                  </button>
                </div>
              )}
              
              {getFilteredTransactions().length > 0 && (
                <div className="text-center py-2 text-gray-500 text-sm">
                  Showing {Math.min(displayCount, getFilteredTransactions().length)} of {getFilteredTransactions().length} transactions
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExpenseTracker;