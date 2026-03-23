import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Cookie-based session (no token in localStorage)
});

// Response interceptor: on 401, notify auth layer to clear session
apiClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        return Promise.reject(error.response?.data || error.message);
    }
);

export default apiClient;
export { apiClient };
