import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token = useAuthStore.getState().idToken;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const handleResponse = async (res: Response) => {
  if (res.status === 401) {
    useAuthStore.getState().clearAuth();
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  if (!res.ok) throw new Error(`Error: ${res.status}`);
  return res.json();
};

export const api = {
  vehicles: {
    list: async () => {
      const res = await fetch(`${API_URL}/vehicles`, {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    },
    get: async (id: string) => {
      const res = await fetch(`${API_URL}/vehicles/${id}`, {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    },
    create: async (data: any) => {
      const res = await fetch(`${API_URL}/vehicles`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    update: async (id: string, data: any) => {
      const res = await fetch(`${API_URL}/vehicles/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_URL}/vehicles/${id}`, {
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
      const res = await fetch(url.toString(), {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    },
    create: async (vehicleId: string, data: any) => {
      const res = await fetch(`${API_URL}/vehicles/${vehicleId}/refills`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    update: async (vehicleId: string, refillId: string, data: any) => {
      const res = await fetch(`${API_URL}/vehicles/${vehicleId}/refills/${refillId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    delete: async (vehicleId: string, refillId: string) => {
      const res = await fetch(`${API_URL}/vehicles/${vehicleId}/refills/${refillId}`, {
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
      const res = await fetch(url.toString(), {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    },
    create: async (vehicleId: string, data: any) => {
      const res = await fetch(`${API_URL}/vehicles/${vehicleId}/expenses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    update: async (vehicleId: string, expenseId: string, data: any) => {
      const res = await fetch(`${API_URL}/vehicles/${vehicleId}/expenses/${expenseId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    delete: async (vehicleId: string, expenseId: string) => {
      const res = await fetch(`${API_URL}/vehicles/${vehicleId}/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    }
  }
};
