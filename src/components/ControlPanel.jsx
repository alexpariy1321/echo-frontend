import React, { useState, useEffect } from 'react';
import { Download, Mic, Sparkles, Loader2 } from 'lucide-react';

const ControlPanel = ({ onRefresh }) => {
  const [status, setStatus] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {}
  };

  // Вспомогательная функция ожидания
  const waitFor = async (key) => {
    return new Promise(resolve => {
      const check = setInterval(async () => {
        try {
          const res = await fetch('/api/status');
          const d = await res.json();
          if (!d[key]) { 
            clearInterval(check); 
            resolve(); 
          }
        } catch(e) { clearInterval(check); resolve(); }
      }, 2000);
    });
  };

  const runDataCycle = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await fetch('/api/sync', { method: 'POST' });
      await waitFor('issyncing');
      await fetch('/api/transcribe', { method: 'POST' });
      await waitFor('isprocessing');
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const runAnalysisOnly = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
       await fetch('/api/analyze', { method: 'POST' });
       await waitFor('isprocessing');
       if (onRefresh) onRefresh();
    } catch(e) { console.error(e); }
    finally { setIsProcessing(false); }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 p-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="flex items-center gap-4">
          <button 
            onClick={runDataCycle}
            disabled={isProcessing || status.issyncing || status.isprocessing}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all ${
              isProcessing ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {status.issyncing ? <Loader2 className="animate-spin" /> : <Download className="w-5 h-5" />}
            <span>1. Скачать и Распознать</span>
          </button>
        </div>

        <div className="flex items-center gap-4 pl-6 border-l border-slate-800">
          <button 
            onClick={runAnalysisOnly}
            disabled={isProcessing || status.issyncing || status.isprocessing}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all ${
              isProcessing ? 'bg-slate-800 text-slate-500' : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
          >
            {status.isprocessing && status.processprogress && status.processprogress.includes("GigaChat") ? <Loader2 className="animate-spin" /> : <Sparkles className="w-5 h-5" />}
            <span>2. AI Анализ</span>
          </button>
        </div>

        <div className="flex-1 text-right text-xs font-mono text-slate-500 truncate max-w-[300px]">
           {status.lasterror ? <span className="text-red-400">{status.lasterror}</span> : 
            status.issyncing ? `Sync: ${status.syncprogress}` : 
            status.isprocessing ? `Proc: ${status.processprogress}` : "Система готова"}
        </div>

      </div>
    </div>
  );
};

export default ControlPanel;
