import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token = useAuthStore.getState().idToken;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const safeFetch = async (url: string, options?: RequestInit) => {
  try {
    const res = await fetch(url, options);
    if (res.status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.replace('/login');
      throw new Error('Session expired');
    }
    return res;
  } catch (error: any) {
    if (error.message === 'Session expired') throw error;
    if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      useAuthStore.getState().clearAuth();
      window.location.replace('/login');
    }
    throw error;
  }
};

const handleResponse = async (res: Response) => {
  if (res.status === 401) {
    useAuthStore.getState().clearAuth();
    window.location.replace('/login');
    return Promise.reject(new Error('Session expired'));
  }
  if (!res.ok) throw new Error(`Error: ${res.status}`);
  return res.json();
};

export const api = {
  vehicles: {
    list: async () => {
      const res = await safeFetch(`${API_URL}/vehicles`, {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    },
    get: async (id: string) => {
      const res = await safeFetch(`${API_URL}/vehicles/${id}`, {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    },
    create: async (data: any) => {
      const res = await safeFetch(`${API_URL}/vehicles`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    update: async (id: string, data: any) => {
      const res = await safeFetch(`${API_URL}/vehicles/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    delete: async (id: string) => {
      const res = await safeFetch(`${API_URL}/vehicles/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    }
  },
  refills: {
    list: async (vehicleId: string, nextToken?: string) => {
      const url = new URL(`${API_URL}/vehicles/${vehicleId}/refills`);
      if (nextToken) url.searchParams.set('nextToken', nextToken);
      const res = await safeFetch(url.toString(), {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    },
    create: async (vehicleId: string, data: any) => {
      const res = await safeFetch(`${API_URL}/vehicles/${vehicleId}/refills`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    update: async (vehicleId: string, refillId: string, data: any) => {
      const res = await safeFetch(`${API_URL}/vehicles/${vehicleId}/refills/${refillId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    delete: async (vehicleId: string, refillId: string) => {
      const res = await safeFetch(`${API_URL}/vehicles/${vehicleId}/refills/${refillId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    }
  },
  expenses: {
    list: async (vehicleId: string, nextToken?: string) => {
      const url = new URL(`${API_URL}/vehicles/${vehicleId}/expenses`);
      if (nextToken) url.searchParams.set('nextToken', nextToken);
      const res = await safeFetch(url.toString(), {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    },
    create: async (vehicleId: string, data: any) => {
      const res = await safeFetch(`${API_URL}/vehicles/${vehicleId}/expenses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    update: async (vehicleId: string, expenseId: string, data: any) => {
      const res = await safeFetch(`${API_URL}/vehicles/${vehicleId}/expenses/${expenseId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    delete: async (vehicleId: string, expenseId: string) => {
      const res = await safeFetch(`${API_URL}/vehicles/${vehicleId}/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    }
  },
  statistics: {
    get: async (vehicleId: string) => {
      const res = await safeFetch(`${API_URL}/vehicles/${vehicleId}/statistics`, {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    }
  },
  charts: {
    get: async (vehicleId: string) => {
      const res = await safeFetch(`${API_URL}/vehicles/${vehicleId}/charts`, {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    }
  },
  settings: {
    get: async () => {
      const res = await safeFetch(`${API_URL}/users/settings`, {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    },
    update: async (data: any) => {
      const res = await safeFetch(`${API_URL}/users/settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    }
  },
  auth: {
    changePassword: async (data: { oldPassword: string; newPassword: string }) => {
      const res = await safeFetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    }
  }
};
