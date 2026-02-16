import React, { useState, useEffect } from 'react';
import { X, FileText, Copy, Check } from 'lucide-react';

const ReportViewer = ({ week, company, manager, onClose }) => {
  const [content, setContent] = useState("Загрузка...");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/report/${week}/${company}/${manager}`);
        const data = await res.json();
        setContent(data.content);
      } catch (e) {
        setContent("Ошибка загрузки отчета.");
      }
    };
    fetchReport();
  }, [week, company, manager]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-800/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Финальный отчет</h2>
              <p className="text-sm text-slate-400">Сгенерировано GigaChat</p>
            </div>
          </div>
          <div className="flex gap-2">
             <button onClick={copyToClipboard} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
              {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8 bg-slate-950">
          <pre className="whitespace-pre-wrap font-sans text-slate-300 leading-relaxed max-w-none">
            {content}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ReportViewer;
