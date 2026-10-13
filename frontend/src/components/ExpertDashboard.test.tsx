// === FICHIER : frontend/src/components/ExpertDashboard.test.tsx ===
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ExpertDashboard } from './ExpertDashboard';
import { BrowserRouter } from 'react-router-dom';
import * as api from '../services/api';
import '@testing-library/jest-dom';

// Mock de l'API pour ne pas faire de vraies requêtes
jest.mock('../services/api', () => ({
  getExpertSlots: jest.fn(),
  createExpertSlot: jest.fn(),
  deleteExpertSlot: jest.fn(),
}));

describe('Composant ExpertDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.getExpertSlots as jest.Mock).mockResolvedValue([]);
  });

  it('bloque la soumission si la date de fin est dans le passé par rapport au début', async () => {
    // 1. On enveloppe le rendu initial dans "act" pour gérer le fetch asynchrone du démarrage
    await act(async () => {
      render(
        <BrowserRouter>
          <ExpertDashboard />
        </BrowserRouter>
      );
    });

    // 2. On s'assure que le chargement est bien terminé en cherchant le titre principal
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Tableau de bord Expert' })).toBeInTheDocument();
    });

    // 3. On récupère directement les champs par leur type HTML natif (sans utiliser les rôles ARIA stricts)
    const inputDateDebut = document.querySelectorAll('input[type="date"]')[0];
    const inputHeureDebut = document.querySelectorAll('input[type="time"]')[0];
    const inputDateFin = document.querySelectorAll('input[type="date"]')[1];
    const inputHeureFin = document.querySelectorAll('input[type="time"]')[1];

    // 4. On enveloppe les interactions utilisateur dans "act"
    await act(async () => {
      fireEvent.change(inputDateDebut, { target: { value: '2026-10-15' } });
      fireEvent.change(inputHeureDebut, { target: { value: '08:00' } });
      fireEvent.change(inputDateFin, { target: { value: '2026-10-10' } });
      fireEvent.change(inputHeureFin, { target: { value: '18:00' } });
      
      const submitBtn = screen.getByRole('button', { name: 'Ajouter ce créneau' });
      fireEvent.click(submitBtn);
    });

    // 5. On valide que le message d'erreur d'incohérence temporelle est bien affiché
    expect(await screen.findByText("La date/heure de fin doit être après le début.")).toBeInTheDocument();
    
    // 6. On valide que l'API n'a pas été déclenchée pour envoyer une requête impossible
    expect(api.createExpertSlot).not.toHaveBeenCalled();
  });
});