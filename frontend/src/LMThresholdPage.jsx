import React from 'react';

const styles = {
    container: {
        maxWidth: '700px',
        margin: '40px auto',
        padding: '30px 40px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
    },
    header: {
        textAlign: 'center',
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: '20px'
    },
    successBanner: {
        background: '#dcfce7',
        color: '#166534',
        padding: '12px',
        borderRadius: '8px',
        textAlign: 'center',
        fontWeight: '500',
        marginBottom: '25px'
    },
    detailsSection: {
        marginBottom: '25px'
    },
    detailItem: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: '1px solid #f3f4f6'
    },
    detailLabel: {
        color: '#4b5563',
        fontWeight: '600'
    },
    detailValue: {
        color: '#111827',
        fontWeight: '500'
    },
    buttonGroup: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '30px'
    },
    button: {
        padding: '10px 25px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '15px'
    }
};

const LMThresholdPage = ({ model, setCurrentPage }) => {
    // Use placeholder data if no model is passed
    const displayModel = model || {
        provider: 'Anthropic',
        name: 'Gemini Pro',
        endpoint: 'http://localhost:5173/',
        status: 'inactive'
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.header}>Set User Thresholds</h2>
            <div style={styles.successBanner}>LM configuration created successfully!</div>

            <div style={styles.detailsSection}>
                <h3 style={{ color: '#374151', marginBottom: '10px' }}>Model Details</h3>
                <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Provider:</span>
                    <span style={styles.detailValue}>{displayModel.provider}</span>
                </div>
                <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Model:</span>
                    <span style={styles.detailValue}>{displayModel.name}</span>
                </div>
                <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Endpoint:</span>
                    <span style={styles.detailValue}>{displayModel.endpoint || 'N/A'}</span>
                </div>
                <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Status:</span>
                    <span   style={{ color: displayModel.status === 'active' ? '#16a34a' : '#dc2626' }}>{displayModel.status}</span>
                </div>
            </div>

            <div style={styles.buttonGroup}>
                <button onClick={() => setCurrentPage('LMOnboard')} style={{ ...styles.button, background: '#e5e7eb', color: '#4b5563' }}>Start Over</button>
                <button onClick={() => alert('Save Thresholds clicked!')} style={{ ...styles.button, background: '#3b82f6', color: 'white' }}>Save Thresholds</button>
            </div>
        </div>
    );
};

export default LMThresholdPage;
 