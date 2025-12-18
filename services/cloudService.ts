
import { Profile } from "../types";

const SUPABASE_URL: string = "https://cumucxvvdbnglvaypipu.supabase.co"; 
const SUPABASE_KEY: string = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1bXVjeHZ2ZGJuZ2x2YXlwaXB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODE0MDQsImV4cCI6MjA4MTU1NzQwNH0.RegkRQfL0H9TMDdko1ri6SipV2a1zGTSrSlpRvWv3j8";

export const isCloudConfigured = () => SUPABASE_URL.length > 20 && SUPABASE_KEY.length > 50;

const getHeaders = (token?: string) => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${token || SUPABASE_KEY}`,
  'Content-Type': 'application/json'
});

export const signUp = async (email: string, pass: string) => {
  if (!isCloudConfigured()) return { error: { message: "Servizio Cloud non configurato." } };
  const cleanEmail = email.toLowerCase().trim();
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email: cleanEmail, password: pass })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || data.error?.message || "Errore registrazione");
    return data;
  } catch (e: any) {
    return { error: { message: e.message } };
  }
};

export const signIn = async (email: string, pass: string) => {
  if (!isCloudConfigured()) return { error: { message: "Servizio Cloud non configurato." } };
  const cleanEmail = email.toLowerCase().trim();
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email: cleanEmail, password: pass })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.error?.message || "Credenziali non valide.");
    if (data.access_token) {
      localStorage.setItem('srsg_token', data.access_token);
      localStorage.setItem('srsg_user', cleanEmail);
      localStorage.setItem('srsg_user_id', data.user.id);
    }
    return data;
  } catch (e: any) {
    return { error: { message: e.message } };
  }
};

export const fetchDataFromCloud = async (): Promise<Profile[] | null> => {
  const token = localStorage.getItem('srsg_token');
  const userId = localStorage.getItem('srsg_user_id');
  if (!token || !userId) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${userId}&select=data`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    if (!res.ok) return null;
    const result = await res.json();
    return result.length > 0 ? result[0].data : [];
  } catch (e) {
    return null;
  }
};

export const fetchSharedProjects = async (myEmail: string): Promise<Profile[]> => {
  const token = localStorage.getItem('srsg_token');
  if (!token || !myEmail) return [];
  const cleanMyEmail = myEmail.toLowerCase().trim();
  
  try {
    const myId = localStorage.getItem('srsg_user_id');
    // Chiediamo esplicitamente tutti i profili dove il JSON contiene l'email
    const res = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=id,data,email`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    
    if (!res.ok) {
        console.error("Fetch shared failed with status:", res.status);
        return [];
    }
    
    const allUsersData = await res.json();
    let shared: Profile[] = [];
    
    allUsersData.forEach((row: any) => {
      if (row.id === myId) return;

      const userProjects: Profile[] = Array.isArray(row.data) ? row.data : [];
      
      const foundInRow = userProjects.filter(p => {
        const assigned = p.settings?.assignedEmails || [];
        return assigned.some(email => email.toLowerCase().trim() === cleanMyEmail);
      }).map(p => ({
        ...p,
        isShared: true,
        ownerEmail: row.email || "Colleague"
      }));
      
      shared = [...shared, ...foundInRow];
    });
    
    return shared;
  } catch (e) {
    console.error("Critical Cloud Error:", e);
    return [];
  }
};

export const syncDataToCloud = async (profiles: Profile[]) => {
  const token = localStorage.getItem('srsg_token');
  const userId = localStorage.getItem('srsg_user_id');
  const email = localStorage.getItem('srsg_user');
  if (!token || !userId) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/user_profiles`, {
      method: 'POST',
      headers: { ...getHeaders(token), 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({ 
        id: userId, 
        email: email?.toLowerCase().trim(), 
        data: profiles, 
        updated_at: new Date().toISOString() 
      })
    });
  } catch (e) {
    console.error("Sync failed", e);
  }
};

export const updateSharedProjectOnCloud = async (ownerEmail: string, updatedProject: Profile) => {
  const token = localStorage.getItem('srsg_token');
  if (!token || !ownerEmail) return;
  try {
    // Cerchiamo l'ID dell'owner tramite la sua email
    const res = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?email=eq.${ownerEmail.toLowerCase().trim()}&select=id,data`, {
      method: 'GET',
      headers: getHeaders(token)
    });
    
    if (!res.ok) return;
    const result = await res.json();
    if (result.length === 0) return;

    const ownerId = result[0].id;
    const ownerData: Profile[] = Array.isArray(result[0].data) ? result[0].data : [];

    // Sostituiamo solo il progetto aggiornato nell'array dell'owner
    const updatedData = ownerData.map(p => p.name === updatedProject.name ? updatedProject : p);

    // Salviamo l'intero array aggiornato nella riga dell'owner
    await fetch(`${SUPABASE_URL}/rest/v1/user_profiles`, {
      method: 'POST',
      headers: { ...getHeaders(token), 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({ 
        id: ownerId, 
        data: updatedData, 
        updated_at: new Date().toISOString() 
      })
    });
  } catch (e) {
    console.error("Shared update failed", e);
  }
};

export const logout = () => {
  localStorage.removeItem('srsg_token');
  localStorage.removeItem('srsg_user');
  localStorage.removeItem('srsg_user_id');
};

export const resetPassword = async (email: string) => {
  if (!isCloudConfigured()) return { error: { message: "Cloud not configured." } };
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email: email.toLowerCase().trim() })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || data.error?.message || "Error");
    return data;
  } catch (e: any) {
    return { error: { message: e.message } };
  }
};

export const updateUserPassword = async (password: string, token: string) => {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || data.error?.message || "Error");
    return data;
  } catch (e: any) {
    return { error: { message: e.message } };
  }
};
