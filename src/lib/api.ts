import axios from 'axios';

// API Base URL với logic xử lý /api prefix tương tự api-client.ts
const getApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // Development
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return envUrl || 'http://localhost:3005/api';
  }
  
  // Production - prefer environment variable, fallback to same domain
  if (envUrl) {
    return envUrl;
  }
  
  // Fallback to same domain with /api path for production
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}/api`;
  }
  
  // SSR fallback
  return 'http://localhost:3005/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
});

// Debug log API URL
if (typeof window !== 'undefined' && (process.env.NODE_ENV === 'development' || window.location.search.includes('debug=api'))) {
  console.log('🌐 API_BASE_URL (api.ts):', getApiBaseUrl());
}

// Request interceptor để xử lý /api prefix và auth token
api.interceptors.request.use((config) => {
  // Xử lý /api prefix logic (tương tự api-client.ts)
  if (config.url && config.baseURL) {
    const base = config.baseURL.replace(/\/$/, '');
    const baseHasApi = /\/api(?:$|\/)/.test(base);
    
    let path = config.url.startsWith('/') ? config.url : `/${config.url}`;
    
    if (baseHasApi) {
      // strip leading '/api' from path if present to avoid /api/api
      if (path.startsWith('/api/')) {
        path = path.replace(/^\/api/, '');
      }
    } else {
      // ensure path starts with '/api/'
      if (!path.startsWith('/api/')) {
        path = `/api${path}`;
      }
    }
    
    config.url = path;
  }
  
  // Add auth token
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
