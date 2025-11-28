// components/EditUserModal.jsx

import React, { useState, useEffect } from 'react';

// --- MODAL STYLING DEFINITION ---
// These styles enforce the modal overlay behavior.
const modalStyles = {
    backdrop: {
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',     
        zIndex: 1000 // Ensures it's above all other content
    },
    content: {
        backgroundColor: 'white', 
        padding: '30px', 
        borderRadius: '8px', 
        width: '500px', 
        maxWidth: '90%', // Ensures responsiveness
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        maxHeight: '80vh',
        overflowY: 'auto'
    },
    label: { 
        display: 'block', 
        marginBottom: '5px', 
        marginTop: '10px', 
        fontWeight: '600', 
        fontSize: '14px' 
    },
    input: { 
        width: '100%', 
        padding: '10px', 
        border: '1px solid #d1d5db', 
        borderRadius: '4px', 
        boxSizing: 'border-box' 
    },
    controlGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginTop: '10px',
    },
    buttonContainer: { 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: '10px', 
        marginTop: '20px' 
    },
    saveButton: { 
        padding: '10px 20px', 
        background: '#3b82f6', 
        color: 'white', 
        border: 'none', 
        borderRadius: '4px', 
        cursor: 'pointer' 
    },
    cancelButton: { 
        padding: '10px 20px', 
        background: '#f3f4f6', 
        border: '1px solid #d1d5db', 
        borderRadius: '4px', 
        cursor: 'pointer' 
    }
};
// ------------------------------------


const EditUserModal = ({ isOpen, onClose, onUpdate, initialData }) => {
    
    const [formData, setFormData] = useState(initialData || {});

    // 2. Update state when initialData changes (i.e., when a new user is selected for editing)
    useEffect(() => {
        // Ensure formData is initialized correctly, handling nulls/undefined for checkboxes
        if (initialData) {
            setFormData({
                ...initialData,
                // Ensure 'enabled' is a proper boolean, not just a string or undefined
                enabled: initialData.enabled === true || initialData.enabled === 'true' 
            });
        }
    }, [initialData]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdate(formData); 
    };
    

    return (
        // --- APPLY BACKDROP STYLE HERE ---
        <div style={modalStyles.backdrop}> 
            {/* --- APPLY CONTENT STYLE HERE --- */}
            <div style={modalStyles.content}> 
                <h3>Edit User: {formData.username || 'Loading...'}</h3>
                <form onSubmit={handleSubmit}>
                    
                    <label style={modalStyles.label} htmlFor="username">Username:</label>
                    <input 
                        style={modalStyles.input}
                        name="username" 
                        id="username"
                        value={formData.username || ''} 
                        onChange={handleChange} 
                        required 
                    />
                    
                    <label style={modalStyles.label} htmlFor="email">Email:</label>
                    <input 
                        style={modalStyles.input}
                        name="email" 
                        id="email"
                        type="email" 
                        value={formData.email || ''} 
                        onChange={handleChange} 
                        required 
                    />
                    
                    <label style={modalStyles.label} htmlFor="firstName">First Name:</label>
                    <input 
                        style={modalStyles.input}
                        name="firstName" 
                        id="firstName"
                        value={formData.firstName || ''} 
                        onChange={handleChange} 
                    />
                    
                    <label style={modalStyles.label} htmlFor="lastName">Last Name:</label>
                    <input 
                        style={modalStyles.input}
                        name="lastName" 
                        id="lastName"
                        value={formData.lastName || ''} 
                        onChange={handleChange} 
                    />
                    
                    <div style={modalStyles.controlGroup}>
                        <label style={{...modalStyles.label, marginTop: '0', marginBottom: '0'}} htmlFor="enabled">Status (Enabled):</label>
                        <input 
                            type="checkbox" 
                            name="enabled" 
                            id="enabled"
                            checked={formData.enabled || false} // Default to false if undefined
                            onChange={handleChange} 
                        />
                    </div>
                    
                    {/* Add fields for Group/Role assignment here later */}
                    
                    <div style={modalStyles.buttonContainer}>
                        <button type="button" onClick={onClose} style={modalStyles.cancelButton}>Cancel</button>
                        <button type="submit" style={modalStyles.saveButton}>Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserModal;