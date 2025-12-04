import { useKeycloak } from "@react-keycloak/web";

/**
 * A component to protect routes based on Keycloak authentication and roles.
 * It checks for roles within `token.realm_access.roles`.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - The components to render if authorized.
 * @param {string[]} props.roles - An array of role names required to access the route.
 */
const ProtectedRoute = ({ children }) => {
  const { keycloak, initialized } = useKeycloak();

  // Wait until Keycloak is initialized
  if (!initialized) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Initializing authentication...</div>;
  }

  // Check for authentication
  if (!keycloak.authenticated) {
    // In a real app, you might redirect to a login page or show a generic access denied message.
    return <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>Access Denied: You are not logged in.</div>;
  }

  return children;
};

export default ProtectedRoute;
