import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import keycloak from './keycloak'; // <-- IMPORTS the single instance
import { ReactKeycloakProvider } from '@react-keycloak/web';

const root = createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
  <ReactKeycloakProvider
      authClient={keycloak} // <-- USES the single imported instance
      initOptions={{
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: false,
        redirectUri: window.location.origin,
      }}
      onEvent={(event, error) => {
        console.log('Keycloak event:', event, error);
      }}
      onTokens={(tokens) => {
        console.log('Tokens received:', tokens);
      }}
    >
      <App />
    </ReactKeycloakProvider>
  </StrictMode>
);