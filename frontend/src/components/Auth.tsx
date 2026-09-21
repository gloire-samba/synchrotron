// === FICHIER : frontend/src/components/Auth.tsx ===
import { useState } from 'react';
import { login, register, resetPassword } from '../services/api';

export const Auth = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      if (mode === 'login') {
        await login(email, password);
        onLoginSuccess();
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('Les mots de passe ne correspondent pas.');
          return;
        }
        await register(email, password, confirmPassword);
        onLoginSuccess();
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccess('Un email de réinitialisation vous a été envoyé si cette adresse existe.');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Harmonisation absolue de tous les champs
  const inputStyle = { padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#333', color: '#fff', width: '100%', boxSizing: 'border-box' as const };
  const buttonStyle = { position: 'absolute' as const, right: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', top: '50%', transform: 'translateY(-50%)' };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px', border: '1px solid #444', borderRadius: '8px', backgroundColor: '#1e1e1e' }}>
      <h2>
        {mode === 'login' && 'Connexion'}
        {mode === 'register' && 'Créer un compte'}
        {mode === 'forgot' && 'Mot de passe oublié'}
      </h2>
      
      {error && <p style={{ color: '#ff6b6b', backgroundColor: '#331a1a', padding: '10px', borderRadius: '4px' }}>{error}</p>}
      {success && <p style={{ color: '#51cf66', backgroundColor: '#18331e', padding: '10px', borderRadius: '4px' }}>{success}</p>}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
            <input 
              type="email" 
              placeholder="Adresse email" 
              required
              autoComplete="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              style={inputStyle}
            />
        </div>
        
        {mode !== 'forgot' && (
          <div style={{ position: 'relative', width: '100%' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Mot de passe" 
              required
              autoComplete="new-password"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              style={inputStyle}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={buttonStyle}>
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        )}

        {mode === 'register' && (
          <div style={{ position: 'relative', width: '100%' }}>
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              placeholder="Confirmer le mot de passe" 
              required
              autoComplete="new-password"
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              style={inputStyle}
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={buttonStyle}>
              {showConfirmPassword ? '🙈' : '👁️'}
            </button>
          </div>
        )}
        
        <button type="submit" style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
          {mode === 'login' && 'Se connecter'}
          {mode === 'register' && 'S\'inscrire'}
          {mode === 'forgot' && 'Envoyer le lien'}
        </button>
      </form>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
        {mode === 'login' && (
          <>
            <button onClick={() => setMode('forgot')} style={{ background: 'none', border: 'none', color: '#61dafb', cursor: 'pointer', textAlign: 'left', padding: 0 }}>Mot de passe oublié ?</button>
            <button onClick={() => setMode('register')} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', textAlign: 'left', padding: 0 }}>Pas encore de compte ? S'inscrire</button>
          </>
        )}
        {mode !== 'login' && (
          <button onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', textAlign: 'left', padding: 0 }}>Retour à la connexion</button>
        )}
      </div>

      <hr style={{ margin: '20px 0', borderColor: '#444' }} />
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <a href={`https://accounts.google.com/o/oauth2/v2/auth?client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID}&redirect_uri=http://localhost:5173/auth/google/callback&response_type=code&scope=email%20profile`} style={{ padding: '10px', backgroundColor: '#fff', color: '#000', textAlign: 'center', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}>Continuer avec Google</a>
        <a href={`https://github.com/login/oauth/authorize?client_id=${import.meta.env.VITE_GITHUB_CLIENT_ID}&redirect_uri=http://localhost:5173/auth/github/callback&scope=user:email`} style={{ padding: '10px', backgroundColor: '#333', color: '#fff', textAlign: 'center', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}>Continuer avec GitHub</a>
      </div>
    </div>
  );
};