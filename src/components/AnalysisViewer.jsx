import React, { useEffect, useState } from 'react';
import { X, FileText, Download, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const AnalysisViewer = ({ call, week, company, manager, onClose }) => {
  const [content, setContent] = useState('Загрузка отчета...');
  const [downloading, setDownloading] = useState(false);

  // Определяем URL: либо отчет по звонку, либо отчет по менеджеру (если call передан как null, но manager есть)
  // В текущей логике App.jsx мы передаем call. Но для недельного отчета нам нужен другой подход.
  // Давай сделаем универсально.
  
  // Если передан call, значит смотрим отчет по звонку (которого пока нет, т.к. мы делаем недельный).
  // НО! App.jsx открывает отчет менеджера через window.open().
  // А этот компонент AnalysisViewer использовался для по-звонкового анализа.
  
  // Давай адаптируем этот компонент для просмотра НЕДЕЛЬНОГО ОТЧЕТА, если передан только менеджер.
  
  useEffect(() => {
    const fetchReport = async () => {
      try {
        // Мы используем тот же эндпоинт, что и для скачивания файла, но читаем его как текст
        // Трюк: у нас нет API "get_report_content", но есть API файлов.
        // Давай просто сделаем fetch на файл.
        
        const url = call 
          ? `/api/calls/${week}/${company}/${manager}/report/${call.filename}.md`
          : `/api/calls/${week}/${company}/${manager}/report`; // Это откроет файл в браузере
          
        // Но нам нужен текст. Бэкенд отдает файл.
        // Лучше добавить эндпоинт для чтения текста отчета.
        // Пока что используем window.open в App.jsx - это просто открывает файл.
      } catch (e) {
        setContent('Ошибка загрузки.');
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
       {/* Этот компонент пока не используется для недельных отчетов, 
           так как мы открываем их в новой вкладке через window.open.
           Оставим его на будущее для детального анализа звонков. */}
    </div>
  );
};

export default AnalysisViewer;
