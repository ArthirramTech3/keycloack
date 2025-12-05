import React, { useState } from 'react';
import useApi from '../useApi'; // Adjust path as necessary
import { useKeycloak } from '@react-keycloak/web';

const LMOnboardModal = ({ isOpen, onClose, onSuccess }) => {
    const { keycloak } = useKeycloak();
    const api = useApi();
    const [formData, setFormData] = useState({
        model_name: '',
        provider: '',
        api_url: '',
        api_key: '',
        is_public: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const token = keycloak.token;
            if (!token) {
                throw new Error("User not authenticated.");
            }

            // Include Authorization header for admin endpoint
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            
            const response = await api.post('/admin/models/create', formData, { headers });

            if (response.status !== 200 && response.status !== 201) {
                throw new Error(response.data.detail || 'Failed to onboard the model.');
            }
            setSuccessMessage('Model onboarded successfully!');
            onSuccess(); // Trigger refresh in parent component
            setTimeout(() => {
                onClose(); // Close modal after a short delay
            }, 1500);
        } catch (err) {
            console.error('Error onboarding model:', err);
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDiscard = () => {
        setFormData({
            model_name: '',
            provider: '',
            api_url: '',
            api_key: '',
            is_public: false,
        });
        setError(null);
        setSuccessMessage(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full m-4">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">LM Onboard Configuration</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Provider</label>
                        <select
                            name="provider"
                            value={formData.provider}
                            onChange={handleChange}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                            <option value="">Select Provider</option>
                            <option value="OpenAI">OpenAI</option>
                            <option value="Anthropic">Anthropic</option>
                            <option value="Google AI Studio">Google AI Studio</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Models</label>
                        <input
                            type="text"
                            name="model_name"
                            value={formData.model_name}
                            onChange={handleChange}
                            placeholder="e.g., gpt-4, claude-3, gemini-pro"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">API Endpoint</label>
                        <input
                            type="text"
                            name="api_url"
                            value={formData.api_url}
                            onChange={handleChange}
                            placeholder="Enter API endpoint URL"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Key</label>
                        <input
                            type="password"
                            name="api_key"
                            value={formData.api_key}
                            onChange={handleChange}
                            placeholder="Enter API key"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="is_public"
                            checked={formData.is_public}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="is_public" className="ml-2 block text-sm text-gray-900">
                            Is Public
                        </label>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm mt-2">{error}</div>
                    )}
                    {successMessage && (
                        <div className="text-green-600 text-sm mt-2">{successMessage}</div>
                    )}

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={handleDiscard}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md border border-transparent hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            disabled={isSubmitting}
                        >
                            Discard
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md border border-transparent hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : 'Save & Submit'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LMOnboardModal;
