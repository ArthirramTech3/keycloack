// UsersTab.jsx
import { useState, useEffect } from 'react';
import { useKeycloak } from "@react-keycloak/web"; 
import CreateUserModal from './components/CreateUserModal';
import EditUserModal from './components/EditUserModal'; // <-- 1. NEW: Import Edit Modal
import useApi from './useApi';

const UsersTab = () => {
    // Existing States
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false); // For Create Modal
    const [loading, setLoading] = useState(false);
    
    // --- NEW STATES FOR EDITING ---
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null); // Holds user data being edited
    // -------------------------------
    
    const api = useApi();
    const { keycloak } = useKeycloak();
    const currentUserName = keycloak.tokenParsed?.preferred_username || 'Current User';

    // --- API FUNCTIONS ---
    
    // Fetch all users
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users'); 
            
            setUsers(response.data);
        } catch (error) {
            // ...
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Handle User Creation
    const handleCreateUser = async (newUserData) => {
        setLoading(true);
        try {
            // Data structure must match the FastAPI UserCreate model

            await api.post('/admin/users', {
                username: newUserData.username,
                password: newUserData.password, 
                email: newUserData.email,
                // Assuming fullName is handled in the modal and split here
                firstName: newUserData.fullName ? newUserData.fullName.split(' ')[0] : '', 
                lastName: newUserData.fullName && newUserData.fullName.split(' ').length > 1 ? newUserData.fullName.split(' ').slice(1).join(' ') : '',
                groupId: newUserData.groupId, // Pass the selected group ID/name
                status: newUserData.status,
            });
            setShowModal(false);
            await fetchUsers(); // Reload data
        } catch (error) {
            const errorMessage = error.response?.data?.detail || "User creation failed.";
            alert(`Creation Failed: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    // Handle User Deletion
    const handleDeleteUser = async (userId, username) => {
        if (window.confirm(`Are you sure you want to delete user ${username}?`)) {
            setLoading(true);
            try {
                await api.delete(`/users/${userId}`); 
                await fetchUsers(); // Reload data
            } catch (error) {
                const errorMessage = error.response?.data?.detail || "User deletion failed.";
                alert(`Deletion Failed: ${errorMessage}`);
            } finally {
                setLoading(false);
            }
        }
    };
    
    // Handle Status Toggle
    const handleToggleStatus = async (userId, currentStatus) => {
        setLoading(true);
        try {
            await api.put(`/users/${userId}/status`, { enabled: !currentStatus }); 
            await fetchUsers(); // Reload data
        } catch (error) {
            const errorMessage = error.response?.data?.detail || "Status update failed.";
            alert(`Status Update Failed: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };
    
    // --- NEW EDITING LOGIC (FETCH DATA) ---
    const handleEditClick = async (user) => {
        setLoading(true);
        try {
            // 1. Fetch full user details from the backend (GET /admin/users/{id})
            const response = await api.get(`/users/${user.id}`);
            
            // 2. Set the data for the modal
            setSelectedUser(response.data);
            
            // 3. Open the Edit Modal
            setShowEditModal(true); 
        } catch (error) {
            console.error("Error fetching user for edit:", error);
            alert(`Failed to load user data for ${user.username}.`);
        } finally {
            setLoading(false);
        }
    };

    // --- NEW EDITING LOGIC (SUBMIT UPDATE) ---
    const handleUpdateUser = async (updatedData) => {
        setLoading(true);
        try {
            // Send PUT request to the /admin/users/{user_id} endpoint
            // updatedData must match the FastAPI UserUpdate model
            await api.put(`/users/${updatedData.id}`, updatedData);
            
            // Success!
            setShowEditModal(false);
            alert(`Editing user ${updatedData.username} successful!`);
            await fetchUsers(); // Reload data
        } catch (error) {
            const errorMessage = error.response?.data?.detail || "An unexpected error occurred during update.";
            alert(`Update Failed: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    // --- STYLES (Kept for completeness) ---
    const headerStyle = { padding: '12px 15px', textAlign: 'left', background: '#f9fafb', color: '#6b7280', fontWeight: '600', fontSize: '13px' };
    const cellStyle = { padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '14px', color: '#374151' };

    return (
        <div>
            {/* --- ACTION BUTTONS --- */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => setShowModal(true)} style={{ padding: '10px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Create User</button>
                <button style={{ padding: '10px 24px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Import Users</button>
                <button style={{ padding: '10px 24px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Export Data</button>
            </div>

            {loading && <p>Loading users...</p>}

            {/* --- USER TABLE --- */}
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}>
                <thead>
                    <tr>
                        <th style={headerStyle}>ID</th>
                        <th style={headerStyle}>Name</th>
                        <th style={headerStyle}>Groups</th>
                        <th style={headerStyle}>Roles</th>
                        <th style={headerStyle}>Status</th>
                        <th style={headerStyle}>Created Date</th>
                        <th style={{...headerStyle, textAlign: 'center'}}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td style={cellStyle}>{user.id.substring(0, 5)}...</td>
                            <td style={cellStyle}>{user.username}</td>
                            <td style={cellStyle}>{(user.groups && user.groups.length > 0) ? user.groups.join(', ') : 'None'}</td>
                            <td style={cellStyle}>{user.roles || 'None'}</td>
                            <td style={cellStyle}>
                                <span 
                                    onClick={() => handleToggleStatus(user.id, user.enabled)} 
                                    style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', background: user.enabled ? '#ecfdf5' : '#fef2f2', color: user.enabled ? '#059669' : '#ef4444' }}
                                >
                                    {user.enabled ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td style={cellStyle}>{user.createdTimestamp ? new Date(user.createdTimestamp).toLocaleDateString() : 'N/A'}</td> 
                            <td style={{...cellStyle, textAlign: 'center'}}>
                                {/* --- EDIT BUTTON CALLS NEW HANDLER --- */}
                                <button 
                                    onClick={() => handleEditClick(user)} 
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', marginRight: '8px', fontSize: '14px' }}
                                >
                                    ✏️ 
                                </button>
                                {/* --------------------------------------- */}
                                <button 
                                    onClick={() => handleDeleteUser(user.id, user.username)} 
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '14px' }}
                                >
                                    🗑️
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* --- MODALS --- */}
            <CreateUserModal 
                isOpen={showModal} 
                onClose={() => setShowModal(false)} 
                onCreate={handleCreateUser} 
            />

            {/* --- EDIT MODAL (Conditional rendering) --- */}
            {selectedUser && (
                <EditUserModal 
                    isOpen={showEditModal} 
                    onClose={() => setShowEditModal(false)} 
                    onUpdate={handleUpdateUser}
                    initialData={selectedUser} // Pass the fetched data
                />
            )}
            {/* ------------------------------------------- */}
        </div>
    );
};

export default UsersTab;