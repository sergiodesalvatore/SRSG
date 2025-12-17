
import { Profile } from "../types";

// --- CONFIGURAZIONE SUPABASE ---
const SUPABASE_URL: string = "https://cumucxvvdbnglvaypipu.supabase.co"; 
const SUPABASE_KEY: string = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1bXVjeHZ2ZGJuZ2x2YXlwaXB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODE0MDQsImV4cCI6MjA4MTU1NzQwNH0.RegkRQfL0H9TMDdko1ri6SipV2a1zGTSrSlpRvWv3j8";
// -------------------------------

export const isCloudConfigured = () => SUPABASE_URL.length > 20 && SUPABASE_KEY.length > 50;

const getHeaders = (token?: string) => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${token || SUPABASE_KEY}`,
  'Content-Type': 'application/json'
});

export const signUp = async (email: string, pass: string) => {
  if (!isCloudConfigured()) return { error: { message: "Supabase non configurato correttamente nelle costanti." } };
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password: pass })
  });
  return res.json();
};

export const signIn = async (email: string, pass: string) => {
  if (!isCloudConfigured()) return { error: { message: "Supabase non configurato." } };
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password: pass })
    });
    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('srsg_token', data.access_token);
      localStorage.setItem('srsg_user', email);
      localStorage.setItem('srsg_user_id', data.user.id);
    }
    return data;
  } catch (e) {
    return { error: { message: "Errore di rete o URL Supabase errato." } };
  }
};

export const syncDataToCloud = async (profiles: Profile[]): Promise<boolean> => {
  const token = localStorage.getItem('srsg_token');
  const userId = localStorage.getItem('srsg_user_id');
  const email = localStorage.getItem('srsg_user');
  
  if (!token || !userId || !isCloudConfigured()) return false;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles`, {
      method: 'POST',
      headers: { 
        ...getHeaders(token), 
        'Prefer': 'resolution=merge-duplicates' 
      },
      body: JSON.stringify({ 
        id: userId,
        email: email,
        data: profiles,
        updated_at: new Date().toISOString()
      })
    });
    return res.ok;
  } catch (e) {
    console.error("Sync error", e);
    return false;
  }
};

export const fetchDataFromCloud = async (): Promise<Profile[] | null> => {
  const token = localStorage.getItem('srsg_token');
  const userId = localStorage.getItem('srsg_user_id');
  if (!token || !userId || !isCloudConfigured()) return null;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${userId}&select=data`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    if (!res.ok) return null;
    const result = await res.json();
    return result.length > 0 ? result[0].data : null;
  } catch (e) {
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem('srsg_token');
  localStorage.removeItem('srsg_user');
  localStorage.removeItem('srsg_user_id');
};
