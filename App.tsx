
import React, { useState, useEffect } from 'react';
import { Profile, Article, Selections } from './types';
import { getProfiles, saveProfiles } from './services/storageService';
import { syncDataToCloud, fetchDataFromCloud } from './services/cloudService';
import { parseNBIB, parseRIS } from './services/parserService';
import { ProfileSelector } from './components/ProfileSelector';
import { UploadView } from './components/UploadView';
import { ScreeningInterface } from './components/ScreeningInterface';

type AppView = 'profile' | 'upload' | 'screening';

export default function App() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [view, setView] = useState<AppView>('profile');
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selections, setSelections] = useState<Selections>({});

  // Caricamento iniziale
  useEffect(() => {
    const loadData = async () => {
      // Carica prima i dati locali per velocità
      const localData = getProfiles();
      setProfiles(localData);

      // Se loggato, prova a scaricare dal cloud
      if (localStorage.getItem('srsg_token')) {
        setIsLoadingCloud(true);
        const cloudData = await fetchDataFromCloud();
        if (cloudData) {
          saveProfiles(cloudData);
          setProfiles(cloudData);
        }
        setIsLoadingCloud(false);
      }
    };
    loadData();
  }, []);

  const handleCreateProfile = async (name: string) => {
    if (profiles.some(p => p.name === name)) {
      alert('Il progetto esiste già');
      return;
    }
    const newProfile: Profile = {
      name,
      createdAt: new Date().toLocaleDateString(),
      session: null
    };
    const updatedProfiles = [...profiles, newProfile];
    saveProfiles(updatedProfiles);
    setProfiles(updatedProfiles);
    setCurrentProfile(newProfile);
    setView('upload');
    
    // Sync immediato al cloud se loggato
    if (localStorage.getItem('srsg_token')) {
      await syncDataToCloud(updatedProfiles);
    }
  };

  const handleSelectProfile = (name: string) => {
    const profile = profiles.find(p => p.name === name);
    if (profile) {
      setCurrentProfile(profile);
      setView('upload');
    }
  };

  const handleProfilesRefresh = () => {
    setProfiles(getProfiles());
  };

  const handleUpload = (content: string, type: 'nbib' | 'ris') => {
    try {
      let parsedArticles: Article[] = [];
      if (type === 'nbib') parsedArticles = parseNBIB(content);
      if (type === 'ris') parsedArticles = parseRIS(content);
      if (parsedArticles.length === 0) return alert('Nessun articolo trovato nel file');

      setArticles(parsedArticles);
      setSelections({});
      setCurrentIndex(0);
      setView('screening');
    } catch (e) { alert('Errore durante la lettura del file'); }
  };

  const handleContinueSession = () => {
    if (currentProfile?.session) {
      setArticles(currentProfile.session.articles);
      setCurrentIndex(currentProfile.session.currentIndex);
      setSelections(currentProfile.session.selections);
      setView('screening');
    }
  };

  const handleSaveSession = async (idx: number, sels: Selections) => {
    if (!currentProfile) return;
    const updatedProfile: Profile = {
      ...currentProfile,
      session: {
        articles,
        currentIndex: idx,
        selections: sels,
        timestamp: new Date().toISOString()
      }
    };
    
    const updatedProfiles = profiles.map(p => p.name === updatedProfile.name ? updatedProfile : p);
    saveProfiles(updatedProfiles);
    setProfiles(updatedProfiles);
    setCurrentProfile(updatedProfile);
    setCurrentIndex(idx);
    setSelections(sels);

    if (localStorage.getItem('srsg_token')) {
      await syncDataToCloud(updatedProfiles);
    }
  };

  const handleDeleteSession = async () => {
    if (!currentProfile) return;
    const updatedProfile = { ...currentProfile, session: null };
    const updatedProfiles = profiles.map(p => p.name === updatedProfile.name ? updatedProfile : p);
    saveProfiles(updatedProfiles);
    setProfiles(updatedProfiles);
    setCurrentProfile(updatedProfile);
    
    if (localStorage.getItem('srsg_token')) {
      await syncDataToCloud(updatedProfiles);
    }
  };

  if (view === 'profile') return (
    <ProfileSelector 
      profiles={profiles} 
      onCreate={handleCreateProfile} 
      onSelect={handleSelectProfile} 
      onImportSuccess={handleProfilesRefresh} 
    />
  );
  
  if (view === 'upload' && currentProfile) return (
    <UploadView 
      profileName={currentProfile.name} 
      hasSavedSession={!!currentProfile.session} 
      onUpload={handleUpload} 
      onContinue={handleContinueSession} 
      onDeleteSession={handleDeleteSession} 
      onBack={() => { setArticles([]); setSelections({}); setCurrentProfile(null); setView('profile'); }}
    />
  );

  if (view === 'screening' && currentProfile) return (
    <ScreeningInterface 
      articles={articles} 
      initialIndex={currentIndex} 
      initialSelections={selections} 
      profileName={currentProfile.name} 
      onSave={handleSaveSession} 
      onExit={() => { setArticles([]); setSelections({}); setCurrentProfile(null); setView('profile'); }}
    />
  );

  return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Caricamento in corso...</div>;
}
