// LanguageModelsDashboard.jsx (UPDATED)
import { useState, useEffect } from 'react';
import ModelCard from './ModelCard'; 
import LMOnboardModal from './LMOnboardModal'; 
import LMSelectionPage from '../LMSelectionPage'; // <-- NEW IMPORT

const initialModels = [
    { name: 'OPEN AI', version: 'OMINI 4.1', isPrivate: false, buttonColor: '#6b7280' },
    { name: 'GEMENI', version: 'FLASH 3.1', isPrivate: false, buttonColor: '#dc2626' },
    { name: 'CLAUDE', version: 'SONNET 4', isPrivate: false, buttonColor: '#16a34a' },
    { name: 'QWEN', version: 'FLASH 3.1', isPrivate: true, buttonColor: '#9333ea' },
    { name: 'GEMENI', version: 'FLASH 3.1', isPrivate: false, buttonColor: '#dc2626' }, 
    { name: 'OLLAMA', version: 'CEREBREAL', isPrivate: true, buttonColor: '#111827' },
];

const LanguageModelsDashboard = () => {
  const [showFormModal, setShowFormModal] = useState(false); // Controls the modal FORM
  const [models, setModels] = useState([]); 
  
  // Controls the main rendering: 'SELECTION_PAGE', 'DASHBOARD'
  const [currentView, setCurrentView] = useState('DASHBOARD'); 

  // --- 1. EFFECT TO LOAD MODELS AND SET INITIAL VIEW ---
  useEffect(() => {
      const storedModelsJSON = localStorage.getItem('onboarded_models');
      let loadedModels = [];
      
      if (storedModelsJSON) {
          loadedModels = JSON.parse(storedModelsJSON);
      } else {
          // If you want to show the selection page on first run even if initialModels is set:
          // loadedModels = []; // <-- Uncomment this line to force selection page on startup
          loadedModels = initialModels; // <-- Keep this line to show default models
      }
      
      setModels(loadedModels);
      
      // Determine the initial view based on loaded models
      if (loadedModels.length === 0) {
          setCurrentView('SELECTION_PAGE'); // Show the full-page selection screen
      } else {
          setCurrentView('DASHBOARD'); // Show the main dashboard
      }
      
  }, []);

  // --- 2. EFFECT TO SAVE MODELS WHENEVER STATE CHANGES ---
  useEffect(() => {
      if (models.length > 0) {
          localStorage.setItem('onboarded_models', JSON.stringify(models));
          // Once a model is added, switch to the dashboard view
          if (currentView === 'SELECTION_PAGE') {
              setCurrentView('DASHBOARD');
          }
      }
  }, [models]);


  const handleAddModel = (newModelData) => {
    const newModel = {
        name: newModelData.provider.toUpperCase(), 
        version: newModelData.model, 
        isPrivate: newModelData.status !== 'active', 
        buttonColor: '#3b82f6', 
    };
    
    setModels(prevModels => [newModel, ...prevModels]); 
    setShowFormModal(false); // Close the modal after adding
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
      // Called from the LMSelectionPage (full page)
      setShowFormModal(true); // Open the configuration modal form
  }
  
  const handlePrivateSelect = () => {
      alert("Private Hosted is not yet configured.");
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
          <ModelCard key={idx} {...model} />
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