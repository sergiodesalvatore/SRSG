
import React, { useState, useEffect } from 'react';
import { Profile, ProjectSettings, Session, Selections } from './types';
import { getProfiles, saveProfiles } from './services/storageService';
import { syncDataToCloud, fetchDataFromCloud, logout as cloudLogout, fetchSharedProjects, updateSharedProjectOnCloud } from './services/cloudService';
import { ProfileSelector } from './components/ProfileSelector';
import { ScreeningInterface } from './components/ScreeningInterface';
import { UploadView } from './components/UploadView';
import { Auth } from './components/Auth';
import { processUploads } from './services/parserService';

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
      saveProfiles(ownData || []);
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

  const handleDeleteProfile = async (name: string) => {
    const profToDelete = profiles.find(p => p.name === name);
    if (!profToDelete) return;

    if (profToDelete.isShared) {
      alert("You cannot delete a shared project. Only the owner can do that.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${name}"? This will permanently remove it from the cloud database.`)) return;
    
    // 1. Filtra localmente i progetti di proprietà (escludendo quelli condivisi che non vanno risalvati nel nostro 'data' di Supabase)
    const ownedProfiles = profiles.filter(p => !p.isShared && p.name !== name);
    
    // 2. Aggiorna lo stato UI subito per feedback istantaneo
    const nextUiProfiles = profiles.filter(p => p.name !== name);
    setProfiles(nextUiProfiles);

    // 3. Sincronizza col cloud inviando l'array aggiornato (senza il progetto cancellato)
    try {
      setLoading(true);
      await syncDataToCloud(ownedProfiles);
      saveProfiles(ownedProfiles);
      console.log("Sync success after deletion");
      // Forza un ricaricamento completo per essere sicuri
      await refreshData();
    } catch (err) {
      alert("Error syncing deletion to Cloud. Please check your Supabase table has a Primary Key on 'id'.");
      // Se fallisce, ripristina lo stato precedente
      await refreshData();
    } finally {
      setLoading(false);
    }

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
      <p className="font-black text-slate-900 uppercase tracking-widest text-[10px]">Updating Database...</p>
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
      onCreate={async (name, settings) => {
        const newProfile: AppProfile = { name, createdAt: new Date().toLocaleDateString(), settings, session: null };
        const myOwn = profiles.filter(p => !p.isShared);
        const updated = [...myOwn, newProfile];
        
        try {
          setLoading(true);
          await syncDataToCloud(updated);
          setProfiles(prev => [...prev, newProfile]);
          saveProfiles(updated);
          setCurrentProfileName(name);
          setView('upload');
        } catch (e) {
          alert("Could not create project on cloud. Please check connection.");
        } finally {
          setLoading(false);
        }
      }} 
      onDelete={handleDeleteProfile}
      onImportSuccess={refreshData}
      onLogout={handleLogout}
    />
  );
  
  if (view === 'upload' && currentProfile) return (
    <UploadView 
      profileName={currentProfile.name}
      onUploadMultiple={async (files) => {
        const { articles, duplicates } = processUploads(files, currentProfile.session?.articles || []);
        const newSession: Session = {
          articles, currentIndex: 0, selections: currentProfile.session?.selections || {},
          timestamp: new Date().toISOString(), duplicatesCount: duplicates
        };
        const updatedProfile = { ...currentProfile, session: newSession };
        
        try {
          setLoading(true);
          if (currentProfile.isShared && currentProfile.ownerEmail) {
            await updateSharedProjectOnCloud(currentProfile.ownerEmail, updatedProfile);
            await refreshData();
          } else {
            const myOwn = profiles.filter(p => !p.isShared).map(p => p.name === currentProfile.name ? updatedProfile : p);
            await syncDataToCloud(myOwn);
            setProfiles(prev => prev.map(p => p.name === currentProfile.name ? updatedProfile : p));
            saveProfiles(myOwn);
          }
          setView('screening');
        } catch (e) {
          alert("Upload failed. Try again.");
        } finally {
          setLoading(false);
        }
      }}
      onBack={() => setView('profile')}
    />
  );

  const handleScreeningSave = async (idx: number, sels: Selections, updatedSettings?: ProjectSettings) => {
    if (!currentProfile) return;
    const updatedProfile = { 
      ...currentProfile, 
      settings: updatedSettings || currentProfile.settings,
      session: { ...currentProfile.session!, currentIndex: idx, selections: sels } 
    };

    try {
      if (currentProfile.isShared && currentProfile.ownerEmail) {
        await updateSharedProjectOnCloud(currentProfile.ownerEmail, updatedProfile);
        // Non facciamo refresh per non interrompere lo screening
      } else {
        const myOwn = profiles.filter(p => !p.isShared).map(p => p.name === currentProfile.name ? updatedProfile : p);
        await syncDataToCloud(myOwn);
        setProfiles(prev => prev.map(p => p.name === currentProfile.name ? updatedProfile : p));
        saveProfiles(myOwn);
      }
    } catch (e) {
      console.error("Autosave failed");
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
