import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Users } from 'lucide-react';

const PromptEditor = ({ onClose }) => {
  const [prompts, setPrompts] = useState({
    manager_prompt: '',
    company_prompt: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Загрузка текущих промптов при открытии
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const res = await fetch('/api/prompts');
        if (res.ok) {
          const data = await res.json();
          setPrompts(data);
        }
      } catch (e) {
        console.error("Ошибка загрузки промптов:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPrompts();
  }, []);

  // Сохранение изменений
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prompts)
      });
      if (res.ok) {
        onClose(); // Закрываем окно после успешного сохранения
      } else {
        alert('Ошибка сохранения');
      }
    } catch (e) {
      alert('Ошибка соединения: ' + e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl flex flex-col max-h-[90vh] shadow-2xl">
        
        {/* Шапка */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-800/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Настройки Анализа (AI)</h2>
              <p className="text-sm text-slate-400">Инструкции для GigaChat</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Контент (скроллируемый) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {loading ? (
            <div className="text-center py-20 text-slate-500">Загрузка настроек...</div>
          ) : (
            <>
              {/* 1. Промпт Менеджера */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-200 uppercase tracking-wider">
                  <Users className="w-4 h-4 text-emerald-400" />
                  1. Анализ Менеджера (Индивидуальный)
                </label>
                <p className="text-xs text-slate-400 mb-2">
                  Этот промпт будет использован для анализа звонков конкретного сотрудника и сравнения с его прошлой неделей.
                </p>
                <textarea
                  value={prompts.manager_prompt}
                  onChange={(e) => setPrompts({ ...prompts, manager_prompt: e.target.value })}
                  className="w-full h-48 bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-300 font-mono text-sm leading-relaxed focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  placeholder="Введите инструкцию для анализа менеджера..."
                />
              </div>

              {/* 2. Промпт Компании */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-200 uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-purple-400" />
                  2. Анализ Компании (Общий)
                </label>
                <p className="text-xs text-slate-400 mb-2">
                  Этот промпт будет использован для сводного отчета по всему отделу продаж.
                </p>
                <textarea
                  value={prompts.company_prompt}
                  onChange={(e) => setPrompts({ ...prompts, company_prompt: e.target.value })}
                  className="w-full h-48 bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-300 font-mono text-sm leading-relaxed focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  placeholder="Введите инструкцию для общего отчета..."
                />
              </div>
            </>
          )}

        </div>

        {/* Подвал с кнопкой */}
        <div className="p-6 border-t border-slate-800 bg-slate-800/30 rounded-b-2xl flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-slate-400 hover:text-white font-medium transition-colors"
          >
            Отмена
          </button>
          <button 
            onClick={handleSave}
            disabled={saving || loading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>Сохранение...</>
            ) : (
              <>
                <Save className="w-4 h-4" /> Сохранить настройки
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PromptEditor;
