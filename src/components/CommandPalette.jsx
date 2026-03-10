import React, { useState, useEffect, useRef, useMemo } from 'react';

const CommandPalette = ({ actions, isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (!query) return actions;
    const lower = query.toLowerCase();
    return actions.filter(a =>
      a.label.toLowerCase().includes(lower) ||
      (a.keywords || '').toLowerCase().includes(lower)
    );
  }, [actions, query]);

  const handleSelect = (action) => {
    action.onSelect();
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && filtered.length > 0) {
      handleSelect(filtered[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-black/30" />
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command..."
          className="w-full px-4 py-3 text-sm border-b border-gray-200 outline-none"
        />
        <div className="max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-400 text-center">No matching commands</div>
          ) : (
            filtered.map((action, i) => (
              <button
                key={action.id}
                onClick={() => handleSelect(action)}
                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 flex justify-between items-center ${
                  i === 0 ? 'bg-blue-50' : ''
                }`}
              >
                <span>{action.label}</span>
                {action.shortcut && (
                  <kbd className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{action.shortcut}</kbd>
                )}
              </button>
            ))
          )}
        </div>
        <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
          Enter to select / Esc to close
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
