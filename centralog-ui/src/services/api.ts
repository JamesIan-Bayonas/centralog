import axios from 'axios';

// Automatically shifts between your production host server and your local fallback environment
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'https://localhost:7196/api/v1' 
  : 'http://mypersonalsite-jamesian.runasp.net/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject signed JWT tokens automatically on downstream requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('centralog_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});