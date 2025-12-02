// ModelCard.jsx

const ModelCard = ({ name, version, isPrivate, buttonColor, onConfigure }) => {
    return (
      <div style={{
        background: 'white',
        border: '2px dotted #9ca3af',
        borderRadius: '8px',
        padding: '24px 20px',
        width: '100%',
        minHeight: '280px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px', flex: '0 0 auto' }}>
          <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>
            • {isPrivate ? 'Private' : 'Public Hosted'}
          </span>
          <h3 style={{ margin: '10px 0 6px 0', fontSize: '20px', fontWeight: 'bold', color: '#111827', letterSpacing: '0.5px' }}>
            {name}
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#dc2626', fontWeight: '700' }}>{version}</p>
        </div>
  
        <div style={{
          borderTop: '3px solid #3b82f6',
          paddingTop: '16px',
          marginBottom: '20px',
          flex: '1 1 auto'
        }}>
          <ul style={{ 
            listStyle: 'disc', 
            paddingLeft: '20px', 
            margin: 0, 
            color: '#4b5563', 
            fontSize: '12px',
            lineHeight: '1.8'
          }}>
            <li>Meta Features</li>
            <li>45 Parameter</li>
            <li>34 Temperature</li>
            <li>Score/Benchmark</li>
          </ul>
        </div>
  
        <button
          onClick={onConfigure}
          style={{
          width: '100%',
          padding: '11px',
          background: buttonColor,
          color: 'white',
          border: 'none',
          borderRadius: '20px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '12px',
          letterSpacing: '0.5px',
          flex: '0 0 auto'
        }}>
          VIEW/CONFIGURE
        </button>
      </div>
    );
  };
  
  export default ModelCard;