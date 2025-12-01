import { useState, useEffect } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import ModelCard from './ModelCard';
import LMSelectionPage from '../LMSelectionPage';

const LanguageModelsDashboard = ({ setCurrentPage, onViewModel }) => {
  const { keycloak } = useKeycloak();
  const [models, setModels] = useState([]);
  const [currentView, setCurrentView] = useState('DASHBOARD');

  const apiFetch = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'Content-Type': 'application/json',
      Authorization: `Bearer ${keycloak.token}`,
    };
    const response = await fetch(`http://localhost:8000${url}`, { ...options, headers });
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    return response.json();
  };

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const modelsData = await apiFetch('/api/models');
        setModels(modelsData);
        if (modelsData.length === 0) {
          setCurrentView('SELECTION_PAGE');
        } else {
          setCurrentView('DASHBOARD');
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
      }
    };

    if (keycloak.token) {
      fetchModels();
    }
  }, [keycloak.token]);

  const handlePrivateSelect = () => {
    alert("Private Hosted is not yet configured.");
  };

  if (currentView === 'SELECTION_PAGE') {
    return (
      <LMSelectionPage
        onPublicSelect={() => setCurrentPage('lm-config')}
        onPrivateSelect={handlePrivateSelect}
      />
    );
  }

  return (
    <div style={{ padding: '0' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px'
      }}>
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
        <button
          onClick={() => setCurrentPage('lm-selection')}
          style={{
            padding: '10px 24px', background: '#3b82f6', color: 'white',
            border: 'none', borderRadius: '6px', cursor: 'pointer',
            fontWeight: '600', fontSize: '14px', letterSpacing: '0.3px'
          }}
        >
          Onboard LM
        </button>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '30px', maxWidth: '1500px'
      }}>
        {models.map((model, idx) => (
          <div key={idx} onClick={() => onViewModel(model)}>
            <ModelCard
              name={model.model_name}
              version=""
              isPrivate={model.is_public === 'false'}
              buttonColor="#3b82f6"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default LanguageModelsDashboard;
