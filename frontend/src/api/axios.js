import axios from 'axios';

// 1. On définit la logique pour l'URL en premier
const getBaseURL = () => {
  // Si tu es sur le Web (navigateur), localhost suffit
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://127.0.0.1:8000/';
  }
  // Sinon, on est sur l'app mobile, on utilise l'IP locale
  return 'http://192.168.0.100:8000/';
};

// 2. On crée l'instance `api` une seule fois avec la fonction dynamique
const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// 3. Tes interceptors (Request)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 4. Tes interceptors (Response)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login') {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;