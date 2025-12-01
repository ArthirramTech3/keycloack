// LMThresholdsPage.jsx
import React from 'react';

const styles = {
    container: {
        maxWidth: '650px',
        margin: '80px auto',
        padding: '40px',
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
    },
    header: {
        textAlign: 'center',
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '20px'
    },
    successMessage: {
        background: '#dcfce7',
        color: '#16a34a',
        padding: '12px',
        borderRadius: '8px',
        textAlign: 'center',
        marginBottom: '20px',
    },
    detailsSection: {
        marginBottom: '20px',
    },
    detailItem: {
        marginBottom: '5px'
    },
    buttonContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '30px'
    },
    button: {
        padding: '10px 20px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '600'
    },
};

const LMThresholdsPage = ({ modelData, setCurrentPage }) => {
    const handleSave = () => {
        const newModel = {
            name: modelData.provider.toUpperCase(),
            version: modelData.model,
            isPrivate: modelData.status !== 'active',
            buttonColor: '#3b82f6', 
        };
        const existingModels = JSON.parse(localStorage.getItem('onboarded_models')) || [];
        const updatedModels = [newModel, ...existingModels];
        localStorage.setItem('onboarded_models', JSON.stringify(updatedModels));
        setCurrentPage('dashboard');
    };

    const handleStartOver = () => {
        setCurrentPage('lm-selection');
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.header}>Set User Thresholds</h2>
            <div style={styles.successMessage}>
                LM configuration created successfully!
            </div>
            <div style={styles.detailsSection}>
                <h4>Model Details</h4>
                <p style={styles.detailItem}><strong>Provider:</strong> {modelData.provider}</p>
                <p style={styles.detailItem}><strong>Model:</strong> {modelData.model}</p>
                <p style={styles.detailItem}><strong>Endpoint:</strong> {modelData.apiEndpoint}</p>
                <p style={styles.detailItem}><strong>Status:</strong> {modelData.status}</p>
            </div>
            <div>
                <h4>Assign User Thresholds</h4>
                {/* This is a placeholder. A real implementation would map over users. */}
            </div>
            <div style={styles.buttonContainer}>
                <button style={{...styles.button, background: '#e5e7eb'}} onClick={handleStartOver}>
                    Start Over
                </button>
                <button style={{...styles.button, background: '#3b82f6', color: 'white'}} onClick={handleSave}>
                    Save Thresholds
                </button>
            </div>
        </div>
    );
};

export default LMThresholdsPage;
