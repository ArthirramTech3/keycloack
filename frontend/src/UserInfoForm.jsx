import { useState, useEffect } from "react";
import { useKeycloak } from "@react-keycloak/web";

// LM Onboard Modal
const LMOnboardModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    provider: 'Anthropic',
    model: 'Gemini Pro',
    apiEndpoint: '',
    apiKey: '',
    status: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    console.log('LM Onboard data:', formData);
    onClose();
  };

  if (!isOpen) return null;

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px'
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '0',
        width: '460px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{
          background: '#ef4444',
          color: 'white',
          padding: '12px 16px',
          margin: '0',
          borderRadius: '8px 8px 0 0',
          fontSize: '15px',
          fontWeight: '600',
          letterSpacing: '0.3px'
        }}>LM Onboard</h2>

        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Provider</label>
            <select name="provider" value={formData.provider} onChange={handleChange} style={inputStyle}>
              <option value="Anthropic">Anthropic</option>
              <option value="OpenAI">OpenAI</option>
              <option value="Google">Google</option>
              <option value="Alibaba">Alibaba</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Models</label>
            <select name="model" value={formData.model} onChange={handleChange} style={inputStyle}>
              <option value="Gemini Pro">Gemini Pro</option>
              <option value="Claude Sonnet 4">Claude Sonnet 4</option>
              <option value="GPT-4">GPT-4</option>
              <option value="Qwen Flash 3.1">Qwen Flash 3.1</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>API Endpoint</label>
            <input
              type="text"
              name="apiEndpoint"
              value={formData.apiEndpoint}
              onChange={handleChange}
              placeholder="Enter API endpoint URL"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Key</label>
            <input
              type="password"
              name="apiKey"
              value={formData.apiKey}
              onChange={handleChange}
              placeholder="Enter API key"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Status</label>
            <select name="status" value={formData.status} onChange={handleChange} style={inputStyle}>
              <option value="">Select status...</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px'
              }}
            >
              Discard
            </button>
            <button
              onClick={handleSubmit}
              style={{
                padding: '10px 20px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px'
              }}
            >
              Save & Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Model Card Component
