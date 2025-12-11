import { useState } from 'react';

/**
 * CustomLoginForm Component
 * Renders a standard username/password form and sends credentials
 * to the FastAPI custom-login endpoint (which then uses Keycloak ROPC).
 * * @param {function} onLoginSuccess - Callback function passed from App.jsx 
 * to manually update the Keycloak state on success.
 */
export default function CustomLoginForm({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        // Simple validation
        if (!username || !password) {
            setError('Please enter both username and password.');
            setLoading(false);
            return;
        }

        try {
            // 1. Call the FastAPI endpoint which handles the Keycloak ROPC flow
            const response = await fetch("http://localhost:8000/auth/login", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                // The error detail comes directly from FastAPI/Keycloak (e.g., Invalid credentials)
                throw new Error(data.detail || 'Login failed due to server error.');
            }

            // 2. SUCCESS: Pass the token data (access_token, refresh_token, etc.) 
            //    back up to App.jsx to manually initialize Keycloak.
            onLoginSuccess(data);

        } catch (err) {
            console.error('Login error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={containerStyle}>
            <form onSubmit={handleSubmit} style={formStyle}>
                <h2 style={headerStyle}>🔒 Sign In</h2>
                <p style={subHeaderStyle}>Enter your credentials to access the system</p>

                {error && <div style={errorStyle}>{error}</div>}

                <label style={labelStyle}>Username/Email</label>
                <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    style={inputStyle} 
                    required 
                    autoComplete="username"
                />

                <label style={labelStyle}>Password</label>
                <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    style={inputStyle} 
                    required 
                    autoComplete="current-password"
                />

                <button 
                    type="submit" 
                    style={buttonStyle} 
                    disabled={loading}
                >
                    {loading ? 'Authenticating...' : 'Log In'}
                </button>
            </form>
        </div>
    );
}

// --- Basic Styles for the Form ---
const containerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    width: '100%',
};

const formStyle = {
    background: 'white',
    padding: '40px',
    borderRadius: '10px',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
    width: '100%',
    maxWidth: '350px',
};

const headerStyle = {
    textAlign: 'center',
    marginBottom: '5px',
    color: '#1f2937',
};

const subHeaderStyle = {
    textAlign: 'center',
    marginBottom: '20px',
    color: '#6b7280',
    fontSize: '14px',
};

const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: '600',
    fontSize: '14px',
    color: '#374151',
    marginTop: '15px'
};

const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #d1d5db',
    boxSizing: 'border-box',
    fontSize: '15px',
};

const buttonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#06b6d4', // Teal/Cyan button
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '700',
    marginTop: '30px',
    transition: 'background-color 0.3s',
};

const errorStyle = {
    color: '#ef4444',
    background: '#fee2e2',
    padding: '10px',
    borderRadius: '5px',
    marginBottom: '15px',
    textAlign: 'center',
    fontSize: '14px',
    border: '1px solid #fca5a5'
};