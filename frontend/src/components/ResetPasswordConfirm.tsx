// === FICHIER : frontend/src/components/ResetPasswordConfirm.tsx ===
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { confirmPasswordReset } from '../services/api';

export const ResetPasswordConfirm = () => {
  // Récupération des codes secrets depuis l'URL dynamique
  const { uid, token } = useParams<{ uid: string, token: string }>();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    
    if (!uid || !token) {
      setError('Lien de réinitialisation invalide ou expiré.');
      return;
    }

    try {
      await confirmPasswordReset(uid, token, password);
      setSuccess('Votre mot de passe a été modifié avec succès ! Redirection en cours...');
      setTimeout(() => navigate('/'), 3000); // Retour à l'accueil après 3s
    } catch (err: any) {
      setError(err.message);
    }
  };

  const inputStyle = { padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: '#fff', width: '100%', boxSizing: 'border-box' as const };
  const buttonStyle = { position: 'absolute' as const, right: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', top: '50%', transform: 'translateY(-50%)' };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px', border: '1px solid #444', borderRadius: '8px', backgroundColor: '#1e1e1e' }}>
      <h2>Nouveau mot de passe</h2>
      
      {error && <p style={{ color: '#ff6b6b', backgroundColor: '#331a1a', padding: '10px', borderRadius: '4px' }}>{error}</p>}
      {success && <p style={{ color: '#51cf66', backgroundColor: '#18331e', padding: '10px', borderRadius: '4px' }}>{success}</p>}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <input 
            type={showPassword ? "text" : "password"} 
            placeholder="Nouveau mot de passe" required
            autoComplete="new-password"
            value={password} onChange={(e) => setPassword(e.target.value)} 
            style={inputStyle}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} style={buttonStyle}>
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>

        <div style={{ position: 'relative', width: '100%' }}>
          <input 
            type={showConfirmPassword ? "text" : "password"} 
            placeholder="Confirmer le nouveau mot de passe" required
            autoComplete="new-password"
            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} 
            style={inputStyle}
          />
          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={buttonStyle}>
            {showConfirmPassword ? '🙈' : '👁️'}
          </button>
        </div>
        
        <button type="submit" style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
          Enregistrer le mot de passe
        </button>
      </form>
    </div>
  );
};