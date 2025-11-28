// CreateGroupModal.jsx
import { useState } from 'react';

const CreateGroupModal = ({ isOpen, onClose, onCreate }) => {
    const [formData, setFormData] = useState({
        groupCode: '',
        groupName: '',
        description: '',
        department: '',
        status: 'Active'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        if (!formData.groupCode || !formData.groupName) {
            alert('Group Code and Name are required.');
            return;
        }
        onCreate(formData);
        // Reset form
        setFormData({ groupCode: '', groupName: '', description: '', department: '', status: 'Active' });
    };

    if (!isOpen) return null;

    const inputStyle = { width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' };
    const buttonStyle = { padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' };

    return (
        <div style={{ /* Modal Overlay Styles */ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ background: 'white', borderRadius: '8px', width: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
                <h2 style={{ padding: '15px 20px', margin: '0', fontSize: '18px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Create New Group</h2>
                
                <div style={{ padding: '20px', display: 'grid', gap: '15px' }}>
                    
                    {/* Group Code */}
                    <div><label style={labelStyle}>Group Code</label><input type="text" name="groupCode" value={formData.groupCode} onChange={handleChange} style={inputStyle} placeholder="Enter group code (e.g., DEV_OPS)" /></div>
                    
                    {/* Group Name */}
                    <div><label style={labelStyle}>Group Name</label><input type="text" name="groupName" value={formData.groupName} onChange={handleChange} style={inputStyle} placeholder="Enter group name" /></div>
                    
                    {/* Description */}
                    <div><label style={labelStyle}>Description</label><textarea name="description" value={formData.description} onChange={handleChange} style={{...inputStyle, minHeight: '60px'}} placeholder="Enter group description..." /></div>
                    
                    {/* Department */}
                    <div><label style={labelStyle}>Department</label><select name="department" value={formData.department} onChange={handleChange} style={inputStyle}><option value="">Select department...</option></select></div>
                    
                    {/* Status */}
                    <div><label style={labelStyle}>Status</label><select name="status" value={formData.status} onChange={handleChange} style={inputStyle}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
                    
                </div>
                
                <div style={{ padding: '15px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onClose} style={{ ...buttonStyle, background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}>Cancel</button>
                    <button onClick={handleSubmit} style={{ ...buttonStyle, background: '#3b82f6', color: 'white', border: 'none' }}>Create Group</button>
                </div>
            </div>
        </div>
     );
};

export default CreateGroupModal;