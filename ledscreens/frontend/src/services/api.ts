import axios from 'axios';

const isCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor;
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && !isCapacitor;

// Dynamic Base URL Resolution with /api normalization
const getApiBaseUrl = () => {
  if (isLocalhost) {
    return 'http://localhost:5000/api';
  }
  let url = import.meta.env.VITE_API_URL || 'https://api.e3di.org/api';
  url = url.replace(/\/$/, '');
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
};

const baseURL = getApiBaseUrl();
console.log('📡 API BaseURL:', baseURL);

const API = axios.create({ baseURL });

// Add a request interceptor to include the JWT token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle token expiration globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("⚠️ Token expired or unauthorized. Logging out...");
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login' && !window.location.pathname.startsWith('/gov')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const getFullStreamUrl = (relativeUrl: string) => {
  if (!relativeUrl) return '';
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) return relativeUrl;
  
  let base = getApiBaseUrl();
  base = base.replace(/\/$/, '');
  if (base.endsWith('/api')) {
    base = base.slice(0, -4);
  }
  
  const cleanPath = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
  return `${base}${cleanPath}`;
};

export default API;
