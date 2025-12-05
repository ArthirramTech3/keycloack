// useApi.js
import axios from 'axios';
import { useKeycloak } from "@react-keycloak/web";
import { useMemo } from 'react'; // Import useMemo

const API_BASE_URL = 'http://localhost:8000'; // Base for all API endpoints

const useApi = () => {
    const { keycloak } = useKeycloak();

    const fetcher = useMemo(() => {
        const instance = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        instance.interceptors.request.use(
            (config) => {
                // Attach the current user's Keycloak access token (must have 'admin' role)
                if (keycloak.token) {
                    config.headers.Authorization = `Bearer ${keycloak.token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Add a simple error handler for the response
        instance.interceptors.response.use(
            (response) => response,
            (error) => {
                console.error("API Error:", error.response || error);
                return Promise.reject(error);
            }
        );
        return instance;
    }, [keycloak.token]); // Recreate fetcher only if keycloak.token changes

    return fetcher;
};

export default useApi;
