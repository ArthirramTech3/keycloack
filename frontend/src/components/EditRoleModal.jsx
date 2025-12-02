import React, { useState, useEffect } from 'react';

const modalStyles = {
    backdrop: {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', 
        alignItems: 'center', zIndex: 1000
    },
    content: {
        backgroundColor: 'white', padding: '30px', borderRadius: '8px', 
        width: '500px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    },
    header: {
        fontSize: '20px', fontWeight: 'bold', marginBottom: '25px', color: '#1f2937'
    },
    formGroup: {
        marginBottom: '20px'
    },
    label: {
        display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151'
    },
    input: {
        width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
        borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'
    },
    buttonGroup: {
        display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px'
    },
    button: {
        padding: '10px 20px', borderRadius: '6px', border: 'none',
        cursor: 'pointer', fontWeight: '600', fontSize: '14px'
    }
};

const EditRoleModal = ({ isOpen, onClose, onUpdate, initialData }) => {
    const [roleName, setRoleName] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (initialData) {
            setRoleName(initialData.name || '');
            setDescription(initialData.description || '');
        }
    }, [initialData]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!roleName) {
            alert('Role Name is required.');
            return;
        }
        // The first argument is the original role name, used to find the role in the API path
        onUpdate(initialData.name, { name: roleName, description });
    };

    return (
        <div style={modalStyles.backdrop}>
            <div style={modalStyles.content}>
                <h3 style={modalStyles.header}>Edit Role: {initialData.name}</h3>
                <div style={modalStyles.formGroup}>
                    <label style={modalStyles.label}>Role Name</label>
                    <input
                        type="text"
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        style={modalStyles.input}
                    />
                </div>
                <div style={modalStyles.formGroup}>
                    <label style={modalStyles.label}>Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        style={{ ...modalStyles.input, height: '80px', resize: 'vertical' }}
                    />
                </div>
                <div style={modalStyles.buttonGroup}>
                    <button onClick={onClose} style={{ ...modalStyles.button, background: '#e5e7eb', color: '#4b5563' }}>Cancel</button>
                    <button onClick={handleSubmit} style={{ ...modalStyles.button, background: '#3b82f6', color: 'white' }}>Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default EditRoleModal;