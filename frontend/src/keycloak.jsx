import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "http://localhost:8080",
  realm: "cybersecurity-realm",
  clientId: "cybersecurity-frontend",
});

export default keycloak;
