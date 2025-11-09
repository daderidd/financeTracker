# Finance Tracker

A local expense tracker application that helps you analyze your financial transactions from CSV files.

## Features

- Load and parse CSV files containing bank transactions
- Visualize expenses and income with monthly charts
- Categorize transactions automatically
- Filter transactions by date range
- View spending breakdown by categories and subcategories

## Prerequisites

- Node.js (v16 or later)
- npm or yarn

## Installation

1. Clone or download this repository to your local machine
2. Open your terminal and navigate to the project directory:

```bash
cd financeTracker
```

3. Install the dependencies:

```bash
npm install
# or
yarn
```

## Running the Application

To start the development server:

```bash
npm run dev
# or
yarn dev
```

The application will start and be available at [http://localhost:5173](http://localhost:5173)

## Usage

1. Prepare your transaction CSV files
   - The app supports account transactions and card transactions
   - Make sure your files are named appropriately (e.g., account_transactions.csv, card_transactions.csv)

2. Upload your files using the file upload section

3. Use the date filters and dropdown to analyze specific time periods

4. Explore the charts and tables to gain insights into your spending habits

## Customization

You can customize the categories by modifying the `mapToCategory` function in the `ExpenseTracker.jsx` file.

## License

MIT