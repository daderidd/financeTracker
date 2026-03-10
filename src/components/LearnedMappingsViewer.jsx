import React, { useState, useMemo } from 'react';

const LearnedMappingsViewer = ({ learnedMappings, setLearnedMappings, onReapplyRules }) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const filtered = useMemo(() => {
    if (!searchFilter) return learnedMappings;
    const term = searchFilter.toLowerCase();
    return learnedMappings.filter(m =>
      m.description.includes(term) ||
      m.category.toLowerCase().includes(term) ||
      (m.subcategory || '').toLowerCase().includes(term)
    );
  }, [learnedMappings, searchFilter]);

  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => b.count - a.count),
    [filtered]
  );

  const handleDelete = (mappingId) => {
    setLearnedMappings(prev => prev.filter(m => m.id !== mappingId));
  };

  const handleClearAll = () => {
    if (confirm('Delete all learned mappings? This cannot be undone.')) {
      setLearnedMappings([]);
    }
  };

  const handleBootstrap = () => {
    onReapplyRules();
  };

  return (
    <div className="mt-6 p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-lg font-semibold">
            Learned Mappings
            <span className="text-sm font-normal text-gray-500 ml-2">({learnedMappings.length} patterns)</span>
          </h2>
          <p className="text-sm text-gray-500">Auto-learned from your manual category edits. Checked after custom rules, before built-in rules.</p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded text-blue-800 text-sm"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="flex items-center gap-2 mb-3 mt-3">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter by description or category..."
              className="border border-gray-300 rounded px-2 py-1 text-sm flex-1"
            />
            {learnedMappings.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-red-700 text-sm whitespace-nowrap"
              >
                Clear All
              </button>
            )}
          </div>

          {sorted.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2 pr-2">Description Pattern</th>
                    <th className="pb-2 pr-2 w-32">Category</th>
                    <th className="pb-2 pr-2 w-28">Subcategory</th>
                    <th className="pb-2 pr-2 w-12 text-center">Uses</th>
                    <th className="pb-2 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(mapping => (
                    <tr key={mapping.id} className="border-b border-gray-100">
                      <td className="py-1.5 pr-2">
                        <code className="bg-gray-100 px-1 rounded text-xs break-all">{mapping.description.length > 60 ? mapping.description.slice(0, 60) + '...' : mapping.description}</code>
                      </td>
                      <td className="py-1.5 pr-2">{mapping.category}</td>
                      <td className="py-1.5 pr-2 text-gray-500">{mapping.subcategory || '-'}</td>
                      <td className="py-1.5 pr-2 text-center text-gray-400">{mapping.count}</td>
                      <td className="py-1.5">
                        <button
                          onClick={() => handleDelete(mapping.id)}
                          className="px-1.5 py-0.5 bg-red-100 hover:bg-red-200 rounded text-red-700 text-xs"
                        >
                          X
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-sm mt-2">
              {learnedMappings.length === 0
                ? 'No learned mappings yet. Edit a transaction\'s category to start learning.'
                : 'No mappings match your filter.'}
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default LearnedMappingsViewer;
