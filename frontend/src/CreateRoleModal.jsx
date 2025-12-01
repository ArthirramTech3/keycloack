// CreateRoleModal.jsx
import { useState } from 'react';

const CreateRoleModal = ({ isOpen, onClose, onCreate }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'Active'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        if (!formData.name) {
            alert('Role Name is required.');
            return;
        }
        onCreate(formData);
        // Reset form
        setFormData({ name: '', description: '', status: 'Active' });
    };

    if (!isOpen) return null;

    const inputStyle = { width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' };
    const buttonStyle = { padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' };

    return (
        <div style={{ /* Modal Overlay Styles */ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ background: 'white', borderRadius: '8px', width: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
                <h2 style={{ padding: '15px 20px', margin: '0', fontSize: '18px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Create New Role</h2>
                
                <div style={{ padding: '20px', display: 'grid', gap: '15px' }}>
                    
                    {/* Role Name */}
                    <div><label style={labelStyle}>Role Name</label><input type="text" name="name" value={formData.name} onChange={handleChange} style={inputStyle} placeholder="Enter role name" /></div>
                    
                    {/* Description */}
                    <div><label style={labelStyle}>Description</label><textarea name="description" value={formData.description} onChange={handleChange} style={{...inputStyle, minHeight: '60px'}} placeholder="Enter role description..." /></div>
                    
                    {/* Permissions (Placeholder matching your screenshot) */}
                    <div>
                        <label style={labelStyle}>Default Permissions</label>
                        <div style={{ height: '100px', border: '1px solid #d1d5db', borderRadius: '4px', background: '#f9fafb', padding: '10px', overflowY: 'auto', fontSize: '14px' }}>
                           {/* Placeholder permission list */}
                           <p style={{margin: 0}}>Dashboard Access</p>
                           <p style={{margin: 0}}>User Management</p>
                           <p style={{margin: 0}}>Model Access</p>
                           <p style={{margin: 0}}>Monitoring Access</p>
                           <p style={{margin: 0}}>System Configuration</p>
                        </div>
                    </div>

                    {/* Status */}
                    <div><label style={labelStyle}>Status</label><select name="status" value={formData.status} onChange={handleChange} style={inputStyle}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
                    
                </div>
                
                <div style={{ padding: '15px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onClose} style={{ ...buttonStyle, background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}>Cancel</button>
                    <button onClick={handleSubmit} style={{ ...buttonStyle, background: '#3b82f6', color: 'white', border: 'none' }}>Create Role</button>
                </div>
            </div>
        </div>
    );
};

export default CreateRoleModal;