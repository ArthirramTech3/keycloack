import Keycloak from 'keycloak-js';

// IMPORTANT: Replace these with your actual Keycloak server details.
const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'cybersecurity-realm',
  clientId: 'cybersecurity-frontend'
});


export default keycloak;
