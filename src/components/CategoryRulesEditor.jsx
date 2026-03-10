import React, { useState } from 'react';

const CategoryRulesEditor = ({ customRules, setCustomRules, allCategories, onReapplyRules }) => {
  const [newKeyword, setNewKeyword] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [newCategoryCustom, setNewCategoryCustom] = useState('');
  const [useCustomCategory, setUseCustomCategory] = useState(false);

  const handleAddRule = () => {
    const category = useCustomCategory ? newCategoryCustom.trim() : newCategory;
    if (!newKeyword.trim() || !category) return;

    const rule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      keyword: newKeyword.trim(),
      category,
      subcategory: newSubcategory.trim(),
    };

    setCustomRules(prev => [...prev, rule]);
    setNewKeyword('');
    setNewCategory('');
    setNewSubcategory('');
    setNewCategoryCustom('');
    setUseCustomCategory(false);
  };

  const handleRemoveRule = (ruleId) => {
    setCustomRules(prev => prev.filter(r => r.id !== ruleId));
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    setCustomRules(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const handleMoveDown = (index) => {
    setCustomRules(prev => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const handleReapply = () => {
    onReapplyRules(customRules);
  };

  return (
    <div className="mt-6 p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold">Category Rules</h2>
          <p className="text-sm text-gray-500">Custom rules are checked first (top to bottom), then built-in rules apply as fallback.</p>
        </div>
        {customRules.length > 0 && (
          <button
            onClick={handleReapply}
            className="px-3 py-1 bg-amber-100 hover:bg-amber-200 rounded text-amber-800 text-sm"
          >
            Re-apply All Rules
          </button>
        )}
      </div>

      {/* Existing rules */}
      {customRules.length > 0 && (
        <div className="mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 pr-2 w-8">#</th>
                <th className="pb-2 pr-2">Keyword</th>
                <th className="pb-2 pr-2">Category</th>
                <th className="pb-2 pr-2">Subcategory</th>
                <th className="pb-2 w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customRules.map((rule, index) => (
                <tr key={rule.id} className="border-b border-gray-100">
                  <td className="py-2 pr-2 text-gray-400">{index + 1}</td>
                  <td className="py-2 pr-2">
                    <code className="bg-gray-100 px-1 rounded text-xs">{rule.keyword}</code>
                  </td>
                  <td className="py-2 pr-2">{rule.category}</td>
                  <td className="py-2 pr-2 text-gray-500">{rule.subcategory || '-'}</td>
                  <td className="py-2">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className={`px-1.5 py-0.5 rounded text-xs ${index === 0 ? 'text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                      >
                        ^
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === customRules.length - 1}
                        className={`px-1.5 py-0.5 rounded text-xs ${index === customRules.length - 1 ? 'text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                      >
                        v
                      </button>
                      <button
                        onClick={() => handleRemoveRule(rule.id)}
                        className="px-1.5 py-0.5 bg-red-100 hover:bg-red-200 rounded text-red-700 text-xs"
                      >
                        X
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add new rule */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-medium mb-3">Add Rule</h3>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Keyword (matches description)</label>
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="e.g. migros"
              className="border border-gray-300 rounded px-2 py-1 text-sm w-40"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Category</label>
            {useCustomCategory ? (
              <div className="flex items-center space-x-1">
                <input
                  type="text"
                  value={newCategoryCustom}
                  onChange={(e) => setNewCategoryCustom(e.target.value)}
                  placeholder="New category"
                  className="border border-gray-300 rounded px-2 py-1 text-sm w-32"
                />
                <button
                  onClick={() => { setUseCustomCategory(false); setNewCategoryCustom(''); }}
                  className="px-1.5 py-1 bg-gray-200 rounded text-xs"
                >
                  List
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm w-36"
                >
                  <option value="">Select...</option>
                  {allCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <button
                  onClick={() => setUseCustomCategory(true)}
                  className="px-1.5 py-1 bg-gray-200 rounded text-xs"
                  title="Create new category"
                >
                  +
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Subcategory (optional)</label>
            <input
              type="text"
              value={newSubcategory}
              onChange={(e) => setNewSubcategory(e.target.value)}
              placeholder="e.g. Groceries"
              className="border border-gray-300 rounded px-2 py-1 text-sm w-32"
            />
          </div>

          <button
            onClick={handleAddRule}
            disabled={!newKeyword.trim() || !(useCustomCategory ? newCategoryCustom.trim() : newCategory)}
            className={`px-3 py-1 rounded text-sm ${
              !newKeyword.trim() || !(useCustomCategory ? newCategoryCustom.trim() : newCategory)
                ? 'bg-gray-200 text-gray-400'
                : 'bg-green-100 hover:bg-green-200 text-green-800'
            }`}
          >
            Add Rule
          </button>
        </div>
      </div>

      {customRules.length === 0 && (
        <p className="text-gray-400 text-sm mt-3">No custom rules yet. Add a rule above to auto-categorize transactions by keyword.</p>
      )}
    </div>
  );
};

export default CategoryRulesEditor;
