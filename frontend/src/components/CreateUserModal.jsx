// CreateUserModal.jsx
import { useState } from 'react';

const CreateUserModal = ({ isOpen, onClose, onCreate }) => {
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        email: '',
        department: '',
        role: '',
        groups: [],
        status: 'Active'
    });

    const groupsOptions = ['DevOps', 'Development', 'MIS']; // Example groups

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGroupToggle = (group) => {
        setFormData(prev => {
            const currentGroups = prev.groups;
            const newGroups = currentGroups.includes(group)
                ? currentGroups.filter(g => g !== group)
                : [...currentGroups, group];
            return { ...prev, groups: newGroups };
        });
    };

    const handleSubmit = () => {
        // Simple validation
        if (!formData.username || !formData.email) {
            alert('Username and Email are required.');
            return;
        }
        onCreate(formData); // Pass data back to UsersTab
        // Reset form after submission
        setFormData({
            username: '', fullName: '', email: '', department: '',
            role: '', groups: [], status: 'Active'
        });
    };

    if (!isOpen) return null;

    const inputStyle = { width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' };
    const buttonStyle = { padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ background: 'white', borderRadius: '8px', width: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
                <h2 style={{ padding: '15px 20px', margin: '0', fontSize: '18px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Create New User</h2>
                
                <div style={{ padding: '20px', display: 'grid', gap: '15px' }}>
                    
                    {/* Username */}
                    <div><label style={labelStyle}>Username</label><input type="text" name="username" value={formData.username} onChange={handleChange} style={inputStyle} placeholder="Enter username" /></div>
                    
                    {/* Full Name */}
                    <div><label style={labelStyle}>Full Name</label><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} style={inputStyle} placeholder="Enter full name" /></div>
                    
                    {/* Email */}
                    <div><label style={labelStyle}>Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} style={inputStyle} placeholder="Enter email address" /></div>
                    <div>
        <label style={labelStyle}>Password</label>
        <input 
            type="password" // Use 'password' type to hide characters
            name="password" 
            value={formData.password || ''} 
            onChange={handleChange} 
            style={inputStyle} 
            placeholder="Enter password" 
            required // Backend requires this field
        />
    </div>
                    {/* Department */}
                    <div><label style={labelStyle}>Department</label><select name="department" value={formData.department} onChange={handleChange} style={inputStyle}><option value="">Select department...</option><option value="IT">IT</option><option value="Sales">Sales</option></select></div>
                    
                    {/* Role */}
                    <div><label style={labelStyle}>Role</label><select name="role" value={formData.role} onChange={handleChange} style={inputStyle}><option value="">Select role...</option><option value="Admin">Admin</option><option value="User">User</option></select></div>
                    
                    {/* Groups */}
                    <div>
                        <label style={labelStyle}>Groups</label>
                        <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '8px', background: '#f9fafb' }}>
                            {groupsOptions.map(group => (
                                <div key={group} style={{ display: 'inline-block', marginRight: '10px' }}>
                                    <input
                                        type="checkbox"
                                        id={group}
                                        checked={formData.groups.includes(group)}
                                        onChange={() => handleGroupToggle(group)}
                                        style={{ marginRight: '5px' }}
                                    />
                                    <label htmlFor={group} style={{ fontWeight: 'normal', fontSize: '14px', color: '#374151' }}>{group}</label>
                                </div>
                            ))}
                            <p style={{ margin: '5px 0 0', fontSize: '11px', color: '#6b7280' }}>Hold Ctrl/Cmd to select multiple groups</p>
                        </div>
                    </div>
                    
                    {/* Status */}
                    <div><label style={labelStyle}>Status</label><select name="status" value={formData.status} onChange={handleChange} style={inputStyle}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
                    
                </div>
                
                {/* Footer Buttons */}
                <div style={{ padding: '15px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onClose} style={{ ...buttonStyle, background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}>Cancel</button>
                    <button onClick={handleSubmit} style={{ ...buttonStyle, background: '#3b82f6', color: 'white', border: 'none' }}>Create User</button>
                </div>
            </div>
        </div>
    );
};

export default CreateUserModal;