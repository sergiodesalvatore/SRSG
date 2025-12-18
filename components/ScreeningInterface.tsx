
import React, { useState, useMemo, useEffect } from 'react';
import { Article, Selections, Decision, ProjectSettings, SelectionData } from '../types';
import * as XLSX from 'xlsx';
import { 
  Check, X, HelpCircle, Search, UserCircle, Save, 
  Microscope, LayoutGrid, BookOpen, Tag, Plus, Eye, EyeOff, AlertTriangle, CheckCircle2, AlertCircle,
  Download, Filter, Trophy, PartyPopper
} from 'lucide-react';

interface ScreeningInterfaceProps {
  articles: Article[];
  initialIndex: number;
  initialSelections: Selections;
  profileName: string;
  settings: ProjectSettings;
  onSave: (idx: number, sels: Selections, updatedSettings?: ProjectSettings) => void;
  onExit: () => void;
}

const getDecisionBadge = (decision: Decision | undefined) => {
  if (!decision) return { label: 'Pending', class: 'bg-slate-50 text-slate-400 border-slate-200', icon: <HelpCircle size={12}/> };
  switch (decision) {
    case 'include': return { label: 'Included', class: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <Check size={12}/> };
    case 'exclude': return { label: 'Excluded', class: 'bg-rose-50 text-rose-600 border-rose-100', icon: <X size={12}/> };
    case 'maybe': return { label: 'Maybe', class: 'bg-amber-50 text-amber-600 border-amber-100', icon: <HelpCircle size={12}/> };
  }
};

