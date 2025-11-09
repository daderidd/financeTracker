# Finance Tracker

A privacy-focused, browser-based expense tracker for Swiss bank transactions. All data processing happens locally in your browser - no backend, no cloud storage.

## Features

### Data Import & Management
- **CSV Import**: Supports both account and card transaction CSV files from Swiss banks
  - Automatic encoding detection (UTF-8 for accounts, Windows-1252 for cards)
  - BOM removal and header detection
  - Handles both semicolon and comma delimiters
  - Skips summary headers in raw bank exports
- **JSON Export/Import**: Save processed transactions and reload them later
- **Smart Merge**: Load multiple JSON files with intelligent duplicate detection
  - Duplicates are marked as hidden (non-destructive)
  - Manual corrections preserved from oldest dataset
- **Data Privacy**: All processing happens in your browser - your financial data never leaves your device

### Automatic Categorization
- 60+ categorization rules for common Swiss transactions
- Hierarchical categories with subcategories
- Supports IBAN-based categorization for transfers
- Editable categories and subcategories

### Visualizations

#### Spending Overview
- **Pie Charts**: Category and subcategory breakdowns
- **Monthly Trends**: Line chart with 3-month rolling average
- **Daily Spending**: CHF per day normalized across months

#### Advanced Analytics
- **Monthly Category Spending**: Stacked bar chart showing CHF/day by category
  - 3-month rolling average smoothing
  - Interactive legend to show/hide categories
  - Categories sorted by total spending

- **Year-over-Year Comparison**:
  - Compare any two years side-by-side
  - Top 5 increases and decreases
  - Toggle between category and subcategory views
  - Absolute amounts and percentage changes

### Filtering & Display
- Date range filters (start/end date)
- Toggle visibility of hidden transactions (transfers, duplicates)
- Interactive transaction table with:
  - Editing capabilities
  - Category assignment
  - Hide/unhide functionality
  - Search and filter

## Technology Stack

- **React 18**: Modern functional components with hooks
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **Recharts**: Data visualization library
- **PapaParse**: CSV parsing with proper quote/delimiter handling

## Prerequisites

- Node.js (v16 or later)
- npm or yarn

## Installation

1. Clone the repository:

```bash
git clone https://github.com/daderidd/financeTracker.git
cd financeTracker
```

2. Install dependencies:

```bash
npm install
```

## Running the Application

Start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:5173](http://localhost:5173)

## Building for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

## Usage

### First Time Setup

1. **Import CSV Files**:
   - Export your transactions from your Swiss bank
   - Upload both account and card transaction CSV files
   - The app automatically parses and categorizes transactions

2. **Save Your Data**:
   - Click "Save as JSON" to export processed transactions
   - Store the JSON file in your `data/` folder for future use

### Regular Workflow

1. **Load Previous Data**:
   - Use "Load Saved Dataset(s)" to import your historical JSON files
   - Select multiple files to merge them intelligently

2. **Import New Transactions**:
   - Upload new CSV files from your bank
   - The app will detect and mark duplicates

3. **Review & Categorize**:
   - Check the transaction table for any miscategorized items
   - Edit categories as needed
   - Review suspected duplicates (marked with "suspected_duplicate")

4. **Analyze**:
   - Use date filters to focus on specific periods
   - Explore pie charts for spending breakdowns
   - Check monthly trends with rolling averages
   - Compare year-over-year changes

5. **Save Updated Data**:
   - Export to JSON to preserve your corrections

## Customization

### Adding Categories

Edit the `mapToCategory` function in `src/components/ExpenseTracker.jsx` to add your own categorization rules:

```javascript
// Example: Add a new merchant
if (description.includes('YOUR_MERCHANT')) {
  return { name: 'Shopping', sub: 'Electronics' };
}

// Example: Add IBAN-based categorization
if (recipient === 'CH00 0000 0000 0000 0000 0') {
  return { name: 'Home', sub: 'Rent' };
}
```

### File Structure

```
financeTracker/
├── src/
│   ├── components/
│   │   └── ExpenseTracker.jsx  # Main application component
│   └── main.jsx                # Entry point
├── public/
│   └── favicon.svg             # App icon
├── data/                       # Your transaction files (gitignored)
└── index.html
```

## Data Privacy & Security

- **100% Client-Side**: No server, no API calls, no tracking
- **Local Storage Only**: Your data stays on your device
- **Git Protection**: `data/` folder is gitignored to prevent accidental commits
- **No Dependencies on External Services**: Works completely offline after initial load

## CSV Format

The app expects Swiss bank CSV files with these formats:

### Account Transactions
- Encoding: UTF-8
- Delimiter: Semicolon (;)
- Key columns: Date de transaction, Description, Débit/Debit, Crédit/Credit

### Card Transactions
- Encoding: Windows-1252
- Delimiter: Semicolon (;) or comma (,) auto-detected
- Key columns: Date de transaction, Description, Débit/Debit, Crédit/Credit

## License

MIT
