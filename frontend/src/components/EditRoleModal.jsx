// components/EditRoleModal.jsx

import React, { useState, useEffect } from 'react';

// Simple styling object for the modal (replace with your actual CSS/styling solution)
const modalStyles = {
    backdrop: {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', 
        alignItems: 'center', zIndex: 1000
    },
    content: {
        backgroundColor: 'white', padding: '30px', borderRadius: '8px', 
        width: '400px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    },
    formGroup: { marginBottom: '15px' },
    label: { display: 'block', marginBottom: '5px', fontWeight: '600' },
    input: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' },
    buttonContainer: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
    saveButton: { padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    cancelButton: { padding: '10px 20px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }
};


const EditRoleModal = ({ isOpen, onClose, onUpdate, initialData }) => {
    // Keep track of the original role name/ID for the PUT request URL
    const [originalRoleName, setOriginalRoleName] = useState('');
    const [formData, setFormData] = useState({});

    // Effect to reset and set form data whenever the modal opens or initialData changes
    useEffect(() => {
        if (initialData) {
            setFormData({
                // Ensure all fields you want to edit are included
                name: initialData.name || '',
                description: initialData.description || '',
                // Keep the ID/original name in state to use in the update call
                id: initialData.id, 
            });
            setOriginalRoleName(initialData.name);
        }
    }, [initialData]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Call the onUpdate function defined in RolesTab.jsx
        // The parent component needs the original name for the API path 
        // and the new data for the request body.
        onUpdate(originalRoleName, formData); 
    };

    return (
        <div style={modalStyles.backdrop}>
            <div style={modalStyles.content}>
                <h3>Edit Role: {originalRoleName}</h3>
                <form onSubmit={handleSubmit}>
                    
                    <div style={modalStyles.formGroup}>
                        <label style={modalStyles.label} htmlFor="name">Role Name</label>
                        <input 
                            style={modalStyles.input}
                            type="text" 
                            id="name"
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    
                    <div style={modalStyles.formGroup}>
                        <label style={modalStyles.label} htmlFor="description">Description</label>
                        <textarea 
                            style={modalStyles.input}
                            id="description"
                            name="description" 
                            value={formData.description} 
                            onChange={handleChange} 
                        />
                    </div>

                    {/* Add controls for permissions/scopes here later */}

                    <div style={modalStyles.buttonContainer}>
                        <button type="button" onClick={onClose} style={modalStyles.cancelButton}>Cancel</button>
                        <button type="submit" style={modalStyles.saveButton}>Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditRoleModal;