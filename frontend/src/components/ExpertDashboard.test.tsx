// === FICHIER : frontend/src/components/ExpertDashboard.test.tsx ===
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    render(
      <BrowserRouter>
        <ExpertDashboard />
      </BrowserRouter>
    );

    // On récupère tous les champs <input> (0: Date Début, 1: Heure Début, 2: Date Fin, 3: Heure Fin)
    const inputs = screen.getAllByRole('textbox', { hidden: true }) || document.querySelectorAll('input');
    
    const inputDateDebut = document.querySelectorAll('input[type="date"]')[0];
    const inputHeureDebut = document.querySelectorAll('input[type="time"]')[0];
    const inputDateFin = document.querySelectorAll('input[type="date"]')[1];
    const inputHeureFin = document.querySelectorAll('input[type="time"]')[1];

    // On simule une erreur humaine : Fin le 10/10/2026, mais Début le 15/10/2026
    fireEvent.change(inputDateDebut, { target: { value: '2026-10-15' } });
    fireEvent.change(inputHeureDebut, { target: { value: '08:00' } });
    fireEvent.change(inputDateFin, { target: { value: '2026-10-10' } });
    fireEvent.change(inputHeureFin, { target: { value: '18:00' } });

    // On clique sur le bouton d'ajout
    const submitBtn = screen.getByRole('button', { name: 'Ajouter ce créneau' });
    fireEvent.click(submitBtn);

    // L'erreur doit s'afficher et l'API ne doit PAS être appelée
    expect(await screen.findByText("La date/heure de fin doit être après le début.")).toBeInTheDocument();
    expect(api.createExpertSlot).not.toHaveBeenCalled();
  });
});