import React, { useRef } from 'react';

const FileUpload = ({ transactions, isLoading, error, onFileUpload, onLoadFile, onSave, autoSaveStatus }) => {
  const csvInputRef = useRef(null);
  const hasData = transactions.length > 0;

  // Onboarding view when no data is loaded
  if (!hasData && !isLoading) {
    return (
      <div className="mb-6 p-6 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-1">Expense Tracker</h2>
        <p className="text-sm text-gray-500 mb-6">Import your bank data to get started</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {/* CSV Import */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
            onClick={() => csvInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-blue-400', 'bg-blue-50'); }}
            onDragLeave={(e) => { e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50'); }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
              if (e.dataTransfer.files.length > 0) {
                const fakeEvent = { target: { files: e.dataTransfer.files } };
                onFileUpload(fakeEvent);
              }
            }}
          >
            <div className="text-3xl mb-2 text-gray-400">CSV</div>
            <h3 className="font-medium mb-1">Import Bank CSV Files</h3>
            <p className="text-xs text-gray-500 mb-3">Drag & drop or click to browse</p>
            <p className="text-xs text-gray-400">
              Expected filenames: <code className="bg-gray-100 px-1 rounded">card_transactions.csv</code> or <code className="bg-gray-100 px-1 rounded">account_transactions.csv</code>
            </p>
            <input
              ref={csvInputRef}
              type="file"
              multiple
              accept=".csv"
              onChange={onFileUpload}
              className="hidden"
            />
          </div>

          {/* JSON Load */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 hover:bg-green-50 transition-colors cursor-pointer"
            onClick={() => document.getElementById('load-saved-dataset').click()}
          >
            <div className="text-3xl mb-2 text-gray-400">JSON</div>
            <h3 className="font-medium mb-1">Load Saved Session</h3>
            <p className="text-xs text-gray-500 mb-3">Open a previously exported dataset</p>
            <p className="text-xs text-gray-400">
              Includes categories, budgets, and custom rules
            </p>
            <input
              id="load-saved-dataset"
              type="file"
              accept=".json"
              multiple
              onChange={onLoadFile}
              className="hidden"
            />
          </div>
        </div>

        {autoSaveStatus === 'saved' && (
          <p className="text-xs text-gray-400 mt-3 text-center">Previous session restored from browser storage</p>
        )}
      </div>
    );
  }

  // Compact view when data is loaded
  return (
    <div className="mb-6 p-4 bg-white rounded shadow">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-sm font-medium cursor-pointer transition-colors">
            Import CSV
            <input type="file" multiple accept=".csv" onChange={onFileUpload} className="hidden" />
          </label>

          <label className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm cursor-pointer transition-colors">
            Load JSON
            <input type="file" accept=".json" multiple onChange={onLoadFile} className="hidden" />
          </label>

          <button
            onClick={onSave}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
          >
            Export Backup
          </button>
        </div>

        <span className="text-sm text-gray-500">
          {transactions.length.toLocaleString()} transactions loaded
        </span>

        {autoSaveStatus && (
          <span className={`text-xs ${autoSaveStatus === 'error' ? 'text-red-500' : 'text-gray-400'}`}>
            {autoSaveStatus === 'saving' && 'Saving...'}
            {autoSaveStatus === 'saved' && 'Auto-saved'}
            {autoSaveStatus === 'error' && 'Auto-save failed'}
          </span>
        )}
      </div>

      {isLoading && <div className="mt-2 text-blue-600 text-sm">Loading transactions...</div>}
      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
    </div>
  );
};

export default FileUpload;
