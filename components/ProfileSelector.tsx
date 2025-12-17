
import React, { useState, useRef } from 'react';
import { Profile } from '../types';
import { Plus, ArrowRight, FolderOpen, Download, Upload, Database, LogIn, LogOut, RefreshCw, Mail, Lock, UserPlus, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { validateAndImportData, saveProfiles } from '../services/storageService';
import { signUp, signIn, logout, fetchDataFromCloud, syncDataToCloud, isCloudConfigured } from '../services/cloudService';

interface ProfileSelectorProps {
  profiles: Profile[];
  onSelect: (name: string) => void;
  onCreate: (name: string) => void;
  onImportSuccess: () => void;
}

const LOGO_SRC = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPG1hc2sgaWQ9ImMiPgogICAgPGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiIGZpbGw9IndoaXRlIi8+CiAgPC9tYXNrPgogIDxnIG1hc2s9InVybCgjYykiPgogICAgPHBhdGggZD0iTTAgMCBINTAgQyAzMCAzMCAzMCA3MCA1MCAxMDAgSDAgWiIgZmlsbD0iIzI1NjNFQiIvPgogICAgPHBhdGggZD0iTTYwIDAgQyA0MCAzMCA0NSA1MCAxMDAgNTAgVjAgSDYwIFoiIGZpbGw9IiM4NkVGQUMiLz4KICAgIDxwYXRoIGQ9Ik02MCAxMDAgQyA0MCA3MCA0NSA1MCAxMDAgNTAgVjEwMCBINjAgWiIgZmlsbD0iI0ZERTA0NyIvPgogIDwvZz4KPC9zdmc+";

const AppleIcon = () => (
  <svg viewBox="0 0 384 512" width="18" height="18" fill="currentColor">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z"/>
  </svg>
);

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({ profiles, onSelect, onCreate, onImportSuccess }) => {
  const [newProfileName, setNewProfileName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);
  const [userEmail, setUserEmail] = useState(localStorage.getItem('srsg_user'));
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    if (newProfileName.trim()) {
      onCreate(newProfileName);
      setNewProfileName('');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return alert("Inserisci email e password");
    setLoading(true);
    try {
      if (isLoginView) {
        const data = await signIn(email, password);
        if (data.error) throw new Error(data.error.message || "Credenziali errate");
        
        const cloudData = await fetchDataFromCloud();
        if (cloudData) {
          saveProfiles(cloudData);
          onImportSuccess();
        }
        setUserEmail(email);
      } else {
        const data = await signUp(email, password);
        if (data.error) throw new Error(data.error.message || "Errore durante la registrazione");
        alert("Registrazione completata! Ora puoi effettuare il login.");
        setIsLoginView(true);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUserEmail(null);
    onImportSuccess();
  };

  const handleManualSync = async () => {
    setLoading(true);
    const success = await syncDataToCloud(profiles);
    setLoading(false);
    alert(success ? "Sincronizzazione completata!" : "Errore durante la sincronizzazione cloud.");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col p-6 font-sans">
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between py-4 mb-12">
        <div className="flex items-center gap-3">
           <img src={LOGO_SRC} alt="SRSG Logo" className="h-10 w-10 drop-shadow-sm" />
           <span className="text-2xl font-black text-slate-900 tracking-tighter">SCREENY</span>
        </div>
        
        <div className="flex items-center gap-4">
          <a 
            href="https://1drv.ms/f/c/1463450412a5421e/IgD_ksfXjh9wQY5YspISd_pNAdcxL8GL8T98yJnEySswqyI?e=7aAuE3" 
            target="_blank" 
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-md"
          >
            <AppleIcon /> Download for Mac
          </a>
          
          {userEmail ? (
            <div className="flex items-center gap-3 bg-white pl-4 pr-2 py-1.5 rounded-2xl shadow-sm border border-slate-100">
               <div className="text-right leading-none">
                 <p className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1 justify-end">
                   <Wifi size={10} /> Online
                 </p>
                 <p className="text-xs font-bold text-slate-700">{userEmail}</p>
               </div>
               <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-500 transition-colors bg-slate-50 rounded-xl" title="Logout">
                 <LogOut size={16} />
               </button>
            </div>
          ) : (
            <div className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 flex items-center gap-2">
              <WifiOff size={14} /> Offline Mode
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-5 space-y-8">
          {!userEmail ? (
            <div className="bg-white rounded-[40px] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 animate-in fade-in slide-in-from-left-6 duration-700">
               <div className="mb-8">
                  <h2 className="text-3xl font-extrabold text-slate-900 mb-2">{isLoginView ? 'Bentornato' : 'Inizia Ora'}</h2>
                  <p className="text-slate-500 font-medium leading-relaxed">Sincronizza i tuoi progetti di ricerca su tutti i tuoi dispositivi.</p>
               </div>
               
               <form onSubmit={handleAuth} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="Indirizzo Email"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="password" required value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                  <button 
                    type="submit" disabled={loading}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="animate-spin" /> : (isLoginView ? <LogIn size={20} /> : <UserPlus size={20} />)}
                    {isLoginView ? 'Accedi' : 'Crea Account'}
                  </button>
                  
                  <button 
                    type="button" onClick={() => setIsLoginView(!isLoginView)}
                    className="w-full text-center text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest mt-4"
                  >
                    {isLoginView ? "Non hai un account? Registrati" : "Hai già un account? Accedi"}
                  </button>
               </form>
            </div>
          ) : (
            <div className="space-y-8 py-10">
              <h1 className="text-6xl font-black text-slate-900 tracking-tight leading-[0.95]">
                Screening <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
                  Sincronizzato.
                </span>
              </h1>
              <p className="text-xl text-slate-500 leading-relaxed font-medium">
                I tuoi progetti sono al sicuro nel cloud. Puoi iniziare su un PC e finire sul tuo Mac o tablet.
              </p>
              <div className="flex flex-col gap-4">
                 <button 
                  onClick={handleManualSync}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm w-fit active:scale-95"
                 >
                   <RefreshCw size={20} className={loading ? 'animate-spin' : ''} /> Forza Sincronizzazione
                 </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-7 bg-white rounded-[40px] shadow-2xl shadow-slate-200/40 border border-slate-100 p-8 md:p-10 flex flex-col min-h-[600px]">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <FolderOpen className="text-indigo-600" size={28} />
              I Tuoi Progetti
            </h2>
          </div>
          
          <div className="flex-1 space-y-4 mb-10 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
            {profiles.length > 0 ? profiles.map(p => (
              <button 
                key={p.name} onClick={() => onSelect(p.name)} 
                className="w-full group flex items-center justify-between p-6 rounded-[24px] border border-slate-100 bg-white hover:border-indigo-500 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-center gap-5 text-left">
                  <div className="h-14 w-14 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl flex items-center justify-center font-black text-indigo-600 text-xl shadow-sm group-hover:from-indigo-600 group-hover:to-indigo-500 group-hover:text-white group-hover:border-transparent transition-all">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Creato il {p.createdAt}</p>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <ArrowRight size={20} strokeWidth={3} />
                </div>
              </button>
            )) : (
              <div className="text-center py-24 border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/30">
                <p className="text-slate-400 font-bold text-lg">Nessun progetto trovato.</p>
                <p className="text-slate-300 text-sm font-medium">Crea il tuo primo progetto qui sotto.</p>
              </div>
            )}
          </div>

          <div className="pt-8 border-t border-slate-100">
            <div className="flex gap-3">
              <input 
                type="text" value={newProfileName} onChange={e => setNewProfileName(e.target.value)}
                placeholder="Esempio: Meta-Analisi Diabete 2024"
                className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-slate-900 placeholder:text-slate-400"
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
              <button 
                onClick={handleCreate} disabled={!newProfileName.trim()} 
                className="bg-indigo-600 text-white px-8 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center shadow-lg active:scale-90"
              >
                <Plus size={28} strokeWidth={3} />
              </button>
            </div>
            
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-50">
               <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                 <Database size={12} /> Strumenti Locali
               </span>
               <div className="flex gap-3">
                  <button onClick={() => {
                    const dataStr = JSON.stringify(profiles, null, 2);
                    const link = document.createElement('a');
                    link.href = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                    link.download = `srsg-backup.json`;
                    link.click();
                  }} className="px-4 py-2 text-[11px] font-black text-slate-500 bg-white border border-slate-200 hover:border-slate-400 rounded-xl flex items-center gap-2 transition-all shadow-sm">
                    <Download size={14} /> Esporta Backup
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 text-[11px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-xl flex items-center gap-2 transition-all">
                    <Upload size={14} /> Importa
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      if (validateAndImportData(ev.target?.result as string)) {
                        onImportSuccess(); alert("Dati importati con successo!");
                      }
                    };
                    reader.readAsText(file);
                  }} />
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
