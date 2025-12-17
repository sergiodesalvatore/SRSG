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