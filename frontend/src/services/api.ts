import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 (Unauthorized) or 403 (Forbidden) errors
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Check if the error is due to token expiration or invalid token
      const errorDetail = error.response.data?.detail;

      // If it's a token-related error, clear the token and redirect to login
      if (
        errorDetail?.includes('token') ||
        errorDetail?.includes('expired') ||
        errorDetail?.includes('invalid') ||
        errorDetail === 'Not authenticated' ||
        error.response.status === 401
      ) {
        localStorage.removeItem('access_token');
        // Only redirect if we're not already on the login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(new Error('登入已過期，請重新登入'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
