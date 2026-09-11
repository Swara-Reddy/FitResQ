import axios from 'axios';

export const AWS_API_BASE_URL = 'https://qhk28b7ud2.execute-api.ap-south-1.amazonaws.com';

export const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.trim()) ||
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? '' : AWS_API_BASE_URL);

export const DEMO_USER_ID =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEMO_USER_ID && import.meta.env.VITE_DEMO_USER_ID.trim())
    ? import.meta.env.VITE_DEMO_USER_ID.trim()
    : 'CUS-001';

/**
 * FitResQ Core API Client
 * Clean Axios client connected to AWS API Gateway backend.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor for Cognito JWT Auth token attachment
api.interceptors.request.use(
  (config) => {
    // Strictly prioritize Cognito ID token for API Gateway Cognito Authorizer
    const idToken =
      localStorage.getItem('fitresq_id_token') ||
      sessionStorage.getItem('fitresq_id_token');
    const token =
      idToken ||
      localStorage.getItem('fitresq_token') ||
      localStorage.getItem('fitresq_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error parsing
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle standard API errors gracefully while preserving response status for caller handling
    const message =
      error.response?.data?.message || error.message || 'An unexpected error occurred';
    const err = new Error(message);
    err.response = error.response;
    err.status = error.response?.status;
    return Promise.reject(err);
  }
);

export default api;
