import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, CheckCircle } from 'lucide-react';

const PromptEditor = ({ onClose }) => {
  const [prompts, setPrompts] = useState(null);
  const [activeTab, setActiveTab] = useState('UN'); // UN или SO
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetch('/api/prompts')
      .then(res => res.json())
      .then(data => setPrompts(data))
      .catch(err => console.error(err));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prompts)
      });
      if (res.ok) {
        setStatus('success');
        setTimeout(() => setStatus(null), 3000);
      } else {
        setStatus('error');
      }
    } catch (e) {
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const updateCompanyPrompt = (comp, text) => {
    setPrompts(prev => ({
      ...prev,
      companies: {
        ...prev.companies,
        [comp]: {
          ...prev.companies[comp],
          prompt: text
        }
      }
    }));
  };

  if (!prompts) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        
        {/* Шапка */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 rounded-t-2xl">
          <h2 className="text-xl font-bold text-white">Настройка AI Анализа</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Вкладки */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-6 pt-4 gap-4">
          {['UN', 'SO'].map(comp => (
            <button
              key={comp}
              onClick={() => setActiveTab(comp)}
              className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === comp 
                  ? 'border-purple-500 text-purple-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {prompts.companies[comp]?.name || comp}
            </button>
          ))}
          <button
              onClick={() => setActiveTab('system')}
              className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'system' 
                  ? 'border-indigo-500 text-indigo-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Системная Роль (Общая)
          </button>
        </div>

        {/* Редактор */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-950/50">
          {activeTab === 'system' ? (
             <div className="space-y-4">
               <label className="block text-sm font-medium text-slate-400">Роль AI (System Prompt)</label>
               <textarea
                 value={prompts.system}
                 onChange={(e) => setPrompts({...prompts, system: e.target.value})}
                 className="w-full h-64 bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none font-mono text-sm leading-relaxed"
                 placeholder="Ты опытный РОП..."
               />
               <p className="text-xs text-slate-500">Эта инструкция применяется ко всем компаниям. Задайте тон и стиль общения.</p>
             </div>
          ) : (
             <div className="space-y-4">
               <label className="block text-sm font-medium text-slate-400">
                 Критерии анализа для {prompts.companies[activeTab]?.name}
               </label>
               <textarea
                 value={prompts.companies[activeTab]?.prompt || ''}
                 onChange={(e) => updateCompanyPrompt(activeTab, e.target.value)}
                 className="w-full h-96 bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none font-mono text-sm leading-relaxed"
                 placeholder="Опишите специфику, критерии оценки, стоп-слова..."
               />
               <div className="flex gap-2 text-xs text-slate-500">
                 <span className="bg-slate-800 px-2 py-1 rounded">Совет:</span>
                 <span>Используйте списки (1. 2. 3.) для четких критериев. AI будет проверять каждый пункт.</span>
               </div>
             </div>
          )}
        </div>

        {/* Футер */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-800/30 rounded-b-2xl flex justify-between items-center">
          <div className="flex items-center gap-2">
            {status === 'success' && <span className="text-emerald-400 flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4" /> Сохранено</span>}
            {status === 'error' && <span className="text-red-400 flex items-center gap-2 text-sm"><AlertCircle className="w-4 h-4" /> Ошибка сохранения</span>}
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-xl transition-all font-medium shadow-lg shadow-indigo-900/20"
          >
            {saving ? 'Сохранение...' : <><Save className="w-4 h-4" /> Сохранить настройки</>}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PromptEditor;
