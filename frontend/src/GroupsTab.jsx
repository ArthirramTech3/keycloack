// GroupsTab.jsx
import { useState, useEffect } from 'react';
import useApi from './useApi'; 
import CreateGroupModal from './CreateGroupModal'; 
import AddMembersModal from './AddMembersModal'; 
 import EditGroupModal from './components/EditGroupModal';
const GroupsTab = () => {
    const [groups, setGroups] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(false);
    
    // selectedGroup is used for both Edit and Members modals
    const [selectedGroup, setSelectedGroup] = useState(null); 
    
    const [loading, setLoading] = useState(false);
    const api = useApi();

    const GROUP_BASE_PATH = 'groups'; 

    const fetchGroups = async () => {
        setLoading(true);
        try {
            // FIX: Ensure API call is correct, assuming it returns group details

            const response = await api.get('/admin/groups');
            setGroups(response.data);
        } catch (error) {
            console.error("Failed to fetch groups:", error);
            setGroups([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleCreateGroup = async (newGroupData) => {
        setLoading(true);
        
        // --- FIX: Map the incoming data field to the expected 'name' field ---
        const payload = {
            // Map 'groupName' from the modal to the required backend field 'name'
            name: newGroupData.groupName, 
            
            // Pass other fields directly
            description: newGroupData.description,
            groupCode: newGroupData.groupCode,
            status: newGroupData.status,
            // Include other fields like department, permissions, etc.
            department: newGroupData.department,
            permissions: newGroupData.permissions,
        };
        // ------------------------------------------------------------------
    
        try {

            // Use the corrected payload
            await api.post('/admin/groups', payload);
            
            setShowCreateModal(false);
            await fetchGroups();
            alert(`Group ${payload.name} created successfully.`);
        } catch (error) {
            // Implement robust error handling (similar to the fix for RolesTab)
            let errorMessage = "An unknown error occurred during group creation.";
            if (error.response && error.response.data && error.response.data.detail) {
                 // Access the missing field message or the detail string
                 errorMessage = Array.isArray(error.response.data.detail) 
                               ? error.response.data.detail[0].msg 
                               : error.response.data.detail; 
            } else if (error.response && error.response.status) {
                 errorMessage = `API Error: Status ${error.response.status}. Check permissions/data format.`;
            }
            alert(`Creation Failed: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };
        
    const handleUpdateGroup = async (groupId, updatedData) => {
        setLoading(true);
        try {

            // FIX: Ensure PUT request sends only the updated fields,
            // and the endpoint is correct (e.g., /groups/{groupId})
            await api.put(`/admin/groups/${groupId}`, updatedData);
            
            setShowEditModal(false);
            setSelectedGroup(null); // Clear selected group on successful edit
            alert(`Group ${updatedData.name} updated successfully.`);
            await fetchGroups(); 
        } catch (error) {
            const errorMessage = error.response?.data?.detail || "Group update failed.";
            alert(`Update Failed: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteGroup = async (groupId, groupName) => {
        if (window.confirm(`Are you sure you want to delete group ${groupName}?`)) {
            setLoading(true);
            try {

                await api.delete(`/admin/groups/${groupId}`);
                await fetchGroups();
            } catch (error) {
                alert(`Deletion Failed: ${error.response?.data?.detail || 'Unknown error'}`);
            } finally {
                setLoading(false);
            }
        }
    };
    
    // HANDLERS TO OPEN MODALS
    const handleEditClick = (group) => {
        setSelectedGroup(group);
        setShowEditModal(true);
    };

    const openMembersModal = (group) => {
        setSelectedGroup(group);
        setShowMembersModal(true);
    };
    
    // STYLING
    const headerStyle = { padding: '12px 15px', textAlign: 'left', background: '#f9fafb', color: '#6b7280', fontWeight: '600', fontSize: '13px' };
    const cellStyle = { padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '14px', color: '#374151' };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => setShowCreateModal(true)} style={{ padding: '10px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Create Group</button>
                <button style={{ padding: '10px 24px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Filter by</button>
            </div>

            {loading && <p>Loading groups...</p>}

            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}>
                <thead>
                    <tr>
                        <th style={headerStyle}>ID</th>
                        <th style={headerStyle}>Group Name</th>
                        <th style={headerStyle}>Description</th>
                        <th style={headerStyle}>Members Count</th>
                        <th style={headerStyle}>Created By</th>
                        <th style={{...headerStyle, textAlign: 'center'}}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {groups.map((group) => (
                        <tr key={group.id}>
                            <td style={cellStyle}>{group.id.substring(0, 5)}...</td>
                            <td style={cellStyle}>{group.name}</td>
                            <td style={cellStyle}>{group.description}</td>
                            <td style={cellStyle}>
                                {/* Assuming memberCount and group properties are available on the group object */}
                                {group.memberCount || 0}
                                <button onClick={() => openMembersModal(group)} style={{ marginLeft: '10px', background: 'none', border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontSize: '12px' }}>+ Add Members</button>
                            </td>
                            <td style={cellStyle}>{group.createdBy || 'System'}</td>
                            <td style={{...cellStyle, textAlign: 'center'}}>
                                <button onClick={() => handleEditClick(group)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', marginRight: '8px', fontSize: '14px' }}>  ✏️ </button>
                                <button onClick={() => handleDeleteGroup(group.id, group.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '14px' }}>🗑️</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <CreateGroupModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onCreate={handleCreateGroup} />
            
            {/* Edit Modal: Clear selectedGroup and close modal */}
            {selectedGroup && (
                <EditGroupModal 
                    isOpen={showEditModal} 
                    onClose={() => {setShowEditModal(false); setSelectedGroup(null);}} 
                    onUpdate={handleUpdateGroup}
                    initialData={selectedGroup} 
                />
            )}
            
            {/* Add Members Modal: Clear selectedGroup and close modal */}
            {selectedGroup && (
                <AddMembersModal 
                    isOpen={showMembersModal} 
                    onClose={() => {setShowMembersModal(false); setSelectedGroup(null);}} 
                    group={selectedGroup}
                    onUpdate={fetchGroups} 
                />
            )}
        </div>
    );
};

export default GroupsTab;