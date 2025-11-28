// UserManagement.jsx
import { useState } from 'react';
import UsersTab from './UsersTab';
import GroupsTab from './GroupsTab';
import RolesTab from './RolesTab';

const UserManagement = () => {
    const [activeTab, setActiveTab] = useState('users'); // users, groups, or roles

    const tabStyle = (tabName) => ({
        padding: '10px 20px',
        cursor: 'pointer',
        fontWeight: '500',
        fontSize: '15px',
        color: activeTab === tabName ? '#3b82f6' : '#6b7280',
        borderBottom: activeTab === tabName ? '3px solid #3b82f6' : '3px solid transparent',
        transition: 'all 0.2s',
        marginRight: '15px'
    });

    const renderContent = () => {
        switch (activeTab) {
            case 'users':
                return <UsersTab />;
            case 'groups':
                // Placeholder for GroupsTab
                return <GroupsTab />;
            case 'roles':
                // Placeholder for RolesTab
                return <RolesTab />;
            default:
                return <UsersTab />;
        }
    };

    return (
        <div style={{ padding: '0 40px', maxWidth: '1400px', margin: '0 auto' }}>
            <h1 style={{ margin: '0 0 5px 0', fontSize: '26px', fontWeight: 'bold', color: '#111827' }}>
                Accounts Management
            </h1>
            <p style={{ margin: '0 0 30px 0', color: '#4b5563', fontSize: '14px' }}>
                Manage users, groups, and roles within the organization
            </p>

            <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '20px' }}>
                <div style={{ display: 'flex' }}>
                    <div style={tabStyle('users')} onClick={() => setActiveTab('users')}>Users</div>
                    <div style={tabStyle('groups')} onClick={() => setActiveTab('groups')}>Groups</div>
                    <div style={tabStyle('roles')} onClick={() => setActiveTab('roles')}>Roles</div>
                </div>
            </div>

            {renderContent()}
        </div>
    );
};

export default UserManagement;