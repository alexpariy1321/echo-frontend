import React, { useState, useEffect } from 'react';
import { X, Download, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ReportViewer = ({ week, company, manager, onClose }) => {
  const [content, setContent] = useState('Загрузка отчета...');

  useEffect(() => {
    fetchReport();
  }, [manager]);

  const fetchReport = async () => {
    try {
      const res = await fetch(`/api/report/${week}/${company}/${manager}?t=${Date.now()}`);
      if (res.ok) {
        const text = await res.text();
        setContent(text);
      } else {
        setContent("### Отчет еще не сформирован\n\nНажмите кнопку **'Молния'** в карточке менеджера, чтобы создать его.");
      }
    } catch (e) {
      setContent("### Ошибка загрузки\n" + e.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Шапка */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-lg border border-white/5">
              <FileText className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Финальный отчет</h2>
              <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">AI Analysis • GigaChat Pro</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-950 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <div className="prose prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:text-white prose-p:text-slate-300 prose-p:leading-relaxed prose-strong:text-purple-400 prose-ul:list-disc prose-ul:pl-6 prose-li:marker:text-purple-500 prose-blockquote:border-l-4 prose-blockquote:border-purple-500 prose-blockquote:bg-slate-900/50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-slate-400">
             <ReactMarkdown>
               {content}
             </ReactMarkdown>
          </div>
        </div>

        {/* Футер */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center">
          <span className="text-xs text-slate-500">Конфиденциально</span>
          <a 
            href={`/api/report/${week}/${company}/${manager}`} 
            download={`Report_${manager}.md`}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all font-medium shadow-lg shadow-indigo-900/20 hover:shadow-indigo-900/40 transform hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4" /> Скачать оригинал
          </a>
        </div>

      </div>
    </div>
  );
};

export default ReportViewer;
