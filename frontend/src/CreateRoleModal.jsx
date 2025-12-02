// CreateRoleModal.jsx
import { useState } from 'react';

const CreateRoleModal = ({ isOpen, onClose, onCreate }) => {
    const [formData, setFormData] = useState({
        roleID: '',
        roleName: '',
        description: '',
        department: '',
        status: 'Active'
    });

    // Mock user list for assignment. In a real app, this would be fetched.
    const [users, setUsers] = useState([
        { id: 'user1', name: 'Kisan' },
        { id: 'user2', name: 'Santhosh' },
        { id: 'user3', name: 'Supriya' },
        { id: 'user4', name: 'Arthi' }
    ]);
    const [assignedUsers, setAssignedUsers] = useState([]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAssignUser = (userId) => {
        const userToAssign = users.find(u => u.id === userId);
        if (userToAssign && !assignedUsers.some(u => u.id === userId)) {
            setAssignedUsers([...assignedUsers, userToAssign]);
        }
    };

    const handleSubmit = () => {
        if (!formData.roleID || !formData.roleName) {
            alert('Role ID and Name are required.');
            return;
        }
        onCreate({ ...formData, assignedUsers: assignedUsers.map(u => u.id) });
        // Reset form after submission
        setFormData({ roleID: '', roleName: '', description: '', department: '', status: 'Active' });
        setAssignedUsers([]);
    };

    if (!isOpen) return null;

    const inputStyle = { width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' };
    const buttonStyle = { padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', border: 'none' };

    return (
        <div style={{ /* Modal Overlay Styles */ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ background: 'white', borderRadius: '8px', width: '650px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
                <h2 style={{ padding: '15px 20px', margin: '0', fontSize: '18px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Create New Role</h2>
                
                <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    
                    {/* Left Column */}
                    <div>
                        <div style={{marginBottom: '15px'}}><label style={labelStyle}>Role ID</label><input type="text" name="roleID" value={formData.roleID} onChange={handleChange} style={inputStyle} placeholder="Enter Role ID (e.g., R009)" /></div>
                        <div style={{marginBottom: '15px'}}><label style={labelStyle}>Role Name</label><input type="text" name="roleName" value={formData.roleName} onChange={handleChange} style={inputStyle} placeholder="Enter role name" /></div>
                        <div style={{marginBottom: '15px'}}><label style={labelStyle}>Description</label><textarea name="description" value={formData.description} onChange={handleChange} style={{...inputStyle, minHeight: '80px'}} placeholder="Enter role description..." /></div>
                        <div style={{marginBottom: '15px'}}><label style={labelStyle}>Department</label><select name="department" value={formData.department} onChange={handleChange} style={inputStyle}><option value="">Select department...</option><option value="IT">IT</option><option value="Sales">Sales</option></select></div>
                        <div><label style={labelStyle}>Status</label><select name="status" value={formData.status} onChange={handleChange} style={inputStyle}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
                    </div>

                    {/* Right Column */}
                    <div>
                        <label style={labelStyle}>Assign User</label>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                            <select onChange={(e) => handleAssignUser(e.target.value)} style={{...inputStyle, flexGrow: 1}}>
                                <option value="">Select a user to add...</option>
                                {users.filter(u => !assignedUsers.some(au => au.id === u.id)).map(user => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', background: '#f9fafb', padding: '10px', minHeight: '150px' }}>
                            <h4 style={{margin: '0 0 10px 0', fontSize: '14px'}}>Assigned Users</h4>
                            {assignedUsers.length > 0 ? assignedUsers.map(u => <div key={u.id}>{u.name}</div>) : <p style={{color: '#9ca3af', fontSize: '13px'}}>No users assigned yet.</p>}
                        </div>
                    </div>
                </div>
                
                <div style={{ padding: '15px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onClose} style={{ ...buttonStyle, background: '#6b7280', color: 'white' }}>Cancel</button>
                    <button onClick={handleSubmit} style={{ ...buttonStyle, background: '#3b82f6', color: 'white' }}>Create Role</button>
                </div>
            </div>
        </div>
    );
};

export default CreateRoleModal;