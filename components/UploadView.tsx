
import React, { useState } from 'react';
import { Upload, FileText, ArrowLeft, Play, Trash2, FileType } from 'lucide-react';

interface UploadViewProps {
  profileName: string;
  hasSavedSession: boolean;
  onUpload: (content: string, type: 'nbib' | 'ris') => void;
  onContinue: () => void;
  onDeleteSession: () => void;
  onBack: () => void;
}

export const UploadView: React.FC<UploadViewProps> = ({ 
  profileName, 
  hasSavedSession, 
  onUpload, 
  onContinue, 
  onDeleteSession,
  onBack 
}) => {
  const [textInput, setTextInput] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (file.name.endsWith('.nbib')) {
        onUpload(content, 'nbib');
      } else if (file.name.endsWith('.ris')) {
        onUpload(content, 'ris');
      } else {
        alert('Unsupported file format. Please use .nbib or .ris');
      }
    };
    reader.readAsText(file);
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) return;
    const type = textInput.includes('ER  -') || textInput.includes('ER -') ? 'ris' : 'nbib';
    onUpload(textInput, type);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
            <button onClick={onBack} className="p-3 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 rounded-xl transition-all shadow-sm text-slate-500">
                <ArrowLeft size={20} />
            </button>
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Setup Project</h1>
                <p className="text-slate-500 font-medium">Active Profile: <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-sm">{profileName}</span></p>
            </div>
        </div>

        {hasSavedSession && (
          <div className="bg-white rounded-2xl shadow-lg shadow-indigo-100 border border-indigo-100 p-6 mb-8 flex items-center justify-between relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 to-blue-500"></div>
            <div className="pl-2">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                </span>
                Resume Session?
              </h3>
              <p className="text-slate-500 text-sm mt-1">You have unsaved progress available in this profile.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={onDeleteSession}
                className="flex items-center gap-2 px-4 py-2.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl font-semibold text-sm transition-colors"
              >
                <Trash2 size={18} /> Discard
              </button>
              <button 
                onClick={onContinue}
                className="cursor-pointer flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg shadow-indigo-200"
              >
                <Play size={18} fill="currentColor" /> Resume
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-1">
          <div className="p-8">
             <div 
               className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ease-in-out group ${dragActive ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}
               onDragEnter={handleDrag}
               onDragLeave={handleDrag}
               onDragOver={handleDrag}
               onDrop={handleDrop}
             >
                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept=".nbib,.ris" onChange={handleFileChange} />
                <div className="flex flex-col items-center pointer-events-none relative z-0">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors duration-300 ${dragActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
                        <Upload size={36} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Drag & Drop your file</h3>
                    <p className="text-slate-500 mb-6">Supports <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">.NBIB</span> and <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">.RIS</span> formats</p>
                    <span className="inline-block px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 shadow-sm group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">Browse Files</span>
                </div>
             </div>

             <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest"><span className="px-4 bg-white text-slate-400 font-bold">Or paste manually</span></div>
             </div>

             <div className="relative group">
                <div className="absolute top-4 left-4 text-slate-400 pointer-events-none group-focus-within:text-indigo-500 transition-colors">
                  <FileType size={20} />
                </div>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste raw content from your .nbib or .ris file here..."
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white outline-none text-sm font-mono h-32 resize-none transition-all text-slate-900 placeholder:text-slate-400"
                />
             </div>
             
             <button 
               onClick={handleTextSubmit}
               disabled={!textInput.trim()}
               className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-bold text-base hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
             >
               <FileText size={20} /> Process Text Data
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
