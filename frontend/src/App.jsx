// App.jsx (The Main Application Logic)

// --- Imports ---
import { useState, useEffect } from "react";
import { useKeycloak } from "@react-keycloak/web";
import ProtectedRoute from "./ProtectedRoute";
import CustomLoginForm from './CustomLoginForm'; 
import UserManagement from "./UserManagement"; // Assuming this is separate
import AppLayout from './AppLayout'; // <--- NEW Layout Component
//import UserManagement from "./components/UserManagement";

// --- Component Imports (These files must be created in the 'components' folder) ---
import LanguageModelsDashboard from './components/LanguageModelsDashboard';
import UserInfoForm from './components/UserInfoForm';
// Note: LMOnboardModal and ModelCard are imported inside LanguageModelsDashboard.jsx
// --- NEW IMPORT ---
 import { jwtDecode } from 'jwt-decode'; // <-- ADD THIS IMPORT


// MAIN APP
export default function App() {
  const { keycloak, initialized } = useKeycloak();
  const [currentPage, setCurrentPage] = useState('dashboard'); // Default view after login
  const [loginCompleted, setLoginCompleted] = useState(false);
  const [reauthenticating, setReauthenticating] = useState(false);
  const loading = !initialized;
  
  useEffect(() => {
    if (initialized && keycloak.authenticated) {
      keycloak.loadUserProfile(); 
    }
  }, [initialized, keycloak.authenticated]);
  useEffect(() => {
    const storedRefreshToken = localStorage.getItem('keycloak_refresh_token');

    if (initialized && !keycloak.authenticated && storedRefreshToken && !reauthenticating) {
        setReauthenticating(true);
        console.log("Found refresh token, attempting silent re-authentication...");
        
        // This function needs to contact your FastAPI backend's token/refresh endpoint
        // You will need to create this function (e.g., refreshTokenExchange)
        const reauthenticate = async () => {
            try {
                const response = await fetch("http://localhost:8000/token/refresh", { // <-- YOUR BACKEND REFRESH ENDPOINT
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: storedRefreshToken }),
                });

                if (response.ok) {
                    const newTokenData = await response.json();
                    await handleLoginSuccess(newTokenData); // Re-run the success logic
                } else {
                    // Refresh failed (token expired or revoked)
                    localStorage.removeItem('keycloak_refresh_token');
                    console.error("Refresh token exchange failed. User must log in.");
                }
            } catch (error) {
                console.error("Error during silent refresh:", error);
            } finally {
                setReauthenticating(false);
            }
        };

        reauthenticate();
    }
}, [initialized, keycloak.authenticated, reauthenticating]); // Dependency array

// In your main render logic, check if reauthenticating:
if (reauthenticating || loading) {
    return (
        <div style={{ padding: "40px", textAlign: "center", minHeight: "100vh", background: "#f3f4f6" }}>
            <h2>Restoring Session...</h2>
        </div>
    );
}

  // Inside App.jsx

const handleLoginSuccess = async (tokenData) => {
  try {
      console.log("Token received. Attempting Keycloak state update...");

      // 1. Manually set authentication state and raw tokens
      keycloak.authenticated = true; 
      keycloak.token = tokenData.access_token;
      keycloak.refreshToken = tokenData.refresh_token;
      keycloak.idToken = tokenData.id_token || null;

      // 2. Use jwt-decode to set tokenParsed (as done in the last fix)
      // ... (Keep the jwtDecode logic here) ...
      try {
          // NOTE: Make sure you imported { jwtDecode } from 'jwt-decode'
          keycloak.tokenParsed = jwtDecode(tokenData.access_token); 
      } catch (e) {
          console.error("JWT Decode failed:", e);
          throw new Error("Failed to decode token using jwt-decode.");
      }
      
      // 3. CRITICAL FINAL FIX: Force Keycloak state update with a generous validity time.
      // We set the min validity to 600 seconds (10 minutes).
      // If the token is valid for 10 more minutes (which it should be), Keycloak will accept the manual setup.
      // This is a common method to bypass minor clock skew and timing issues.
      const updated = await keycloak.updateToken(600); // <-- Change is here (minValidity = 600)

      if (!updated) {
          // If it fails here, the token is likely expired or invalid from the server.
          throw new Error("Failed to validate Keycloak state and token during final validation.");
      }
      
      // 4. Load the user profile and redirect
      await keycloak.loadUserProfile();
      setLoginCompleted(true);
      setCurrentPage('dashboard'); 
      
      console.log("Custom login SUCCESS. Keycloak state is fully established.");
      localStorage.setItem('keycloak_refresh_token', tokenData.refresh_token);
  } catch (error) {
      console.error("Failed to process ROPC tokens and update Keycloak state:", error);
      throw error;
  }
};


  const handleNavigate = (page) => {
    // This handler will be passed to the Sidebar
    setCurrentPage(page);
  }

  // --- 1. Loading State ---
  if (!initialized) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #1f2937 0%, #000000 100%)',
        color: 'white'
      }}>
        Loading...
      </div>
    );
  }

  // --- 2. Unauthenticated State (Custom Login) ---
  if (!keycloak.authenticated && !loginCompleted) { // <-- MODIFIED LINE
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #1f2937 0%, #000000 100%)'
      }}>
        <CustomLoginForm onLoginSuccess={handleLoginSuccess} />
      </div>
    );
}
  // --- 3. Authenticated State (Routing Logic) ---

  let content = null;
  
  if (currentPage === "usermanagement") {
    // Maps to the "User" management menu item (using UserInfoForm as placeholder)
    content = (
      <ProtectedRoute roles={["admin"]}>
        {/* Replace UserInfoForm with your full UserManagement component if needed */}
        <UserManagement /> 
      </ProtectedRoute>
    );
  } else if (currentPage === "dashboard" || currentPage === "LMOnboard") {
    // Dashboard and LMOnboard both typically render the dashboard view, 
    // with LMOnboard potentially triggering a modal (handled internally by the component)
    content = (
      <ProtectedRoute roles={["admin"]}>
        <LanguageModelsDashboard />
      </ProtectedRoute>
    );
  } else {
    // Fallback View
    content = <div style={{padding: '50px'}}>Page not found or select an item from the sidebar.</div>;
  }
  
  // FINAL RENDERING: Use the Layout when authenticated
  return (
    // Pass the navigation handler and current page state to AppLayout
    <AppLayout currentPage={currentPage} setCurrentPage={handleNavigate}>
      {content}
      {/* Any modals that need to overlay the entire app should go here if not
          already inside the content component. (LMOnboardModal is now inside LanguageModelsDashboard) */}
    </AppLayout>
  );
}