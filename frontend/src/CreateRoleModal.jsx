import React, { useState } from 'react';

// --- UPDATED MOCK DATA: RESOURCES & ACTIONS ---
// Define the resources (pages/sections) and the actions available for them
const PERMISSION_RESOURCES = [
    { 
        resource: 'User Management', 
        category: 'User & Account', 
        description: 'Manage system users and profiles.',
        actions: ['view', 'create', 'edit', 'delete'],
        color: '#DBEAFE', text: '#1E40AF' 
    },
    { 
        resource: 'Role Management', 
        category: 'User & Account', 
        description: 'Manage roles and access groups.',
        actions: ['view', 'create', 'edit', 'delete'],
        color: '#DBEAFE', text: '#1E40AF' 
    },
    { 
        resource: 'LM Policy Control', 
        category: 'Policy', 
        description: 'Configure AI model policies.',
        actions: ['view', 'create', 'edit'],
        color: '#FCE7F3', text: '#9D174D' 
    },
    { 
        resource: 'Audit & Logs', 
        category: 'Security', 
        description: 'View system audit and activity logs.',
        actions: ['view'],
        color: '#FEF3C7', text: '#92400E' 
    },
];

// Standard available actions for easy header mapping
const ALL_ACTIONS = ['View', 'Create', 'Edit', 'Delete'];


