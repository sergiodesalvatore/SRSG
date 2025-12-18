
import React, { useState } from 'react';
import { Profile, ProjectSettings, SelectionData } from '../types';
import { Plus, Users, ShieldCheck, ArrowRight, LogOut, RefreshCw, FolderPlus, Database, CopySlash, FileX, Microscope, Trash2 } from 'lucide-react';

interface ProfileSelectorProps {
  profiles: Profile[];
  onSelect: (name: string) => void;
  onCreate: (name: string, settings: ProjectSettings) => void;
  onDelete: (name: string) => void;
  onImportSuccess: () => void;
  onLogout: () => void;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({ profiles, onSelect, onCreate, onDelete, onImportSuccess, onLogout }) => {
  const [step, setStep] = useState<'list' | 'create'>('list');
  const [name, setName] = useState('');
  const [reviewers, setReviewers] = useState<1 | 2>(1);
  const [emails, setEmails] = useState('');
  const [incKey, setIncKey] = useState('');
  const [excKey, setExcKey] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const userEmail = localStorage.getItem('srsg_user');

  const handleStartCreate = () => {
    if (!name.trim()) return;
    const settings: ProjectSettings = {
      reviewersCount: reviewers,
      screeningMode: reviewers === 2 ? 'double' : 'single',
      assignedEmails: emails.split(',').map(e => e.trim()).filter(e => e),
      includeKeywords: incKey.split(',').map(k => k.trim()).filter(k => k),
      excludeKeywords: excKey.split(',').map(k => k.trim()).filter(k => k),
    };
    onCreate(name, settings);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onImportSuccess();
    setTimeout(() => setIsRefreshing(false), 800);
  };

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
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Session</span>
                <span className="text-sm font-bold text-slate-700">{userEmail}</span>
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
          {step === 'create' ? (
            <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-12 border border-slate-200 animate-in fade-in zoom-in duration-300">
               <h2 className="text-3xl font-black text-slate-900 mb-8">Configure New Project</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Project Name</label>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Type 2 Diabetes Study" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-slate-900" />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setReviewers(1)} className={`p-6 rounded-3xl border-2 text-left transition-all ${reviewers === 1 ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100'}`}>
                           <Users className={reviewers === 1 ? 'text-indigo-600' : 'text-slate-300'} />
                           <div className="mt-2 font-black text-slate-900">1 Reviewer</div>
                        </button>
                        <button onClick={() => setReviewers(2)} className={`p-6 rounded-3xl border-2 text-left transition-all ${reviewers === 2 ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100'}`}>
                           <ShieldCheck className={reviewers === 2 ? 'text-indigo-600' : 'text-slate-300'} />
                           <div className="mt-2 font-black text-slate-900">2 Reviewers</div>
                        </button>
                     </div>
                     {reviewers === 2 && (
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Collaborator Emails</label>
                           <input value={emails} onChange={e => setEmails(e.target.value)} placeholder="email1@test.com, email2@test.com" className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-bold" />
                        </div>
                     )}
                  </div>
                  <div className="space-y-6">
                     <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                        <label className="block text-[10px] font-black text-emerald-600 uppercase mb-2">Inclusion Keywords</label>
                        <textarea value={incKey} onChange={e => setIncKey(e.target.value)} placeholder="human, trial..." className="w-full p-4 bg-white border border-emerald-200 rounded-2xl text-sm font-bold h-24 outline-none focus:border-emerald-500" />
                     </div>
                     <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100">
                        <label className="block text-[10px] font-black text-rose-600 uppercase mb-2">Exclusion Keywords</label>
                        <textarea value={excKey} onChange={e => setExcKey(e.target.value)} placeholder="animal, review..." className="w-full p-4 bg-white border border-rose-200 rounded-2xl text-sm font-bold h-24 outline-none focus:border-rose-500" />
                     </div>
                  </div>
               </div>
               <div className="flex gap-4 mt-10">
                  <button onClick={() => setStep('list')} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all">Cancel</button>
                  <button onClick={handleStartCreate} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">Create Project <ArrowRight size={20}/></button>
               </div>
            </div>
          ) : (
            <>
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                  <div>
                     <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Projects Dashboard</h1>
                     <p className="text-slate-400 font-bold mt-1 uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
                        <Database size={10} /> Synchronized with Cloud Supabase
                     </p>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                     <button onClick={handleRefresh} className={`p-4 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-indigo-600 transition-all shadow-sm ${isRefreshing ? 'animate-spin' : ''}`}>
                        <RefreshCw size={20}/>
                     </button>
                     <button onClick={() => setStep('create')} className="flex-1 md:flex-none bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all">
                        <Plus size={20}/> New Project
                     </button>
                  </div>
               </div>

               {profiles.length === 0 ? (
                  <div className="bg-white rounded-[40px] border border-slate-200 border-dashed p-20 flex flex-col items-center justify-center text-center">
                     <div className="h-20 w-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mb-6">
                        <FolderPlus size={40} />
                     </div>
                     <h2 className="text-2xl font-black text-slate-900 mb-2">No projects available</h2>
                     <p className="text-slate-400 font-medium mb-8">Get started by creating your first systematic screening project.</p>
                     <button onClick={() => setStep('create')} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-slate-200">Start Now <ArrowRight size={20}/></button>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {profiles.map(p => {
                        const duplicates = p.session?.duplicatesCount || 0;
                        const articles = p.session?.articles || [];
                        const selections = p.session?.selections || {};
                        const excludedCount = Object.values(selections).filter((selArr) => 
                           (selArr as SelectionData[]).some(s => s.decision === 'exclude')
                        ).length;

                        return (
                           <div key={p.name} className="relative group h-full">
                              <div 
                                onClick={() => onSelect(p.name)} 
                                className="w-full bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm flex flex-col text-left group-hover:border-indigo-500 group-hover:shadow-2xl group-hover:shadow-indigo-500/5 transition-all relative overflow-hidden h-full cursor-pointer"
                              >
                                 <div className="flex items-center gap-4 mb-8">
                                    <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-lg">
                                       {p.name[0].toUpperCase()}
                                    </div>
                                    <div className="pr-8">
                                       <h3 className="font-black text-slate-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors">{p.name}</h3>
                                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{p.createdAt}</p>
                                    </div>
                                 </div>
                                 <div className="space-y-2 mt-auto">
                                    <div className="flex items-center justify-between px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                       <span className="text-[10px] font-black text-slate-400 uppercase">Total Articles</span>
                                       <span className="text-xs font-black text-slate-900">{articles.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-2 bg-rose-50 rounded-xl border border-rose-100">
                                       <span className="text-[10px] font-black text-rose-600 uppercase flex items-center gap-1.5"><FileX size={12}/> Excluded</span>
                                       <span className="text-xs font-black text-rose-700">{excludedCount}</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-2 bg-amber-50 rounded-xl border border-amber-100">
                                       <span className="text-[10px] font-black text-amber-600 uppercase flex items-center gap-1.5"><CopySlash size={12}/> Duplicates</span>
                                       <span className="text-xs font-black text-amber-700">{duplicates}</span>
                                    </div>
                                 </div>
                                 <div className="mt-6 flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                                    Go to screening <ArrowRight size={14}/>
                                 </div>
                              </div>
                              
                              {/* Better positioned and isolated Delete Button */}
                              <div className="absolute top-8 right-8 z-[60]">
                                <button 
                                   onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      onDelete(p.name);
                                   }}
                                   className="p-3 bg-white text-rose-500 rounded-xl border border-slate-100 shadow-xl hover:bg-rose-50 hover:border-rose-200 transition-all opacity-80 group-hover:opacity-100 flex items-center justify-center active:scale-90"
                                   title="Delete Project"
                                >
                                   <Trash2 size={20} />
                                </button>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               )}
            </>
          )}
       </main>
    </div>
  );
};
