import React, { useState } from 'react';

const styles = {
    container: {
        maxWidth: '700px',
        margin: '40px auto',
        padding: '30px 40px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
    },
    header: {
        textAlign: 'center',
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: '20px'
    },
    detailsSection: {
        marginBottom: '25px'
    },
    detailItem: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: '1px solid #f3f4f6'
    },
    detailLabel: {
        color: '#4b5563',
        fontWeight: '600'
    },
    detailValue: {
        color: '#111827',
        fontWeight: '500'
    },
    buttonGroup: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '30px'
    },
    button: {
        padding: '10px 25px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '15px'
    },
    sectionTitle: {
        color: '#374151',
        marginBottom: '15px',
        fontSize: '18px',
        fontWeight: '600',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '10px'
    },
    formRow: {
        display: 'flex',
        gap: '20px',
        marginBottom: '15px',
        alignItems: 'center'
    },
    formControl: {
        flex: 1
    },
    input: {
        width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
        borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'
    }
};

const LMThresholdPage = ({ model, setCurrentPage }) => {
    // Use placeholder data if no model is passed
    const displayModel = model || {
        provider: 'Anthropic',
        name: 'Gemini Pro',
        endpoint: 'http://localhost:5173/',
        status: 'inactive'
    };

    const [threshold, setThreshold] = useState('');
    const [timeLimit, setTimeLimit] = useState('per_day');
    const [assignType, setAssignType] = useState('users');
    const [selectedAssignees, setSelectedAssignees] = useState([]);

    // Mock data for assignment dropdowns
    const mockUsers = [{ id: 'user1', name: 'Kisan' }, { id: 'user2', name: 'Santhosh' }];
    const mockGroups = [{ id: 'group1', name: 'Development' }, { id: 'group2', name: 'DevOps' }];

    return (
        <div style={styles.container}>
            <h2 style={styles.header}>Set User Thresholds</h2>

            <div style={styles.detailsSection}>
                <h3 style={styles.sectionTitle}>Model Details</h3>
                <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Provider:</span>
                    <span style={styles.detailValue}>{displayModel.provider}</span>
                </div>
                <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Model:</span>
                    <span style={styles.detailValue}>{displayModel.name}</span>
                </div>
                <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Endpoint:</span>
                    <span style={styles.detailValue}>{displayModel.endpoint || 'N/A'}</span>
                </div>
                <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Status:</span>
                    <span style={{ color: displayModel.status === 'active' ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                        {displayModel.status ? displayModel.status.toUpperCase() : 'INACTIVE'}
                    </span>
                </div>
            </div>

            <div style={styles.detailsSection}>
                <h3 style={styles.sectionTitle}>User Thresholds</h3>
                <div style={styles.formRow}>
                    <div style={styles.formControl}>
                        <label style={styles.detailLabel}>Threshold Limit per User</label>
                        <input type="number" value={threshold} onChange={e => setThreshold(e.target.value)} style={styles.input} placeholder="e.g., 100" />
                    </div>
                    <div style={styles.formControl}>
                        <label style={styles.detailLabel}>Time Limit</label>
                        <select value={timeLimit} onChange={e => setTimeLimit(e.target.value)} style={styles.input}>
                            <option value="per_day">Per Day</option>
                            <option value="per_week">Per Week</option>
                            <option value="per_month">Per Month</option>
                        </select>
                    </div>
                </div>
            </div>

            <div style={styles.detailsSection}>
                <h3 style={styles.sectionTitle}>Assign to Users/Groups</h3>
                <div style={styles.formRow}>
                    <div style={styles.formControl}>
                        <label style={styles.detailLabel}>Assign to</label>
                        <select value={assignType} onChange={e => setAssignType(e.target.value)} style={styles.input}>
                            <option value="users">Users</option>
                            <option value="groups">Groups</option>
                        </select>
                    </div>
                    <div style={{ ...styles.formControl, flex: 2 }}>
                        <label style={styles.detailLabel}>Select {assignType === 'users' ? 'Users' : 'Groups'}</label>
                        <select
                            multiple
                            value={selectedAssignees}
                            onChange={e => setSelectedAssignees(Array.from(e.target.selectedOptions, option => option.value))}
                            style={{ ...styles.input, height: '100px' }}
                        >
                            {(assignType === 'users' ? mockUsers : mockGroups).map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div style={styles.buttonGroup}>
                <button onClick={() => setCurrentPage('LMOnboard')} style={{ ...styles.button, background: '#e5e7eb', color: '#4b5563' }}>Start Over</button>
                <button onClick={() => alert('Save Thresholds clicked!')} style={{ ...styles.button, background: '#3b82f6', color: 'white' }}>Save Thresholds</button>
            </div>
        </div>
    );
};

export default LMThresholdPage;
 