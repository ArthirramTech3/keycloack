import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import keycloak from './keycloak';
import { ReactKeycloakProvider } from '@react-keycloak/web';

const root = createRoot(document.getElementById('root'));

const initKeycloak = (keycloak) => {
  root.render(
    <StrictMode>
      <ReactKeycloakProvider authClient={keycloak}>
        <App />
      </ReactKeycloakProvider>
    </StrictMode>
  );
};

keycloak.init({ onLoad: 'login-required', checkLoginIframe: false }).then((authenticated) => {
  if (authenticated) {
    initKeycloak(keycloak);
  } else {
    console.error("Authentication failed");
  }
});
