
import React, { useState, useEffect } from 'react';
import { signIn, signUp, resetPassword, updateUserPassword } from '../services/cloudService';
import { Microscope, LogIn, UserPlus, ArrowRight, AlertCircle, Info, Lock } from 'lucide-react';

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
          setInfo("Account created! Please confirm your email before logging in.");
          setMode('login');
        }
      } else if (mode === 'login') {
        const result = await signIn(email, password);
        if (result.error) setError(result.error.message);
        else onLoginSuccess(email);
      } else if (mode === 'reset') {
        const result = await resetPassword(email);
        if (result.error) setError(result.error.message);
        else setInfo("Recovery link sent to your email.");
      } else if (mode === 'update' && recoveryToken) {
        const result = await updateUserPassword(password, recoveryToken);
        if (result.error) setError(result.error.message);
        else {
          setInfo("Password updated successfully! You can now log in.");
          setMode('login');
        }
      }
    } catch (err: any) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-10">
          <div className="inline-flex h-20 w-20 items-center justify-center bg-indigo-600 rounded-[28px] shadow-2xl shadow-indigo-200 text-white mb-6">
            <Microscope size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
            Screenie <span className="text-indigo-600">Pro</span>
          </h1>
          <p className="text-slate-400 font-black mt-1 uppercase text-[10px] tracking-[0.3em]">
            by <span className="text-indigo-500">SRSG</span>
          </p>
        </div>

        <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 p-8 border border-slate-100">
          {(mode === 'login' || mode === 'signup') && (
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
              <button 
                onClick={() => { setMode('login'); setError(null); }}
                className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${mode === 'login' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                LOGIN
              </button>
              <button 
                onClick={() => { setMode('signup'); setError(null); }}
                className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${mode === 'signup' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                SIGN UP
              </button>
            </div>
          )}

          {mode === 'reset' && (
            <div className="mb-6 text-center">
               <h2 className="text-xl font-black text-slate-900">Reset Password</h2>
               <p className="text-xs font-medium text-slate-400 mt-1">You will receive a reset link via email.</p>
            </div>
          )}

          {mode === 'update' && (
            <div className="mb-6 text-center">
               <h2 className="text-xl font-black text-slate-900">New Password</h2>
               <p className="text-xs font-medium text-slate-400 mt-1">Update your access credentials.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-600 animate-shake">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p className="text-xs font-bold leading-tight">{error}</p>
              </div>
            )}

            {info && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 text-emerald-600">
                <Info size={18} className="mt-0.5 shrink-0" />
                <p className="text-xs font-bold leading-tight">{info}</p>
              </div>
            )}

            {mode !== 'update' && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Academic Email</label>
                <input 
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="name@university.com"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-slate-900"
                />
              </div>
            )}

            {mode !== 'reset' && (
              <div>
                <div className="flex justify-between items-center mb-2 px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {mode === 'update' ? 'New Password' : 'Password'}
                  </label>
                  {(mode === 'login' || mode === 'signup') && (
                    <button 
                      type="button" onClick={() => setMode('reset')}
                      className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input 
                    type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-slate-900"
                  />
                  <Lock size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                </div>
              </div>
            )}

            <button 
              disabled={loading} type="submit"
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {mode === 'login' ? 'Enter Dashboard' : mode === 'signup' ? 'Create Account' : mode === 'reset' ? 'Send Link' : 'Update Password'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {(mode === 'reset' || mode === 'update') && (
              <button 
                type="button" onClick={() => setMode('login')}
                className="w-full text-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
              >
                Back to Login
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
