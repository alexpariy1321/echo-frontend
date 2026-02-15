import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Cpu, FileText, Mic } from 'lucide-react';

const ControlPanel = ({ onClose, onUpdate }) => {
  const [status, setStatus] = useState({
    is_syncing: false,
    is_processing: false,
    is_generating: false,
    sync_progress: '',
    process_progress: '',
    last_error: ''
  });

  const parseProgress = (text) => {
    if (!text) return 0;
    const match = text.match(/(\d+)\/(\d+)/);
    if (match) {
      return (parseInt(match[1]) / parseInt(match[2])) * 100;
    }
    return 0;
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        setStatus(data);
        if (!data.is_syncing && !data.is_processing && !data.is_generating) {
           // auto-update optional
        }
      } catch (e) { console.error(e); }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const runTask = async (endpoint) => {
    try { await fetch(endpoint, { method: 'POST' }); } catch (e) { alert(e); }
  };

  const transcribePercent = status.process_progress.includes('Транскрибация') 
    ? parseProgress(status.process_progress) 
    : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-800/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-amber-500">⚡</span> Панель Управления
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          
          {/* 1. Скачивание */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex-shrink-0 flex items-center justify-center text-blue-400">
                  <RefreshCw className={`w-5 h-5 ${status.is_syncing ? 'animate-spin' : ''}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-slate-200">1. Скачать новые звонки</h3>
                  <p className="text-xs text-slate-400 truncate pr-2">
                    {status.is_syncing ? status.sync_progress : 'Битрикс24 API'}
                  </p>
                </div>
              </div>
              <button onClick={() => runTask('/api/sync')} disabled={status.is_syncing} className="px-4 py-2 flex-shrink-0 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors">
                {status.is_syncing ? 'Загрузка...' : 'Запустить'}
              </button>
            </div>
          </div>

          {/* 2. Транскрибация */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex-shrink-0 flex items-center justify-center text-emerald-400">
                  <Mic className={`w-5 h-5 ${status.is_processing && status.process_progress.includes('Транскрибация') ? 'animate-pulse' : ''}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-slate-200">2. Транскрибация (Whisper)</h3>
                  <p className="text-xs text-slate-400 truncate pr-2" title={status.process_progress}>
                    {(status.is_processing && status.process_progress.includes('Транскрибация')) 
                      ? status.process_progress 
                      : 'Преобразование аудио в текст'}
                  </p>
                </div>
              </div>
              <button onClick={() => runTask('/api/transcribe')} disabled={status.is_processing} className="px-4 py-2 flex-shrink-0 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors">
                {status.is_processing ? 'В работе...' : 'Начать'}
              </button>
            </div>
            
            {(status.is_processing && status.process_progress.includes('Транскрибация')) && (
               <div className="w-full h-1.5 bg-slate-700 rounded-full mt-3 overflow-hidden">
                 <div 
                   className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                   style={{ width: `${transcribePercent}%` }}
                 ></div>
               </div>
            )}
          </div>

          {/* 3. AI Анализ */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex-shrink-0 flex items-center justify-center text-purple-400">
                  <Cpu className={`w-5 h-5 ${status.is_processing && status.process_progress.includes('Анализ') ? 'animate-pulse' : ''}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-slate-200">3. AI Анализ (GigaChat)</h3>
                  <p className="text-xs text-slate-400 truncate pr-2">
                    {(status.is_processing && status.process_progress.includes('Анализ')) ? status.process_progress : 'Оценка качества диалогов'}
                  </p>
                </div>
              </div>
              <button onClick={() => runTask('/api/analyze')} disabled={status.is_processing} className="px-4 py-2 flex-shrink-0 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors">
                {status.is_processing ? 'Думает...' : 'Запустить'}
              </button>
            </div>
          </div>

          {/* 4. Отчет */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex-shrink-0 flex items-center justify-center text-rose-400">
                  <FileText className={`w-5 h-5 ${status.is_generating ? 'animate-bounce' : ''}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-slate-200">4. Финальный отчет</h3>
                  <p className="text-xs text-slate-400 truncate pr-2">
                    {status.is_generating ? 'Генерация...' : 'Сводка за неделю'}
                  </p>
                </div>
              </div>
              <button onClick={() => runTask('/api/generate_report')} disabled={status.is_generating} className="px-4 py-2 flex-shrink-0 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors">Создать</button>
            </div>
          </div>

        </div>

        {status.last_error && (
          <div className="px-6 pb-6">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 font-mono break-all">
              Ошибка: {status.last_error}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ControlPanel;
