// === FICHIER : frontend/src/App.tsx ===
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { BookingTunnel } from './components/BookingTunnel';
import { Auth } from './components/Auth';
import { OAuthCallback } from './components/OAuthCallback';
import { ResetPasswordConfirm } from './components/ResetPasswordConfirm';
import { Profile } from './components/Profile';
import { getUser, logoutUser } from './services/api';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getUser()
      .then(() => setIsAuthenticated(true))
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
              <Link to="/profil" style={{ textDecoration: 'none', backgroundColor: '#61dafb', padding: '10px 15px', color: '#000', borderRadius: '5px', fontWeight: 'bold' }}>
                Mon Profil
              </Link>
              <button 
                onClick={() => {
                  logoutUser()
                    .then(() => {
                      setIsAuthenticated(false);
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
          <Route path="/auth/:provider/callback" element={<OAuthCallback onLoginSuccess={() => setIsAuthenticated(true)} />} />
          <Route path="/changement-de-mot-de-passe/:uid/:token" element={<ResetPasswordConfirm />} />
          
          <Route path="/profil" element={
            isAuthenticated ? <Profile /> : <Auth onLoginSuccess={() => setIsAuthenticated(true)} />
          } />
          
          <Route path="/" element={
            isAuthenticated ? <BookingTunnel /> : <Auth onLoginSuccess={() => setIsAuthenticated(true)} />
          } />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;