const ModelCard = ({ name, version, isPrivate, buttonColor }) => {
  return (
    <div style={{
      background: 'white',
      border: '2px dotted #9ca3af',
      borderRadius: '8px',
      padding: '24px 20px',
      width: '100%',
      minHeight: '280px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '20px', flex: '0 0 auto' }}>
        <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>
          • {isPrivate ? 'Private' : 'Public Hosted'}
        </span>
        <h3 style={{ margin: '10px 0 6px 0', fontSize: '20px', fontWeight: 'bold', color: '#111827', letterSpacing: '0.5px' }}>
          {name}
        </h3>
        <p style={{ margin: 0, fontSize: '13px', color: '#dc2626', fontWeight: '700' }}>{version}</p>
      </div>

      <div style={{
        borderTop: '3px solid #3b82f6',
        paddingTop: '16px',
        marginBottom: '20px',
        flex: '1 1 auto'
      }}>
        <ul style={{ 
          listStyle: 'disc', 
          paddingLeft: '20px', 
          margin: 0, 
          color: '#4b5563', 
          fontSize: '12px',
          lineHeight: '1.8'
        }}>
          <li>Meta Features</li>
          <li>45 Parameter</li>
          <li>34 Temperature</li>
          <li>Score/Benchmark</li>
        </ul>
      </div>

      <button style={{
        width: '100%',
        padding: '11px',
        background: buttonColor,
        color: 'white',
        border: 'none',
        borderRadius: '20px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '12px',
        letterSpacing: '0.5px',
        flex: '0 0 auto'
      }}>
        VIEW/CONFIGURE
      </button>
    </div>
  );
};

// Language Models Dashboard
const LanguageModelsDashboard = () => {
  const [showModal, setShowModal] = useState(false);

  const models = [
    { name: 'OPEN AI', version: 'OMINI 4.1', isPrivate: false, buttonColor: '#6b7280' },
    { name: 'GEMENI', version: 'FLASH 3.1', isPrivate: false, buttonColor: '#dc2626' },
    { name: 'CLAUDE', version: 'SONNET 4', isPrivate: false, buttonColor: '#16a34a' },
    { name: 'QWEN', version: 'FLASH 3.1', isPrivate: true, buttonColor: '#9333ea' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#9ca3af',
      padding: '30px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'white'
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
          onClick={() => setShowModal(true)}
          style={{
            padding: '10px 24px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            letterSpacing: '0.3px'
          }}
        >
          Onboard LM
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '30px',
        maxWidth: '1500px'
      }}>
        {models.map((model, idx) => (
          <ModelCard
            key={idx}
            name={model.name}
            version={model.version}
            isPrivate={model.isPrivate}
            buttonColor={model.buttonColor}
          />
        ))}
      </div>

      <LMOnboardModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
};

// User Information Form
const UserInfoForm = ({ onSuccess }) => {
  const { keycloak } = useKeycloak();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  });
  const [status, setStatus] = useState({ loading: false, message: '', error: false });

  useEffect(() => {
    if (keycloak?.profile) {
      setFormData({
        firstName: keycloak.profile.firstName || "",
        lastName: keycloak.profile.lastName || "",
        email: keycloak.profile.email || "",
        phoneNumber: keycloak.profile.attributes?.phoneNumber?.[0] || "",
      });
    }
  }, [keycloak?.profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    console.log('Save Changes clicked');
    setStatus({ loading: true, message: '', error: false });
    
    setTimeout(() => {
      setStatus({ loading: false, message: 'Profile updated successfully!', error: false });
      
      setTimeout(() => {
        console.log('Calling onSuccess');
        onSuccess();
      }, 300);
    }, 500);
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '16px',
      padding: '32px',
      maxWidth: '600px',
      margin: '0 auto',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    }}>
      <h2 style={{
        fontSize: '28px',
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: '32px'
      }}>User Information</h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '24px',
        marginBottom: '24px'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', color: '#d1d5db', marginBottom: '8px' }}>
            First Name
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Enter your first name"
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', color: '#d1d5db', marginBottom: '8px' }}>
            Last Name
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Enter your last name"
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '14px', color: '#d1d5db', marginBottom: '8px' }}>
          Email
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          style={{
            width: '100%',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '16px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginBottom: '32px' }}>
        <label style={{ display: 'block', fontSize: '14px', color: '#d1d5db', marginBottom: '8px' }}>
          Phone Number
        </label>
        <input
          type="tel"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          placeholder="Enter your phone number"
          style={{
            width: '100%',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '16px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {status.message && (
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '16px',
          background: status.error ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
          color: status.error ? '#fca5a5' : '#86efac',
          border: `1px solid ${status.error ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`
        }}>
          {status.message}
        </div>
      )}

      <button
        type="button"
        disabled={status.loading}
        onClick={handleSubmit}
        style={{
          width: '100%',
          padding: '14px',
          background: status.loading ? '#0891b2' : '#06b6d4',
          border: 'none',
          borderRadius: '12px',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: status.loading ? 'not-allowed' : 'pointer',
          opacity: status.loading ? 0.7 : 1
        }}
      >
        {status.loading ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
};

// MAIN APP
export default function App() {
  const { keycloak, initialized } = useKeycloak();
  const [currentPage, setCurrentPage] = useState('userInfo');

  useEffect(() => {
    if (initialized && keycloak.authenticated) {
      keycloak.loadUserProfile();
    }
  }, [initialized, keycloak.authenticated]);

  const handleNavigateToDashboard = () => {
    console.log('Navigating to dashboard...');
    setCurrentPage('dashboard');
  };

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

  if (!keycloak.authenticated) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #1f2937 0%, #000000 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: 'white', marginBottom: '24px' }}>
            User Information Dashboard
          </h1>
          <button
            onClick={() => keycloak.login()}
            style={{
              background: '#06b6d4',
              color: 'white',
              padding: '12px 32px',
              borderRadius: '12px',
              fontSize: '18px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Login with Keycloak
          </button>
        </div>
      </div>
    );
  }

  if (currentPage === 'dashboard') {
    return <LanguageModelsDashboard />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1f2937 0%, #000000 100%)',
      color: 'white'
    }}>
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 50
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>User Information</h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: '4px 0 0 0' }}>Update your profile details</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#d1d5db' }}>Welcome, {keycloak.profile?.username || 'User'}</span>
          <button
            onClick={() => keycloak.logout()}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main style={{ paddingTop: '120px', padding: '120px 24px 24px 24px', maxWidth: '800px', margin: '0 auto' }}>
        <UserInfoForm onSuccess={handleNavigateToDashboard} />
      </main>
    </div>
  );
}