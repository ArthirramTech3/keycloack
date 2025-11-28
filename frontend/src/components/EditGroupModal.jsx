// components/EditGroupModal.jsx

import React, { useState, useEffect } from 'react';

// Simple styling object for the modal (using the same structure as RoleModal)
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


const EditGroupModal = ({ isOpen, onClose, onUpdate, initialData }) => {
    const [originalGroupId, setOriginalGroupId] = useState('');
    const [formData, setFormData] = useState({});

    // Effect to set form data when initialData changes
    useEffect(() => {
        if (initialData) {
            setFormData({
                // Ensure all fields you want to edit are included
                id: initialData.id, 
                name: initialData.name || '',
                description: initialData.description || '',
                // Other group properties (e.g., attributes)
            });
            setOriginalGroupId(initialData.id);
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
        
        // Call the onUpdate function defined in GroupsTab.jsx
        // Pass the original Group ID and the updated data
        onUpdate(originalGroupId, formData); 
    };

    return (
        <div style={modalStyles.backdrop}>
            <div style={modalStyles.content}>
                <h3>Edit Group: {formData.name}</h3>
                <form onSubmit={handleSubmit}>
                    
                    <div style={modalStyles.formGroup}>
                        <label style={modalStyles.label} htmlFor="name">Group Name</label>
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

                    <div style={modalStyles.buttonContainer}>
                        <button type="button" onClick={onClose} style={modalStyles.cancelButton}>Cancel</button>
                        <button type="submit" style={modalStyles.saveButton}>Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditGroupModal;