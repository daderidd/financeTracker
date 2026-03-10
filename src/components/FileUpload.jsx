import React from 'react';

const FileUpload = ({ transactions, isLoading, error, onFileUpload, onLoadFile, onSave }) => {
  return (
    <div className="mb-6 p-4 bg-white rounded shadow">
      <h2 className="text-lg font-semibold mb-2">Upload Transaction Files</h2>
      <p className="text-sm text-gray-600 mb-2">
        Upload your card_transactions.csv and account_transactions.csv files
      </p>
      <input
        type="file"
        multiple
        onChange={onFileUpload}
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
              onClick={onSave}
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
                Load Saved Dataset(s)
              </button>
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
          <p className="text-sm text-gray-600 mt-1">
            Save your current dataset with all modifications (hidden transactions, etc.) for future sessions.
            You can load multiple JSON files at once - duplicates will be automatically removed (oldest version kept).
          </p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
