import React, { useEffect, useState } from 'react';
import { Article, Selections, Decision, SelectionData } from '../types';
import { ChevronLeft, ChevronRight, Check, X, HelpCircle, Save, Download, Home, RotateCcw, Quote, BookOpen, Tag, ArrowRight, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ScreeningInterfaceProps {
  articles: Article[];
  initialIndex: number;
  initialSelections: Selections;
  profileName: string;
  onSave: (currentIndex: number, selections: Selections) => void;
  onExit: () => void;
}

const LOGO_SRC = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPG1hc2sgaWQ9ImMiPgogICAgPGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiIGZpbGw9IndoaXRlIi8+CiAgPC9tYXNrPgogIDxnIG1hc2s9InVybCgjYykiPgogICAgPHBhdGggZD0iTTAgMCBINTAgQyAzMCAzMCAzMCA3MCA1MCAxMDAgSDAgWiIgZmlsbD0iIzI1NjNFQiIvPgogICAgPHBhdGggZD0iTTYwIDAgQyA0MCAzMCA0NSA1MCAxMDAgNTAgVjAgSDYwIFoiIGZpbGw9IiM4NkVGQUMiLz4KICAgIDxwYXRoIGQ9Ik02MCAxMDAgQyA0MCA3MCA0NSA1MCAxMDAgNTAgVjEwMCBINjAgWiIgZmlsbD0iI0ZERTA0NyIvPgogIDwvZz4KPC9zdmc+";

export const ScreeningInterface: React.FC<ScreeningInterfaceProps> = ({
  articles,
  initialIndex,
  initialSelections,
  profileName,
  onSave,
  onExit
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [selections, setSelections] = useState<Selections>(initialSelections);
  const [showExitModal, setShowExitModal] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const currentArticle = articles[currentIndex];
  const currentSelection = selections[currentIndex];
  
  // Stats
  const total = articles.length;
  
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };
  
  const handleDecision = (decision: Decision) => {
    setSelections(prev => ({
      ...prev,
      [currentIndex]: {
        ...prev[currentIndex],
        decision,
        note: prev[currentIndex]?.note || ''
      }
    }));
    
    // Auto advance
    if (currentIndex < total - 1) {
      setTimeout(() => setCurrentIndex(c => c + 1), 150);
    }
  };

  const handleNoteChange = (note: string) => {
    setSelections(prev => ({
      ...prev,
      [currentIndex]: {
        decision: prev[currentIndex]?.decision || 'maybe',
        note
      }
    }));
  };

  const handleSave = () => {
    try {
      onSave(currentIndex, selections);
      showNotification('Progress saved successfully');
    } catch (error) {
      showNotification('Failed to save progress', 'error');
    }
  };

  const handleExport = () => {
    try {
      const data = articles.map((article, idx) => {
        const sel = selections[idx];
        return {
          'ID': article.pmid,
          'Title': article.title,
          'Abstract': article.abstract,
          'Authors': article.authors,
          'Journal': article.journal,
          'DOI': article.doi,
          'Decision': sel?.decision ? sel.decision.toUpperCase() : 'PENDING',
          'Notes': sel?.note || '',
        };
      });
      
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Screening Results');
      XLSX.writeFile(wb, `${profileName}_screening.xlsx`);
      showNotification('Export started');
    } catch (error) {
      showNotification('Export failed', 'error');
    }
  };

  const handleReset = () => {
    if(confirm("Are you sure you want to reset all progress for this session?")) {
        setSelections({});
        setCurrentIndex(0);
        showNotification('Session reset');
    }
  };

  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 overflow-hidden">
      {/* Toast */}
      <div 
        className={`fixed top-4 right-1/2 translate-x-1/2 z-[60] transform transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
      >
        <div className={`px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border ${toast.type === 'success' ? 'bg-slate-800 text-white border-slate-700' : 'bg-rose-500 text-white border-rose-600'}`}>
          <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-green-400' : 'bg-white'}`}></div>
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      </div>

      {/* Compact Header */}
      <header className="h-14 bg-white border-b border-slate-200 flex-none flex items-center justify-between px-4 z-20 shadow-sm">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-3">
             <img src={LOGO_SRC} alt="Logo" className="h-8 w-8 object-contain" />
             <span className="font-bold text-slate-800 text-sm hidden sm:inline">SRSG</span>
           </div>
           <div className="h-4 w-px bg-slate-200"></div>
           <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">{profileName}</span>
        </div>
        
        {/* Compact Progress Bar in Header */}
        <div className="flex-1 max-w-md mx-4 hidden md:flex flex-col gap-1">
           <div className="flex justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
             <span>Progress</span>
             <span>{Math.round(((currentIndex + 1) / total) * 100)}%</span>
           </div>
           <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
              ></div>
           </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleSave} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Save">
             <Save size={18} />
          </button>
          <button onClick={handleExport} className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Export">
             <Download size={18} />
          </button>
          <div className="h-4 w-px bg-slate-200 mx-1"></div>
          <button onClick={() => setShowExitModal(true)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Exit">
             <Home size={18} />
          </button>
        </div>
      </header>

      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Column: Article (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-white custom-scrollbar">
           <div className="max-w-3xl mx-auto pb-12">
              {currentArticle ? (
                <div className="animate-in fade-in duration-300">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-200">
                      #{currentIndex + 1}
                    </span>
                    <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-200">
                      PMID: {currentArticle.pmid}
                    </span>
                    {currentArticle.doi !== 'N/A' && (
                       <a href={`https://doi.org/${currentArticle.doi}`} target="_blank" rel="noreferrer" className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded border border-blue-100 hover:bg-blue-100 transition-colors flex items-center gap-1">
                         DOI <ArrowRight size={8} />
                       </a>
                    )}
                  </div>
                  
                  <h1 className="text-xl md:text-3xl font-extrabold text-slate-900 leading-tight mb-4">
                    {currentArticle.title}
                  </h1>
                  
                  {currentArticle.journal && (
                    <div className="flex items-center gap-2 mb-2 text-indigo-700 font-serif-reading italic text-sm">
                      <BookOpen size={14} />
                      <span>{currentArticle.journal}</span>
                    </div>
                  )}

                  <div className="text-xs text-slate-500 mb-8 font-medium border-l-2 border-slate-200 pl-3">
                    {currentArticle.authors}
                  </div>

                  <div className="prose prose-slate max-w-none font-serif-reading text-slate-700 leading-relaxed text-sm md:text-base selection:bg-indigo-100 selection:text-indigo-900">
                     {currentArticle.abstract}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 mt-20">
                  <BookOpen size={48} strokeWidth={1} />
                  <p className="font-medium">End of list</p>
                </div>
              )}
           </div>
        </div>

        {/* Right Column: Controls (Fixed) */}
        <div className="w-80 bg-slate-50 border-l border-slate-200 flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10">
           
           {/* Top: Stats (Compact) */}
           <div className="p-4 border-b border-slate-200 bg-white/50">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500 mb-2">
                 <span>Screening Stats</span>
                 <button onClick={handleReset} className="text-[10px] text-slate-400 hover:text-rose-500 flex items-center gap-1">
                    <RotateCcw size={10} /> Reset
                 </button>
              </div>
              <div className="flex gap-2">
                 <div className="flex-1 bg-emerald-100/50 rounded p-2 text-center border border-emerald-100">
                    <div className="text-lg font-bold text-emerald-600 leading-none">{(Object.values(selections) as SelectionData[]).filter(s => s.decision === 'include').length}</div>
                    <div className="text-[9px] uppercase font-bold text-emerald-400">In</div>
                 </div>
                 <div className="flex-1 bg-rose-100/50 rounded p-2 text-center border border-rose-100">
                    <div className="text-lg font-bold text-rose-600 leading-none">{(Object.values(selections) as SelectionData[]).filter(s => s.decision === 'exclude').length}</div>
                    <div className="text-[9px] uppercase font-bold text-rose-400">Out</div>
                 </div>
                 <div className="flex-1 bg-amber-100/50 rounded p-2 text-center border border-amber-100">
                    <div className="text-lg font-bold text-amber-600 leading-none">{(Object.values(selections) as SelectionData[]).filter(s => s.decision === 'maybe').length}</div>
                    <div className="text-[9px] uppercase font-bold text-amber-400">?</div>
                 </div>
              </div>
           </div>

           {/* Middle: Decision Buttons (Main Focus) */}
           <div className="flex-1 p-4 flex flex-col justify-center gap-3">
              <button 
                onClick={() => handleDecision('include')}
                className={`group relative w-full py-4 px-4 rounded-xl border transition-all duration-200 flex items-center gap-3 ${currentSelection?.decision === 'include' ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'}`}
              >
                <div className={`p-1 rounded-full ${currentSelection?.decision === 'include' ? 'bg-white/20' : 'bg-slate-100 text-slate-400 group-hover:text-emerald-500'}`}>
                  <Check size={18} strokeWidth={3} />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-sm">Include</span>
                  <span className={`text-[10px] opacity-80 ${currentSelection?.decision === 'include' ? 'text-white' : 'text-slate-400'}`}>Matches criteria</span>
                </div>
              </button>

              <button 
                onClick={() => handleDecision('exclude')}
                className={`group relative w-full py-4 px-4 rounded-xl border transition-all duration-200 flex items-center gap-3 ${currentSelection?.decision === 'exclude' ? 'border-rose-500 bg-rose-500 text-white shadow-lg shadow-rose-200' : 'border-slate-200 bg-white text-slate-600 hover:border-rose-300 hover:bg-rose-50'}`}
              >
                <div className={`p-1 rounded-full ${currentSelection?.decision === 'exclude' ? 'bg-white/20' : 'bg-slate-100 text-slate-400 group-hover:text-rose-500'}`}>
                  <X size={18} strokeWidth={3} />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-sm">Exclude</span>
                  <span className={`text-[10px] opacity-80 ${currentSelection?.decision === 'exclude' ? 'text-white' : 'text-slate-400'}`}>Does not match</span>
                </div>
              </button>

              <button 
                onClick={() => handleDecision('maybe')}
                className={`group relative w-full py-4 px-4 rounded-xl border transition-all duration-200 flex items-center gap-3 ${currentSelection?.decision === 'maybe' ? 'border-amber-400 bg-amber-400 text-white shadow-lg shadow-amber-100' : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50'}`}
              >
                <div className={`p-1 rounded-full ${currentSelection?.decision === 'maybe' ? 'bg-white/20' : 'bg-slate-100 text-slate-400 group-hover:text-amber-500'}`}>
                  <HelpCircle size={18} strokeWidth={3} />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-sm">Maybe</span>
                  <span className={`text-[10px] opacity-80 ${currentSelection?.decision === 'maybe' ? 'text-white' : 'text-slate-400'}`}>Unsure / Review later</span>
                </div>
              </button>
           </div>

           {/* Notes Section (Conditional) */}
           <div className={`px-4 transition-all duration-300 overflow-hidden ${currentSelection?.decision === 'exclude' || currentSelection?.decision === 'maybe' ? 'max-h-32 opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'}`}>
              <div className="bg-white border border-slate-200 rounded-lg p-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  <Tag size={10} />
                  {currentSelection?.decision === 'exclude' ? 'Reason' : 'Note'}
                </div>
                <textarea 
                  value={currentSelection?.note || ''} 
                  onChange={(e) => handleNoteChange(e.target.value)}
                  className="w-full text-xs text-slate-700 outline-none resize-none placeholder:text-slate-300"
                  rows={2}
                  placeholder="Type here..."
                />
              </div>
           </div>

           {/* Bottom: Navigation */}
           <div className="p-4 bg-white border-t border-slate-200">
              <div className="flex gap-2">
                 <button 
                   onClick={() => setCurrentIndex(c => Math.max(0, c - 1))}
                   disabled={currentIndex === 0}
                   className="flex-1 py-2.5 flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                 >
                    <ChevronLeft size={16} /> Prev
                 </button>
                 <button 
                   onClick={() => setCurrentIndex(c => Math.min(total - 1, c + 1))}
                   disabled={currentIndex === total - 1}
                   className="flex-1 py-2.5 flex items-center justify-center gap-1 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                 >
                    Next <ChevronRight size={16} />
                 </button>
              </div>
           </div>

        </div>
      </div>

      {/* Exit Modal */}
      {showExitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
           <div className="bg-white rounded-[24px] shadow-2xl p-6 max-w-sm w-full border border-white/20">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Save progress?</h3>
              <p className="text-sm text-slate-500 mb-6">
                Do you want to save before leaving?
              </p>
              <div className="flex flex-col gap-2">
                 <button onClick={() => { handleSave(); onExit(); }} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm">Save & Exit</button>
                 <button onClick={onExit} className="w-full py-3 bg-white border border-slate-200 text-rose-500 hover:bg-rose-50 rounded-xl font-bold text-sm">Discard</button>
                 <button onClick={() => setShowExitModal(false)} className="w-full py-2 text-slate-400 hover:text-slate-600 font-semibold text-xs">Cancel</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};