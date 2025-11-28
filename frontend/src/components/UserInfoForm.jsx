// UserInfoForm.jsx
import { useState, useEffect } from "react";
import { useKeycloak } from "@react-keycloak/web";

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
    
    // Simulate API call to save profile
    setTimeout(() => {
      setStatus({ loading: false, message: 'Profile updated successfully!', error: false });
      
      setTimeout(() => {
        onSuccess();
      }, 300);
    }, 500);
  };

  const inputBaseStyle = {
      width: '100%',
      padding: '12px',
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      color: 'white',
      fontSize: '16px',
      boxSizing: 'border-box'
  };
  const labelBaseStyle = { 
      display: 'block', 
      fontSize: '14px', 
      color: '#d1d5db', 
      marginBottom: '8px' 
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
          <label style={labelBaseStyle}>First Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Enter your first name"
            style={inputBaseStyle}
          />
        </div>

        <div>
          <label style={labelBaseStyle}>Last Name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Enter your last name"
            style={inputBaseStyle}
          />
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={labelBaseStyle}>Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          style={inputBaseStyle}
        />
      </div>

      <div style={{ marginBottom: '32px' }}>
        <label style={labelBaseStyle}>Phone Number</label>
        <input
          type="tel"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          placeholder="Enter your phone number"
          style={inputBaseStyle}
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

export default UserInfoForm;