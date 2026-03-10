import React, { useState } from 'react';
import { generateTextReport, generateCategoryCSV, copyToClipboard, downloadAsFile } from '../utils/exportReport';

const ExportMenu = ({ totals, categoryData, startDate, endDate, budgets }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyText = async () => {
    const text = generateTextReport(totals, categoryData, startDate, endDate, budgets);
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCSV = () => {
    const csv = generateCategoryCSV(categoryData, totals);
    const date = new Date().toISOString().slice(0, 10);
    downloadAsFile(csv, `expense_report_${date}.csv`, 'text/csv');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        onClick={handleCopyText}
        className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
      >
        {copied ? 'Copied!' : 'Copy Summary'}
      </button>
      <button
        onClick={handleDownloadCSV}
        className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
      >
        Export CSV
      </button>
      <button
        onClick={handlePrint}
        className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
      >
        Print / PDF
      </button>
    </div>
  );
};

export default ExportMenu;
