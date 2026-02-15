import React, { useEffect, useState } from 'react';
import { X, Download, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ReportViewer = ({ week, company, manager, onClose }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        // Добавляем timestamp, чтобы избежать кэширования старого отчета
        const timestamp = new Date().getTime();
        const res = await fetch(`/api/calls/${week}/${company}/${manager}/report?t=${timestamp}`);
        
        if (res.ok) {
          const text = await res.text();
          setContent(text);
        } else {
          setContent('# Отчет не найден\nВозможно, файл еще не сгенерирован.');
        }
      } catch (e) {
        setContent('# Ошибка загрузки\nПроверьте соединение.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [week, company, manager]);

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report_${manager}_${week}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl flex flex-col max-h-[90vh] shadow-2xl">
        
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-purple-500/20 rounded-lg">
               <FileText className="w-6 h-6 text-purple-400" />
             </div>
             <div>
               <h3 className="font-bold text-white text-lg">Недельный Отчет</h3>
               <p className="text-xs text-slate-400 font-mono">{manager}</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownload}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 border border-slate-700 transition-colors flex items-center gap-2"
              title="Скачать .md файл"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Скачать</span>
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-950/50">
           {loading ? (
             <div className="flex items-center justify-center h-full text-slate-500">Загрузка...</div>
           ) : (
             <div className="prose prose-invert prose-lg max-w-none text-slate-300">
               <ReactMarkdown>{content}</ReactMarkdown>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default ReportViewer;
