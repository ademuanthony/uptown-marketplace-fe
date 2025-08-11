import axios from 'axios';
import { auth } from '@/lib/firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async config => {
    try {
      // Get current Firebase user
      const {currentUser} = auth;
      
      if (currentUser) {
        // Get fresh Firebase token
        const token = await currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
        console.info('Added Firebase Authorization header:', `Bearer ${token.substring(0, 20)}...`);
      } else {
        // Fallback to stored token if Firebase user not available
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.info('Added stored Authorization header:', `Bearer ${token.substring(0, 20)}...`);
        } else {
          // Development mode fallback - use test token
          if (process.env.NODE_ENV === 'development' || API_BASE_URL.includes('localhost')) {
            config.headers.Authorization = 'Bearer test-user-token';
            console.info('Added development test token');
          } else {
            console.warn('No auth token available');
          }
        }
      }
    } catch (error) {
      console.error('Error getting Firebase token:', error);
      
      // Fallback to stored token
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.info('Added fallback Authorization header:', `Bearer ${token.substring(0, 20)}...`);
      } else if (process.env.NODE_ENV === 'development' || API_BASE_URL.includes('localhost')) {
        config.headers.Authorization = 'Bearer test-user-token';
        console.info('Added development fallback test token');
      }
    }
    
    return config;
  },
  error => Promise.reject(error),
);

// Response interceptor to handle errors
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.warn('401 error, attempting token refresh');
      
      try {
        const {currentUser} = auth;
        if (currentUser) {
          // Try to refresh the token
          const newToken = await currentUser.getIdToken(true);
          localStorage.setItem('auth_token', newToken);
          
          // Retry the original request with new token
          const originalRequest = error.config;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
      
      // If refresh fails, redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  },
);

export default api;