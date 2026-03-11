import axios from 'axios';

const getBaseURL = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://127.0.0.1:8000/';
  }

  return 'https://miche-kazadi-djangowhat-sppclone-1.onrender.com/'; 
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }

  return config;
});

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