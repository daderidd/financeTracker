import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../utils/formatting';

const SplitTransactionModal = ({ transaction, allCategories, getSubcategoriesForCategory, onSave, onClose }) => {
  const totalAmount = Math.abs(transaction.value);

  const [splits, setSplits] = useState([
    {
      amount: totalAmount,
      category: transaction.category?.name || '',
      subcategory: transaction.category?.sub || '',
    },
  ]);

  const remaining = useMemo(() => {
    const allocated = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
    return Math.round((totalAmount - allocated) * 100) / 100;
  }, [splits, totalAmount]);

  const addSplit = () => {
    setSplits(prev => [...prev, { amount: remaining > 0 ? remaining : 0, category: '', subcategory: '' }]);
  };

  const removeSplit = (index) => {
    if (splits.length <= 1) return;
    setSplits(prev => prev.filter((_, i) => i !== index));
  };

  const updateSplit = (index, field, value) => {
    setSplits(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleSave = () => {
    const validSplits = splits.filter(s => s.amount > 0 && s.category);
    if (validSplits.length === 0) return;
    onSave(transaction.id, validSplits);
    onClose();
  };

  const isValid = splits.every(s => s.amount > 0 && s.category) && Math.abs(remaining) < 0.01;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/30" />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-1">Split Transaction</h3>
        <p className="text-sm text-gray-500 mb-4">
          {transaction.description?.slice(0, 60)} — {formatCurrency(totalAmount)} CHF
        </p>

        <div className="space-y-3 max-h-60 overflow-y-auto">
          {splits.map((split, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <input
                type="number"
                value={split.amount}
                onChange={(e) => updateSplit(i, 'amount', parseFloat(e.target.value) || 0)}
                className="border border-gray-300 rounded px-2 py-1 text-sm w-24"
                min="0"
                step="0.01"
              />
              <select
                value={split.category}
                onChange={(e) => updateSplit(i, 'category', e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm flex-1"
              >
                <option value="">Category...</option>
                {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={split.subcategory}
                onChange={(e) => updateSplit(i, 'subcategory', e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm flex-1"
                disabled={!split.category}
              >
                <option value="">Sub...</option>
                {split.category && getSubcategoriesForCategory(split.category).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {splits.length > 1 && (
                <button onClick={() => removeSplit(i)} className="px-2 py-1 bg-red-100 rounded text-red-700 text-xs">X</button>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-3">
          <button onClick={addSplit} className="text-sm text-blue-600 hover:underline">+ Add split</button>
          <span className={`text-sm ${Math.abs(remaining) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
            {Math.abs(remaining) < 0.01 ? 'Balanced' : `${remaining > 0 ? '+' : ''}${formatCurrency(remaining)} CHF remaining`}
          </span>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className={`px-4 py-2 text-sm rounded ${isValid ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400'}`}
          >
            Save Split
          </button>
        </div>
      </div>
    </div>
  );
};

export default SplitTransactionModal;
