import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, FileText, BarChart2, Sliders, AlignLeft, Zap, RefreshCw, Phone, Calendar } from 'lucide-react';
import ControlPanel from './components/ControlPanel';
import AnalysisViewer from './components/AnalysisViewer';
import TranscriptViewer from './components/TranscriptViewer';
import PromptEditor from './components/PromptEditor';
import ReportViewer from './components/ReportViewer';
import { getRusName, COMPANY_NAMES } from './translations';

// --- КОМПОНЕНТЫ UI ---
const Card = ({ children, className }) => (
  <div className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default' }) => {
  const styles = {
    default: "bg-slate-700 text-slate-300",
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    purple: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[variant] || styles.default}`}>{children}</span>;
};

const App = () => {
  const [structure, setStructure] = useState({});
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedManager, setSelectedManager] = useState(null);
  const [groupedCalls, setGroupedCalls] = useState({});
  
  const [playing, setPlaying] = useState(null);
  const [audioSrc, setAudioSrc] = useState(null);
  const audioRef = useRef(null);
  
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [viewingAnalysis, setViewingAnalysis] = useState(null);
  const [viewingTranscript, setViewingTranscript] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);
  const [analyzingManagers, setAnalyzingManagers] = useState({});

  useEffect(() => { fetchStructure(); }, []);

  const fetchStructure = async () => {
    try {
      const res = await fetch('/api/structure');
      if(res.ok) {
          const data = await res.json();
          setStructure(data);
          if (!selectedWeek && Object.keys(data).length > 0) {
            const weeks = Object.keys(data).sort().reverse();
            setSelectedWeek(weeks[0]);
            const companies = Object.keys(data[weeks[0]]);
            if (companies.length > 0) setSelectedCompany(companies[0]);
          }
      }
    } catch (e) { console.error(e); }
  };

  const loadCalls = async (managerId) => {
    setSelectedManager(managerId);
    setGroupedCalls({});
    try {
      const res = await fetch(`/api/calls/${selectedWeek}/${selectedCompany}/${managerId}`);
      if(res.ok) {
          const data = await res.json();
          const grouped = {};
          data.sort((a,b) => b.sortkey.localeCompare(a.sortkey)).forEach(call => {
            // Форматируем дату красиво
            let dateKey = call.date === "Unknown" ? "Не распознана" : call.date;
            try {
               const [d, m, y] = call.date.split('.');
               const dateObj = new Date(`${y}-${m}-${d}`);
               dateKey = dateObj.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
               dateKey = dateKey.charAt(0).toUpperCase() + dateKey.slice(1);
            } catch (e) {}
            
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(call);
          });
          setGroupedCalls(grouped);
      }
    } catch (e) { console.error(e); }
  };

  const handleAnalyzeManager = async (e, mgr) => {
    e.stopPropagation(); 
    let force = false;
    setAnalyzingManagers(prev => ({...prev, [mgr.id]: true}));
    
    try {
      const res = await fetch('/api/analyze_manager', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          week: selectedWeek,
          company: selectedCompany,
          manager: mgr.id,
          force: false
        })
      });
      
      const data = await res.json();
      
      if (data.status === 'exists') {
        if (confirm(`Отчет для ${getRusName(mgr.id)} уже есть. Перезаписать?`)) {
           await fetch('/api/analyze_manager', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              week: selectedWeek,
              company: selectedCompany,
              manager: mgr.id,
              force: true
            })
          });
          alert("Анализ запущен. Подождите минуту.");
        } else {
          setAnalyzingManagers(prev => ({...prev, [mgr.id]: false}));
          return;
        }
      } else {
         alert(`Анализ ${getRusName(mgr.id)} запущен!`);
      }

      setTimeout(() => {
        fetchStructure();
        setAnalyzingManagers(prev => ({...prev, [mgr.id]: false}));
      }, 5000);

    } catch (err) {
      alert("Ошибка запуска анализа");
      setAnalyzingManagers(prev => ({...prev, [mgr.id]: false}));
    }
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-purple-500/30">
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 h-16 flex items-center justify-between px-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/20">
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-none">Echo<span className="text-purple-400">Audit</span></h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase mt-0.5">Sales AI Agent</p>
          </div>
        </div>
        <button onClick={() => setShowPromptEditor(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg text-slate-300 hover:text-white transition-all">
          <Sliders className="w-4 h-4" /> Настройки AI
        </button>
      </header>

      <ControlPanel onRefresh={() => { fetchStructure(); if (selectedManager) loadCalls(selectedManager); }} />

      <main className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row gap-8">
        {/* САЙДБАР */}
        <div className="w-full sm:w-72 space-y-8">
          
          {/* Недели */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-2">
              <Calendar className="w-3 h-3" /> Период
            </h3>
            <div className="space-y-1">
              {Object.keys(structure).sort().reverse().map(week => {
                const [start, end] = week.split('_');
                return (
                  <button key={week} onClick={() => { setSelectedWeek(week); setSelectedManager(null); setGroupedCalls({}); }} 
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${selectedWeek === week ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'}`}
                  >
                    {start} — {end}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Компании */}
          {selectedWeek && structure[selectedWeek] && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">Компания</h3>
              <div className="flex flex-col gap-2">
                {Object.keys(structure[selectedWeek]).map(comp => (
                  <button key={comp} onClick={() => { setSelectedCompany(comp); setSelectedManager(null); setGroupedCalls({}); }} 
                    className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all flex justify-between items-center ${selectedCompany === comp ? 'bg-slate-800 border-purple-500 text-purple-400 shadow-sm' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700 hover:bg-slate-800'}`}
                  >
                    <span>{COMPANY_NAMES[comp] || comp}</span>
                    {selectedCompany === comp && <div className="w-2 h-2 rounded-full bg-purple-500"></div>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* КОНТЕНТ */}
        <div className="flex-1">
           {selectedCompany && !selectedManager && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {structure[selectedWeek][selectedCompany]?.map(mgr => (
                 <div key={mgr.id} onClick={() => loadCalls(mgr.id)} className="relative group cursor-pointer p-5 rounded-2xl border bg-slate-800/20 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700 transition-all hover:shadow-xl hover:shadow-black/20">
                   
                   <div className="absolute top-5 right-5 z-10">
                     {analyzingManagers[mgr.id] ? (
                        <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg animate-pulse"><RefreshCw className="w-5 h-5 animate-spin" /></div>
                     ) : (
                        <button 
                          onClick={(e) => handleAnalyzeManager(e, mgr)}
                          className="p-2 bg-slate-700/50 hover:bg-purple-600 text-slate-400 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100 transform hover:scale-110"
                          title="Запустить AI Анализ"
                        >
                          <Zap className="w-5 h-5" />
                        </button>
                     )}
                   </div>

                   <div className="flex items-start gap-4">
                     <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center text-lg font-bold text-slate-300 shadow-inner">
                        {getRusName(mgr.id).charAt(0)}
                     </div>
                     <div>
                       <h4 className="font-bold text-lg text-slate-200 group-hover:text-white transition-colors">{getRusName(mgr.id)}</h4>
                       <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                         <Phone className="w-3 h-3" /> {mgr.calls_count} звонков
                       </p>
                       
                       {mgr.has_weekly_report && (
                         <div className="mt-3">
                           <button onClick={(e) => { e.stopPropagation(); setViewingReport({ manager: mgr.id }); }} className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-colors">
                             <FileText className="w-3 h-3" /> Отчет готов
                           </button>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           )}

           {selectedManager && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                        {getRusName(selectedManager).charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">{getRusName(selectedManager)}</h2>
                        <p className="text-slate-400 text-sm">Карточка менеджера</p>
                    </div>
                 </div>
                 
                 <div className="flex gap-3">
                   <button 
                      onClick={(e) => handleAnalyzeManager(e, {id: selectedManager})}
                      className={`px-4 py-2.5 border rounded-xl flex items-center gap-2 text-sm font-medium transition-all ${analyzingManagers[selectedManager] ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                   >
                     <RefreshCw className={`w-4 h-4 ${analyzingManagers[selectedManager] ? 'animate-spin' : ''}`} />
                     {analyzingManagers[selectedManager] ? 'Анализ...' : 'Обновить анализ'}
                   </button>
                   <button onClick={() => setViewingReport({ manager: selectedManager })} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/30 hover:shadow-indigo-900/50 flex items-center gap-2">
                     <FileText className="w-4 h-4" /> Открыть Отчет
                   </button>
                 </div>
               </div>

               <div className="space-y-8">
                 {Object.keys(groupedCalls).length === 0 ? (
                    <div className="text-center py-20 text-slate-500">
                        <Phone className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Нет звонков за этот период</p>
                    </div>
                 ) : (
                    Object.keys(groupedCalls).map(date => (
                        <div key={date}>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-px flex-1 bg-slate-800"></div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 py-1 bg-slate-900 rounded-lg border border-slate-800">{date}</span>
                            <div className="h-px flex-1 bg-slate-800"></div>
                        </div>
                        <div className="space-y-3">
                            {groupedCalls[date].map(call => (
                            <div key={call.filename} className={`group relative p-4 rounded-xl border transition-all ${playing === call.filename ? 'bg-slate-800 border-purple-500/50 shadow-lg shadow-purple-900/20' : 'bg-slate-900/30 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'}`}>
                                <div className="flex items-center gap-4 relative z-10">
                                <button onClick={() => handlePlay(call)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${playing === call.filename ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40 scale-105' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white'}`}>
                                    {playing === call.filename ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                                </button>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                    <span className="font-mono text-sm font-medium text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">{call.time}</span>
                                    {call.has_transcript && <Badge variant="success">Текст</Badge>}
                                    {call.has_report && <Badge variant="purple">Анализ</Badge>}
                                    </div>
                                    <div className="text-sm text-slate-400 truncate font-medium group-hover:text-slate-300 transition-colors">{call.filename}</div>
                                </div>
                                
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {call.has_transcript && (
                                        <button onClick={() => setViewingTranscript(call)} className="p-2 hover:bg-slate-700 rounded-lg text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/20 transition-colors" title="Открыть текст">
                                            <AlignLeft className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                                </div>
                                {/* Прогресс бар (фейковый для красоты) */}
                                {playing === call.filename && (
                                    <div className="absolute bottom-0 left-0 h-1 bg-purple-600/50 rounded-b-xl w-full animate-pulse"></div>
                                )}
                            </div>
                            ))}
                        </div>
                        </div>
                    ))
                 )}
               </div>
             </div>
           )}
        </div>
      </main>

      <audio ref={audioRef} src={audioSrc} onEnded={() => setPlaying(null)} className="hidden" />
      {showPromptEditor && <PromptEditor onClose={() => setShowPromptEditor(false)} />}
      {viewingAnalysis && <AnalysisViewer call={viewingAnalysis} week={selectedWeek} company={selectedCompany} manager={selectedManager} onClose={() => setViewingAnalysis(null)} />}
      {viewingTranscript && <TranscriptViewer call={viewingTranscript} week={selectedWeek} company={selectedCompany} manager={selectedManager} onClose={() => setViewingTranscript(null)} />}
      {viewingReport && <ReportViewer week={selectedWeek} company={selectedCompany} manager={viewingReport.manager} onClose={() => setViewingReport(null)} />}
    </div>
  );
};

export default App;
