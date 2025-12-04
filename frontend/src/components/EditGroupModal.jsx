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
        width: '400px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        maxHeight: '80vh', overflowY: 'auto' // Added for scrolling if many fields
    },
    formGroup: { marginBottom: '15px' },
    label: { display: 'block', marginBottom: '5px', fontWeight: '600' },
    input: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' },
    select: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' },
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
                id: initialData.id, 
                name: initialData.name || '',
                description: initialData.description || '',
                // ADDED FIELDS based on Group Creation payload:
                groupCode: initialData.groupCode || '',
                status: initialData.status || 'Active', // Assuming a default status
                department: initialData.department || '',
                permissions: initialData.permissions || [], // Permissions might need a more complex input
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
        
        // Prepare data for update: remove the ID field before sending
        const { id, ...dataToUpdate } = formData;
        
        // Pass the original Group ID and the updated data (excluding ID)
        onUpdate(originalGroupId, dataToUpdate); 
    };

    return (
        <div style={modalStyles.backdrop}>
            <div style={modalStyles.content}>
                <h3>Edit Group: {formData.name}</h3>
                <form onSubmit={handleSubmit}>
                    
                    {/* Group Name */}
                    <div style={modalStyles.formGroup}>
                        <label style={modalStyles.label} htmlFor="name">Group Name</label>
                        <input 
                            style={modalStyles.input}
                            type="text" 
                            id="name"
                            name="name" 
                            value={formData.name || ''} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    
                    {/* Description */}
                    <div style={modalStyles.formGroup}>
                        <label style={modalStyles.label} htmlFor="description">Description</label>
                        <textarea 
                            style={modalStyles.input}
                            id="description"
                            name="description" 
                            value={formData.description || ''} 
                            onChange={handleChange} 
                        />
                    </div>

                    {/* Group Code (New Field) */}
                    <div style={modalStyles.formGroup}>
                        <label style={modalStyles.label} htmlFor="groupCode">Group Code</label>
                        <input 
                            style={modalStyles.input}
                            type="text" 
                            id="groupCode"
                            name="groupCode" 
                            value={formData.groupCode || ''} 
                            onChange={handleChange} 
                        />
                    </div>

                    {/* Status (New Field - Using Select for example) */}
                    <div style={modalStyles.formGroup}>
                        <label style={modalStyles.label} htmlFor="status">Status</label>
                        <select 
                            style={modalStyles.select}
                            id="status"
                            name="status" 
                            value={formData.status || 'Active'} 
                            onChange={handleChange} 
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>

                    {/* Department (New Field) */}
                    <div style={modalStyles.formGroup}>
                        <label style={modalStyles.label} htmlFor="department">Department</label>
                        <input 
                            style={modalStyles.input}
                            type="text" 
                            id="department"
                            name="department" 
                            value={formData.department || ''} 
                            onChange={handleChange} 
                        />
                    </div>
                    
                    {/* Permissions (New Field - Simplistic Textarea/Input for example) */}
                    {/* NOTE: In a real app, this would likely be a complex multi-select or checklist */}
                    <div style={modalStyles.formGroup}>
                        <label style={modalStyles.label} htmlFor="permissions">Permissions (e.g., list of codes)</label>
                        <input 
                            style={modalStyles.input}
                            type="text" 
                            id="permissions"
                            name="permissions" 
                            // Assuming permissions is a comma-separated string for a simple input
                            value={Array.isArray(formData.permissions) ? formData.permissions.join(', ') : (formData.permissions || '')} 
                            // NOTE: Handle change for array/string conversion if needed for the backend
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