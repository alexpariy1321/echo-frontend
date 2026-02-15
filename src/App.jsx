import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, FileText, BarChart2, Calendar, 
  Search, Settings, Mic, ChevronRight, Clock,
  Filter, Download, CheckCircle, AlertCircle, X, AlignLeft, Settings2, RefreshCw, Zap
} from 'lucide-react';
import ControlPanel from './components/ControlPanel';
import AnalysisViewer from './components/AnalysisViewer';
import TranscriptViewer from './components/TranscriptViewer';
import PromptEditor from './components/PromptEditor';
import ReportViewer from './components/ReportViewer';

const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = "default" }) => {
  const styles = {
    default: "bg-slate-700 text-slate-300",
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    purple: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[variant] || styles.default}`}>
      {children}
    </span>
  );
};

const App = () => {
  const [structure, setStructure] = useState({});
  // Инициализируем стейты как null
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedManager, setSelectedManager] = useState(null);
  
  const [calls, setCalls] = useState([]);
  const [groupedCalls, setGroupedCalls] = useState({});
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(null);
  const [audioSrc, setAudioSrc] = useState(null);
  const audioRef = useRef(null);
  
  // Состояния UI
  const [showControl, setShowControl] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [viewingAnalysis, setViewingAnalysis] = useState(null);
  const [viewingTranscript, setViewingTranscript] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);
  
  const [analyzingManagers, setAnalyzingManagers] = useState({}); 

  useEffect(() => {
    fetchStructure();
    const interval = setInterval(fetchStructure, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStructure = async () => {
    try {
      const res = await fetch('/api/structure');
      const data = await res.json();
      setStructure(data);
      
      // Логика ПЕРВОЙ инициализации (только если вообще ничего не выбрано)
      // Мы используем колбэк setStates, чтобы проверить актуальное значение
      setSelectedWeek(prev => {
        if (prev) return prev; // Если уже выбрано - не трогаем!
        const weeks = Object.keys(data).sort().reverse();
        if (weeks.length > 0) {
           // Сразу выбираем компанию для первой недели
           const firstWeek = weeks[0];
           const companies = Object.keys(data[firstWeek]);
           if (companies.length > 0) {
              setSelectedCompany(companies[0]);
           }
           return firstWeek;
        }
        return null;
      });
      
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const loadCalls = async (managerId) => {
    setSelectedManager(managerId);
    setLoading(true);
    try {
      const res = await fetch(`/api/calls/${selectedWeek}/${selectedCompany}/${managerId}`);
      const data = await res.json();
      const sorted = data.sort((a, b) => (b.sort_key || "").localeCompare(a.sort_key || ""));
      setCalls(sorted);
      const grouped = {};
      sorted.forEach(call => {
        const date = call.date || "Неизвестная дата";
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(call);
      });
      setGroupedCalls(grouped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    if (selectedManager) loadCalls(selectedManager);
    fetchStructure();
  };

  const handlePlay = (call) => {
    if (playing === call.filename) {
      audioRef.current.pause();
      setPlaying(null);
    } else {
      const url = `/api/audio/${selectedWeek}/${selectedCompany}/${selectedManager}/${call.filename}`;
      setAudioSrc(url);
      setPlaying(call.filename);
      setTimeout(() => audioRef.current.play(), 100);
    }
  };

  // --- ИСПРАВЛЕННАЯ НАВИГАЦИЯ ---

  const handleCompanyChange = (comp) => {
    console.log("Switching company to:", comp);
    setSelectedCompany(comp);
    setSelectedManager(null); // Сброс менеджера
    setCalls([]); // Очистка списка
    setGroupedCalls({});
  };

  const handleWeekChange = (week) => {
    console.log("Switching week to:", week);
    setSelectedWeek(week);
    setSelectedManager(null);
    setCalls([]);
    setGroupedCalls({});
    
    // При смене недели - сбрасываем на первую доступную компанию ЭТОЙ недели
    // Но проверяем, существует ли текущая выбранная компания в новой неделе
    if (structure[week]) {
       const companies = Object.keys(structure[week]);
       // Если текущая компания есть в новой неделе - оставляем её. Если нет - берем первую.
       if (!companies.includes(selectedCompany)) {
           if (companies.length > 0) setSelectedCompany(companies[0]);
           else setSelectedCompany(null);
       }
    }
  };

  const handleAnalyzeManager = async (e, mgr) => {
    e.stopPropagation(); 
    if (mgr.has_weekly_report) {
       if (!confirm(`Отчет для ${mgr.name} уже существует.\nВы хотите пересоздать его?`)) {
         return;
       }
    }
    setAnalyzingManagers(prev => ({ ...prev, [mgr.id]: true }));
    try {
      await fetch('/api/analyze_manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week: selectedWeek,
          company: selectedCompany,
          manager: mgr.id
        })
      });
      setTimeout(() => {
         setAnalyzingManagers(prev => ({ ...prev, [mgr.id]: false }));
         fetchStructure();
      }, 5000); 
    } catch (e) {
      alert("Ошибка запуска: " + e);
      setAnalyzingManagers(prev => ({ ...prev, [mgr.id]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-purple-500/30">
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight text-white">
              Echo<span className="text-slate-400 font-normal">Audit</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowPromptEditor(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-lg transition-all text-slate-400 hover:text-white"
            >
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">Настройки AI</span>
            </button>
            <button 
              onClick={() => setShowControl(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 border border-transparent rounded-lg transition-colors text-white shadow-lg shadow-indigo-900/20"
            >
              <Settings className="w-4 h-4" />
              <span>Панель</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row gap-6 mb-8">
          <div className="w-full sm:w-64 space-y-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Период</h3>
            <div className="space-y-1">
              {Object.keys(structure).sort().reverse().map(week => (
                <button
                  key={week}
                  onClick={() => handleWeekChange(week)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedWeek === week 
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' 
                      : 'hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  {week.replace('_', ' — ')}
                </button>
              ))}
            </div>
          </div>

          {selectedWeek && structure[selectedWeek] && (
            <div className="flex-1">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Компания</h3>
              <div className="flex gap-2">
                {Object.keys(structure[selectedWeek]).map(comp => (
                  <button
                    key={comp}
                    onClick={() => handleCompanyChange(comp)} // ИСПОЛЬЗУЕМ НОВУЮ ФУНКЦИЮ
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                      selectedCompany === comp
                        ? 'bg-slate-800 border-purple-500 text-purple-400'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {comp === 'UN' ? 'Union (UN)' : comp === 'SO' ? 'Standard Oil (SO)' : comp}
                  </button>
                ))}
              </div>

              <div className="mt-8">
                 <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                   Менеджеры ({selectedCompany})
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {structure[selectedWeek][selectedCompany]?.map(mgr => (
                     <div
                       key={mgr.id}
                       onClick={() => loadCalls(mgr.id)}
                       className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
                         selectedManager === mgr.id
                           ? 'bg-slate-800 border-purple-500/50 shadow-lg shadow-purple-900/10'
                           : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                       }`}
                     >
                       <div className="flex justify-between items-start mb-3">
                         <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold">
                           {mgr.name.charAt(0)}
                         </div>
                         
                         <div className="flex gap-2">
                           {analyzingManagers[mgr.id] ? (
                              <Badge variant="warning">
                                <span className="animate-pulse">Думаю...</span>
                              </Badge>
                           ) : mgr.has_weekly_report ? (
                             <>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); setViewingReport({ manager: mgr.id }); }}
                                 className="px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded text-xs font-medium transition-colors flex items-center gap-1"
                               >
                                 <FileText className="w-3 h-3" /> Отчет
                               </button>
                               <button 
                                 onClick={(e) => handleAnalyzeManager(e, mgr)}
                                 className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-white transition-colors"
                                 title="Пересоздать отчет"
                               >
                                 <RefreshCw className="w-3.5 h-3.5" />
                               </button>
                             </>
                           ) : (
                             <button 
                               onClick={(e) => handleAnalyzeManager(e, mgr)}
                               className="px-2 py-1 bg-slate-700 hover:bg-purple-600 text-slate-300 hover:text-white rounded text-xs font-medium transition-all flex items-center gap-1"
                             >
                               <Zap className="w-3 h-3" /> Анализ
                             </button>
                           )}
                         </div>
                       </div>
                       
                       <h4 className="font-medium text-slate-200 group-hover:text-white transition-colors">
                         {mgr.name}
                       </h4>
                       <p className="text-sm text-slate-500 mt-1">
                         {mgr.calls_count} звонков
                       </p>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          )}
        </div>

        {selectedManager && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="text-purple-400">#</span> {selectedManager}
              </h2>
            </div>

            <div className="space-y-8">
              {Object.keys(groupedCalls).length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  Звонков нет или они еще не скачаны.
                </div>
              ) : (
                Object.keys(groupedCalls).sort().reverse().map(date => (
                  <div key={date}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-px flex-1 bg-slate-800"></div>
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-900 px-2 border border-slate-800 rounded">
                        {date}
                      </span>
                      <div className="h-px flex-1 bg-slate-800"></div>
                    </div>
                    
                    <div className="space-y-3">
                      {groupedCalls[date].map(call => (
                        <Card key={call.filename} className="group hover:border-slate-600 transition-colors">
                          <div className="p-4 flex items-center gap-4">
                            <button
                              onClick={() => handlePlay(call)}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                playing === call.filename
                                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                                  : 'bg-slate-700 text-slate-300 group-hover:bg-slate-600'
                              }`}
                            >
                              {playing === call.filename ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-sm text-slate-300">{call.time}</span>
                                {call.has_transcript && (
                                  <button onClick={() => setViewingTranscript(call)} className="hover:scale-105 transition-transform">
                                    <Badge variant="success">Текст</Badge>
                                  </button>
                                )}
                              </div>
                              <div className="text-sm text-slate-500 truncate" title={call.filename}>
                                {call.filename}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {call.has_transcript && (
                                <button
                                  onClick={() => setViewingTranscript(call)}
                                  className="p-2 hover:bg-slate-700 rounded-lg text-emerald-400 transition-colors"
                                  title="Читать транскрипцию"
                                >
                                  <AlignLeft className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <audio ref={audioRef} src={audioSrc} onEnded={() => setPlaying(null)} className="hidden" />

        {showControl && <ControlPanel onClose={() => setShowControl(false)} onUpdate={refreshData} />}
        {showPromptEditor && <PromptEditor onClose={() => setShowPromptEditor(false)} />}
        
        {viewingAnalysis && (
          <AnalysisViewer 
            call={viewingAnalysis} 
            week={selectedWeek} 
            company={selectedCompany} 
            manager={selectedManager}
            onClose={() => setViewingAnalysis(null)} 
          />
        )}
        {viewingTranscript && (
          <TranscriptViewer 
            call={viewingTranscript} 
            week={selectedWeek} 
            company={selectedCompany} 
            manager={selectedManager}
            onClose={() => setViewingTranscript(null)} 
          />
        )}
        {viewingReport && (
          <ReportViewer 
            week={selectedWeek} 
            company={selectedCompany} 
            manager={viewingReport.manager}
            onClose={() => setViewingReport(null)} 
          />
        )}
        
      </main>
    </div>
  );
};

export default App;