const CreateRoleModal = ({ isOpen, onClose, onCreate }) => {
    const [formData, setFormData] = useState({
        roleId: '',
        roleName: '',
        description: '',
        status: 'Active'
    });
    
    // State stores permissions as an array of strings: ['User Management:view', 'Role Management:edit', ...]
    const [selectedPermissions, setSelectedPermissions] = useState([]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- LOGIC FOR GRANULAR CHECKBOXES ---
    const togglePermission = (resource, action) => {
        const key = `${resource}:${action}`;
        setSelectedPermissions(prev => 
            prev.includes(key) 
                ? prev.filter(p => p !== key)
                : [...prev, key]
        );
    };

    const isActionSelected = (resource, action) => {
        return selectedPermissions.includes(`${resource}:${action}`);
    };

    const handleSelectAllResourceActions = (resource, availableActions) => {
        const allKeys = availableActions.map(action => `${resource}:${action}`);
        // Check if ALL available actions for this resource are currently selected
        const allSelected = allKeys.every(key => selectedPermissions.includes(key));

        if (allSelected) {
            // Deselect all for this resource
            setSelectedPermissions(prev => prev.filter(key => !allKeys.includes(key)));
        } else {
            // Select all for this resource
            setSelectedPermissions(prev => {
                const newSelections = new Set([...prev, ...allKeys]);
                return Array.from(newSelections);
            });
        }
    };

    const handleSubmit = () => {
        // The final permissions array sent to the backend will be a list of keys
        onCreate({
            ...formData,
            permissions: selectedPermissions 
        });
    };

    // --- STYLES ---
    const styles = {
        overlay: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            backdropFilter: 'blur(2px)'
        },
        modal: {
            backgroundColor: '#fff', borderRadius: '12px', width: '900px', // Wider modal needed for matrix view
            maxWidth: '95%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden', fontFamily: "'Inter', sans-serif",
            maxHeight: '90vh', display: 'flex', flexDirection: 'column'
        },
        header: {
            padding: '20px 24px', borderBottom: '1px solid #E5E7EB',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            backgroundColor: '#fff'
        },
        title: { margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' },
        closeBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#9CA3AF' },
        
        body: { padding: '24px', overflowY: 'auto' },
        formGroup: { marginBottom: '20px' },
        rowGroup: { display: 'flex', gap: '20px', marginBottom: '20px' },
        label: { display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' },
        input: {
            width: '100%', padding: '10px 12px', borderRadius: '6px',
            border: '1px solid #D1D5DB', fontSize: '14px', color: '#111827',
            outline: 'none', boxSizing: 'border-box'
        },
        textarea: {
            width: '100%', padding: '10px 12px', borderRadius: '6px',
            border: '1px solid #D1D5DB', fontSize: '14px', color: '#111827',
            minHeight: '60px', resize: 'vertical', outline: 'none', boxSizing: 'border-box'
        },

        // --- NEW PERMISSION MATRIX STYLES ---
        permListContainer: {
            border: '1px solid #E5E7EB', borderRadius: '8px', 
            maxHeight: '400px', overflowY: 'auto', backgroundColor: '#F9FAFB',
        },
        permTable: {
            width: '100%', borderCollapse: 'collapse', 
            // Ensures the table background matches container
            backgroundColor: '#F9FAFB' 
        },
        th: {
            padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', 
            color: '#6B7280', textTransform: 'uppercase', borderBottom: '1px solid #E5E7EB',
            position: 'sticky', top: 0, backgroundColor: '#F9FAFB', zIndex: 10
        },
        td: {
            padding: '12px 16px', borderBottom: '1px solid #E5E7EB', fontSize: '14px', 
            verticalAlign: 'middle', backgroundColor: 'white'
        },
        resourceNameContainer: { 
            display: 'flex', flexDirection: 'column', paddingRight: '20px' 
        },
        resourceName: { 
            fontWeight: '600', color: '#111827' 
        },
        resourceDesc: { 
            fontSize: '12px', color: '#6B7280', marginTop: '2px' 
        },
        actionCell: { 
            textAlign: 'center' 
        },
        checkbox: { 
            width: '16px', height: '16px', cursor: 'pointer', 
            verticalAlign: 'middle'
        },
        badge: (bg, color) => ({
            backgroundColor: bg, color: color, fontSize: '11px', fontWeight: '600',
            padding: '4px 8px', borderRadius: '12px', textTransform: 'uppercase', 
            letterSpacing: '0.5px', whiteSpace: 'nowrap'
        }),

        footer: {
            padding: '16px 24px', borderTop: '1px solid #E5E7EB',
            display: 'flex', justifyContent: 'flex-end', gap: '12px',
            backgroundColor: '#F9FAFB'
        },
        btnCancel: {
            padding: '10px 16px', borderRadius: '6px', border: '1px solid #D1D5DB',
            backgroundColor: '#fff', color: '#374151', fontSize: '14px', fontWeight: '500',
            cursor: 'pointer'
        },
        btnSubmit: {
            padding: '10px 16px', borderRadius: '6px', border: 'none',
            backgroundColor: '#2563EB', color: '#fff', fontSize: '14px', fontWeight: '500',
            cursor: 'pointer'
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h3 style={styles.title}>Create New Role</h3>
                    <button onClick={onClose} style={styles.closeBtn}>&times;</button>
                </div>

                <div style={styles.body}>
                    <div style={styles.rowGroup}>
                        <div style={{flex: 1}}>
                            <label style={styles.label}>Role ID</label>
                            <input type="text" name="roleId" placeholder="e.g. R005" style={styles.input} value={formData.roleId} onChange={handleChange} />
                        </div>
                        <div style={{flex: 2}}>
                            <label style={styles.label}>Role Name</label>
                            <input type="text" name="roleName" placeholder="Enter role name" style={styles.input} value={formData.roleName} onChange={handleChange} />
                        </div>
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Description</label>
                        <textarea name="description" placeholder="Briefly describe the purpose of this role" style={styles.textarea} value={formData.description} onChange={handleChange} />
                    </div> 
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Status</label>
                        <select name="status" value={formData.status} onChange={handleChange} style={styles.input}>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>


                    {/* Permission Matrix (The Granular View) */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Assign Granular Permissions</label>
                        
                        <div style={styles.permListContainer}>
                            <table style={styles.permTable}>
                                <thead>
                                    <tr>
                                        <th style={{...styles.th, width: '30%'}}>Resource</th>
                                        <th style={{...styles.th, width: '15%', textAlign: 'center'}}>Category</th>
                                        {ALL_ACTIONS.map(action => (
                                            <th key={action} style={{...styles.th, width: '10%', textAlign: 'center'}}>{action}</th>
                                        ))}
                                        <th style={{...styles.th, width: '10%', textAlign: 'center'}}>Select All</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {PERMISSION_RESOURCES.map((res, index) => {
                                        const actionsAvailable = res.actions.map(a => a.charAt(0).toUpperCase() + a.slice(1));
                                        return (
                                            <tr key={index}>
                                                <td style={styles.td}>
                                                    <div style={styles.resourceNameContainer}>
                                                        <span style={styles.resourceName}>{res.resource}</span>
                                                        <span style={styles.resourceDesc}>{res.description}</span>
                                                    </div>
                                                </td>
                                                <td style={{...styles.td, textAlign: 'center'}}>
                                                    <span style={styles.badge(res.color, res.text)}>{res.category}</span>
                                                </td>
                                                {/* Action Checkboxes */}
                                                {ALL_ACTIONS.map(action => (
                                                    <td key={action} style={styles.actionCell}>
                                                        {res.actions.includes(action.toLowerCase()) ? (
                                                            <input
                                                                type="checkbox"
                                                                style={styles.checkbox}
                                                                checked={isActionSelected(res.resource, action.toLowerCase())}
                                                                onChange={() => togglePermission(res.resource, action.toLowerCase())}
                                                            />
                                                        ) : (
                                                            <span style={{color: '#E5E7EB'}}>-</span>
                                                        )}
                                                    </td>
                                                ))}
                                                {/* Select All for Resource */}
                                                <td style={{...styles.actionCell, paddingRight: '16px'}}>
                                                    <button 
                                                        onClick={() => handleSelectAllResourceActions(res.resource, res.actions)}
                                                        style={{...styles.btnSubmit, padding: '4px 8px', fontSize: '11px', background: '#3B82F6'}}
                                                    >
                                                        {actionsAvailable.every(a => isActionSelected(res.resource, a.toLowerCase())) ? 'Clear' : 'All'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div style={styles.footer}>
                    <button onClick={onClose} style={styles.btnCancel}>Cancel</button>
                    <button onClick={handleSubmit} style={styles.btnSubmit}>Create Role</button>
                </div>
            </div>
        </div>
    );
};

export default CreateRoleModal;