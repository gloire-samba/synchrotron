// === FICHIER : frontend/src/components/ExpertDashboard.tsx ===
import { useState, useEffect } from 'react';
import { getExpertSlots, createExpertSlot, deleteExpertSlot } from '../services/api';
import { useNavigate } from 'react-router-dom';

export const ExpertDashboard = () => {
  const navigate = useNavigate();
  const [slots, setSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // États pour le formulaire de création (Gestion Multi-jours incluse)
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    chargerCreneaux();
  }, []);

  const chargerCreneaux = async () => {
    try {
      const data = await getExpertSlots();
      setSlots(data);
    } catch (err: any) {
      setError(err.message || "Accès refusé ou session expirée. Veuillez vous reconnecter.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const startIso = new Date(`${startDate}T${startTime}`).toISOString();
    const endIso = new Date(`${endDate}T${endTime}`).toISOString();

    if (new Date(startIso) >= new Date(endIso)) {
      setError("La date/heure de fin doit être après le début.");
      return;
    }

    try {
      await createExpertSlot(startIso, endIso);
      setSuccess("Créneau ouvert avec succès !");
      await chargerCreneaux();
      setStartDate(''); setStartTime(''); setEndDate(''); setEndTime('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteSlot = async (id: number) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce créneau ? S'il est réservé, un email d'annulation sera envoyé au patient.")) return;
    try {
      await deleteExpertSlot(id);
      setSuccess("Créneau supprimé avec succès.");
      await chargerCreneaux();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message + " (Si vous étiez inactif, veuillez vous reconnecter)");
    }
  };

  if (isLoading) return <div>Chargement de l'espace expert...</div>;

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Tableau de bord Expert</h2>
        <button onClick={() => navigate('/')} style={{ padding: '8px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Retour au portail
        </button>
      </div>

      {error && <div style={{ color: '#ff6b6b', backgroundColor: '#331a1a', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{error}</div>}
      {success && <div style={{ color: '#51cf66', backgroundColor: '#18331e', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{success}</div>}

      <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', border: '1px solid #444', marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0, color: '#61dafb' }}>Ouvrir une nouvelle disponibilité</h3>
        <form onSubmit={handleCreateSlot} style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Date de début</label>
              <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: '#fff', width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Heure de début</label>
              <input type="time" required value={startTime} onChange={e => setStartTime(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: '#fff', width: '100%', boxSizing: 'border-box' }} />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Date de fin</label>
              <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: '#fff', width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Heure de fin</label>
              <input type="time" required value={endTime} onChange={e => setEndTime(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: '#fff', width: '100%', boxSizing: 'border-box' }} />
            </div>
          </div>
          
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Ajouter ce créneau
          </button>
        </form>
      </div>

      <h3>Mes créneaux planifiés</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {slots.length === 0 ? (
          <p>Vous n'avez aucun créneau planifié.</p>
        ) : (
          slots.map(slot => (
            <div key={slot.id} style={{ border: `1px solid ${slot.is_booked ? '#dc3545' : '#28a745'}`, padding: '15px', borderRadius: '8px', backgroundColor: '#1e1e1e' }}>
              
              <div style={{ backgroundColor: slot.is_booked ? '#dc3545' : '#28a745', color: 'white', padding: '5px', borderRadius: '3px', display: 'inline-block', marginBottom: '10px', fontSize: '0.8em' }}>
                {slot.is_booked ? 'Réservé' : 'Libre'}
              </div>
              
              <p style={{ margin: '0 0 5px 0' }}>
                <strong>Début :</strong> {new Date(slot.start_time).toLocaleDateString('fr-FR')} à {new Date(slot.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p style={{ margin: '0 0 15px 0' }}>
                <strong>Fin :</strong> {new Date(slot.end_time).toLocaleDateString('fr-FR')} à {new Date(slot.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>

              {/* ENCART INFORMATIONS DU PATIENT */}
              {slot.is_booked ? (
                <div style={{ padding: '10px', backgroundColor: '#333', borderRadius: '4px', borderLeft: '4px solid #61dafb', marginBottom: '15px' }}>
                  <p style={{ margin: '0 0 5px 0', color: '#61dafb', fontSize: '0.9em' }}><strong>Patient :</strong> {slot.patient_info?.name}</p>
                  <p style={{ margin: 0, fontSize: '0.8em', color: '#aaa' }}>📧 {slot.patient_info?.email}</p>
                </div>
              ) : (
                <p style={{ margin: '0 0 15px 0', color: '#aaa', fontStyle: 'italic', fontSize: '0.9em' }}>Aucune réservation pour le moment.</p>
              )}

              <button onClick={() => handleDeleteSlot(slot.id)} style={{ width: '100%', backgroundColor: '#dc3545', color: 'white', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Supprimer le créneau
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};