// useApi.js
import axios from 'axios';
import { useKeycloak } from "@react-keycloak/web";


const API_BASE_URL = 'http://localhost:8000'; // Base for all backend endpoints

const useApi = () => {
    const { keycloak } = useKeycloak();

    const fetcher = axios.create({
        baseURL: API_BASE_URL,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    fetcher.interceptors.request.use(
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
    fetcher.interceptors.response.use(
        (response) => response,
        (error) => {
            console.error("API Error:", error.response || error);
            // Removing the disruptive alert. Errors should be handled in the component's catch block.
            // const message = error.response?.data?.detail || "An unexpected error occurred.";
            // alert(`API Error: ${message}`);
            return Promise.reject(error);
        }
    );

    return fetcher;
};

export default useApi;