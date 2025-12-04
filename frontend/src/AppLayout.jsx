// AppLayout.jsx
import { useKeycloak } from "@react-keycloak/web";
import { useState, useEffect } from 'react';
// --- Layout Components ---
const SIDEBAR_WIDTH = '280px';
const Header = ({ username, onLogout }) => (
    <header style={{
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        background: 'rgb(31, 41, 55)', // Light Header
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 10,
        height: '60px'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* User Info (Bottom-left in your reference image, but placed here for structure) */}
            <span style={{ fontWeight: '600', color: '#fff' }}>
                Welcome, {username}
            </span>
            <button onClick={onLogout} style={logoutButtonStyle}>
                Logout
            </button>
        </div>
    </header>
);

const Sidebar = ({ currentPage, onNavigate }) => (
    <aside style={{
        width: '250px',
        background: '#1f2937', // Dark Sidebar Background
        padding: '50px 0',
        height: 'calc(100vh - 60px)', // Full height minus header
        position: 'fixed',
        top: '60px', // Below the header
        left: 0,
        color: 'white',
        paddingBottom: '60px' // Space for the footer
    }}>
        <div style={{ padding: '0 20px', marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#9ca3af' }}>POLICY MANAGEMENT</h3>
            <button
                onClick={() => onNavigate('createPolicy')}
                style={getSidebarItemStyle(currentPage === 'createPolicy')}
            >
                Create Policy
            </button>
        </div>
        <div style={{ padding: '0 20px', marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#9ca3af' }}>USER MANAGEMENT</h3>
            <button
                onClick={() => onNavigate('usermanagement')} // Assuming this is where User details go
                style={getSidebarItemStyle(currentPage === 'usermanagement')}
            >
                User
            </button>
        </div>

        <div style={{ padding: '0 20px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#9ca3af' }}>MODEL & SOURCE MANAGEMENT</h3>
            <button
                onClick={() => onNavigate('dashboard')}
                style={getSidebarItemStyle(currentPage === 'dashboard')}
            >
                Onboard Listing
            </button>
            <button
                onClick={() => onNavigate('LMOnboard')}
                style={getSidebarItemStyle(currentPage === 'LMOnboard')}
            >
                LM Onboard
            </button>
        </div>
        {/* User Info / Footer Slot (Bottom-Left) */}
        <div style={footerUserInfoStyle}>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Supurayan</span>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Super Administrator</span>
        </div>

    </aside>
);

// --- Main Layout Component ---

export default function AppLayout({ currentPage, setCurrentPage, children }) {
    const { keycloak } = useKeycloak();
    const username = keycloak.profile?.username || 'User';

    const handleLogout = () => keycloak.logout();
    const handleNavigate = (page) => setCurrentPage(page);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#e5e7eb' }}>
            {/* Top Bar/Header (Fixed) */}
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10 }}>
                <Header 
                    username={username} 
                    onLogout={handleLogout} 
                />
            </div>

            {/* Sidebar (Fixed below header) */}
            <Sidebar 
                style={{ 
                    width: SIDEBAR_WIDTH, 
                    position: 'fixed', 
                    top: 0, 
                    left: 0, 
                    height: '100vh', 
                    background: '#1f2937', 
                    overflowY: 'auto', // Allows the content inside the 100vh box to scroll
                    padding: '90px 0', // Adds padding to the top and bottom of the scrolling area
                }}
                currentPage={currentPage} 
                onNavigate={handleNavigate} 
            />
            
            {/* Main Content Area (Offset by Sidebar width and Header height) */}
            <main style={mainContentStyle}>
                {children} {/* This will render the LanguageModelsDashboard or LMOnboardPage */}
            </main>
        </div>
    );
};

// --- Styles ---
const logoutButtonStyle = {
    background: '#dc2626',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px'
};

const getSidebarItemStyle = (isActive) => ({
    width: '100%',
    textAlign: 'left',
    padding: '10px 15px',
    borderRadius: '6px',
    border: 'none',
    background: isActive ? '#06b6d4' : 'transparent', // Active state color
    color: isActive ? 'white' : '#d1d5db',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '15px',
    transition: 'all 0.2s',
    display: 'block',
    marginBottom: '5px'
});

const footerUserInfoStyle = {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    display: 'flex',
    flexDirection: 'column',
    borderTop: '1px solid #374151',
    paddingTop: '10px',
    width: 'calc(100% - 40px)'
};

const mainContentStyle = {
    flex: 1,
    padding: '30px',
    marginLeft: '250px', // Offset for the fixed sidebar
    paddingTop: '125px', // Offset for the fixed header (60px height + 30px padding)
    overflowY: 'auto',
    width: 'calc(100% - 250px)'
}