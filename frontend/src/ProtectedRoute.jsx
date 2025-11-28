import { useKeycloak } from "@react-keycloak/web";

export default function ProtectedRoute({ children, roles = [] }) {
  const { keycloak, initialized } = useKeycloak();

  // Still initializing
  if (!initialized) {
    return (
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#f3f4f6'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#6b7280' }}>Loading...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!keycloak.authenticated) {
    keycloak.login();
    return null;
  }

  // Debug: Log user roles
  console.log('User Roles:', keycloak.realmAccess?.roles);
  console.log('Required Roles:', roles);
  console.log('Token Parsed:', keycloak.tokenParsed);

  // Check if user has required role
  const hasRequiredRole = 
    roles.length === 0 || 
    roles.some((role) => keycloak.hasRealmRole(role));

  console.log('Has Required Role:', hasRequiredRole);

  if (!hasRequiredRole) {
    return (
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f3f4f6',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          maxWidth: '500px',
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: '#fee2e2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '40px'
          }}>
            🔒
          </div>
          <h2 style={{ 
            color: '#dc2626', 
            fontSize: '24px',
            margin: '0 0 10px 0'
          }}>
            Access Denied
          </h2>
          <p style={{ 
            color: '#6b7280',
            fontSize: '16px',
            margin: '0 0 30px 0'
          }}>
            You do not have permission to access this page.
          </p>
          
          <div style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            <p style={{ 
              margin: '0 0 10px 0',
              fontSize: '14px',
              color: '#374151',
              fontWeight: '600'
            }}>
              Required Role(s):
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {roles.map((role, idx) => (
                <span key={idx} style={{
                  background: '#dbeafe',
                  color: '#1e40af',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  {role}
                </span>
              ))}
            </div>
            
            <p style={{ 
              margin: '15px 0 5px 0',
              fontSize: '14px',
              color: '#374151',
              fontWeight: '600'
            }}>
              Your Role(s):
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {keycloak.realmAccess?.roles?.map((role, idx) => (
                <span key={idx} style={{
                  background: '#f3f4f6',
                  color: '#6b7280',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  {role}
                </span>
              )) || <span style={{ color: '#9ca3af', fontSize: '13px' }}>No roles assigned</span>}
            </div>
          </div>

          <button
            onClick={() => window.history.back()}
            style={{
              padding: '12px 24px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              marginRight: '10px'
            }}
          >
            Go Back
          </button>
          <button
            onClick={() => keycloak.logout()}
            style={{
              padding: '12px 24px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return children;
}