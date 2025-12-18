
import React, { useState } from 'react';
import { Upload, FileText, ArrowLeft, Trash2, Files, CheckCircle2, AlertCircle } from 'lucide-react';

interface UploadViewProps {
  profileName: string;
  onUploadMultiple: (files: {content: string, name: string, type: 'ris' | 'nbib'}[]) => void;
  onBack: () => void;
}

export const UploadView: React.FC<UploadViewProps> = ({ profileName, onUploadMultiple, onBack }) => {
  const [pendingFiles, setPendingFiles] = useState<{content: string, name: string, type: 'ris' | 'nbib'}[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = await Promise.all(Array.from(e.target.files).map((file: File) => {
        return new Promise<{content: string, name: string, type: 'ris' | 'nbib'}>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            resolve({
              content: ev.target?.result as string,
              name: file.name,
              type: file.name.endsWith('.ris') ? 'ris' : 'nbib'
            });
          };
          reader.readAsText(file);
        });
      }));
      setPendingFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleStartProcessing = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onUploadMultiple(pendingFiles);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 hover:text-indigo-600 transition-all"><ArrowLeft size={20}/></button>
            <div>
              <h1 className="text-3xl font-black text-slate-900">Import Studies</h1>
              <p className="text-slate-500 font-medium">Project: <span className="text-indigo-600 font-bold">{profileName}</span></p>
            </div>
          </div>
          <button 
            disabled={pendingFiles.length === 0 || isProcessing}
            onClick={handleStartProcessing}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 disabled:opacity-50 hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            {isProcessing ? 'Processing...' : 'Continue to Screening'}
            {!isProcessing && <CheckCircle2 size={20}/>}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div 
            className={`border-4 border-dashed rounded-[40px] p-12 flex flex-col items-center justify-center transition-all ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'}`}
          >
            <div className="h-24 w-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-6">
              <Upload size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Upload NBIB or RIS files</h3>
            <p className="text-slate-400 text-center text-sm font-medium mb-8">PubMed, Scopus, Cochrane, etc.</p>
            <input type="file" multiple accept=".nbib,.ris" onChange={handleFileChange} className="hidden" id="file-up" />
            <label htmlFor="file-up" className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold cursor-pointer hover:bg-slate-800 transition-all">Browse Files</label>
          </div>

          <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm flex flex-col">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Files size={14}/> Selected Files ({pendingFiles.length})</h3>
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              {pendingFiles.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                  <FileText size={48} strokeWidth={1} className="mb-2 opacity-20" />
                  <p className="text-sm font-bold">Waiting for files...</p>
                </div>
              ) : (
                pendingFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm font-black text-[10px]">
                        {f.type.toUpperCase()}
                      </div>
                      <span className="text-sm font-bold text-slate-700 truncate max-w-[180px]">{f.name}</span>
                    </div>
                    <button onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={18}/></button>
                  </div>
                ))
              )}
            </div>
            {pendingFiles.length > 0 && (
              <div className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
                <AlertCircle className="text-indigo-500" size={18}/>
                <p className="text-[10px] font-black uppercase text-indigo-700">Deduplication active: identical titles will be merged.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
