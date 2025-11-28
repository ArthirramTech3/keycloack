// LMConfigurationPage.jsx
import { useState } from 'react';

// --- STYLING (Reusing styles for consistency) ---
const styles = {
    container: {
        maxWidth: '700px',
        margin: '50px auto',
        padding: '30px',
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
    },
    inputStyle: {
        width: '100%', padding: '12px 15px', border: '1px solid #d1d5db',
        borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box'
    },
    labelStyle: {
        display: 'block', fontSize: '14px', fontWeight: '600',
        color: '#374151', marginBottom: '8px', marginTop: '15px'
    },
    buttonGroup: {
        display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '30px'
    },
    buttonStyle: {
        padding: '12px 25px', border: 'none', borderRadius: '6px',
        cursor: 'pointer', fontWeight: '600', fontSize: '15px', transition: 'background-color 0.2s'
    }
};

const LMConfigurationPage = ({ onSaveAndSubmit, onCancel }) => { 
  
  const [formData, setFormData] = useState({
    provider: 'Anthropic',
    model: 'Gemini Pro',
    apiEndpoint: '',
    apiKey: '',
    status: 'active'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.apiKey && formData.apiEndpoint) {
        onSaveAndSubmit(formData);
        
        // Optionally reset form state after submission
        setFormData({
            provider: 'Anthropic', model: 'Gemini Pro', apiEndpoint: '', apiKey: '', status: 'active'
        });
    } else {
        alert("Please fill in API Endpoint and Key.");
    }
  };
  
  // Handler to navigate back to the selection page
  const handleCancel = () => {
    onCancel();
  }

  return (
    <div style={styles.container}>
        <h1 style={{ 
            textAlign: 'center', 
            color: '#1f2937', 
            fontSize: '28px', 
            marginBottom: '10px' 
        }}>
            Onboard Language Model Configuration
        </h1>
        <p style={{ 
            textAlign: 'center', 
            color: '#6b7280', 
            marginBottom: '30px', 
            fontSize: '16px' 
        }}>
            Enter the details for your public hosted model.
        </p>

        <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
                <label style={styles.labelStyle}>Provider</label>
                <select 
                    name="provider" 
                    value={formData.provider} 
                    onChange={handleChange} 
                    style={styles.inputStyle}
                >
                    <option value="Anthropic">Anthropic</option>
                    <option value="OpenAI">OpenAI</option>
                    <option value="Google">Google</option>
                    <option value="Alibaba">Alibaba</option>
                </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
                <label style={styles.labelStyle}>Model</label>
                <select 
                    name="model" 
                    value={formData.model} 
                    onChange={handleChange} 
                    style={styles.inputStyle}
                >
                    <option value="Gemini Pro">Gemini Pro</option>
                    <option value="Claude Sonnet 4">Claude Sonnet 4</option>
                    <option value="GPT-4">GPT-4</option>
                    <option value="Qwen Flash 3.1">Qwen Flash 3.1</option>
                </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
                <label style={styles.labelStyle}>API Endpoint</label>
                <input
                    type="url" name="apiEndpoint" value={formData.apiEndpoint} onChange={handleChange}
                    placeholder="e.g., https://api.openai.com/v1/chat/completions" 
                    style={styles.inputStyle}
                    required
                />
            </div>

            <div style={{ marginBottom: '16px' }}>
                <label style={styles.labelStyle}>API Key</label>
                <input
                    type="password" name="apiKey" value={formData.apiKey} onChange={handleChange}
                    placeholder="Enter your confidential API key" 
                    style={styles.inputStyle}
                    required
                />
            </div>

            <div style={{ marginBottom: '16px' }}>
                <label style={styles.labelStyle}>Status</label>
                <select 
                    name="status" 
                    value={formData.status} 
                    onChange={handleChange} 
                    style={styles.inputStyle}
                >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            <div style={styles.buttonGroup}>
                <button
                    type="button"
                    onClick={handleCancel}
                    style={{ ...styles.buttonStyle, background: '#e5e7eb', color: '#4b5563' }}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    style={{ ...styles.buttonStyle, background: '#3b82f6', color: 'white' }}
                >
                    Save & Submit
                </button>
            </div>
        </form>
    </div>
  );
};

export default LMConfigurationPage;