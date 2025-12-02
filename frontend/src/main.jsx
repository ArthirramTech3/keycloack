import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import keycloak from './keycloak'; // <-- IMPORTS the single instance
import { ReactKeycloakProvider } from '@react-keycloak/web';

const root = createRoot(document.getElementById('root'));

// Function to handle token persistence
const onTokens = (tokens) => {
  if (tokens.token) {
    localStorage.setItem('kc_token', tokens.token);
  }
  if (tokens.refreshToken) {
    localStorage.setItem('kc_refreshToken', tokens.refreshToken);
  }
  if (tokens.idToken) {
    localStorage.setItem('kc_idToken', tokens.idToken);
  }
  if (!tokens.token) {
    localStorage.removeItem('kc_token');
  }
};

// Retrieve stored tokens to initialize Keycloak
const initOptions = {
  onLoad: 'check-sso',
  pkceMethod: 'S256',
  checkLoginIframe: false,
  redirectUri: window.location.origin,
  token: localStorage.getItem('kc_token') || undefined,
  refreshToken: localStorage.getItem('kc_refreshToken') || undefined,
  idToken: localStorage.getItem('kc_idToken') || undefined,
};

root.render(
  <StrictMode>
  <ReactKeycloakProvider
      authClient={keycloak} // <-- USES the single imported instance
      initOptions={initOptions}
      onTokens={onTokens}
    >
      <App />
    </ReactKeycloakProvider>
  </StrictMode>
);