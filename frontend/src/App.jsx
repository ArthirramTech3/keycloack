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
import LMOnboardPage from './LMOnboardPage';
import LMThresholdPage from './LMThresholdPage';
// --- NEW IMPORT ---
 import { jwtDecode } from 'jwt-decode'; // <-- ADD THIS IMPORT

// MAIN APP
export default function App() {
  const { keycloak, initialized } = useKeycloak();
  const [currentPage, setCurrentPage] = useState('dashboard'); // Default view after login
  const [loginCompleted, setLoginCompleted] = useState(false);
  const [selectedModelForThreshold, setSelectedModelForThreshold] = useState(null);
  const loading = !initialized;
  
  useEffect(() => {
    if (initialized && keycloak.authenticated) {
      keycloak.loadUserProfile(); 
    }
  }, [initialized, keycloak]);

// In your main render logic, check if reauthenticating:
if (!initialized) {
    return (
        <div style={{ padding: "40px", textAlign: "center", minHeight: "100vh", background: "#f3f4f6" }}>
            <h2>Restoring Session...</h2>
        </div>
    );
}

const handleLoginSuccess = async (tokenData) => {
  try {
      console.log("Token received. Attempting Keycloak state update...");

      // Manually set the tokens on the existing, initialized Keycloak instance.
      // This is the correct way to handle a custom ROPC login flow.
      // DO NOT call keycloak.init() here again.
      keycloak.token = tokenData.access_token;
      keycloak.refreshToken = tokenData.refresh_token;
      keycloak.idToken = tokenData.id_token;
      keycloak.tokenParsed = jwtDecode(tokenData.access_token);
      keycloak.idTokenParsed = jwtDecode(tokenData.id_token);
      // Note: Refresh tokens are often opaque and not JWTs, so we don't decode them.
      keycloak.authenticated = true;

      // This tells the Keycloak instance to align its internal timers with the new tokens.
      keycloak.updateToken(-1);

      await keycloak.loadUserProfile();
      setLoginCompleted(true);
      setCurrentPage('dashboard'); 
      
      console.log("Custom login SUCCESS. Keycloak state is fully established.");
  } catch (error) {
      console.error("Failed to process ROPC tokens and update Keycloak state:", error);
      keycloak.clearToken(); // Clear state on error
      throw error;
  }
};


  const handleNavigate = (page) => {
    // This handler will be passed to the Sidebar
    setCurrentPage(page);
  }

  // --- 1. Loading State ---
  // --- 2. Unauthenticated State (Custom Login) ---
  if (!keycloak.authenticated && !loginCompleted) {
    return <CustomLoginForm onLoginSuccess={handleLoginSuccess} />; // Show login form
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
  } else if (currentPage === "dashboard") {
    content = (
      <ProtectedRoute roles={["admin"]}>
        <LanguageModelsDashboard 
          setCurrentPage={setCurrentPage} 
          setSelectedModelForThreshold={setSelectedModelForThreshold} 
        />
      </ProtectedRoute>
    );
  } else if (currentPage === "LMOnboard") { // <-- NEW: Handle LMOnboard route
    content = (
      <ProtectedRoute roles={["admin"]}>
        <LMOnboardPage setCurrentPage={setCurrentPage} />
      </ProtectedRoute>
    );
  } else if (currentPage === "LMThreshold") {
    content = (
      <ProtectedRoute roles={["admin"]}>
        <LMThresholdPage model={selectedModelForThreshold} setCurrentPage={setCurrentPage} />
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