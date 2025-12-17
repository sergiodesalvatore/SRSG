import { Profile } from "../types";

const STORAGE_KEY = 'screeningProfiles';

export const getProfiles = (): Profile[] => {
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    return item ? JSON.parse(item) : [];
  } catch (error) {
    console.error("Failed to load profiles", error);
    return [];
  }
};

export const saveProfiles = (profiles: Profile[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch (error) {
    console.error("Failed to save profiles", error);
    throw new Error("Could not save to local storage");
  }
};

// Funzione helper per validare se il JSON importato è nel formato corretto
export const validateAndImportData = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    
    // Controllo base: deve essere un array
    if (!Array.isArray(data)) {
      return false;
    }

    // Controllo opzionale: verifica se gli oggetti hanno la forma di un profilo
    // Se l'array non è vuoto, controlliamo il primo elemento
    if (data.length > 0) {
      const sample = data[0];
      if (!('name' in sample) || !('createdAt' in sample)) {
        return false;
      }
    }

    // Se tutto ok, salviamo nel localStorage sovrascrivendo i dati attuali
    saveProfiles(data as Profile[]);
    return true;
  } catch (error) {
    console.error("Import failed", error);
    return false;
  }
};