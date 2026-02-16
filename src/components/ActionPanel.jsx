import React, { useState, useEffect } from 'react';
import { Download, Mic, FileText, Play, CheckCircle, Loader2 } from 'lucide-react';

const ActionPanel = ({ onRefresh }) => {
  const [status, setStatus] = useState({
    issyncing: false,
    isprocessing: false,
    isgenerating: false,
    lasterror: null
  });
  
  const [currentStep, setCurrentStep] = useState('idle');
  const [logs, setLogs] = useState([]);

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
    } catch (e) {
      console.error("Status fetch error", e);
    }
  };

  const addLog = (msg) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

  const runFullCycle = async () => {
    if (currentStep !== 'idle' && currentStep !== 'done') return;
    
    setLogs([]);
    addLog("🚀 Запуск полного цикла...");
    
    try {
      setCurrentStep('sync');
      addLog("📥 1. Скачивание звонков...");
      await fetch('/api/sync', { method: 'POST' });
      await waitForCompletion('issyncing');
      
      setCurrentStep('transcribe');
      addLog("🎧 2. Транскрибация...");
      await fetch('/api/transcribe', { method: 'POST' });
      await waitForCompletion('isprocessing');

      setCurrentStep('analyze');
      addLog("🧠 3. AI Анализ...");
      await fetch('/api/analyze', { method: 'POST' });
      await waitForCompletion('isprocessing');

      setCurrentStep('report');
      addLog("📊 4. Генерация отчета...");
      await fetch('/api/generatereport', { method: 'POST' });
      await waitForCompletion('isgenerating');

      setCurrentStep('done');
      addLog("✅ Готово!");
      if (onRefresh) onRefresh();

    } catch (e) {
      addLog(`❌ Ошибка: ${e.message}`);
      setCurrentStep('idle');
    }
  };

  const waitForCompletion = async (flagName) => {
    return new Promise((resolve) => {
      const check = setInterval(async () => {
        const res = await fetch('/api/status');
        const data = await res.json();
        if (!data[flagName]) {
          clearInterval(check);
          resolve();
        }
      }, 3000);
    });
  };

  const StepIcon = ({ step, icon: Icon, label }) => {
    const isActive = currentStep === step;
    let color = "text-slate-500 bg-slate-800 border-slate-700";
    if (isActive) color = "text-indigo-400 bg-indigo-900/30 border-indigo-500 animate-pulse";
    if (['done', 'report', 'analyze', 'transcribe', 'sync'].indexOf(currentStep) > ['done', 'report', 'analyze', 'transcribe', 'sync'].indexOf(step) || currentStep === 'done') {
        color = "text-emerald-400 bg-emerald-900/20 border-emerald-500";
    }

    return (
      <div className={`flex items-center gap-2 p-2 rounded-lg border ${color} transition-all`}>
        {isActive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
        <span className="text-xs font-medium">{label}</span>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 p-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <button 
          onClick={runFullCycle}
          disabled={currentStep !== 'idle' && currentStep !== 'done'}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold shadow-lg transition-all ${
            currentStep === 'idle' || currentStep === 'done'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-105 text-white' 
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {currentStep === 'idle' || currentStep === 'done' ? <><Play className="w-5 h-5" /> Обновить Данные</> : <Loader2 className="animate-spin" />}
        </button>

        <div className="flex gap-2">
          <StepIcon step="sync" icon={Download} label="Скачивание" />
          <StepIcon step="transcribe" icon={Mic} label="Транскриб." />
          <StepIcon step="analyze" icon={FileText} label="Анализ" />
          <StepIcon step="report" icon={FileText} label="Отчет" />
        </div>

        <div className="text-xs text-slate-500 font-mono w-48 truncate text-right">
          {logs.length > 0 ? logs[logs.length - 1] : "Система готова"}
        </div>
      </div>
    </div>
  );
};

export default ActionPanel;
