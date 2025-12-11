import { useState, useEffect } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import useApi from './useApi'; // <-- 1. IMPORT THE useApi HOOK

const styles = {
  inputStyle: {
      width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
      borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box'
  },
  labelStyle: {
      display: 'block', fontSize: '13px', fontWeight: '600',
      color: '#374151', marginBottom: '6px'
  },
  buttonStylePrimary: {
      padding: '10px 20px', background: '#3b82f6', color: 'white',
      border: 'none', borderRadius: '4px', cursor: 'pointer',
      fontWeight: '500', fontSize: '14px'
  },
  pageHeader: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '20px',
  }
};

const LMOnboardPage = ({ setCurrentPage }) => {
  const { keycloak } = useKeycloak();
  const api = useApi(); // <-- 2. INITIALIZE THE API HOOK
  const [formData, setFormData] = useState({
    model_name: '', provider: '', api_key: '', api_url: '', is_public: true, organization_id: null
  });
  const [organizations, setOrganizations] = useState([]);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await api.get('/organizations');
        setOrganizations(response.data);
      } catch (error) {
        console.error('Error fetching organizations:', error);
      }
    };
    fetchOrganizations();
  }, [api]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async () => {
    try {
      const payload = { ...formData };
      if (payload.organization_id === '') {
        payload.organization_id = null;
      }
      // 3. USE THE API HOOK TO CREATE THE MODEL
      const response = await api.post('/admin/models/create', payload);
      
      if (response.status !== 200 && response.status !== 201) {
        throw new Error(response.data.detail || 'Failed to save the model.');
      }
      alert('Model saved successfully!');
      setCurrentPage('dashboard'); // Navigate back to the dashboard
    } catch (error) {
      console.error('Error saving model:', error);
      alert(`An error occurred while saving the model: ${error.message}`);
    }
  };

  const handleDiscard = () => {
    setCurrentPage('dashboard');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '20px', borderRadius: '8px' }}>
      <h2 style={styles.pageHeader}>LM Onboard Configuration</h2>
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={styles.labelStyle}>Model Name</label>
          <input
            type="text" name="model_name" value={formData.model_name} onChange={handleChange}
            placeholder="e.g., Gemini Pro" style={styles.inputStyle}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={styles.labelStyle}>Provider</label>
          <input
            type="text" name="provider" value={formData.provider} onChange={handleChange}
            placeholder="e.g., Google, OpenAI" style={styles.inputStyle}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={styles.labelStyle}>API URL</label>
          <input
            type="text" name="api_url" value={formData.api_url} onChange={handleChange}
            placeholder="Enter API endpoint URL" style={styles.inputStyle}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={styles.labelStyle}>API Key</label>
          <input
            type="password" name="api_key" value={formData.api_key} onChange={handleChange}
            placeholder="Enter API key" style={styles.inputStyle}
          />
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <label style={{ ...styles.labelStyle, display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              name="is_public"
              checked={formData.is_public}
              onChange={handleChange}
              style={{ marginRight: '8px' }}
            />
            Is Public
          </label>
        </div>

        {!formData.is_public && (
          <div style={{ marginBottom: '16px' }}>
            <label style={styles.labelStyle}>Organization</label>
            <select
              name="organization_id"
              value={formData.organization_id}
              onChange={handleChange}
              style={styles.inputStyle}
            >
              <option value="">Select an organization</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleDiscard}
            style={{ ...styles.buttonStylePrimary, background: '#6b7280' }}
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            style={styles.buttonStylePrimary}
          >
            Save & Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default LMOnboardPage;
