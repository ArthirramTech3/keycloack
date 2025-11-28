// AddMembersModal.jsx

import React, { useState, useEffect } from 'react';
import useApi from './useApi';

// (Include the standard modalStyles object here, same as EditUserModal)
const modalStyles = {
    backdrop: {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', 
        alignItems: 'center', zIndex: 1000
    },
    content: {
        backgroundColor: 'white', padding: '30px', borderRadius: '8px', 
        width: '600px', maxHeight: '80vh', overflowY: 'auto', 
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    },
    // ... (other form styles)
};


const AddMembersModal = ({ isOpen, onClose, group, onUpdate }) => {
    const api = useApi();
    const [availableUsers, setAvailableUsers] = useState([]);
    const [currentMembers, setCurrentMembers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    // --- FIX: Ensure useEffect runs ONLY when the modal opens or group ID changes ---
    useEffect(() => {
        if (isOpen && group && group.id) {
            fetchUsersAndMembers(group.id);
        }
    }, [isOpen, group ? group.id : null]); // Dependency on stable ID

// AddMembersModal.jsx

const fetchUsersAndMembers = async (groupId) => {
    setLoading(true);
    try {
        // 1. Fetch ALL users using the standard /users path
        const usersResponse = await api.get('/users'); // CHANGE IS HERE
        
        // 2. Fetch current group members (API call 2)
        const membersResponse = await api.get(`/groups/${groupId}/members`); 
        
        setCurrentMembers(membersResponse.data);
        
        // Filter available users to exclude current members
        const memberIds = new Set(membersResponse.data.map(m => m.id));
        const filteredUsers = usersResponse.data.filter(u => !memberIds.has(u.id));
        setAvailableUsers(filteredUsers);
        
    } catch (error) {
        console.error("Failed to fetch data for members modal:", error);
        alert("Failed to load user and member lists.");
    } finally {
        setLoading(false);
    }
};    
    const handleAddMembers = async () => {
        if (selectedUsers.length === 0) return;

        setLoading(true);
        try {
            // API call to add members to the group
            await api.post(`/groups/${group.id}/members`, { 
                members_ids: selectedUsers 
            });
            
            alert(`${selectedUsers.length} member(s) added successfully.`);
            onClose();      // Close modal
            onUpdate();     // Refresh GroupsTab data
        } catch (error) {
            alert(`Failed to add members: ${error.response?.data?.detail || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };
    
    if (!isOpen || !group) return null;

    return (
        <div style={modalStyles.backdrop}>
            <div style={modalStyles.content}>
                <h3>Manage Members for: {group.name}</h3>
                
                {loading ? (
                    <p>Loading member lists...</p>
                ) : (
                    <>
                        {/* List current members */}
                        <h4>Current Members ({currentMembers.length})</h4>
                        {/* Render current members here... */}
                        
                        {/* List available users to add */}
                        <h4>Available Users to Add ({availableUsers.length})</h4>
                        <select multiple size="10" onChange={(e) => 
                            setSelectedUsers(Array.from(e.target.selectedOptions, option => option.value))
                        }>
                            {availableUsers.map(user => (
                                <option key={user.id} value={user.id}>{user.username} ({user.email})</option>
                            ))}
                        </select>
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button onClick={onClose}>Cancel</button>
                            <button onClick={handleAddMembers} disabled={selectedUsers.length === 0}>
                                Add Selected ({selectedUsers.length})
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AddMembersModal;