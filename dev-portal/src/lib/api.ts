const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = {
    get: async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            credentials: 'include',
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || `HTTP ${response.status}`);
        }
        return response.json();
    },
    
    post: async <T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> => {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined,
            ...options,
            credentials: 'include',
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || `HTTP ${response.status}`);
        }
        return response.json();
    },
};

export const devApi = {
    prices: {
        getAll: (params?: Record<string, string>) => {
            const query = params ? '?' + new URLSearchParams(params).toString() : '';
            return api.get(`/api/dev/prices${query}`);
        },
        getLatest: (params?: Record<string, string>) => {
            const query = params ? '?' + new URLSearchParams(params).toString() : '';
            return api.get(`/api/dev/prices/latest${query}`);
        },
        getTrends: (params?: Record<string, string>) => {
            const query = params ? '?' + new URLSearchParams(params).toString() : '';
            return api.get(`/api/dev/prices/trends${query}`);
        },
    },
    crops: {
        getAll: () => api.get('/api/dev/crops'),
        search: (q: string) => api.get(`/api/dev/crops/search?q=${encodeURIComponent(q)}`),
        getById: (id: string) => api.get(`/api/dev/crops/${id}`),
    },
    states: {
        getAll: () => api.get('/api/dev/states'),
        getByCode: (code: string) => api.get(`/api/dev/states/${code}`),
    },
};
