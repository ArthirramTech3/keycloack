// LMOnboardModal.jsx (SIMPLIFIED)
import { useState } from 'react';

// --- STYLING (Keep all styles) ---
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
    cardStyle: {
        border: '1px solid #e5e7eb', borderRadius: '6px', padding: '16px',
        marginBottom: '15px', cursor: 'pointer', transition: 'all 0.15s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    },
    cardHover: {
        borderColor: '#3b82f6',
        boxShadow: '0 4px 6px rgba(59, 130, 246, 0.1)'
    },
    headerStyle: {
        background: '#ef4444', color: 'white', padding: '12px 16px', margin: '0',
        borderRadius: '8px 8px 0 0', fontSize: '15px', fontWeight: '600', letterSpacing: '0.3px'
    }
};

const LMOnboardModal = ({ isOpen, onClose, onAddModel }) => { // Removed 'step' and 'onPublicSelect' props
  
  const [formData, setFormData] = useState({
    provider: 'Anthropic', model: 'Gemini Pro', apiEndpoint: '', apiKey: '', status: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onAddModel(formData);
    setFormData({ // Reset form state
      provider: 'Anthropic', model: 'Gemini Pro', apiEndpoint: '', apiKey: '', status: ''
    });
    onClose(); 
  };
  
  const handleDiscard = () => {
    onClose(); 
  }

  if (!isOpen) return null;
  
  // --- CONFIGURATION FORM VIEW (Keep this function as-is) ---
  const ConfigFormView = () => (
    <>
      <h2 style={styles.headerStyle}>LM Onboard Configuration</h2>
      {/* ... (All form fields and buttons go here) ... */}
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={styles.labelStyle}>Provider</label>
          <select name="provider" value={formData.provider} onChange={handleChange} style={styles.inputStyle}>
            <option value="Anthropic">Anthropic</option>
            <option value="OpenAI">OpenAI</option>
            <option value="Google">Google</option>
            <option value="Alibaba">Alibaba</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={styles.labelStyle}>Models</label>
          <select name="model" value={formData.model} onChange={handleChange} style={styles.inputStyle}>
            <option value="Gemini Pro">Gemini Pro</option>
            <option value="Claude Sonnet 4">Claude Sonnet 4</option>
            <option value="GPT-4">GPT-4</option>
            <option value="Qwen Flash 3.1">Qwen Flash 3.1</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={styles.labelStyle}>API Endpoint</label>
          <input
            type="text" name="apiEndpoint" value={formData.apiEndpoint} onChange={handleChange}
            placeholder="Enter API endpoint URL" style={styles.inputStyle}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={styles.labelStyle}>Key</label>
          <input
            type="password" name="apiKey" value={formData.apiKey} onChange={handleChange}
            placeholder="Enter API key" style={styles.inputStyle}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={styles.labelStyle}>Status</label>
          <select name="status" value={formData.status} onChange={handleChange} style={styles.inputStyle}>
            <option value="">Select status...</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

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
    </>
  );

  // --- MAIN RENDER ---
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 100
    }}>
      <div style={{
        background: 'white', borderRadius: '8px', padding: '0', width: '460px', 
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}>
        <ConfigFormView /> {/* Only render the form */}
      </div>
    </div>
  );
};

export default LMOnboardModal;