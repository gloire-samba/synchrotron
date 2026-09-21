// === FICHIER : frontend/src/components/OAuthCallback.tsx ===
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loginSocial } from '../services/api';

// 1. On ajoute la fonction en paramètre
export const OAuthCallback = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const { provider } = useParams<{ provider: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState(`Authentification ${provider} en cours...`);
  
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code && provider) {
      hasFetched.current = true;
      
      loginSocial(provider, code)
        .then(() => {
          onLoginSuccess(); 
          // Ajout de replace: true
          // Cela remplace l'historique : le bouton "Précédent" sautera cette page !
          navigate('/', { replace: true }); 
        })
        .catch((err) => {
          setStatus(err.message);
        });
    } else {
      setStatus("Aucun code d'autorisation ou fournisseur trouvé.");
    }
  }, [provider, navigate, onLoginSuccess]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>{status}</h2>
      <button onClick={() => navigate('/')}>Retour à l'accueil</button>
    </div>
  );
};