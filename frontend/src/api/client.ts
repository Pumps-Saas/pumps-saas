import axios from 'axios';
import { OperatingPointResult } from '../types/engineering';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor to add Token
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const api = {
    auth: {
        login: (credentials: FormData | URLSearchParams) => apiClient.post('/auth/login', credentials, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }),
        register: (data: any) => apiClient.post('/auth/register', data),
        me: () => apiClient.get('/auth/me'),
    },
    projects: {
        list: () => apiClient.get('/projects/'),
        create: (data: any) => apiClient.post('/projects/', data),
        get: (id: number) => apiClient.get(`/projects/${id}`),
        delete: (id: number) => apiClient.delete(`/projects/${id}`),
        // Scenarios
        addScenario: (projectId: number, data: any) => apiClient.post(`/projects/${projectId}/scenarios`, data),
        deleteScenario: (scenarioId: number) => apiClient.delete(`/projects/scenarios/${scenarioId}`),
    },
    fluids: {
        list: () => apiClient.get('/fluids/custom'),
        create: (data: any) => apiClient.post('/fluids/custom', data),
        delete: (id: number) => apiClient.delete(`/fluids/custom/${id}`),
        standards: () => apiClient.get('/fluids/standards'),
    },
    pumps: {
        list: () => apiClient.get('/pumps/'),
        create: (data: any) => apiClient.post('/pumps/', data),
        delete: (id: number) => apiClient.delete(`/pumps/${id}`),
    },
    calculate: {
        operatingPoint: (data: any) => apiClient.post('/calculate/operating-point', data),
        systemCurve: (data: any) => apiClient.post('/calculate/system-curve', data),
    }
};
