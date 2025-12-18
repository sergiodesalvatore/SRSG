
import React, { useState, useEffect } from 'react';
import { signIn, signUp, resetPassword, updateUserPassword } from '../services/cloudService';
import { Microscope, ArrowRight, AlertCircle, Info, Mail, Lock, BookOpen, ShieldCheck } from 'lucide-react';

interface AuthProps {
  onLoginSuccess: (email: string) => void;
  initialMode?: 'login' | 'signup' | 'reset' | 'update';
  recoveryToken?: string | null;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess, initialMode = 'login', recoveryToken }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset' | 'update'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (recoveryToken && mode !== 'update') {
      setMode('update');
      setInfo("Recovery token detected. Please enter your new password.");
    }
  }, [recoveryToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      if (mode === 'signup') {
        const result = await signUp(email, password);
        if (result.error) setError(result.error.message);
        else {
          setInfo("Account created! Please verify your email before logging in.");
          setMode('login');
        }
      } else if (mode === 'login') {
        const result = await signIn(email, password);
        if (result.error) setError(result.error.message);
        else onLoginSuccess(email);
      } else if (mode === 'reset') {
        const result = await resetPassword(email);
        if (result.error) setError(result.error.message);
        else setInfo("A recovery link has been sent to your email.");
      } else if (mode === 'update' && recoveryToken) {
        const result = await updateUserPassword(password, recoveryToken);
        if (result.error) setError(result.error.message);
        else {
          setInfo("Password updated! You can now log in.");
          setMode('login');
        }
      }
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden">
      <div className="hidden md:flex md:w-1/2 bg-indigo-800 relative p-12 lg:p-20 flex-col justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1532187863486-abf91ad1b099?auto=format&fit=crop&q=80" 
            alt="Scientific Lab Research" 
            className="w-full h-full object-cover mix-blend-multiply"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-indigo-900/90 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="h-16 w-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white mb-10 border border-white/20 shadow-2xl">
            <Microscope size={32} />
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight mb-8">
            Scientific Screening <br/>
            <span className="text-indigo-300">Simplified.</span>
          </h1>
          
          <p className="text-xl text-white/80 font-medium leading-relaxed max-w-md">
            Welcome to <span className="text-white font-bold">Screeny</span>. The professional standard for systematic reviews and evidence management.
          </p>
          
          <div className="mt-12 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-indigo-400" size={20} />
              <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Secure Sync</span>
            </div>
            <div className="h-1 w-1 bg-white/20 rounded-full"></div>
            <div className="flex items-center gap-2">
              <BookOpen className="text-indigo-400" size={20} />
              <span className="text-xs font-bold text-white/60 uppercase tracking-widest">SRSG Standard</span>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-12 left-12 lg:left-20 z-10">
          <p className="text-indigo-300/60 font-black uppercase text-[10px] tracking-[0.4em]">
            Developed by <span className="text-white">SRSG</span>
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-8 md:p-12 lg:p-24 bg-white">
        <div className="w-full max-w-[400px] space-y-10 animate-in fade-in slide-in-from-right-4 duration-700">
          
          <div className="flex flex-col items-center mb-10">
             <div className="h-14 w-14 bg-indigo-700 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-100">
                <Microscope size={28} />
             </div>
             <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Screeny</h2>
          </div>

          <div className="space-y-8">
            {(mode === 'login' || mode === 'signup') && (
              <div className="bg-slate-50 p-1.5 rounded-2xl flex border border-slate-100 shadow-sm">
                <button 
                  onClick={() => { setMode('login'); setError(null); }}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${mode === 'login' ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Sign In
                </button>
                <button 
                  onClick={() => { setMode('signup'); setError(null); }}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${mode === 'signup' ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Create Account
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-shake shadow-sm">
                  <AlertCircle size={18} className="shrink-0" />
                  <p className="text-[13px] font-bold">{error}</p>
                </div>
              )}

              {info && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 shadow-sm">
                  <Info size={18} className="shrink-0" />
                  <p className="text-[13px] font-bold">{info}</p>
                </div>
              )}

              {mode !== 'update' && (
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Research Email</label>
                  <div className="relative group">
                    <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                      type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="name@university.edu"
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-700 outline-none font-semibold text-slate-900 transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>
              )}

              {mode !== 'reset' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                    {mode === 'login' && (
                      <button type="button" onClick={() => setMode('reset')} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800">Forgot password?</button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                      type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-700 outline-none font-semibold text-slate-900 transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>
              )}

              <button 
                disabled={loading} type="submit"
                className="w-full py-4.5 bg-indigo-700 text-white rounded-2xl font-black text-[15px] shadow-2xl shadow-indigo-200 flex items-center justify-center gap-3 hover:bg-indigo-800 hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
                  <><span>{mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Get Started' : mode === 'reset' ? 'Send Link' : 'Confirm Password'}</span><ArrowRight size={20} /></>
                )}
              </button>
            </form>

            <div className="text-center pt-4">
              {mode === 'login' ? (
                <p className="text-[14px] font-medium text-slate-500">New to Screeny? <button onClick={() => setMode('signup')} className="text-indigo-700 font-bold hover:underline">Join Research Team</button></p>
              ) : (
                <button type="button" onClick={() => setMode('login')} className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-700 transition-colors">Back to Sign In</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
