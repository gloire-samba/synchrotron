// === FICHIER : frontend/src/services/api.ts ===
import type { Expert, TimeSlot } from '../types';

export const API_URL = 'http://localhost:8000/api';

// Fonction utilitaire pour inclure les cookies par défaut
export const fetchAuth = async (url: string, options: RequestInit = {}) => {
  return fetch(url, {
    ...options,
    credentials: 'include', // INDISPENSABLE pour que React envoie le cookie JWT à Django
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
};

// --- AUTHENTIFICATION ---
export const login = async (email: string, password: string) => {
  const res = await fetchAuth(`${API_URL}/auth/login/`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Identifiants incorrects');
  return res.json();
};

export const register = async (email: string, password1: string, password2: string) => {
  const res = await fetch(`${API_URL}/auth/registration/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
        email: email,
        password1: password1, 
        password2: password2 
    }),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Refusé : ${JSON.stringify(errorData)}`);
  }
  return res.json();
};

export const getUser = async () => {
  const res = await fetchAuth(`${API_URL}/auth/user/`);
  if (!res.ok) throw new Error('Non connecté');
  return res.json();
};

// --- DONNÉES MÉTIER ---
export const fetchExperts = async (): Promise<Expert[]> => {
  const res = await fetchAuth(`${API_URL}/experts/`);
  return res.json();
};

export const fetchTimeSlots = async (expertId: number): Promise<TimeSlot[]> => {
  const res = await fetchAuth(`${API_URL}/timeslots/`);
  const allSlots: TimeSlot[] = await res.json();
  return allSlots.filter(slot => slot.expert === expertId);
};

export const searchWithAI = async (query: string) => {
  const res = await fetchAuth(`${API_URL}/ia/assistant/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  
  if (!res.ok) {
    throw new Error("L'assistant IA est actuellement indisponible.");
  }
  return res.json();
};

export const bookAppointment = async (timeSlotId: number, reason: string) => {
  const res = await fetchAuth(`${API_URL}/appointments/`, {
    method: 'POST',
    body: JSON.stringify({ 
      time_slot: timeSlotId, // format objet attendu par certains serializers
      time_slot_id: timeSlotId, // format ID brut
      reason: reason 
    }),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Erreur ${res.status}: ${JSON.stringify(errorData)}`);
  }
  return res.json();
};

export const loginSocial = async (provider: string, code: string) => {
  const res = await fetchAuth(`${API_URL}/auth/${provider}/`, {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Erreur ${provider}: ${JSON.stringify(errorData)}`);
  }
  return res.json();
};

export const logoutUser = async () => {
  const res = await fetchAuth(`${API_URL}/auth/logout/`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error('Erreur lors de la déconnexion');
  }
  return res.json();
};

export const resetPassword = async (email: string) => {
  const res = await fetch(`${API_URL}/auth/password/reset/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.detail || 'Erreur lors de la réinitialisation.');
  }
  return res.json();
};

export const confirmPasswordReset = async (uid: string, token: string, password: string) => {
  const res = await fetch(`${API_URL}/auth/password/reset/confirm/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      uid, 
      token, 
      new_password1: password, 
      new_password2: password 
    }),
  });
  
  if (!res.ok) {
    const data = await res.json();
    throw new Error(`Erreur : ${JSON.stringify(data)}`);
  }
  return res.json();
};

export const updateProfile = async (data: { first_name: string; last_name: string }) => {
  const res = await fetchAuth(`${API_URL}/auth/user/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erreur lors de la mise à jour du profil.");
  return res.json();
};

export const changePassword = async (new_password1: string, new_password2: string) => {
  const res = await fetchAuth(`${API_URL}/auth/password/change/`, {
    method: 'POST',
    body: JSON.stringify({ new_password1, new_password2 }),
  });
  if (!res.ok) throw new Error("Erreur lors du changement de mot de passe. Assurez-vous qu'il soit assez complexe.");
  return res.json();
};

export const deleteAccount = async () => {
  const res = await fetchAuth(`${API_URL}/profile/delete/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error("Erreur lors de la suppression du compte.");
  return;
};