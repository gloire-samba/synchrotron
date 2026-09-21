// === FICHIER : frontend/src/types/index.ts ===

// [Entête] Interfaces pour les modèles de données de l'API
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface Expert {
  id: number;
  user: User;
  specialty: string;
  description: string;
}

export interface TimeSlot {
  id: number;
  expert: number;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

// Ces interfaces TypeScript permettent de s'assurer que les données manipulées côté front-end correspondent strictement à ce que l'API Django renvoie. Cela évite les erreurs de propriétés non définies à l'exécution.