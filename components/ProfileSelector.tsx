
import React, { useState } from 'react';
import { Profile, ProjectSettings, SelectionData } from '../types';
import { Plus, Users, ShieldCheck, ArrowRight, LogOut, RefreshCw, FolderPlus, Database, CopySlash, FileX, Microscope, Trash2, Mail, Globe, Copy, CheckCircle2, AlertCircle, Sparkles, Activity, HelpCircle } from 'lucide-react';

interface AppProfile extends Profile {
  isShared?: boolean;
  ownerEmail?: string;
}

interface ProfileSelectorProps {
  profiles: AppProfile[];
  onSelect: (name: string) => void;
  onCreate: (name: string, settings: ProjectSettings) => void;
  onDelete: (name: string) => void;
  onImportSuccess: () => void;
  onLogout: () => void;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({ profiles, onSelect, onCreate, onDelete, onImportSuccess, onLogout }) => {
  const [step, setStep] = useState<'list' | 'create' | 'shared-confirm'>('list');
  const [name, setName] = useState('');
  const [reviewers, setReviewers] = useState<1 | 2>(1);
  const [emails, setEmails] = useState('');
  const [incKey, setIncKey] = useState('');
  const [excKey, setExcKey] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSharedWith, setLastSharedWith] = useState('');

  const userEmail = localStorage.getItem('srsg_user');

  const handleStartCreate = () => {
    if (!name.trim()) return;
    const assignedEmails = emails.split(',').map(e => e.trim().toLowerCase()).filter(e => e);
    const settings: ProjectSettings = {
      reviewersCount: reviewers,
      screeningMode: reviewers === 2 ? 'double' : 'single',
      assignedEmails,
      includeKeywords: incKey.split(',').map(k => k.trim()).filter(k => k),
      excludeKeywords: excKey.split(',').map(k => k.trim()).filter(k => k),
    };
    
    onCreate(name, settings);
    
    if (assignedEmails.length > 0) {
      setLastSharedWith(assignedEmails[0]);
      setStep('shared-confirm');
    } else {
      setStep('list');
      resetForm();
    }
  };

