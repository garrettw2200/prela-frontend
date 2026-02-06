import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global variable to store getToken function from Clerk
let clerkGetToken: (() => Promise<string | null>) | null = null;

// Function to set Clerk getToken (called from ClerkProvider setup)
export function setClerkGetToken(getToken: () => Promise<string | null>) {
  clerkGetToken = getToken;
}

// Request interceptor (add Clerk JWT token)
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Try to get Clerk token
    if (clerkGetToken) {
      try {
        const token = await clerkGetToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Failed to get Clerk token:', error);
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor (handle errors globally)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Clerk will handle the redirect to sign-in
      window.location.href = '/sign-in';
    }

    // Handle 403 Forbidden (subscription issue)
    if (error.response?.status === 403) {
      console.error('Subscription issue:', error.response.data);
      // Could show a modal or notification about subscription status
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
