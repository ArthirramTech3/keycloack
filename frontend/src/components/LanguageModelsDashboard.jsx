// LanguageModelsDashboard.jsx (UPDATED)
import { useState, useEffect, useMemo } from 'react';
import { useKeycloak } from '@react-keycloak/web'; // <-- NEW: Import useKeycloak
import useApi from '../useApi'; // <-- NEW: Import useApi hook
import ModelCard from './ModelCard'; 
import LMOnboardModal from './LMOnboardModal'; 
import LMSelectionPage from '../LMSelectionPage'; // <-- NEW IMPORT

const LanguageModelsDashboard = ({ setCurrentPage, setSelectedModelForThreshold }) => {
  const [showFormModal, setShowFormModal] = useState(false); // Controls the modal FORM
  const [models, setModels] = useState([]); 
  const [loading, setLoading] = useState(true); // <-- NEW: Loading state
  const { keycloak } = useKeycloak(); // <-- NEW: Get keycloak instance
  
  // Memoize the api instance to prevent re-renders from triggering useEffect.
  const api = useApi();
  const memoizedApi = useMemo(() => api, [keycloak.token]);
  
  // Controls the main rendering: 'SELECTION_PAGE', 'DASHBOARD'
  const [currentView, setCurrentView] = useState(null); // Initialize to null to indicate loading/undetermined state

  // --- 1. EFFECT TO LOAD MODELS FROM API ---
  useEffect(() => {
    const fetchModels = async () => {
      if (keycloak.authenticated) {
        setLoading(true);
        try {
          // Fetch user-specific models, or public models as a fallback
          const response = await memoizedApi.get(`/admin/models`);
          const loadedModels = response.data.map(model => ({
            name: model.model_name.toUpperCase(),
            version: model.provider,
            isPrivate: !model.is_public,
            buttonColor: '#3b82f6' // Default color
          }));

          setModels(loadedModels);

          if (loadedModels.length === 0) {
            setCurrentView('SELECTION_PAGE');
          } else {
            setCurrentView('DASHBOARD');
          }
        } catch (error) {
          console.error("Failed to fetch models:", error);
          setCurrentView('SELECTION_PAGE'); // Fallback to selection page on error
        } finally {
          setLoading(false);
        }
      }
    };

    fetchModels();
  }, [keycloak.authenticated, memoizedApi]);


  const handleAddModel = (newModelData) => {
    const newModel = {
        name: newModelData.provider.toUpperCase(), 
        version: newModelData.model, 
        isPrivate: newModelData.status !== 'active', 
        buttonColor: '#3b82f6', 
    };
    
    setModels(prevModels => [newModel, ...prevModels]);
    setShowFormModal(false); // Close the modal after adding
    // If this was the first model, switch to the dashboard view
    if (currentView === 'SELECTION_PAGE') {
        setCurrentView('DASHBOARD');
    }
  };
  
  // --- HANDLERS ---
  const handleOpenModal = () => {
      // Called by the 'Onboard LM' button (when models already exist)
      setShowFormModal(true); 
  }
  
  const handleCloseFormModal = () => {
      setShowFormModal(false);
  }
  
  const handlePublicSelect = () => {
      // NEW: Navigate to the full onboarding page
      setCurrentPage('LMOnboard');
  }
  
  const handlePrivateSelect = () => {
      alert("Private Hosted is not yet configured.");
  }


  // --- LOADING VIEW ---
  if (loading || currentView === null) { // Show loading until currentView is determined
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading models...</div>;
  }

  // --- CONDITIONAL RENDER: SHOW SELECTION PAGE (FULL PAGE) ---
  if (currentView === 'SELECTION_PAGE') {
       return (
            <LMSelectionPage 
                onPublicSelect={handlePublicSelect} 
                onPrivateSelect={handlePrivateSelect}
            />
       );
  }

  // --- DEFAULT DASHBOARD VIEW ---
  return (
    <div style={{ padding: '0' }}>
      {/* Dashboard Header and Button */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px'
      }}>
        {/* ... (Header/Title remains the same) ... */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{
            width: '50px', height: '50px', borderRadius: '50%', background: '#3b82f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', fontWeight: 'bold', color: 'white'
          }}>A</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 'bold', color: '#111827' }}>
              Add Language Models
            </h1>
            <p style={{ margin: '2px 0 0 0', color: '#4b5563', fontSize: '13px' }}>
              Manage and configure onboarded AI models
            </p>
          </div>
        </div>
        
        {/* Button to open the modal (for subsequent additions) */}
        <button
          onClick={handleOpenModal} 
          style={{
            padding: '10px 24px', background: '#3b82f6', color: 'white',
            border: 'none', borderRadius: '6px', cursor: 'pointer',
            fontWeight: '600', fontSize: '14px', letterSpacing: '0.3px'
          }}
        >
          Onboard LM
        </button>
      </div>

      {/* Model Cards Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '30px', maxWidth: '1500px'
      }}>
        {models.map((model, idx) => (
          <ModelCard 
            key={idx} 
            {...model} 
            onConfigure={() => { setSelectedModelForThreshold(model); setCurrentPage('LMThreshold'); }} 
          />
        ))}
      </div>

      {/* Configuration Modal (Only for step 2) */}
      <LMOnboardModal 
          isOpen={showFormModal} 
          onClose={handleCloseFormModal} 
          onAddModel={handleAddModel} 
          step={'FORM'} // Always show the form view now
          onPublicSelect={() => {}} // No longer needed
      />
    </div>
  );
};

export default LanguageModelsDashboard;