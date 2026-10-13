// === FICHIER : frontend/src/components/BookingTunnel.tsx ===
import { useState, useEffect, useMemo } from 'react';
import { API_URL, fetchAuth, searchWithAI } from '../services/api';

// Algorithme de Levenshtein pour calculer la distance entre deux mots (tolérance aux fautes)
const getLevenshteinDistance = (a: string, b: string) => {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
};

// Fonction de recherche floue améliorée pour supporter plusieurs mots
const fuzzyMatch = (text: string, search: string, maxDistance: number = 2) => {
  if (!search) return true;
  if (!text) return false;
  
  const normalizedText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normalizedSearch = search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (normalizedText.includes(normalizedSearch)) return true;

  const searchTerms = normalizedSearch.split(/\s+/);
  const textWords = normalizedText.split(/\s+/);

  // Vérifie que chaque mot tapé correspond (exactement ou avec faute) à un mot du texte
  return searchTerms.every(searchTerm =>
    textWords.some(word =>
      word.includes(searchTerm) || getLevenshteinDistance(word, searchTerm) <= maxDistance
    )
  );
};

export const BookingTunnel = () => {
  const [slots, setSlots] = useState<any[]>([]);
  const [mesReservations, setMesReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ongletActif, setOngletActif] = useState<'dispo' | 'mes_resa'>('dispo');

  // Menus déroulants stricts
  const [filtreDiscipline, setFiltreDiscipline] = useState('');
  const [filtreChercheur, setFiltreChercheur] = useState('');

  // Champs de recherche textuelle (Floue)
  const [searchNom, setSearchNom] = useState('');
  const [searchDiscipline, setSearchDiscipline] = useState('');

  // Assistant IA
  const [iaQuery, setIaQuery] = useState('');
  const [isIaLoading, setIsIaLoading] = useState(false);
  const [iaMessage, setIaMessage] = useState('');

  useEffect(() => {
    chargerToutesLesDonnees();
  }, []);

  const chargerToutesLesDonnees = async () => {
    setIsLoading(true);
    await Promise.all([chargerCreneaux(), chargerMesReservations()]);
    setIsLoading(false);
  };

  const chargerCreneaux = async () => {
    try {
      const res = await fetchAuth(`${API_URL}/timeslots/`);
      if (res.ok) setSlots(await res.json());
    } catch (err: any) {
      console.error(err);
    }
  };

  const chargerMesReservations = async () => {
    try {
      const res = await fetchAuth(`${API_URL}/appointments/`);
      if (res.ok) setMesReservations(await res.json());
    } catch (err: any) {
      console.error(err);
    }
  };

  const reserver = async (slotId: number) => {
    setError('');
    setSuccess('');
    try {
      const res = await fetchAuth(`${API_URL}/appointments/`, {
        method: 'POST',
        body: JSON.stringify({ time_slot: slotId, reason: 'Demande via portail' }),
      });
      if (!res.ok) throw new Error("Impossible de réserver ce créneau.");
      
      setSuccess('Créneau réservé avec succès !');
      await chargerToutesLesDonnees();
      setOngletActif('mes_resa');
      setTimeout(() => setSuccess(''), 3000); 
    } catch (err: any) {
      setError(err.message);
    }
  };

  const annulerReservation = async (resaId: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir annuler ce créneau ?")) return;
    setError('');
    try {
      const res = await fetchAuth(`${API_URL}/appointments/${resaId}/`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Erreur lors de l'annulation.");
      
      setSuccess('Réservation annulée. Un email a été envoyé.');
      await chargerToutesLesDonnees();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleIaSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!iaQuery.trim()) return;
    setIsIaLoading(true);
    setIaMessage('');
    setError('');
    try {
      const data = await searchWithAI(iaQuery);
      if (data.ia_analysis && data.ia_analysis.specialty) {
        setSearchDiscipline(data.ia_analysis.specialty);
        setIaMessage(`Filtre IA appliqué : ${data.ia_analysis.specialty}`);
      } else {
        setIaMessage("L'IA n'a pas détecté de spécialité précise.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsIaLoading(false);
    }
  };

  const getNomChercheur = (slot: any) => {
    return slot.expert?.user?.first_name || slot.expert?.first_name || `Chercheur N°${slot.expert?.id}`;
  };

  const disciplinesDisponibles = Array.from(new Set(slots.map(s => s.expert?.specialty))).filter(Boolean);
  const chercheursDisponibles = Array.from(new Set(slots.map(s => getNomChercheur(s)))).filter(Boolean);

  // Filtrage combiné (Menus déroulants + Recherche textuelle)
  const creneauxAffiches = useMemo(() => {
    const slotsFiltres = slots.filter(slot => {
      const nomChercheur = getNomChercheur(slot);
      const specialite = slot.expert?.specialty || "";
      
      // Filtres stricts (Menus déroulants)
      if (filtreDiscipline && specialite !== filtreDiscipline) return false;
      if (filtreChercheur && nomChercheur !== filtreChercheur) return false;

      // Filtres flous (Barres de recherche texte)
      if (searchNom && !fuzzyMatch(nomChercheur, searchNom)) return false;
      if (searchDiscipline && !fuzzyMatch(specialite, searchDiscipline)) return false;

      return true;
    });
    
    return slotsFiltres.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [slots, filtreDiscipline, filtreChercheur, searchNom, searchDiscipline]);

  if (isLoading) return <div>Chargement de votre espace...</div>;

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
        <button onClick={() => setOngletActif('dispo')} style={{ padding: '10px 20px', backgroundColor: ongletActif === 'dispo' ? '#61dafb' : '#333', color: ongletActif === 'dispo' ? '#000' : '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
          Nouvelle réservation
        </button>
        <button onClick={() => setOngletActif('mes_resa')} style={{ padding: '10px 20px', backgroundColor: ongletActif === 'mes_resa' ? '#61dafb' : '#333', color: ongletActif === 'mes_resa' ? '#000' : '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
          Mes réservations ({mesReservations.length})
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: '#ffdcdc', borderRadius: '5px' }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: '15px', padding: '10px', backgroundColor: '#d4edda', borderRadius: '5px' }}>{success}</div>}

      {ongletActif === 'dispo' && (
        <div>
          <h2>Réserver une ligne de lumière ou un expert</h2>
          
          {/* BARRE DE RECHERCHE IA */}
          <form onSubmit={handleIaSearch} style={{ display: 'flex', gap: '10px', marginBottom: '15px', padding: '15px', backgroundColor: '#1a1a2e', borderRadius: '8px', border: '1px solid #4d4dff' }}>
            <span style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center' }}>✨</span>
            <input type="text" placeholder="Recherche intelligente via l'IA Gemini..." value={iaQuery} onChange={(e) => setIaQuery(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#333', color: '#fff' }} />
            <button type="submit" disabled={isIaLoading} style={{ padding: '10px 20px', backgroundColor: '#4d4dff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: isIaLoading ? 'not-allowed' : 'pointer' }}>
              {isIaLoading ? 'Analyse...' : 'Demander à l\'IA'}
            </button>
          </form>
          {iaMessage && <p style={{ color: '#61dafb', margin: '0 0 20px 0', fontSize: '0.9em' }}>{iaMessage}</p>}

          {/* ZONE DE FILTRAGE COMBINÉE */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px', padding: '15px', backgroundColor: '#2c2c2c', borderRadius: '8px' }}>
            
            {/* Ligne 1 : Menus déroulants stricts */}
            <div style={{ display: 'flex', gap: '15px' }}>
              <select value={filtreDiscipline} onChange={(e) => setFiltreDiscipline(e.target.value)} style={{ padding: '8px', flex: 1, borderRadius: '4px', backgroundColor: '#333', color: '#fff', border: '1px solid #555' }}>
                <option value="">Toutes les disciplines (Filtre exact)</option>
                {disciplinesDisponibles.map(disc => <option key={String(disc)} value={String(disc)}>{String(disc)}</option>)}
              </select>
              <select value={filtreChercheur} onChange={(e) => setFiltreChercheur(e.target.value)} style={{ padding: '8px', flex: 1, borderRadius: '4px', backgroundColor: '#333', color: '#fff', border: '1px solid #555' }}>
                <option value="">Tous les experts (Filtre exact)</option>
                {chercheursDisponibles.map(chercheur => <option key={chercheur} value={chercheur}>{chercheur}</option>)}
              </select>
            </div>

            {/* Ligne 2 : Recherche libre (Floue) */}
            <div style={{ display: 'flex', gap: '15px' }}>
              <input 
                type="text" 
                placeholder="Recherche libre par discipline (ex: phisique)..." 
                value={searchDiscipline} 
                onChange={(e) => setSearchDiscipline(e.target.value)} 
                style={{ padding: '10px', flex: 1, borderRadius: '4px', border: '1px solid #555', backgroundColor: '#444', color: '#fff' }} 
              />
              <input 
                type="text" 
                placeholder="Recherche libre par expert (ex: dupont)..." 
                value={searchNom} 
                onChange={(e) => setSearchNom(e.target.value)} 
                style={{ padding: '10px', flex: 1, borderRadius: '4px', border: '1px solid #555', backgroundColor: '#444', color: '#fff' }} 
              />
              <button 
                onClick={() => { 
                  setFiltreDiscipline(''); 
                  setFiltreChercheur(''); 
                  setSearchDiscipline(''); 
                  setSearchNom(''); 
                  setIaQuery(''); 
                  setIaMessage(''); 
                }} 
                style={{ backgroundColor: '#6c757d', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Effacer tous les filtres
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {creneauxAffiches.length === 0 ? (
              <p>Aucun créneau disponible pour cette recherche.</p>
            ) : (
              creneauxAffiches.map(slot => (
                <div key={slot.id} style={{ border: '1px solid #444', padding: '15px', borderRadius: '8px', backgroundColor: '#1e1e1e' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#61dafb' }}>{getNomChercheur(slot)}</h3>
                  <p style={{ margin: '0 0 5px 0', fontSize: '0.9em', color: '#aaa' }}>{slot.expert?.specialty}</p>
                  <div style={{ margin: '15px 0', padding: '10px', backgroundColor: '#333', borderRadius: '4px' }}>
                    <p style={{ margin: 0 }}><strong>{new Date(slot.start_time).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</strong></p>
                    <p style={{ margin: 0 }}>{new Date(slot.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} à {new Date(slot.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <button onClick={() => reserver(slot.id)} style={{ width: '100%', backgroundColor: '#007bff', color: 'white', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Réserver ce créneau
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {ongletActif === 'mes_resa' && (
        <div>
          <h2>Vos réservations confirmées</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {mesReservations.length === 0 ? (
              <p>Vous n'avez aucune réservation à venir.</p>
            ) : (
              mesReservations.map(resa => (
                <div key={resa.id} style={{ border: '1px solid #28a745', padding: '15px', borderRadius: '8px', backgroundColor: '#1e1e1e' }}>
                  <div style={{ backgroundColor: '#28a745', color: 'white', padding: '5px', borderRadius: '3px', display: 'inline-block', marginBottom: '10px', fontSize: '0.8em' }}>Confirmé</div>
                  <h3 style={{ margin: '0 0 10px 0', color: '#61dafb' }}>Réservation N°{resa.id}</h3>
                  <div style={{ margin: '15px 0', padding: '10px', backgroundColor: '#333', borderRadius: '4px' }}>
                     <p style={{ margin: '0 0 5px 0' }}><strong>Expert :</strong> {resa.time_slot_details?.expert?.user?.first_name || resa.time_slot_details?.expert?.user?.last_name || 'Expert'}</p>
                     <p style={{ margin: '0 0 5px 0' }}><strong>Spécialité :</strong> {resa.time_slot_details?.expert?.specialty}</p>
                     <p style={{ margin: 0 }}><strong>Date :</strong> {new Date(resa.time_slot_details?.start_time).toLocaleDateString('fr-FR')} à {new Date(resa.time_slot_details?.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <button onClick={() => annulerReservation(resa.id)} style={{ width: '100%', backgroundColor: '#dc3545', color: 'white', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Annuler la réservation
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};