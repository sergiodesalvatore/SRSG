import React, { useState } from 'react';
import { Profile } from '../types';
import { Plus, ArrowRight, Sparkles, FolderOpen } from 'lucide-react';

interface ProfileSelectorProps {
  profiles: Profile[];
  onSelect: (name: string) => void;
  onCreate: (name: string) => void;
}

const LOGO_SRC = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPG1hc2sgaWQ9ImMiPgogICAgPGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiIGZpbGw9IndoaXRlIi8+CiAgPC9tYXNrPgogIDxnIG1hc2s9InVybCgjYykiPgogICAgPHBhdGggZD0iTTAgMCBINTAgQyAzMCAzMCAzMCA3MCA1MCAxMDAgSDAgWiIgZmlsbD0iIzI1NjNFQiIvPgogICAgPHBhdGggZD0iTTYwIDAgQyA0MCAzMCA0NSA1MCAxMDAgNTAgVjAgSDYwIFoiIGZpbGw9IiM4NkVGQUMiLz4KICAgIDxwYXRoIGQ9Ik02MCAxMDAgQyA0MCA3MCA0NSA1MCAxMDAgNTAgVjEwMCBINjAgWiIgZmlsbD0iI0ZERTA0NyIvPgogIDwvZz4KPC9zdmc+";

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({ profiles, onSelect, onCreate }) => {
  const [newProfileName, setNewProfileName] = useState('');

  const handleCreate = () => {
    if (newProfileName.trim()) {
      onCreate(newProfileName);
      setNewProfileName('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Brand Header - Top Left */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-3 z-20">
         <img src={LOGO_SRC} alt="SRSG Logo" className="h-12 w-12 object-contain" />
         <span className="text-2xl font-bold text-slate-900 tracking-tight">SRSG</span>
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50 to-slate-50 -z-10"></div>
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50 -z-10"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10"></div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mt-12 md:mt-0">
        
        {/* Left Side: Hero Text */}
        <div className="space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider">
            <Sparkles size={14} /> Systematic Review Tool
          </div>
          <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Screening made <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">
              intelligent & simple.
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-lg mx-auto lg:mx-0 leading-relaxed">
            Import your NBIB or RIS files, screen abstracts distraction-free, and export your decisions seamlessly.
          </p>
        </div>

        {/* Right Side: Profile Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 transform transition-all hover:shadow-indigo-200/50">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-800">Your Projects</h2>
            <div className="h-8 w-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
              <FolderOpen size={18} />
            </div>
          </div>
          
          <div className="space-y-4 mb-8 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
            {profiles.length > 0 ? (
              profiles.map((profile) => (
                <button
                  key={profile.name}
                  onClick={() => onSelect(profile.name)}
                  className="w-full group flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white hover:border-indigo-500 hover:shadow-md hover:shadow-indigo-100 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                       {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-800 text-base">{profile.name}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{profile.createdAt}</p>
                    </div>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <ArrowRight size={16} />
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-12 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-medium">No active projects</p>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Start a new review</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Project Name (e.g., 'Osteoarthritis Review')"
                className="flex-1 px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <button
                onClick={handleCreate}
                disabled={!newProfileName.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-95 flex items-center justify-center"
              >
                <Plus size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};