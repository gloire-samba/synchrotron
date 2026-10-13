import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { BookingTunnel } from './components/BookingTunnel';
import { Auth } from './components/Auth';
import { OAuthCallback } from './components/OAuthCallback';
import { ResetPasswordConfirm } from './components/ResetPasswordConfirm';
import { Profile } from './components/Profile';
import { getUser, logoutUser, fetchAuth, API_URL } from './services/api';
import { ExpertDashboard } from './components/ExpertDashboard';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isExpert, setIsExpert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fonction centralisée pour vérifier le rôle de l'utilisateur
  const verifierStatutExpert = async () => {
    try {
      const res = await fetchAuth(`${API_URL}/auth/user/`);
      if (res.ok) {
        const userData = await res.json();
        setIsExpert(userData.is_expert);
      }
    } catch (err) {
      console.error("Erreur lors de la vérification du statut expert", err);
    }
  };

  // NOUVEAU : Fonction déclenchée à chaque connexion réussie
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    verifierStatutExpert(); // On vérifie immédiatement s'il est expert
  };

  useEffect(() => {
    getUser()
      .then(() => {
        setIsAuthenticated(true);
        verifierStatutExpert(); // On vérifie aussi s'il était déjà connecté (F5)
      })
      .catch(() => setIsAuthenticated(false))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div>Chargement de l'application...</div>;
  }

  return (
    <BrowserRouter>
      <main>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: 0 }}>Portail Synchrotron SOLEIL</h1>
          
          {isAuthenticated && (
            <div style={{ display: 'flex', gap: '15px' }}>
              
              {isExpert && (
                <Link to="/expert" style={{ textDecoration: 'none', backgroundColor: '#f39c12', padding: '10px 15px', color: '#000', borderRadius: '5px', fontWeight: 'bold' }}>
                  Espace Expert
                </Link>
              )}

              <Link to="/profil" style={{ textDecoration: 'none', backgroundColor: '#61dafb', padding: '10px 15px', color: '#000', borderRadius: '5px', fontWeight: 'bold' }}>
                Mon Profil
              </Link>
              <button 
                onClick={() => {
                  logoutUser()
                    .then(() => {
                      setIsAuthenticated(false);
                      setIsExpert(false); // On réinitialise l'état
                      window.location.href = '/'; 
                    })
                    .catch((err) => console.error("Échec de la déconnexion", err));
                }}
                style={{ backgroundColor: '#d9534f', padding: '10px 15px', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit', fontSize: '1em' }}
              >
                Se déconnecter
              </button>
            </div>
          )}
        </div>
        
        <Routes>
          <Route path="/auth/:provider/callback" element={<OAuthCallback onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/changement-de-mot-de-passe/:uid/:token" element={<ResetPasswordConfirm />} />
          
          <Route path="/expert" element={
            isAuthenticated ? <ExpertDashboard /> : <Auth onLoginSuccess={handleLoginSuccess} />
          } />
          
          <Route path="/profil" element={
            isAuthenticated ? <Profile /> : <Auth onLoginSuccess={handleLoginSuccess} />
          } />
          
          <Route path="/" element={
            isAuthenticated ? <BookingTunnel /> : <Auth onLoginSuccess={handleLoginSuccess} />
          } />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;