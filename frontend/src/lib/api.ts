import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('neurobalance-store');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const token = parsed?.state?.token;
        if (token) config.headers.Authorization = `Bearer ${token}`;
      } catch { /* ignore */ }
    }
  }
  return config;
});

// Auth
export const signup = (email: string, password: string, name?: string) =>
  api.post('/api/auth/signup', { email, password, name }).then((r) => r.data);

export const login = (email: string, password: string) =>
  api.post('/api/auth/login', { email, password }).then((r) => r.data);

export const getMe = () => api.get('/api/auth/me').then((r) => r.data);

// Sessions
export const startSession = () =>
  api.post('/api/sessions/start').then((r) => r.data);

export const endSession = (sessionId: string) =>
  api.post(`/api/sessions/${sessionId}/end`).then((r) => r.data);

// Readings
export const saveReading = (payload: object) =>
  api.post('/api/readings', payload).then((r) => r.data);

// Analytics
export const getAnalytics = () => api.get('/api/analytics').then((r) => r.data);

// Interventions
export const logIntervention = (payload: object) =>
  api.post('/api/interventions', payload).then((r) => r.data);

export const respondIntervention = (id: string, response: string) =>
  api.patch(`/api/interventions/${id}/respond`, { response }).then((r) => r.data);

// Settings
export const updateSettings = (payload: object) =>
  api.patch('/api/settings', payload).then((r) => r.data);
