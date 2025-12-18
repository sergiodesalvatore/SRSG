
import React, { useState, useEffect } from 'react';
import { Profile, ProjectSettings, Session, Selections } from './types';
import { getProfiles, saveProfiles } from './services/storageService';
import { syncDataToCloud, fetchDataFromCloud, logout as cloudLogout } from './services/cloudService';
import { ProfileSelector } from './components/ProfileSelector';
import { ScreeningInterface } from './components/ScreeningInterface';
import { UploadView } from './components/UploadView';
import { Auth } from './components/Auth';
import { processUploads } from './services/parserService';

export default function App() {
  const [user, setUser] = useState<string | null>(localStorage.getItem('srsg_user'));
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfileName, setCurrentProfileName] = useState<string | null>(null);
  const [view, setView] = useState<'profile' | 'upload' | 'screening'>('profile');
  const [loading, setLoading] = useState(true);
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.replace('#', '?'));
      const token = params.get('access_token');
      const type = params.get('type');
      if (token && type === 'recovery') {
        setRecoveryToken(token);
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  const refreshData = async () => {
    try {
      const token = localStorage.getItem('srsg_token');
      if (!token) {
        setProfiles([]);
        setLoading(false);
        return;
      }
      
      const cloudData = await fetchDataFromCloud();
      if (cloudData) {
        setProfiles(cloudData);
        saveProfiles(cloudData);
      } else {
        const local = getProfiles();
        setProfiles(local);
      }
    } catch (err) {
      console.error("Refresh error:", err);
      setProfiles(getProfiles());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleLoginSuccess = (email: string) => {
    setLoading(true);
    setUser(email);
  };

  const handleLogout = () => {
    setLoading(true);
    cloudLogout();
    setProfiles([]);
    setCurrentProfileName(null);
    setView('profile');
    setUser(null);
    setTimeout(() => setLoading(false), 500);
  };

  const handleDeleteProfile = (name: string) => {
    if (!window.confirm(`Sei sicuro di voler eliminare il progetto "${name}"? L'azione è irreversibile.`)) return;
    
    // Create the updated list first
    const updatedProfiles = profiles.filter(p => p.name !== name);
    
    // Update state
    setProfiles(updatedProfiles);
    
    // Persist changes
    saveProfiles(updatedProfiles);
    syncDataToCloud(updatedProfiles);

    if (currentProfileName === name) {
      setCurrentProfileName(null);
      setView('profile');
    }
  };

  const currentProfile = profiles.find(p => p.name === currentProfileName);

  if (!user || recoveryToken) {
    return (
      <Auth 
        onLoginSuccess={handleLoginSuccess} 
        recoveryToken={recoveryToken}
        initialMode={recoveryToken ? 'update' : 'login'}
      />
    );
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-black text-slate-900 uppercase tracking-widest text-[10px]">Accessing Database...</p>
    </div>
  );

  if (view === 'profile') return (
    <ProfileSelector 
      profiles={profiles} 
      onSelect={(name) => {
        setCurrentProfileName(name);
        const p = profiles.find(pr => pr.name === name);
        setView(p?.session?.articles?.length ? 'screening' : 'upload');
      }} 
      onCreate={(name, settings) => {
        const newProfile: Profile = { name, createdAt: new Date().toLocaleDateString(), settings, session: null };
        const updated = [...profiles, newProfile];
        setProfiles(updated);
        saveProfiles(updated);
        syncDataToCloud(updated);
        setCurrentProfileName(name);
        setView('upload');
      }} 
      onDelete={handleDeleteProfile}
      onImportSuccess={refreshData}
      onLogout={handleLogout}
    />
  );
  
  if (view === 'upload' && currentProfile) return (
    <UploadView 
      profileName={currentProfile.name}
      onUploadMultiple={(files) => {
        const { articles, duplicates } = processUploads(files, currentProfile.session?.articles || []);
        const newSession: Session = {
          articles, currentIndex: 0, selections: currentProfile.session?.selections || {},
          timestamp: new Date().toISOString(), duplicatesCount: duplicates
        };
        const updatedProfiles = profiles.map(p => p.name === currentProfile.name ? { ...p, session: newSession } : p);
        setProfiles(updatedProfiles);
        saveProfiles(updatedProfiles);
        syncDataToCloud(updatedProfiles);
        setView('screening');
      }}
      onBack={() => setView('profile')}
    />
  );

  const handleScreeningSave = (idx: number, sels: Selections, updatedSettings?: ProjectSettings) => {
    if (!currentProfile) return;
    const updatedProfiles = profiles.map(p => {
      if (p.name === currentProfile.name) {
        return { 
          ...p, 
          settings: updatedSettings || p.settings,
          session: { ...p.session!, currentIndex: idx, selections: sels } 
        };
      }
      return p;
    });
    setProfiles(updatedProfiles);
    saveProfiles(updatedProfiles);
    syncDataToCloud(updatedProfiles);
  };

  if (view === 'screening' && currentProfile?.session) return (
    <ScreeningInterface 
      articles={currentProfile.session.articles} 
      initialIndex={currentProfile.session.currentIndex} 
      initialSelections={currentProfile.session.selections}
      profileName={currentProfile.name}
      settings={currentProfile.settings}
      onSave={handleScreeningSave}
      onExit={() => setView('profile')}
    />
  );

  return null;
}
