import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true;

let activeRequests = 0;
let setGlobalProcessing: ((loading: boolean) => void) | null = null;

export const handleProcessing = (handler: (loading: boolean) => void) => {
    setGlobalProcessing = handler;
};

// --- Interceptor de request ---
axios.interceptors.request.use((config) => {
    activeRequests++;
    if (setGlobalProcessing) setGlobalProcessing(true);
    return config;
});

// --- Interceptor de response ---
axios.interceptors.response.use(
    (response) => {
        activeRequests--;
        if (activeRequests <= 0 && setGlobalProcessing) setGlobalProcessing(false);
        return response;
    },
    (error) => {
        activeRequests--;
        if (activeRequests <= 0 && setGlobalProcessing) setGlobalProcessing(false);
        return Promise.reject(error);
    },
);

export default axios;
