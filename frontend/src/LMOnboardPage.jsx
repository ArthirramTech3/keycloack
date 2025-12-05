import { useState, useEffect, useCallback } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import useApi from './useApi';
import LMOnboardModal from './components/LMOnboardModal'; // Import the new modal component
import ModelCard from './components/ModelCard'; // Assuming ModelCard exists for displaying models

const LMOnboardPage = ({ setCurrentPage }) => {
  const { keycloak } = useKeycloak();
  const api = useApi();
  const [models, setModels] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/models'); // Fetch models from the backend
      if (response.status === 200) {
        setModels(response.data);
      } else {
        throw new Error(response.data.detail || 'Failed to fetch models.');
      }
    } catch (err) {
      console.error('Error fetching models:', err);
      setError(`Failed to load models: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleOnboardSuccess = () => {
    setIsModalOpen(false);
    fetchModels(); // Refresh the list of models
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading models...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage and configure onboarded AI models</h2>
        <button
          onClick={openModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Onboard LM
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.length > 0 ? (
          models.map(model => (
            <ModelCard key={model.id} model={model} onUpdate={fetchModels} onDelete={fetchModels} />
          ))
        ) : (
          <p className="text-gray-600 col-span-full text-center">No models onboarded yet. Click "Onboard LM" to add one.</p>
        )}
      </div>

      <LMOnboardModal isOpen={isModalOpen} onClose={closeModal} onSuccess={handleOnboardSuccess} />
    </div>
  );
};

export default LMOnboardPage;
