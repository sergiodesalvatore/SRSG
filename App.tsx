import React, { useState, useEffect } from 'react';
import { Profile, Article, Selections } from './types';
import { getProfiles, saveProfiles } from './services/storageService';
import { parseNBIB, parseRIS } from './services/parserService';
import { ProfileSelector } from './components/ProfileSelector';
import { UploadView } from './components/UploadView';
import { ScreeningInterface } from './components/ScreeningInterface';

type AppView = 'profile' | 'upload' | 'screening';

export default function App() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [view, setView] = useState<AppView>('profile');
  
  // Session State
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selections, setSelections] = useState<Selections>({});

  useEffect(() => {
    setProfiles(getProfiles());
  }, []);

  const handleCreateProfile = (name: string) => {
    if (profiles.some(p => p.name === name)) {
      alert('Profile already exists');
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
  };

  const handleSelectProfile = (name: string) => {
    const profile = profiles.find(p => p.name === name);
    if (profile) {
      setCurrentProfile(profile);
      setView('upload');
    }
  };

  const handleUpload = (content: string, type: 'nbib' | 'ris') => {
    try {
      let parsedArticles: Article[] = [];
      if (type === 'nbib') parsedArticles = parseNBIB(content);
      if (type === 'ris') parsedArticles = parseRIS(content);

      if (parsedArticles.length === 0) {
        alert('No articles found in file.');
        return;
      }

      setArticles(parsedArticles);
      setSelections({});
      setCurrentIndex(0);
      setView('screening');
    } catch (error) {
      console.error(error);
      alert('Error parsing file.');
    }
  };

  const handleContinueSession = () => {
    if (currentProfile?.session) {
      setArticles(currentProfile.session.articles);
      setCurrentIndex(currentProfile.session.currentIndex);
      setSelections(currentProfile.session.selections);
      setView('screening');
    }
  };

  const handleDeleteSession = () => {
    if (!currentProfile) return;
    const updatedProfile = { ...currentProfile, session: null };
    updateProfile(updatedProfile);
  };

  const handleSaveSession = (idx: number, sels: Selections) => {
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
    updateProfile(updatedProfile);
    
    // Update local state to match saved state
    setCurrentIndex(idx);
    setSelections(sels);
  };

  const updateProfile = (updatedProfile: Profile) => {
    const updatedProfiles = profiles.map(p => 
      p.name === updatedProfile.name ? updatedProfile : p
    );
    saveProfiles(updatedProfiles);
    setProfiles(updatedProfiles);
    setCurrentProfile(updatedProfile);
  };

  const handleExit = () => {
    setArticles([]);
    setSelections({});
    setCurrentIndex(0);
    setCurrentProfile(null);
    setView('profile');
  };

  const handleBackToProfile = () => {
    setCurrentProfile(null);
    setView('profile');
  };

  // Render logic
  if (view === 'profile') {
    return (
      <ProfileSelector 
        profiles={profiles} 
        onCreate={handleCreateProfile} 
        onSelect={handleSelectProfile} 
      />
    );
  }

  if (view === 'upload' && currentProfile) {
    return (
      <UploadView 
        profileName={currentProfile.name}
        hasSavedSession={!!currentProfile.session}
        onUpload={handleUpload}
        onContinue={handleContinueSession}
        onDeleteSession={handleDeleteSession}
        onBack={handleBackToProfile}
      />
    );
  }

  if (view === 'screening' && currentProfile) {
    return (
      <ScreeningInterface 
        articles={articles}
        initialIndex={currentIndex}
        initialSelections={selections}
        profileName={currentProfile.name}
        onSave={handleSaveSession}
        onExit={handleExit}
      />
    );
  }

  return <div>Loading...</div>;
}