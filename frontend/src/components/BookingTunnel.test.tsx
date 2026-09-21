// === FICHIER : frontend/src/components/BookingTunnel.test.tsx ===
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BookingTunnel } from './BookingTunnel';
import * as api from '../services/api';

// 1. Simulation (Mock) du fichier API avec l'objet global 'jest'
jest.mock('../services/api', () => ({
  API_URL: 'http://localhost:8000/api',
  fetchAuth: jest.fn(),
}));

const mockCreneaux = [
  {
    id: 1,
    start_time: '2026-10-21T10:00:00Z',
    end_time: '2026-10-21T12:00:00Z',
    expert: { id: 10, specialty: 'Physique des matériaux', user: { first_name: 'Dr. Curium' } }
  },
  {
    id: 2,
    start_time: '2026-10-22T14:00:00Z',
    end_time: '2026-10-22T16:00:00Z',
    expert: { id: 11, specialty: 'Cristallographie', user: { first_name: 'Dr. Bragg' } }
  }
];

describe('Composant BookingTunnel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('affiche le message de chargement au démarrage', () => {
    (api.fetchAuth as jest.Mock).mockReturnValue(new Promise(() => {}));
    
    render(<BookingTunnel />);
    expect(screen.getByText(/Chargement de votre espace/i)).toBeInTheDocument();
  });

  it('affiche la liste des créneaux après le chargement', async () => {
    (api.fetchAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockCreneaux,
    } as unknown as Response);

    render(<BookingTunnel />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dr. Curium' })).toBeInTheDocument();
    });
    
    expect(screen.getByRole('heading', { name: 'Dr. Bragg' })).toBeInTheDocument();
    
    // CORRECTION : On utilise getAllByText et on valide que le premier élément trouvé est bien dans le DOM
    expect(screen.getAllByText('Physique des matériaux')[0]).toBeInTheDocument();
  });

  it('filtre les créneaux par spécialité', async () => {
    (api.fetchAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockCreneaux,
    } as unknown as Response);

    render(<BookingTunnel />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dr. Curium' })).toBeInTheDocument();
    });

    const selectDiscipline = screen.getAllByRole('combobox')[0];
    fireEvent.change(selectDiscipline, { target: { value: 'Cristallographie' } });

    // Dr. Bragg doit toujours être là
    expect(screen.getByRole('heading', { name: 'Dr. Bragg' })).toBeInTheDocument();
    
    // Dr. Curium ne doit plus être dans les titres
    expect(screen.queryByRole('heading', { name: 'Dr. Curium' })).not.toBeInTheDocument();
  });
});