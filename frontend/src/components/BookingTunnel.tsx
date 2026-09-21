// === FICHIER : frontend/src/components/BookingTunnel.tsx ===
import { useState, useEffect, useMemo } from 'react';
import { API_URL, fetchAuth, searchWithAI } from '../services/api';

export const BookingTunnel = () => {
  const [slots, setSlots] = useState<any[]>([]);
  const [mesReservations, setMesReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Gestion des onglets
  const [ongletActif, setOngletActif] = useState<'dispo' | 'mes_resa'>('dispo');

  const [filtreDiscipline, setFiltreDiscipline] = useState('');
  const [filtreChercheur, setFiltreChercheur] = useState('');

  // NOUVEAUX STATES POUR L'IA
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
      await chargerToutesLesDonnees(); // Met à jour les deux listes
      setOngletActif('mes_resa'); // Redirection vers mes réservations
      
      // Fait disparaître le message de succès après 3 secondes
      setTimeout(() => setSuccess(''), 3000); 
    } catch (err: any) {
      setError(err.message);
    }
  };

  const annulerReservation = async (resaId: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir annuler ce créneau ? Un email de confirmation vous sera envoyé.")) return;
    
    setError('');
    try {
      const res = await fetchAuth(`${API_URL}/appointments/${resaId}/`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Erreur lors de l'annulation.");
      
      setSuccess('Réservation annulée. Un email a été envoyé.');
      await chargerToutesLesDonnees(); // Remet le créneau dans les disponibilités
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // NOUVELLE FONCTION : Soumettre la requête à l'IA
  const handleIaSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!iaQuery.trim()) return;
    
    setIsIaLoading(true);
    setIaMessage('');
    setError('');

    try {
      const data = await searchWithAI(iaQuery);
      
      // Si l'IA a détecté une spécialité, on l'applique automatiquement au filtre
      if (data.ia_analysis && data.ia_analysis.specialty) {
        const spec = data.ia_analysis.specialty.charAt(0).toUpperCase() + data.ia_analysis.specialty.slice(1);
        setFiltreDiscipline(spec);
        setIaMessage(`Filtre IA appliqué : ${spec}`);
      } else {
        setIaMessage("L'IA n'a pas détecté de spécialité précise dans votre demande.");
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

  const creneauxAffiches = useMemo(() => {
    return slots
      .filter(slot => {
        // On remplace l'égalité stricte (!==) par une recherche d'inclusion tolérante
        if (filtreDiscipline && !slot.expert?.specialty?.toLowerCase().includes(filtreDiscipline.toLowerCase())) {
            return false;
        }
        if (filtreChercheur && getNomChercheur(slot) !== filtreChercheur) {
            return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [slots, filtreDiscipline, filtreChercheur]);

  if (isLoading) return <div>Chargement de votre espace...</div>;

  return (
    <div style={{ marginTop: '20px' }}>
      
      {/* Navigation des onglets */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
        <button 
          onClick={() => setOngletActif('dispo')}
          style={{ padding: '10px 20px', backgroundColor: ongletActif === 'dispo' ? '#61dafb' : '#333', color: ongletActif === 'dispo' ? '#000' : '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Nouvelle réservation
        </button>
        <button 
          onClick={() => setOngletActif('mes_resa')}
          style={{ padding: '10px 20px', backgroundColor: ongletActif === 'mes_resa' ? '#61dafb' : '#333', color: ongletActif === 'mes_resa' ? '#000' : '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Mes réservations ({mesReservations.length})
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: '#ffdcdc', borderRadius: '5px' }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: '15px', padding: '10px', backgroundColor: '#d4edda', borderRadius: '5px' }}>{success}</div>}

      {/* ONGLET : DISPONIBILITÉS */}
      {ongletActif === 'dispo' && (
        <div>
          <h2>Réserver une ligne de lumière ou un expert</h2>
          
          {/* BARRE DE RECHERCHE IA */}
          <form onSubmit={handleIaSearch} style={{ display: 'flex', gap: '10px', marginBottom: '15px', padding: '15px', backgroundColor: '#1a1a2e', borderRadius: '8px', border: '1px solid #4d4dff' }}>
            <span style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center' }}>✨</span>
            <input 
              type="text" 
              placeholder="Ex: Je cherche un spécialiste en Cristallographie..." 
              value={iaQuery}
              onChange={(e) => setIaQuery(e.target.value)}
              style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#333', color: '#fff' }}
            />
            <button 
              type="submit" 
              disabled={isIaLoading}
              style={{ padding: '10px 20px', backgroundColor: '#4d4dff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: isIaLoading ? 'not-allowed' : 'pointer' }}
            >
              {isIaLoading ? 'Analyse...' : 'Demander à l\'IA'}
            </button>
          </form>
          {iaMessage && <p style={{ color: '#61dafb', margin: '0 0 20px 0', fontSize: '0.9em' }}>{iaMessage}</p>}

          <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', padding: '15px', backgroundColor: '#2c2c2c', borderRadius: '8px' }}>
            <select value={filtreDiscipline} onChange={(e) => setFiltreDiscipline(e.target.value)} style={{ padding: '8px', flex: 1, borderRadius: '4px' }}>
              <option value="">Toutes les disciplines</option>
              {disciplinesDisponibles.map(disc => <option key={String(disc)} value={String(disc)}>{String(disc)}</option>)}
            </select>
            <select value={filtreChercheur} onChange={(e) => setFiltreChercheur(e.target.value)} style={{ padding: '8px', flex: 1, borderRadius: '4px' }}>
              <option value="">Tous les experts</option>
              {chercheursDisponibles.map(chercheur => <option key={chercheur} value={chercheur}>{chercheur}</option>)}
            </select>
            <button 
              onClick={() => { 
                setFiltreDiscipline(''); 
                setFiltreChercheur(''); 
                setIaQuery(''); 
                setIaMessage(''); 
              }} 
              style={{ backgroundColor: '#6c757d', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Réinitialiser
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {creneauxAffiches.length === 0 ? (
              <p>Aucun créneau disponible.</p>
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

      {/* ONGLET : MES RÉSERVATIONS */}
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
                     <p style={{ margin: 0 }}>ID du Créneau: {resa.time_slot}</p>
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