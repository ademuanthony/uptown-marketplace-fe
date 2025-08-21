import axios from 'axios';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token refresh state to prevent multiple simultaneous refreshes
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

// Request interceptor to add auth token
api.interceptors.request.use(
  async config => {
    try {
      // Get current Firebase user
      const { currentUser } = auth;

      if (currentUser) {
        // Get Firebase token (cached for 5 minutes by default)
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
      const errorMessage =
        error.response?.data?.message || error.response?.data?.error?.message || '';

      // Check if this is a "user not registered" error or similar auth errors
      const isUserNotRegistered =
        errorMessage.toLowerCase().includes('user not registered') ||
        errorMessage.toLowerCase().includes('user not found') ||
        error.response?.data?.code === 'USER_NOT_REGISTERED';

      if (isUserNotRegistered) {
        console.warn('User not registered in backend, signing out Firebase user');

        // Sign out Firebase user completely to stop the infinite loop
        try {
          await signOut(auth);
        } catch (signOutError) {
          console.error('Error signing out Firebase user:', signOutError);
        }

        // Clear local storage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');

        // Redirect to registration or login page
        window.location.href = '/auth/login?message=Please register or sign in';
        return Promise.reject(error);
      }

      // For other 401 errors, try token refresh first
      console.warn('401 error, attempting token refresh');

      try {
        const { currentUser } = auth;
        if (currentUser) {
          // Prevent multiple simultaneous refresh attempts
          if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = currentUser.getIdToken(true);
          }

          // Wait for the refresh to complete
          const newToken = await refreshPromise;
          if (newToken) {
            localStorage.setItem('auth_token', newToken);

            // Retry the original request with new token
            const originalRequest = error.config;
            if (!originalRequest._retry) {
              originalRequest._retry = true;
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return api(originalRequest);
            }
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }

      // // If refresh fails or this is a retry, sign out and redirect
      // console.warn('Authentication failed, signing out user');

      // try {
      //   await signOut(auth);
      // } catch (signOutError) {
      //   console.error('Error signing out Firebase user:', signOutError);
      // }

      // localStorage.removeItem('auth_token');
      // localStorage.removeItem('user');
      // window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  },
);

export default api;
