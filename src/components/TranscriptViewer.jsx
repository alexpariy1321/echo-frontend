import React, { useEffect, useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

const TranscriptViewer = ({ call, week, company, manager, onClose }) => {
  const [text, setText] = useState('Загрузка...');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchTranscript = async () => {
      try {
        const res = await fetch(`/api/transcript/${week}/${company}/${manager}/${call.filename}`);
        const data = await res.json();
        setText(data.content);
      } catch (e) {
        setText('Ошибка загрузки текста.');
      }
    };
    fetchTranscript();
  }, [call, week, company, manager]);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl flex flex-col max-h-[85vh] shadow-2xl">
        
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50 rounded-t-2xl">
          <div>
            <h3 className="font-bold text-white text-lg">📝 Транскрипция</h3>
            <p className="text-xs text-slate-400 font-mono truncate max-w-[300px]">
              {call.filename}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCopy}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Скопировать текст"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Текст */}
        <div className="p-6 overflow-y-auto font-mono text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
          {text}
        </div>

        {/* Подвал */}
        <div className="p-4 border-t border-slate-800 bg-slate-800/30 rounded-b-2xl text-center">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default TranscriptViewer;
