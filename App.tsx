
import React, { useState, useEffect } from 'react';
import { Profile, ProjectSettings, Session, Selections } from './types';
import { getProfiles, saveProfiles } from './services/storageService';
import { syncDataToCloud, fetchDataFromCloud, logout as cloudLogout, fetchSharedProjects, updateSharedProjectOnCloud } from './services/cloudService';
import { ProfileSelector } from './components/ProfileSelector';
import { ScreeningInterface } from './components/ScreeningInterface';
import { UploadView } from './components/UploadView';
import { Auth } from './components/Auth';
import { processUploads } from './services/parserService';

// Estendiamo il tipo Profile localmente per gestire metadati cloud
interface AppProfile extends Profile {
  isShared?: boolean;
  ownerEmail?: string;
}

export default function App() {
  const [user, setUser] = useState<string | null>(localStorage.getItem('srsg_user'));
  const [profiles, setProfiles] = useState<AppProfile[]>([]);
  const [currentProfileName, setCurrentProfileName] = useState<string | null>(null);
  const [view, setView] = useState<'profile' | 'upload' | 'screening'>('profile');
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    try {
      const token = localStorage.getItem('srsg_token');
      const email = localStorage.getItem('srsg_user');
      if (!token || !email) {
        setProfiles([]);
        setLoading(false);
        return;
      }
      
      const [ownData, sharedData] = await Promise.all([
        fetchDataFromCloud(),
        fetchSharedProjects(email)
      ]);

      const combined: AppProfile[] = [
        ...(ownData || []),
        ...(sharedData || [])
      ];

      setProfiles(combined);
      saveProfiles(ownData || []); // Salviamo localmente solo i propri per ora
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
    const prof = profiles.find(p => p.name === name);
    if (prof?.isShared) {
      alert("Non puoi eliminare un progetto condiviso da altri. Contatta il proprietario.");
      return;
    }

    if (!window.confirm(`Sei sicuro di voler eliminare il progetto "${name}"? L'azione è irreversibile.`)) return;
    
    const updatedProfiles = profiles.filter(p => p.name !== name && !p.isShared);
    setProfiles(prev => prev.filter(p => p.name !== name));
    saveProfiles(updatedProfiles);
    syncDataToCloud(updatedProfiles);

    if (currentProfileName === name) {
      setCurrentProfileName(null);
      setView('profile');
    }
  };

  const currentProfile = profiles.find(p => p.name === currentProfileName);

  if (!user) return <Auth onLoginSuccess={handleLoginSuccess} />;

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
        const newProfile: AppProfile = { name, createdAt: new Date().toLocaleDateString(), settings, session: null };
        const myOwn = profiles.filter(p => !p.isShared);
        const updated = [...myOwn, newProfile];
        setProfiles(prev => [...prev, newProfile]);
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
        const updatedProfile = { ...currentProfile, session: newSession };
        
        // Se è condiviso, dobbiamo aggiornare l'owner, altrimenti noi stessi
        if (currentProfile.isShared && currentProfile.ownerEmail) {
          updateSharedProjectOnCloud(currentProfile.ownerEmail, updatedProfile).then(() => refreshData());
        } else {
          const myOwn = profiles.filter(p => !p.isShared).map(p => p.name === currentProfile.name ? updatedProfile : p);
          setProfiles(prev => prev.map(p => p.name === currentProfile.name ? updatedProfile : p));
          saveProfiles(myOwn);
          syncDataToCloud(myOwn);
        }
        setView('screening');
      }}
      onBack={() => setView('profile')}
    />
  );

  const handleScreeningSave = (idx: number, sels: Selections, updatedSettings?: ProjectSettings) => {
    if (!currentProfile) return;
    const updatedProfile = { 
      ...currentProfile, 
      settings: updatedSettings || currentProfile.settings,
      session: { ...currentProfile.session!, currentIndex: idx, selections: sels } 
    };

    if (currentProfile.isShared && currentProfile.ownerEmail) {
      updateSharedProjectOnCloud(currentProfile.ownerEmail, updatedProfile).then(() => refreshData());
    } else {
      const myOwn = profiles.filter(p => !p.isShared).map(p => p.name === currentProfile.name ? updatedProfile : p);
      setProfiles(prev => prev.map(p => p.name === currentProfile.name ? updatedProfile : p));
      saveProfiles(myOwn);
      syncDataToCloud(myOwn);
    }
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
