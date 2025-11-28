// LMSelectionPage.jsx (NEW FILE)
import React from 'react';

// Use the same styles as LMOnboardModal for consistency
const styles = {
    cardStyle: {
        border: '1px solid #e5e7eb', borderRadius: '8px', padding: '24px',
        marginBottom: '20px', cursor: 'pointer', transition: 'all 0.2s',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)', background: 'white'
    },
    cardHover: {
        borderColor: '#3b82f6',
        boxShadow: '0 8px 16px rgba(59, 130, 246, 0.2)'
    },
};

const LMSelectionPage = ({ onPublicSelect, onPrivateSelect }) => {
    
    const applyHoverStyle = (e, hover) => {
        const style = hover ? styles.cardHover : styles.cardStyle;
        e.currentTarget.style.borderColor = style.borderColor || styles.cardStyle.borderColor;
        e.currentTarget.style.boxShadow = style.boxShadow || styles.cardStyle.boxShadow;
    };
    
    return (
        <div style={{
            maxWidth: '650px',
            margin: '80px auto', // Center the content on the page
            padding: '40px',
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}>
            <h2 style={{
                color: '#3b82f6',
                textAlign: 'center',
                fontSize: '28px',
                marginBottom: '10px'
            }}>
                Onboard Language Model
            </h2>
            <p style={{
                textAlign: 'center',
                color: '#6b7280',
                marginBottom: '40px',
                fontSize: '16px'
            }}>
                Choose how you want to host your language model:
            </p>

            {/* PUBLIC HOSTED CARD */}
            <div 
                onClick={onPublicSelect} 
                style={styles.cardStyle}
                onMouseEnter={(e) => applyHoverStyle(e, true)}
                onMouseLeave={(e) => applyHoverStyle(e, false)}
            >
                <h3 style={{ margin: '0 0 8px 0', color: '#3b82f6' }}>Public Hosted</h3>
                <p style={{ margin: 0, fontSize: '15px', color: '#4b5563' }}>
                    Use cloud-based LM providers like OpenAI, Anthropic, or Google.
                </p>
            </div>
            
            {/* PRIVATE HOSTED CARD */}
            <div 
                onClick={onPrivateSelect} 
                style={styles.cardStyle}
                onMouseEnter={(e) => applyHoverStyle(e, true)}
                onMouseLeave={(e) => applyHoverStyle(e, false)}
            >
                <h3 style={{ margin: '0 0 8px 0', color: '#10b981' }}>Private Hosted</h3>
                <p style={{ margin: 0, fontSize: '15px', color: '#4b5563' }}>
                    Deploy on your own infrastructure for maximum control and privacy.
                </p>
            </div>
            
        </div>
    );
};

export default LMSelectionPage;