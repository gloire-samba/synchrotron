// === FICHIER : frontend/src/components/Profile.test.tsx ===
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Profile } from './Profile';
import { BrowserRouter } from 'react-router-dom';
import * as api from '../services/api';
import '@testing-library/jest-dom';

// Simulation des appels API
jest.mock('../services/api', () => ({
  API_URL: 'http://localhost:8000/api',
  fetchAuth: jest.fn(),
  updateProfile: jest.fn(),
  changePassword: jest.fn(),
  deleteAccount: jest.fn(),
  logoutUser: jest.fn(),
}));

describe('Composant Profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('affiche les informations utilisateur au chargement', async () => {
    (api.fetchAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ first_name: 'Marie', last_name: 'Curie', email: 'marie.curie@soleil.fr' }),
    } as unknown as Response);

    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    // On vérifie que le front-end place bien les données API dans les champs
    await waitFor(() => {
      expect(screen.getByDisplayValue('Marie')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Curie')).toBeInTheDocument();
      expect(screen.getByDisplayValue('marie.curie@soleil.fr')).toBeInTheDocument();
    });
  });

  it('bloque la soumission si les mots de passe ne correspondent pas', async () => {
    (api.fetchAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ first_name: '', last_name: '', email: '' }),
    } as unknown as Response);

    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    const passwordInput = screen.getByPlaceholderText('Nouveau mot de passe');
    const confirmInput = screen.getByPlaceholderText('Confirmer le nouveau mot de passe');
    const submitBtn = screen.getByRole('button', { name: 'Modifier le mot de passe' });

    // On tape deux mots de passe différents
    fireEvent.change(passwordInput, { target: { value: 'Soleil2026!' } });
    fireEvent.change(confirmInput, { target: { value: 'Erreur2026!' } });
    fireEvent.click(submitBtn);

    // On vérifie le message d'erreur et que l'API n'a pas été appelée
    expect(await screen.findByText('Les mots de passe ne correspondent pas.')).toBeInTheDocument();
    expect(api.changePassword).not.toHaveBeenCalled();
  });
});