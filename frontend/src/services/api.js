import axios from 'axios';

// Base URL — reads from Vite env, falls back to localhost
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (email, name, role) =>
  api.post('/api/login', { email, name, role });

// ── Articles ──────────────────────────────────────────────────────────────────
export const getArticles  = (params = {}) => api.get('/api/articles', { params });
export const getArticle   = (id)           => api.get(`/api/articles/${id}`);
export const createArticle= (data)         => api.post('/api/articles', data);
export const updateArticle= (id, data)     => api.put(`/api/articles/${id}`, data);
export const deleteArticle= (id)           => api.delete(`/api/articles/${id}`);
export const patchStatus  = (id, data)     => api.patch(`/api/articles/${id}/status`, data);

// ── History ───────────────────────────────────────────────────────────────────
export const getHistory   = (id)           => api.get(`/api/articles/${id}/history`);
export const addHistory   = (id, data)     => api.post(`/api/articles/${id}/history`, data);

// ── Upload ────────────────────────────────────────────────────────────────────
export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export default api;
