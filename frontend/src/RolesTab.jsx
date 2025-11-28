// RolesTab.jsx
import { useState, useEffect } from 'react';
import useApi from './useApi'; 
import CreateRoleModal from './CreateRoleModal'; 
 import EditRoleModal from './components/EditRoleModal';

const RolesTab = () => {
    const [roles, setRoles] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false); // Renamed for clarity
    const [showEditModal, setShowEditModal] = useState(false); // <-- NEW STATE
    const [selectedRole, setSelectedRole] = useState(null); // <-- NEW STATE
    const [loading, setLoading] = useState(false);
    const api = useApi();

    // --- API PATH CORRECTION ---
    // Assuming useApi prepends /admin/ 
    const ROLE_BASE_PATH = 'roles'; 
    // ---------------------------

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/${ROLE_BASE_PATH}`);
            setRoles(response.data);
        } catch (error) {
            console.error("Failed to fetch roles:", error);
            setRoles([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    // RolesTab.jsx

// RolesTab.jsx (Updated handleCreateRole function)

const handleCreateRole = async (newRoleData) => {
    setLoading(true);
    
    // --- FIX: Create the payload expected by the FastAPI backend ---
    const payload = {
        // Map the user-entered 'Role Name' field (assuming it's named 'roleName' 
        // in newRoleData) to the required backend field 'name'.
        name: newRoleData.roleName || newRoleData.id, 
        
        // Pass all other data fields directly
        description: newRoleData.description,
        // Include any other required fields (like permissions/scopes if needed)
        // permissions: newRoleData.permissions, 
        // status: newRoleData.status, 
    };
    // ------------------------------------------------------------------

    try {
        // API POST call using the corrected payload
        await api.post(`/${ROLE_BASE_PATH}/create`, payload);
        
        // Use setShowCreateModal since we renamed the state variable
        setShowCreateModal(false); 
        await fetchRoles();
        alert(`Role ${payload.name} created successfully!`);
    } catch (error) {
        // --- IMPROVED ERROR HANDLING ---
        let errorMessage = "An unknown error occurred during role creation.";
        
        if (error.response && error.response.data) {
            // 1. Check for FastAPI Pydantic errors (list of objects)
            if (Array.isArray(error.response.data.detail)) {
                // Display the message from the first missing/invalid field
                errorMessage = `Validation Error: Field missing or invalid. Check your input.`;
            } 
            // 2. Check for simple error string (e.g., Keycloak says "Role already exists")
            else if (typeof error.response.data.detail === 'string') {
                errorMessage = error.response.data.detail;
            }
            // 3. Handle generic status codes 
            else if (error.response.status) {
                 errorMessage = `API Error: Status ${error.response.status}. Check permissions/data format.`;
            }
        }
        
        alert(`Creation Failed: ${errorMessage}`);
    } finally {
        setLoading(false);
    }
}; 
    const handleDeleteRole = async (roleName) => {
        if (window.confirm(`Are you sure you want to delete role ${roleName}?`)) {
            setLoading(true);
            try {
                // Keycloak API uses role name for deletion
                await api.delete(`/${ROLE_BASE_PATH}/${roleName}`); 
                await fetchRoles();
            } catch (error) {
                const errorMessage = error.response?.data?.detail || "Role deletion failed.";
                alert(`Deletion Failed: ${errorMessage}`);
            } finally {
                setLoading(false);
            }
        }
    };
    
    // --- NEW EDITING LOGIC ---
    const handleEditClick = (role) => {
        // Since the GET /roles endpoint gives us all necessary data (name, description), 
        // we can often use that directly without a separate GET by ID/Name call.
        setSelectedRole(role);
        setShowEditModal(true);
    };

    const handleUpdateRole = async (currentRoleName, updatedData) => {
        setLoading(true);
        try {
            // PUT /roles/{current_role_name}
            await api.put(`/${ROLE_BASE_PATH}/${currentRoleName}`, updatedData);
            
            setShowEditModal(false);
            alert(`Role ${currentRoleName} updated successfully.`);
            await fetchRoles(); 
        } catch (error) {
            const errorMessage = error.response?.data?.detail || "Role update failed.";
            alert(`Update Failed: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };
    
    // ... (Styling remains the same)
    const headerStyle = { padding: '12px 15px', textAlign: 'left', background: '#f9fafb', color: '#6b72c0', fontWeight: '600', fontSize: '13px' };
    const cellStyle = { padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '14px', color: '#374151' };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => setShowCreateModal(true)} style={{ padding: '10px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Create Role</button>
                <button style={{ padding: '10px 24px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Filter by</button>
            </div>

            {loading && <p>Loading roles...</p>}

            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}>
                <thead>
                    <tr>
                        <th style={headerStyle}>Role Name</th>
                        <th style={headerStyle}>Description</th>
                        <th style={headerStyle}>Users Count</th>
                        <th style={headerStyle}>Status</th>
                        <th style={{...headerStyle}}>Created By</th>
                        <th style={{...headerStyle, textAlign: 'center'}}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {roles.map((role) => (
                        <tr key={role.id}>
                            <td style={cellStyle}>{role.name}</td>
                            <td style={cellStyle}>{role.description}</td>
                            <td style={cellStyle}>{role.usersCount}</td>
                            <td style={cellStyle}>
                                <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', background: role.status ? '#ecfdf5' : '#fef2f2', color: role.status ? '#059669' : '#ef4444' }}>
                                    {role.status ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td style={cellStyle}>Admin/System</td>
                            <td style={{...cellStyle, textAlign: 'center'}}>
                                {/* --- FIX: Call new edit handler --- */}
                                <button 
                                    onClick={() => handleEditClick(role)} 
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', marginRight: '8px', fontSize: '14px' }}
                                >
                                    Edit
                                </button>
                                {/* ---------------------------------- */}
                                <button onClick={() => handleDeleteRole(role.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '14px' }}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <CreateRoleModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onCreate={handleCreateRole} />
            
            {/* --- NEW EDIT MODAL --- */}
            {selectedRole && (
                <EditRoleModal 
                    isOpen={showEditModal} 
                    onClose={() => setShowEditModal(false)} 
                    onUpdate={handleUpdateRole}
                    initialData={selectedRole}
                />
            )}
            {/* ------------------------ */}
        </div>
    );
};

export default RolesTab;