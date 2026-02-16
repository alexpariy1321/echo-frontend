import React, { useState } from 'react';

const ControlPanel = ({ status = {}, onRefresh }) => {
  const [loadingAction, setLoadingAction] = useState(null); // 'sync' | 'analyze' | null
  const [message, setMessage] = useState(null);

  // Safe status access
  const isProcessing = status?.is_processing || false;
  const isSyncing = status?.is_syncing || false;
  const isBusy = isProcessing || isSyncing || loadingAction !== null;

  const runAction = async (endpoint, actionName) => {
    setLoadingAction(actionName);
    setMessage(`Starting ${actionName}...`);
    try {
      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json();
      setMessage(`${actionName} started: ${data.status || 'OK'}`);
      
      // Auto-refresh status after 2s
      setTimeout(onRefresh, 2000);
    } catch (err) {
      setMessage(`Error starting ${actionName}`);
      console.error(err);
    } finally {
      setLoadingAction(null);
      // Clear message after 5s
      setTimeout(() => setMessage(null), 5000);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* Status Indicators */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isProcessing ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></div>
            <span className="text-sm font-medium text-gray-600">
              Analysis: {isProcessing ? 'Running...' : 'Ready'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isSyncing ? 'bg-blue-400 animate-pulse' : 'bg-gray-300'}`}></div>
            <span className="text-sm font-medium text-gray-600">
              Download/Transcribe: {isSyncing ? 'Active' : 'Idle'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onRefresh}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Refresh Status"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </button>

          {/* 1. Sync & Transcribe Button */}
          <button
            onClick={() => runAction('/api/transcribe', 'sync')}
            disabled={isBusy}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loadingAction === 'sync' ? 'Starting...' : '1. Download & Transcribe'}
          </button>

          {/* 2. Analyze AI Button */}
          <button
            onClick={() => runAction('/api/analyze', 'analyze')}
            disabled={isBusy}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {loadingAction === 'analyze' ? (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            )}
            {loadingAction === 'analyze' ? 'Starting...' : '2. Run AI Analysis'}
          </button>
        </div>
      </div>
      
      {/* Feedback Message */}
      {message && (
        <div className="mt-3 p-2 bg-blue-50 text-blue-700 text-xs rounded-md text-center animate-pulse">
          {message}
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
