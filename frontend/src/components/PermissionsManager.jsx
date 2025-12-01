import React, { useState, useEffect } from 'react';
import { useKeycloak } from '@react-keycloak/web';

const PermissionsManager = () => {
  const { keycloak } = useKeycloak();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({});

  const apiFetch = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'Content-Type': 'application/json',
      Authorization: `Bearer ${keycloak.token}`,
    };
    const response = await fetch(`http://localhost:8000${url}`, { ...options, headers });
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    return response.json();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rolesData = await apiFetch('/admin/roles');
        const permissionsData = await apiFetch('/api/permissions');
        const rolePermissionsData = await apiFetch('/api/role-permissions');

        setRoles(rolesData.map(role => role.name));
        setPermissions(permissionsData);
        setRolePermissions(rolePermissionsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        // Handle error (e.g., show a message to the user)
      }
    };

    if (keycloak.token) {
      fetchData();
    }
  }, [keycloak.token]);

  // Handle checkbox change
  const handlePermissionChange = (role, permission) => {
    setRolePermissions(prevState => ({
      ...prevState,
      [role]: {
        ...prevState[role],
        [permission]: !prevState[role][permission],
      },
    }));
  };

  const handleSave = async () => {
    try {
      await apiFetch('/api/role-permissions', {
        method: 'POST',
        body: JSON.stringify({ permissions: rolePermissions }),
      });
      alert('Permissions saved successfully!');
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('An error occurred while saving permissions.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Permissions Manager</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Default</th>
              {roles.map(role => (
                <th key={role} className="py-2 px-4 border-b text-center">{role}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissions.map(permission => (
              <tr key={permission}>
                <td className="py-2 px-4 border-b">{permission}</td>
                {roles.map(role => (
                  <td key={role} className="py-2 px-4 border-b text-center">
                    <input
                      type="checkbox"
                      checked={rolePermissions[role]?.[permission] || false}
                      onChange={() => handlePermissionChange(role, permission)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end mt-4">
        <button
          onClick={handleSave}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default PermissionsManager;