  const resetForm = () => {
    setName('');
    setEmails('');
    setIncKey('');
    setExcKey('');
    setReviewers(1);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onImportSuccess();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const myProjects = profiles.filter(p => !p.isShared);
  const sharedWithMe = profiles.filter(p => p.isShared);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
       <header className="bg-white border-b border-slate-100 px-6 md:px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-50">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-100">
                <Microscope size={20} />
             </div>
             <div className="flex flex-col">
                <span className="font-black text-slate-900 tracking-tighter text-xl leading-none">Screenie <span className="text-indigo-600">Pro</span></span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">by SRSG</span>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active User</span>
                <span className="text-sm font-bold text-indigo-600">{userEmail}</span>
             </div>
             <button 
                onClick={onLogout} 
                className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-black text-xs hover:bg-rose-600 hover:text-white transition-all group"
             >
                <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" /> LOGOUT
             </button>
          </div>
       </header>

       <main className="max-w-6xl mx-auto w-full p-4 md:p-10 flex-1">
          {step === 'shared-confirm' ? (
            <div className="max-w-xl mx-auto bg-white rounded-[40px] shadow-2xl p-12 text-center animate-in zoom-in duration-300 border border-slate-100">
               <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-8 mx-auto">
                  <CheckCircle2 size={40} className="text-emerald-500" />
               </div>
               <h2 className="text-3xl font-black text-slate-900 mb-4">Sincronizzazione Attiva!</h2>
               <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                  Il progetto è stato salvato nel Cloud. <br/>
                  Se <span className="text-indigo-600 font-bold">{lastSharedWith}</span> effettua l'accesso, vedrà il progetto istantaneamente cliccando su <b>Refresh</b>.
               </p>
               <button onClick={() => { setStep('list'); resetForm(); }} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
                  Torna alla Dashboard
               </button>
            </div>
          ) : step === 'create' ? (
            <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-12 border border-slate-200 animate-in fade-in zoom-in duration-300">
               <h2 className="text-3xl font-black text-slate-900 mb-8">Nuovo Progetto</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nome Studio</label>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="es. Review Diabete 2024" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-slate-900" />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setReviewers(1)} className={`p-6 rounded-3xl border-2 text-left transition-all ${reviewers === 1 ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100'}`}>
                           <Users className={reviewers === 1 ? 'text-indigo-600' : 'text-slate-300'} />
                           <div className="mt-2 font-black text-slate-900">1 Revisore</div>
                        </button>
                        <button onClick={() => setReviewers(2)} className={`p-6 rounded-3xl border-2 text-left transition-all ${reviewers === 2 ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100'}`}>
                           <ShieldCheck className={reviewers === 2 ? 'text-indigo-600' : 'text-slate-300'} />
                           <div className="mt-2 font-black text-slate-900">2 Revisori</div>
                        </button>
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Mail size={12}/> Collaboratore (Email registrata)</label>
                        <input value={emails} onChange={e => setEmails(e.target.value)} placeholder="collega@email.it" className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-bold" />
                        <p className="text-[9px] text-slate-400 mt-2 italic">* Inserisci l'email che il tuo collega usa per Screenie Pro.</p>
                     </div>
                  </div>
                  <div className="space-y-6">
                     <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                        <label className="block text-[10px] font-black text-emerald-600 uppercase mb-2">Keyword Inclusione</label>
                        <textarea value={incKey} onChange={e => setIncKey(e.target.value)} placeholder="human, trial..." className="w-full p-4 bg-white border border-emerald-200 rounded-2xl text-sm font-bold h-24 outline-none focus:border-emerald-500" />
                     </div>
                     <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100">
                        <label className="block text-[10px] font-black text-rose-600 uppercase mb-2">Keyword Esclusione</label>
                        <textarea value={excKey} onChange={e => setExcKey(e.target.value)} placeholder="animal, review..." className="w-full p-4 bg-white border border-rose-200 rounded-2xl text-sm font-bold h-24 outline-none focus:border-rose-500" />
                     </div>
                  </div>
               </div>
               <div className="flex gap-4 mt-10">
                  <button onClick={() => setStep('list')} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all">Annulla</button>
                  <button onClick={handleStartCreate} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">Crea e Condividi <ArrowRight size={20}/></button>
               </div>
            </div>
          ) : (
            <>
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                  <div>
                     <h1 className="text-4xl font-black text-slate-900 tracking-tighter">I miei Studi</h1>
                     <div className="flex items-center gap-4 mt-1">
                        <p className={`font-bold uppercase text-[10px] tracking-[0.2em] flex items-center gap-2 ${isRefreshing ? 'text-indigo-600' : 'text-slate-400'}`}>
                           <Activity size={10} className={isRefreshing ? 'animate-pulse' : ''} /> {isRefreshing ? 'Syncing Cloud...' : 'Cloud Connection OK'}
                        </p>
                        <div className="h-4 w-px bg-slate-200"></div>
                        <p className="text-emerald-500 font-bold uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
                           <Globe size={10} /> Collaboration Ready
                        </p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                     <button 
                        onClick={handleRefresh} 
                        disabled={isRefreshing}
                        className={`p-4 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2 ${isRefreshing ? 'bg-indigo-50' : ''}`}
                     >
                        <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''}/>
                        <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Refresh</span>
                     </button>
                     <button onClick={() => setStep('create')} className="flex-1 md:flex-none bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all">
                        <Plus size={20}/> Nuovo Progetto
                     </button>
                  </div>
               </div>

               <div className="space-y-16">
                  {/* I Miei Progetti */}
                  <section>
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em] mb-6 flex items-center gap-2">
                        <FolderPlus size={14}/> Progetti Creati da Me ({myProjects.length})
                    </h2>
                    {myProjects.length === 0 ? (
                        <div className="bg-white rounded-[40px] border border-slate-200 border-dashed p-12 text-center">
                            <p className="text-slate-400 font-bold text-sm">Nessun progetto creato. Inizia cliccando su "Nuovo Progetto".</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myProjects.map(p => renderProjectCard(p, onSelect, onDelete))}
                        </div>
                    )}
                  </section>

