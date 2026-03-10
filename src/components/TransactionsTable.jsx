import React, { useState, useCallback, useEffect } from 'react';
import { List } from 'react-window';

const ROW_HEIGHT = 52;
const CARD_HEIGHT = 88;
const TABLE_HEIGHT = 600;

// Column width config (percentages for flex-basis)
const COL = {
  hide: '4%',
  date: '9%',
  desc: '22%',
  cat: '13%',
  sub: '12%',
  amount: '13%',
  type: '7%',
  source: '7%',
  recipient: '13%',
};

const headerCellClass = "px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";

const TransactionsTable = ({
  filteredTransactions,
  onToggleHidden,
  onHideAllFiltered,
  categoryFilter,
  subcategoryFilter,
  onClearCategoryFilters,
  sortConfig,
  onRequestSort,
  allCategories,
  getSubcategoriesForCategory,
  onUpdateCategory,
}) => {
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleUpdateCategory = (transactionId, categoryName, subcategoryName) => {
    onUpdateCategory(transactionId, categoryName, subcategoryName);
    setEditingTransaction(null);
    setIsCreatingCategory(false);
    setNewCategoryName('');
    setNewSubcategoryName('');
  };

  const handleCreateCategory = (transactionId) => {
    if (!newCategoryName.trim()) return;
    handleUpdateCategory(transactionId, newCategoryName.trim(), newSubcategoryName.trim());
  };

  const SortIndicator = ({ sortKey }) => (
    sortConfig.key === sortKey ? (
      <span className="ml-1">{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
    ) : null
  );

  const Row = useCallback(({ index, style }) => {
    const transaction = filteredTransactions[index];
    const isEditing = editingTransaction === transaction.id;

    return (
      <div
        style={style}
        className={`flex items-center border-b border-gray-200 ${
          transaction.type === 'expense' ? 'bg-red-50' : 'bg-green-50'
        } ${transaction.hidden ? 'opacity-60' : ''}`}
      >
        {/* Hide */}
        <div className="px-3 text-center shrink-0" style={{ flexBasis: COL.hide }}>
          <input
            type="checkbox"
            checked={transaction.hidden}
            onChange={() => onToggleHidden(transaction.id)}
            className="form-checkbox h-4 w-4 text-blue-600"
          />
        </div>

        {/* Date */}
        <div className="px-3 text-sm text-gray-900 truncate shrink-0" style={{ flexBasis: COL.date }}>
          {transaction.date}
        </div>

        {/* Description */}
        <div className="px-3 text-sm text-gray-500 truncate shrink-0" style={{ flexBasis: COL.desc }} title={transaction.description}>
          {transaction.description}
        </div>

        {/* Category */}
        <div className="px-3 text-sm text-gray-500 truncate shrink-0" style={{ flexBasis: COL.cat }}>
          {isEditing ? (
            isCreatingCategory ? (
              <div className="flex items-center space-x-1">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category"
                  className="border border-gray-300 rounded px-1 py-0.5 text-xs bg-white text-gray-800 w-20"
                  autoFocus
                />
                <button
                  onClick={() => handleCreateCategory(transaction.id)}
                  disabled={!newCategoryName.trim()}
                  className={`px-1 py-0.5 rounded text-xs ${!newCategoryName.trim() ? 'bg-gray-300 text-gray-500' : 'bg-blue-500 text-white'}`}
                >
                  OK
                </button>
                <button
                  onClick={() => { setIsCreatingCategory(false); setNewCategoryName(''); }}
                  className="px-1 py-0.5 bg-gray-300 rounded text-xs"
                >
                  X
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <select
                  value={transaction.category?.name || ''}
                  onChange={(e) => {
                    if (e.target.value === 'new') {
                      setIsCreatingCategory(true);
                    } else {
                      handleUpdateCategory(transaction.id, e.target.value, getSubcategoriesForCategory(e.target.value)[0] || '');
                    }
                  }}
                  className="border border-gray-300 rounded px-1 py-0.5 text-xs bg-white text-gray-800 w-24"
                  autoFocus
                >
                  <option value="">Uncategorized</option>
                  <option value="new">+ New...</option>
                  {allCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <button onClick={() => setEditingTransaction(null)} className="px-1 py-0.5 bg-gray-300 rounded text-xs">X</button>
              </div>
            )
          ) : (
            <div
              className="cursor-pointer hover:bg-blue-50 p-1 rounded truncate"
              onClick={() => setEditingTransaction(transaction.id)}
            >
              {transaction.category?.name || 'Uncategorized'}
            </div>
          )}
        </div>

        {/* Subcategory */}
        <div className="px-3 text-sm text-gray-500 truncate shrink-0" style={{ flexBasis: COL.sub }}>
          {isEditing ? (
            isCreatingCategory ? (
              <input
                type="text"
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                placeholder="Sub (optional)"
                className="border border-gray-300 rounded px-1 py-0.5 text-xs bg-white text-gray-800 w-20"
              />
            ) : (
              <select
                value={transaction.category?.sub || ''}
                onChange={(e) => {
                  if (e.target.value === 'new') {
                    setIsCreatingCategory(true);
                    setNewCategoryName(transaction.category?.name || '');
                  } else {
                    handleUpdateCategory(transaction.id, transaction.category?.name || '', e.target.value);
                  }
                }}
                className="border border-gray-300 rounded px-1 py-0.5 text-xs bg-white text-gray-800 w-24"
                disabled={!transaction.category?.name}
              >
                <option value="">None</option>
                <option value="new">+ New...</option>
                {transaction.category?.name && getSubcategoriesForCategory(transaction.category.name).map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            )
          ) : (
            <div
              className="cursor-pointer hover:bg-blue-50 p-1 rounded truncate"
              onClick={() => transaction.category?.name && setEditingTransaction(transaction.id)}
            >
              {transaction.category?.sub || ''}
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="px-3 text-sm font-medium truncate shrink-0" style={{ flexBasis: COL.amount }}>
          {transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CHF
          {transaction.originalAmount && transaction.originalCurrency !== 'CHF' && (
            <span className="ml-1 text-xs text-gray-500">
              ({transaction.originalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {transaction.originalCurrency})
            </span>
          )}
        </div>

        {/* Type */}
        <div className="px-3 text-sm shrink-0" style={{ flexBasis: COL.type }}>
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            transaction.type === 'expense' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          }`}>
            {transaction.type}
          </span>
        </div>

        {/* Source */}
        <div className="px-3 text-sm text-gray-500 truncate shrink-0" style={{ flexBasis: COL.source }}>
          {transaction.source}
        </div>

        {/* Recipient/Sender */}
        <div className="px-3 text-sm text-gray-500 truncate shrink-0" style={{ flexBasis: COL.recipient }}>
          {transaction.recipient || transaction.sender || '-'}
        </div>
      </div>
    );
  }, [filteredTransactions, editingTransaction, isCreatingCategory, newCategoryName, newSubcategoryName, allCategories, getSubcategoriesForCategory, onToggleHidden, sortConfig]);

  const MobileRow = useCallback(({ index, style }) => {
    const t = filteredTransactions[index];
    return (
      <div
        style={style}
        className={`p-3 border-b border-gray-200 ${t.type === 'expense' ? 'bg-red-50' : 'bg-green-50'} ${t.hidden ? 'opacity-60' : ''}`}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{t.description}</div>
            <div className="flex gap-2 text-xs text-gray-500 mt-0.5">
              <span>{t.date}</span>
              <span
                className="text-blue-600 cursor-pointer"
                onClick={() => setEditingTransaction(editingTransaction === t.id ? null : t.id)}
              >
                {t.category?.name || 'Uncategorized'}
              </span>
              {t.category?.sub && <span className="text-gray-400">{t.category.sub}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <span className={`text-sm font-semibold ${t.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
              {t.type === 'expense' ? '-' : '+'}{t.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <input
              type="checkbox"
              checked={t.hidden}
              onChange={() => onToggleHidden(t.id)}
              className="form-checkbox h-4 w-4 text-blue-600"
            />
          </div>
        </div>
        {editingTransaction === t.id && (
          <div className="flex gap-2 mt-2">
            <select
              value={t.category?.name || ''}
              onChange={(e) => {
                if (e.target.value === 'new') {
                  setIsCreatingCategory(true);
                } else {
                  handleUpdateCategory(t.id, e.target.value, getSubcategoriesForCategory(e.target.value)[0] || '');
                }
              }}
              className="border border-gray-300 rounded px-2 py-1 text-xs flex-1"
              autoFocus
            >
              <option value="">Uncategorized</option>
              <option value="new">+ New...</option>
              {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <button onClick={() => setEditingTransaction(null)} className="px-2 py-1 bg-gray-200 rounded text-xs">Done</button>
          </div>
        )}
      </div>
    );
  }, [filteredTransactions, editingTransaction, isCreatingCategory, allCategories, getSubcategoriesForCategory, onToggleHidden]);

  const rowHeight = isMobile ? CARD_HEIGHT : ROW_HEIGHT;
  const listHeight = Math.min(TABLE_HEIGHT, filteredTransactions.length * rowHeight);

  return (
    <div className="mt-6 p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          {categoryFilter
            ? subcategoryFilter
              ? `${categoryFilter} - ${subcategoryFilter} Transactions`
              : `${categoryFilter} Transactions`
            : 'Recent Transactions'}
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({filteredTransactions.length} transactions)
          </span>
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => onHideAllFiltered(true)}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-red-800 text-sm"
          >
            Hide Selected
          </button>
          <button
            onClick={() => onHideAllFiltered(false)}
            className="px-3 py-1 bg-green-100 hover:bg-green-200 rounded text-green-800 text-sm"
          >
            Unhide Selected
          </button>
          {(categoryFilter || subcategoryFilter) && (
            <button
              onClick={onClearCategoryFilters}
              className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded text-blue-800 text-sm"
            >
              Clear Category Filters
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        {/* Desktop header */}
        {!isMobile && (
          <div className="flex items-center bg-gray-50 border-b border-gray-200">
            <div className={`${headerCellClass} text-center shrink-0`} style={{ flexBasis: COL.hide }}>Hide</div>
            <div className={`${headerCellClass} cursor-pointer hover:bg-gray-100 shrink-0`} style={{ flexBasis: COL.date }} onClick={() => onRequestSort('date')}>
              Date<SortIndicator sortKey="date" />
            </div>
            <div className={`${headerCellClass} cursor-pointer hover:bg-gray-100 shrink-0`} style={{ flexBasis: COL.desc }} onClick={() => onRequestSort('description')}>
              Description<SortIndicator sortKey="description" />
            </div>
            <div className={`${headerCellClass} cursor-pointer hover:bg-gray-100 shrink-0`} style={{ flexBasis: COL.cat }} onClick={() => onRequestSort('category')}>
              Category<SortIndicator sortKey="category" />
            </div>
            <div className={`${headerCellClass} cursor-pointer hover:bg-gray-100 shrink-0`} style={{ flexBasis: COL.sub }} onClick={() => onRequestSort('subcategory')}>
              Subcategory<SortIndicator sortKey="subcategory" />
            </div>
            <div className={`${headerCellClass} cursor-pointer hover:bg-gray-100 shrink-0`} style={{ flexBasis: COL.amount }} onClick={() => onRequestSort('amount')}>
              Amount<SortIndicator sortKey="amount" />
            </div>
            <div className={`${headerCellClass} cursor-pointer hover:bg-gray-100 shrink-0`} style={{ flexBasis: COL.type }} onClick={() => onRequestSort('type')}>
              Type<SortIndicator sortKey="type" />
            </div>
            <div className={`${headerCellClass} cursor-pointer hover:bg-gray-100 shrink-0`} style={{ flexBasis: COL.source }} onClick={() => onRequestSort('source')}>
              Source<SortIndicator sortKey="source" />
            </div>
            <div className={`${headerCellClass} shrink-0`} style={{ flexBasis: COL.recipient }}>
              Recipient/Sender
            </div>
          </div>
        )}

        {/* Mobile sort bar */}
        {isMobile && (
          <div className="flex items-center gap-2 py-2 border-b border-gray-200">
            <span className="text-xs text-gray-500">Sort:</span>
            {['date', 'amount', 'category'].map(key => (
              <button
                key={key}
                onClick={() => onRequestSort(key)}
                className={`text-xs px-2 py-1 rounded ${sortConfig.key === key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
                {sortConfig.key === key && (sortConfig.direction === 'ascending' ? ' ↑' : ' ↓')}
              </button>
            ))}
          </div>
        )}

        {/* Virtualized rows */}
        {filteredTransactions.length > 0 ? (
          <List
            height={listHeight}
            itemCount={filteredTransactions.length}
            itemSize={rowHeight}
            width="100%"
            overscanCount={10}
          >
            {isMobile ? MobileRow : Row}
          </List>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No transactions found for the selected period
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsTable;
