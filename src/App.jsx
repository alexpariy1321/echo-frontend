import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, FileText, BarChart2, Sliders, AlignLeft } from 'lucide-react';
import ControlPanel from './components/ControlPanel';
import AnalysisViewer from './components/AnalysisViewer';
import TranscriptViewer from './components/TranscriptViewer';
import PromptEditor from './components/PromptEditor';
import ReportViewer from './components/ReportViewer';

// Простые компоненты UI
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

  useEffect(() => { fetchStructure(); }, []);

  const fetchStructure = async () => {
    try {
      const res = await fetch('/api/structure');
      if(res.ok) {
          const data = await res.json();
          setStructure(data);
          // Автовыбор первой недели
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
            const dateKey = call.date === "Unknown" ? "Не распознана" : call.date;
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(call);
          });
          setGroupedCalls(grouped);
      }
    } catch (e) { console.error(e); }
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
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 h-16 flex items-center justify-between px-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-lg text-white">Echo<span className="text-slate-400 font-normal">Audit</span></h1>
        </div>
        <button onClick={() => setShowPromptEditor(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-slate-800 border border-slate-700 rounded-lg text-slate-300">
          <Sliders className="w-4 h-4" /> Prompts
        </button>
      </header>

      <ControlPanel onRefresh={() => { fetchStructure(); if (selectedManager) loadCalls(selectedManager); }} />

      <main className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row gap-6">
        {/* Боковая панель: Недели и Компании */}
        <div className="w-full sm:w-64 space-y-4">
          <div className="space-y-1">
            {Object.keys(structure).sort().reverse().map(week => (
              <button key={week} onClick={() => { setSelectedWeek(week); setSelectedManager(null); setGroupedCalls({}); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${selectedWeek === week ? 'bg-purple-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}>
                {week.replace('_', ' - ')}
              </button>
            ))}
          </div>
          {selectedWeek && structure[selectedWeek] && (
            <div className="flex gap-2 flex-wrap">
              {Object.keys(structure[selectedWeek]).map(comp => (
                <button key={comp} onClick={() => { setSelectedCompany(comp); setSelectedManager(null); setGroupedCalls({}); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${selectedCompany === comp ? 'bg-slate-800 border-purple-500 text-purple-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                  {comp}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Основной контент */}
        <div className="flex-1">
           {selectedCompany && !selectedManager && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {structure[selectedWeek][selectedCompany]?.map(mgr => (
                 <button key={mgr.id} onClick={() => loadCalls(mgr.id)} className="text-left p-4 rounded-xl border bg-slate-800/30 border-slate-700/50 hover:bg-slate-800 transition-all">
                   <div className="flex justify-between mb-2">
                     <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold">{mgr.name.charAt(0)}</div>
                     {mgr.has_weekly_report && <Badge variant="purple">Отчет</Badge>}
                   </div>
                   <h4 className="font-medium text-slate-200">{mgr.name}</h4>
                   <p className="text-sm text-slate-500">{mgr.calls_count} звонков</p>
                 </button>
               ))}
             </div>
           )}

           {selectedManager && (
             <div className="animate-in fade-in slide-in-from-bottom-4">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-bold text-white">{structure[selectedWeek][selectedCompany].find(m => m.id === selectedManager)?.name}</h2>
                 <button onClick={() => setViewingReport({ manager: selectedManager })} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                   <FileText className="w-4 h-4" /> Отчет
                 </button>
               </div>
               <div className="space-y-6">
                 {Object.keys(groupedCalls).sort().reverse().map(date => (
                   <div key={date}>
                     <div className="flex items-center gap-4 mb-4"><div className="h-px flex-1 bg-slate-800"></div><span className="text-xs font-medium text-slate-500">{date}</span><div className="h-px flex-1 bg-slate-800"></div></div>
                     <div className="space-y-3">
                       {groupedCalls[date].map(call => (
                         <Card key={call.filename} className="p-4 flex items-center gap-4 hover:border-slate-600 transition-colors">
                           <button onClick={() => handlePlay(call)} className={`w-10 h-10 rounded-full flex items-center justify-center ${playing === call.filename ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                             {playing === call.filename ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                           </button>
                           <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2 mb-1">
                               <span className="font-mono text-sm text-slate-300">{call.time}</span>
                               {call.has_transcript && <Badge variant="success">Текст</Badge>}
                               {call.has_report && <Badge variant="purple">Анализ</Badge>}
                             </div>
                             <div className="text-sm text-slate-500 truncate">{call.filename}</div>
                           </div>
                           <div className="flex gap-2">
                             {call.has_transcript && <button onClick={() => setViewingTranscript(call)} className="p-2 hover:bg-slate-700 rounded-lg text-emerald-400"><AlignLeft className="w-5 h-5" /></button>}
                             {call.has_report && <button onClick={() => setViewingAnalysis(call)} className="p-2 hover:bg-slate-700 rounded-lg text-purple-400"><FileText className="w-5 h-5" /></button>}
                           </div>
                         </Card>
                       ))}
                     </div>
                   </div>
                 ))}
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