                  {/* Progetti Condivisi con Me */}
                  <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xs font-black text-indigo-500 uppercase tracking-[0.25em] flex items-center gap-2">
                            <Users size={14}/> Condivisi con Me ({sharedWithMe.length})
                        </h2>
                    </div>
                    {sharedWithMe.length === 0 ? (
                        <div className="bg-indigo-50/20 rounded-[40px] border border-indigo-100 border-dashed p-12 text-center relative overflow-hidden">
                            <div className="flex flex-col items-center max-w-sm mx-auto z-10 relative">
                                <Users size={32} className="text-indigo-200 mb-4" />
                                <p className="text-indigo-400 font-bold text-sm">Nessun progetto condiviso trovato.</p>
                                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                                    Assicurati che il tuo collega abbia inserito l'email <b>{userEmail}</b> nelle impostazioni del progetto.
                                </p>
                                
                                <div className="mt-8 p-4 bg-white/50 rounded-2xl border border-indigo-100 text-left">
                                    <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase mb-2">
                                        <HelpCircle size={14}/> Problemi di visualizzazione?
                                    </div>
                                    <p className="text-[9px] text-slate-500 leading-tight">
                                        Assicurati di aver configurato le <b>RLS Policies</b> nel pannello SQL di Supabase per permettere la lettura dei profili tra utenti autenticati.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sharedWithMe.map(p => renderProjectCard(p, onSelect, onDelete))}
                        </div>
                    )}
                  </section>
               </div>
            </>
          )}
       </main>
    </div>
  );
};

function renderProjectCard(p: AppProfile, onSelect: (n: string) => void, onDelete: (n: string) => void) {
    const articles = p.session?.articles || [];
    const selections = p.session?.selections || {};
    const excludedCount = Object.values(selections).filter((selArr) => 
       (selArr as SelectionData[]).some(s => s.decision === 'exclude')
    ).length;

    return (
       <div key={p.name} className="relative group h-full">
          <div 
            onClick={() => onSelect(p.name)} 
            className={`w-full bg-white p-8 rounded-[35px] border ${p.isShared ? 'border-indigo-200 bg-indigo-50/5' : 'border-slate-100'} shadow-sm flex flex-col text-left group-hover:border-indigo-500 group-hover:shadow-2xl group-hover:shadow-indigo-500/5 transition-all relative overflow-hidden h-full cursor-pointer`}
          >
             <div className="flex items-center gap-4 mb-8">
                <div className={`h-12 w-12 ${p.isShared ? 'bg-indigo-400' : 'bg-indigo-600'} rounded-2xl flex items-center justify-center text-white font-black text-lg`}>
                   {p.name[0].toUpperCase()}
                </div>
                <div className="pr-8">
                   <h3 className="font-black text-slate-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                       {p.name} {p.isShared && <Globe size={14} className="text-indigo-400 animate-pulse"/>}
                   </h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                       {p.isShared ? `Owner: ${p.ownerEmail?.split('@')[0]}` : `Creato: ${p.createdAt}`}
                   </p>
                </div>
             </div>
             <div className="space-y-2 mt-auto">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                   <span className="text-[10px] font-black text-slate-400 uppercase">Articoli</span>
                   <span className="text-xs font-black text-slate-900">{articles.length}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2 bg-rose-50 rounded-xl border border-rose-100">
                   <span className="text-[10px] font-black text-rose-600 uppercase flex items-center gap-1.5"><FileX size={12}/> Esclusi</span>
                   <span className="text-xs font-black text-rose-700">{excludedCount}</span>
                </div>
             </div>
             <div className="mt-6 flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                Apri Screening Room <ArrowRight size={14}/>
             </div>
          </div>
          
          {!p.isShared && (
            <div className="absolute top-8 right-8 z-[60]">
                <button 
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onDelete(p.name);
                }}
                className="p-3 bg-white text-rose-500 rounded-xl border border-slate-100 shadow-xl hover:bg-rose-50 hover:border-rose-200 transition-all opacity-80 group-hover:opacity-100 flex items-center justify-center active:scale-90"
                title="Elimina Progetto"
                >
                <Trash2 size={20} />
                </button>
            </div>
          )}
       </div>
    );
}
