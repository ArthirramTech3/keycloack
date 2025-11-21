import { useKeycloak } from '@react-keycloak/web';
import { useState } from 'react';

function App() {
  const { keycloak, initialized } = useKeycloak();
  const [protectedData, setProtectedData] = useState(null);

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:8000/protected', {
        headers: {
          Authorization: `Bearer ${keycloak.token}`,
        },
      });
      const data = await response.json();
      setProtectedData(data.message);
    } catch (error) {
      console.error('Error fetching protected data:', error);
      setProtectedData('Error fetching data');
    }
  };

  if (!initialized) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Keycloak React App</h1>
      {keycloak.authenticated ? (
        <div>
          <p>Welcome, {keycloak.tokenParsed.preferred_username}!</p>
          <button onClick={() => keycloak.logout()}>Logout</button>
          <button onClick={fetchData}>Fetch Protected Data</button>
          {protectedData && <p>{protectedData}</p>}
        </div>
      ) : (
        <button onClick={() => keycloak.login()}>Login</button>
      )}
    </div>
  );
}

export default App;
