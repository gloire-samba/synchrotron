// === FICHIER : frontend/src/components/Profile.tsx ===
import { useState, useEffect } from 'react';
import { API_URL, fetchAuth, updateProfile, changePassword, deleteAccount, logoutUser } from '../services/api';
import { useNavigate } from 'react-router-dom';

export const Profile = () => {
  const navigate = useNavigate();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Messages séparés pour chaque section
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchAuth(`${API_URL}/auth/user/`)
      .then(res => res.json())
      .then(data => {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setEmail(data.email || '');
      })
      .catch(() => {
        setProfileMsg({ text: "Erreur lors du chargement du profil", type: "error" });
      });
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({ first_name: firstName, last_name: lastName });
      setProfileMsg({ text: "Profil mis à jour avec succès.", type: "success" });
      setTimeout(() => setProfileMsg({ text: '', type: '' }), 4000);
    } catch (err: any) {
      setProfileMsg({ text: err.message, type: "error" });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setPasswordMsg({ text: "Les mots de passe ne correspondent pas.", type: "error" });
      return;
    }
    try {
      await changePassword(password, confirmPassword);
      setPasswordMsg({ text: "Mot de passe modifié avec succès.", type: "success" });
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg({ text: '', type: '' }), 4000);
    } catch (err: any) {
      setPasswordMsg({ text: err.message, type: "error" });
    }
  };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm("ATTENTION : Cette action est irréversible. Toutes vos réservations seront annulées et supprimées. Confirmez-vous ?");
    if (!confirm) return;
    
    try {
      await deleteAccount();
      await logoutUser();
      window.location.href = '/';
    } catch (err: any) {
      alert("Erreur lors de la suppression : " + err.message);
    }
  };

  const inputStyle = { padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: '#fff', width: '100%', boxSizing: 'border-box' as const, marginBottom: '15px' };
  const sectionStyle = { backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', border: '1px solid #444', marginBottom: '20px' };
  const eyeBtnStyle = { position: 'absolute' as const, right: '10px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Mon Profil</h2>
        <button onClick={() => navigate('/')} style={{ padding: '8px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Retour aux réservations
        </button>
      </div>

      {/* SECTION 1 : INFOS PERSONNELLES */}
      <div style={sectionStyle}>
        <h3>Informations Personnelles</h3>
        <form onSubmit={handleUpdateProfile}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Adresse E-mail (Non modifiable)</label>
          <input type="email" value={email} disabled style={{ ...inputStyle, backgroundColor: '#222', color: '#888' }} />
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Prénom</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Nom</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} />
            </div>
          </div>

          {profileMsg.text && (
            <div style={{ padding: '10px', marginBottom: '15px', borderRadius: '4px', color: profileMsg.type === 'success' ? '#51cf66' : '#ff6b6b', backgroundColor: profileMsg.type === 'success' ? '#18331e' : '#331a1a' }}>
              {profileMsg.text}
            </div>
          )}

          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Enregistrer les modifications
          </button>
        </form>
      </div>

      {/* SECTION 2 : MOT DE PASSE */}
      <div style={sectionStyle}>
        <h3>Changer de mot de passe</h3>
        <form onSubmit={handleChangePassword}>
          
          <div style={{ position: 'relative' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Nouveau mot de passe" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              style={{ ...inputStyle, paddingRight: '40px' }} 
              required 
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={eyeBtnStyle}>
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Confirmer le nouveau mot de passe" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              style={{ ...inputStyle, paddingRight: '40px' }} 
              required 
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={eyeBtnStyle}>
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          {passwordMsg.text && (
            <div style={{ padding: '10px', marginBottom: '15px', borderRadius: '4px', color: passwordMsg.type === 'success' ? '#51cf66' : '#ff6b6b', backgroundColor: passwordMsg.type === 'success' ? '#18331e' : '#331a1a' }}>
              {passwordMsg.text}
            </div>
          )}

          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Modifier le mot de passe
          </button>
        </form>
      </div>

      {/* SECTION 3 : RGPD / SUPPRESSION */}
      <div style={{ ...sectionStyle, borderColor: '#dc3545' }}>
        <h3 style={{ color: '#ff6b6b', marginTop: 0 }}>Zone de Danger (RGPD)</h3>
        <p style={{ fontSize: '0.9em', color: '#ccc' }}>La suppression de votre compte entraînera l'effacement immédiat et définitif de vos données personnelles et l'annulation de toutes vos réservations à venir.</p>
        <button onClick={handleDeleteAccount} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Supprimer mon compte définitivement
        </button>
      </div>
    </div>
  );
};