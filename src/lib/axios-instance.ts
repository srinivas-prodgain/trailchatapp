import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001') + '/api/v1',
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const url = (error.config?.baseURL || '') + (error.config?.url || '');
        const method = error.config?.method;
        const message = error.response?.data?.message || error.message || 'No error message';
        console.error('API Error →', `Status: ${status}, URL: ${method?.toUpperCase()} ${url}, Message: ${message}`);
        return Promise.reject(error);
    }
);

export default axiosInstance;