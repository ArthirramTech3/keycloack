import { useState, useEffect } from 'react';
import useApi from './useApi';
import CreateRoleModal from './CreateRoleModal';
import EditRoleModal from './components/EditRoleModal'; // Ensure this path exists

const RolesTab = () => {
    const [roles, setRoles] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [loading, setLoading] = useState(false);
    const api = useApi();

    const ROLE_BASE_PATH = 'roles';

    // Mock Helper to assign visual properties (ID, Permissions, Icons) 
    // since the raw API might not return them exactly like the screenshot.
    const enrichRoleData = (role, index) => {
        const mockPermissions = [
            { label: 'DASHBOARD ACCESS', color: '#FFF7ED', text: '#C2410C' }, // Orange
            { label: 'USER MANAGEMENT', color: '#ECFDF5', text: '#047857' }, // Green
            { label: 'SECURITY', color: '#FEF2F2', text: '#B91C1C' },        // Red
            { label: 'POLICY CONTROL', color: '#EFF6FF', text: '#1D4ED8' }   // Blue
        ];
        
        // Deterministic mock assignment based on index
        return {
            ...role,
            displayId: `R00${index + 1}`,
            iconColor: ['#F59E0B', '#3B82F6', '#EF4444', '#10B981'][index % 4],
            permissions: index === 0 ? [{ label: 'ALL PERMISSIONS', color: '#FFF7ED', text: '#C2410C' }] : [mockPermissions[index % 4]],
            userCount: Math.floor(Math.random() * 10) + 1, // Mock count
        };
    };

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/${ROLE_BASE_PATH}`);
            // Map the API response to include visual data needed for the screenshot look
            const enrichedData = response.data.map((role, index) => enrichRoleData(role, index));
            setRoles(enrichedData);
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

    const handleCreateRole = async (newRoleData) => {
        setLoading(true);
        const payload = {
            name: newRoleData.roleName,
            description: newRoleData.description,
            // Note: 'permissions' and 'roleId' might need specific backend handling
            // attributes: { permissions: newRoleData.permissions } 
        };

        try {
            await api.post(`/${ROLE_BASE_PATH}/create`, payload);
            setShowCreateModal(false);
            await fetchRoles();
        } catch (error) {
            alert(`Creation Failed: ${error.response?.data?.detail || "Unknown error"}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRole = async (roleName) => {
        if (window.confirm(`Are you sure you want to delete role ${roleName}?`)) {
            setLoading(true);
            try {
                await api.delete(`/${ROLE_BASE_PATH}/${roleName}`);
                await fetchRoles();
            } catch (error) {
                alert("Deletion Failed");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleEditClick = (role) => {
        setSelectedRole(role);
        setShowEditModal(true);
    };

    // --- STYLES ---
    const styles = {
        container: { fontFamily: "'Inter', sans-serif", color: '#111827' },
        headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
        title: { fontSize: '18px', fontWeight: '600' },
        createBtn: { padding: '8px 16px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' },
        filterBtn: { padding: '8px 16px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '500', marginLeft: '10px', cursor: 'pointer' },
        tableContainer: { background: 'white', borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', overflow: 'hidden' },
        table: { width: '100%', borderCollapse: 'collapse' },
        th: { padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', borderBottom: '1px solid #E5E7EB', textTransform: 'uppercase', letterSpacing: '0.05em' },
        td: { padding: '16px', borderBottom: '1px solid #E5E7EB', fontSize: '14px', verticalAlign: 'top' },
        
        // Specific Column Styles
        roleNameContainer: { display: 'flex', gap: '12px' },
        roleIcon: (color) => ({ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '14px' }),
        roleTitle: { fontWeight: '600', color: '#111827', display: 'block' },
        roleDesc: { fontSize: '12px', color: '#6B7280', marginTop: '2px' },
        
        badge: (bg, text) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', backgroundColor: bg, color: text, textTransform: 'uppercase', letterSpacing: '0.5px' }),
        statusActive: { display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '9999px', fontSize: '12px', fontWeight: '500', backgroundColor: '#ECFDF5', color: '#059669' },
        
        actionBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280', transition: 'color 0.2s' }
    };

    return (
        <div style={styles.container}>
            <div style={styles.headerRow}>
                <div>
                    <h2 style={styles.title}>Roles Management</h2>
                </div>
                <div>
                    <button onClick={() => setShowCreateModal(true)} style={styles.createBtn}>Create Role</button>
                    <button style={styles.filterBtn}>Filter by</button>
                </div>
            </div>

            {loading && <p>Loading...</p>}

            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Role ID</th>
                            <th style={styles.th}>Role Name</th>
                            <th style={styles.th}>Permissions</th>
                            <th style={styles.th}>Users Count</th>
                            <th style={styles.th}>Status</th>
                            <th style={{...styles.th, textAlign: 'right'}}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roles.map((role) => (
                            <tr key={role.id || role.name}>
                                <td style={styles.td}>
                                    <span style={{fontWeight: '500', color: '#374151'}}>{role.displayId || 'R00X'}</span>
                                </td>
                                <td style={styles.td}>
                                    <div style={styles.roleNameContainer}>
                                        <div style={styles.roleIcon(role.iconColor || '#ccc')}>
                                            {/* Take first letter of name */}
                                            {role.name ? role.name.charAt(0).toUpperCase() : 'R'}
                                        </div>
                                        <div>
                                            <span style={styles.roleTitle}>{role.name}</span>
                                            <span style={styles.roleDesc}>{role.description}</span>
                                        </div>
                                    </div>
                                </td>
                                <td style={styles.td}>
                                    {role.permissions && role.permissions.map((perm, idx) => (
                                        <span key={idx} style={styles.badge(perm.color, perm.text)}>
                                            {perm.label}
                                        </span>
                                    ))}
                                </td>
                                <td style={styles.td}>{role.userCount}</td>
                                <td style={styles.td}>
                                    <span style={styles.statusActive}>Active</span>
                                </td>
                                <td style={{...styles.td, textAlign: 'right'}}>
                                    <button onClick={() => handleEditClick(role)} style={styles.actionBtn} title="Edit">
                                        ✏️ 
                                    </button>
                                    <button onClick={() => handleDeleteRole(role.name)} style={{...styles.actionBtn, marginLeft: '8px'}} title="Delete">
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <CreateRoleModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onCreate={handleCreateRole} />
            
            {/* Keeping your existing Edit Modal */}
            {selectedRole && showEditModal && (
                <EditRoleModal 
                    isOpen={showEditModal} 
                    onClose={() => setShowEditModal(false)} 
                    initialData={selectedRole}
                />
            )}
        </div>
    );
};

export default RolesTab;