export const ScreeningInterface: React.FC<ScreeningInterfaceProps> = ({
  articles, initialIndex, initialSelections, profileName, settings, onSave, onExit
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [selections, setSelections] = useState<Selections>(initialSelections);
  const [search, setSearch] = useState('');
  const [showExitModal, setShowExitModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | Decision>('all');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  
  const [includeKws, setIncludeKws] = useState<{word: string, active: boolean}[]>(
    settings.includeKeywords.map(k => ({ word: k, active: true }))
  );
  const [excludeKws, setExcludeKws] = useState<{word: string, active: boolean}[]>(
    settings.excludeKeywords.map(k => ({ word: k, active: true }))
  );
  const [newKw, setNewKw] = useState('');
  const [kwType, setKwType] = useState<'include' | 'exclude'>('include');

  const myEmail = localStorage.getItem('srsg_user') || 'Reviewer';

  useEffect(() => {
    if (currentIndex >= articles.length && articles.length > 0) {
      setCurrentIndex(0);
    }
  }, [articles]);

  const currentArticle = articles[currentIndex];

  const decidedCount = useMemo(() => {
    return articles.filter(a => selections[a.id]?.some(s => s.reviewerId === myEmail)).length;
  }, [articles, selections, myEmail]);

  const totalCount = articles.length;
  const remainingCount = totalCount - decidedCount;
  const progressPercent = totalCount > 0 ? Math.round((decidedCount / totalCount) * 100) : 0;

  useEffect(() => {
    if (decidedCount === totalCount && totalCount > 0 && !showCompleteModal) {
      setShowCompleteModal(true);
    }
  }, [decidedCount, totalCount]);

  const highlightedAbstract = useMemo(() => {
    if (!currentArticle || !currentArticle.abstract) return '<p class="italic opacity-30 text-center py-20">No abstract available.</p>';
    
    let text = currentArticle.abstract;
    
    includeKws.forEach(({word, active}) => {
      if (!word.trim() || !active) return;
      const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      text = text.replace(regex, '<mark class="bg-emerald-200 text-emerald-900 rounded px-1 font-bold transition-colors">$1</mark>');
    });

    excludeKws.forEach(({word, active}) => {
      if (!word.trim() || !active) return;
      const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      text = text.replace(regex, '<mark class="bg-rose-200 text-rose-900 rounded px-1 font-bold transition-colors">$1</mark>');
    });

    return text;
  }, [currentArticle, includeKws, excludeKws]);

  const handleDecision = (decision: Decision) => {
    if (!currentArticle) return;
    const currentSels = (selections[currentArticle.id] || []) as SelectionData[];
    const updated = [...currentSels.filter(s => s.reviewerId !== myEmail), {
      decision,
      note: '',
      reviewerId: myEmail,
      timestamp: new Date().toISOString()
    }];
    setSelections(prev => ({ ...prev, [currentArticle.id]: updated }));
    
    if (currentIndex < articles.length - 1) {
      setTimeout(() => {
        setCurrentIndex(c => c + 1);
      }, 150);
    }
  };

  const exportToExcel = () => {
    const data = articles.map((a, i) => {
      const sels = selections[a.id] || [];
      const myDecision = sels.find(s => s.reviewerId === myEmail)?.decision || 'pending';
      
      const row: any = {
        '#': i + 1,
        'Final Status': myDecision.toUpperCase(),
        'PMID': a.pmid,
        'Title': a.title,
        'Authors': a.authors,
        'Journal': a.journal,
        'DOI': a.doi,
      };

      settings.assignedEmails.forEach(email => {
        const d = sels.find(s => s.reviewerId === email)?.decision || 'pending';
        row[`Decision (${email})`] = d;
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Screening Results');
    XLSX.writeFile(workbook, `${profileName}_screening_results.xlsx`);
  };

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKw.trim()) return;
    
    if (kwType === 'include') {
      if (!includeKws.some(k => k.word.toLowerCase() === newKw.toLowerCase())) {
        setIncludeKws(prev => [...prev, { word: newKw.trim(), active: true }]);
      }
    } else {
      if (!excludeKws.some(k => k.word.toLowerCase() === newKw.toLowerCase())) {
        setExcludeKws(prev => [...prev, { word: newKw.trim(), active: true }]);
      }
    }
    setNewKw('');
  };

  const toggleKeyword = (word: string, type: 'include' | 'exclude') => {
    if (type === 'include') {
      setIncludeKws(prev => prev.map(k => k.word === word ? { ...k, active: !k.active } : k));
    } else {
      setExcludeKws(prev => prev.map(k => k.word === word ? { ...k, active: !k.active } : k));
    }
  };

  const removeKeyword = (word: string, type: 'include' | 'exclude') => {
    if (type === 'include') {
      setIncludeKws(prev => prev.filter(k => k.word !== word));
    } else {
      setExcludeKws(prev => prev.filter(k => k.word !== word));
    }
  };

  const handleSaveAll = () => {
    const updatedSettings: ProjectSettings = {
      ...settings,
      includeKeywords: includeKws.map(k => k.word),
      excludeKeywords: excludeKws.map(k => k.word)
    };
    onSave(currentIndex, selections, updatedSettings);
  };

  const handleSaveAndExit = () => {
    handleSaveAll();
    onExit();
  };

  const filteredArticles = useMemo(() => {
    let result = articles;
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(a => 
        a.title.toLowerCase().includes(s) || 
        a.pmid.includes(s) || 
        a.journal?.toLowerCase().includes(s)
      );
    }
    if (activeFilter !== 'all') {
      result = result.filter(a => {
        const myDecision = selections[a.id]?.find(s => s.reviewerId === myEmail)?.decision;
        return myDecision === activeFilter;
      });
    }
    return result;
  }, [articles, search, activeFilter, selections, myEmail]);

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden relative">
      {showExitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-sm w-full p-8 animate-in zoom-in duration-300">
            <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-6 mx-auto">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-black text-slate-900 text-center mb-2">Unsaved Progress?</h2>
            <p className="text-sm font-medium text-slate-500 text-center mb-8">
              Don't forget to save your screening decisions and keyword updates before leaving.
            </p>
            <div className="space-y-3">
              <button 
                onClick={handleSaveAndExit}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <Save size={18} /> Save and Exit
              </button>
              <button 
                onClick={onExit}
                className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-black hover:bg-rose-100 transition-all"
              >
                Exit without Saving
              </button>
              <button 
                onClick={() => setShowExitModal(false)}
                className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors text-xs uppercase tracking-widest"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showCompleteModal && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full p-10 text-center animate-in zoom-in duration-300">
            <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-8 mx-auto relative">
              <Trophy size={40} />
              <div className="absolute -top-2 -right-2 bg-indigo-600 text-white p-2 rounded-full shadow-lg">
                <PartyPopper size={16} />
              </div>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3">Screening Complete!</h2>
            <p className="text-slate-500 font-medium mb-10 leading-relaxed">
              Congratulations! You have successfully screened all <span className="font-bold text-indigo-600">{totalCount}</span> articles in this project.
            </p>
            <div className="space-y-4">
              <button 
                onClick={exportToExcel}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <Download size={20} /> Export to Excel
              </button>
              <button 
                onClick={() => setShowCompleteModal(false)}
                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
              >
                Return to Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="h-16 bg-white border-b px-6 flex items-center justify-between shadow-sm shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
             <div className="h-9 w-9 bg-indigo-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                <Microscope size={20} />
             </div>
             <div className="flex flex-col">
                <span className="font-black text-slate-900 text-lg tracking-tighter leading-none uppercase">SCREENY <span className="text-indigo-600">PRO</span></span>
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.25em]">BY SRSG</span>
             </div>
          </div>
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex flex-col">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Session Progress</span>
               <div className="flex items-center gap-3">
                  <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-700 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-slate-700">{decidedCount} / {totalCount}</span>
               </div>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-xl px-12 hidden md:block">
           <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{remainingCount} studies remaining</span>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-700 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
           </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={exportToExcel}
            className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 transition-all shadow-sm group"
            title="Download Results"
          >
            <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
          </button>
          <button 
            onClick={handleSaveAll} 
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md active:scale-95"
          >
            <Save size={14}/> Save Progress
          </button>
          <button 
            onClick={() => setShowExitModal(true)} 
            className="p-2 text-slate-400 hover:text-rose-500 transition-colors ml-2"
          >
            <X size={24}/>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-72 bg-white border-r flex flex-col shrink-0">
          <div className="p-4 space-y-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-300" size={16}/>
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Search articles..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold focus:ring-2 ring-indigo-500/10 outline-none placeholder:text-slate-300" 
              />
            </div>
            <div className="flex gap-1">
              {(['all', 'include', 'exclude', 'maybe'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`flex-1 py-2 rounded-lg text-[9px] font-black border transition-all ${
                    activeFilter === f 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                    : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredArticles.length === 0 ? (
               <div className="p-10 text-center flex flex-col items-center opacity-30">
                  <Filter size={32} className="mb-2" />
                  <p className="text-[10px] font-bold">No results found.</p>
               </div>
            ) : filteredArticles.map((a) => {
              const myDecision = selections[a.id]?.find(s => s.reviewerId === myEmail)?.decision;
              const globalIdx = articles.findIndex(orig => orig.id === a.id);
              const isActive = currentIndex === globalIdx;
              return (
                <button 
                  key={a.id} 
                  onClick={() => setCurrentIndex(globalIdx)} 
                  className={`w-full p-4 border-b text-left transition-all ${isActive ? 'bg-indigo-50/70 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent hover:bg-slate-50'}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                       <LayoutGrid size={9} /> #{globalIdx + 1}
                    </span>
                    {myDecision && (
                      <div className={`h-2.5 w-2.5 rounded-full ring-2 ring-white shadow-sm ${
                        myDecision === 'include' ? 'bg-emerald-500' : myDecision === 'exclude' ? 'bg-rose-500' : 'bg-amber-500'
                      }`}></div>
                    )}
                  </div>
                  <h4 className={`text-[11px] font-bold leading-tight line-clamp-2 ${isActive ? 'text-indigo-900' : 'text-slate-600'}`}>{a.title}</h4>
                  <p className="text-[8px] font-black text-indigo-400 mt-1.5 uppercase tracking-tighter truncate">{a.journal || 'N/A'}</p>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-white overflow-hidden border-r">
          {currentArticle ? (
            <>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-10 lg:p-14">
                <div className="max-w-2xl mx-auto space-y-8">
                  <div className="flex flex-wrap gap-2 pb-6 border-b border-slate-100">
                     {settings.assignedEmails.map(email => {
                        const decision = selections[currentArticle.id]?.find(s => s.reviewerId === email)?.decision;
                        const badge = getDecisionBadge(decision);
                        return (
                           <div key={email} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all ${badge.class} shadow-sm`}>
                              <UserCircle size={14} className="opacity-40" />
                              <div className="flex flex-col">
                                 <span className="text-[8px] font-black opacity-60 uppercase tracking-tighter leading-none mb-0.5">{email === myEmail ? 'You' : email.split('@')[0]}</span>
                                 <span className="text-[9px] font-black uppercase tracking-tight flex items-center gap-1">
                                    {badge.label}
                                 </span>
                              </div>
                           </div>
                        );
                     })}
                  </div>

                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg border border-indigo-100">
                        <BookOpen size={10}/>
                        <span className="text-[9px] font-black uppercase tracking-widest truncate max-w-[200px]">{currentArticle.journal}</span>
                      </div>
                      <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">PMID: {currentArticle.pmid}</span>
                    </div>
                    <h1 className="text-xl lg:text-2xl font-black text-slate-900 leading-tight tracking-tight">{currentArticle.title}</h1>
                    <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 max-h-48 overflow-y-auto custom-scrollbar">
                       <span className="text-[10px] font-bold text-slate-500 italic leading-snug">{currentArticle.authors}</span>
                    </div>
                    <div 
                      className="pt-6 text-sm lg:text-base text-slate-700 leading-relaxed font-serif-reading selection:bg-indigo-100"
                      dangerouslySetInnerHTML={{ __html: highlightedAbstract }}
                    />
                  </div>
                </div>
              </div>

              <div className="h-20 bg-white border-t flex items-center justify-center gap-3 px-8 shrink-0 shadow-[0_-4px_25px_rgba(0,0,0,0.03)] z-10">
                 <button onClick={() => handleDecision('exclude')} className="flex-1 max-w-[150px] py-3 bg-white border-2 border-rose-100 text-rose-500 rounded-xl font-black hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all flex items-center justify-center gap-2 text-[11px] group active:scale-95">
                    <X size={16} className="group-hover:scale-110 transition-transform"/> EXCLUDE
                 </button>
                 <button onClick={() => handleDecision('maybe')} className="flex-1 max-w-[150px] py-3 bg-white border-2 border-amber-100 text-amber-500 rounded-xl font-black hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-all flex items-center justify-center gap-2 text-[11px] group active:scale-95">
                    <HelpCircle size={16} className="group-hover:scale-110 transition-transform"/> MAYBE
                 </button>
                 <button onClick={() => handleDecision('include')} className="flex-1 max-w-[150px] py-3 bg-white border-2 border-emerald-100 text-emerald-500 rounded-xl font-black hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all flex items-center justify-center gap-2 text-[11px] group active:scale-95">
                    <Check size={16} className="group-hover:scale-110 transition-transform"/> INCLUDE
                 </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
               <BookOpen size={48} className="mb-4 opacity-10" />
               <p className="font-bold">Select a study to begin screening.</p>
            </div>
          )}
        </main>

        <aside className="w-80 bg-slate-50/50 flex flex-col shrink-0">
          <div className="p-5 border-b bg-white">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Tag size={12}/> Keyword Manager
            </h3>
            
            <form onSubmit={handleAddKeyword} className="space-y-3">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  type="button" 
                  onClick={() => setKwType('include')}
                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-black transition-all ${kwType === 'include' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                >
                  INCLUDE
                </button>
                <button 
                  type="button" 
                  onClick={() => setKwType('exclude')}
                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-black transition-all ${kwType === 'exclude' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}
                >
                  EXCLUDE
                </button>
              </div>
              <div className="relative">
                <input 
                  value={newKw}
                  onChange={e => setNewKw(e.target.value)}
                  placeholder={`Add ${kwType} keyword...`}
                  className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold focus:ring-2 ring-indigo-500/10 outline-none"
                />
                <button type="submit" className="absolute right-2 top-1.5 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all">
                  <Plus size={14}/>
                </button>
              </div>
            </form>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
            <section>
              <h4 className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <CheckCircle2 size={12}/> High Quality
              </h4>
              <div className="space-y-2">
                {includeKws.length === 0 && <p className="text-[10px] text-slate-400 italic">No keywords added.</p>}
                {includeKws.map(k => (
                  <div key={k.word} className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${k.active ? 'bg-white border-emerald-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                    <span className={`text-[11px] font-bold ${k.active ? 'text-emerald-900' : 'text-slate-400 line-through'}`}>{k.word}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleKeyword(k.word, 'include')} className="p-1.5 text-slate-300 hover:text-indigo-600">
                        {k.active ? <Eye size={14}/> : <EyeOff size={14}/>}
                      </button>
                      <button onClick={() => removeKeyword(k.word, 'include')} className="p-1.5 text-slate-300 hover:text-rose-500">
                        <X size={14}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h4 className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <AlertTriangle size={12}/> Red Flags
              </h4>
              <div className="space-y-2">
                {excludeKws.length === 0 && <p className="text-[10px] text-slate-400 italic">No keywords added.</p>}
                {excludeKws.map(k => (
                  <div key={k.word} className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${k.active ? 'bg-white border-rose-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                    <span className={`text-[11px] font-bold ${k.active ? 'text-rose-900' : 'text-slate-400 line-through'}`}>{k.word}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleKeyword(k.word, 'exclude')} className="p-1.5 text-slate-300 hover:text-indigo-600">
                        {k.active ? <Eye size={14}/> : <EyeOff size={14}/>}
                      </button>
                      <button onClick={() => removeKeyword(k.word, 'exclude')} className="p-1.5 text-slate-300 hover:text-rose-500">
                        <X size={14}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
          
          <div className="p-5 bg-white border-t">
             <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[9px] text-amber-700 leading-tight">
               <b>TIP:</b> Keywords highlight text in the abstract to help you screen faster.
             </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
