import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token = useAuthStore.getState().idToken;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

export const api = {
  vehicles: {
    list: async () => {
      const res = await fetch(`${API_URL}/vehicles`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      return res.json();
    },
    get: async (id: string) => {
      const res = await fetch(`${API_URL}/vehicles/${id}`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      return res.json();
    },
    create: async (data: any) => {
      const res = await fetch(`${API_URL}/vehicles`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      return res.json();
    },
    update: async (id: string, data: any) => {
      const res = await fetch(`${API_URL}/vehicles/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      return res.json();
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_URL}/vehicles/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      return res.json();
    }
  },
  refills: {
    list: async (vehicleId: string) => {
      const res = await fetch(`${API_URL}/vehicles/${vehicleId}/refills`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      return res.json();
    },
    create: async (vehicleId: string, data: any) => {
      const res = await fetch(`${API_URL}/vehicles/${vehicleId}/refills`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      return res.json();
    },
    update: async (vehicleId: string, refillId: string, data: any) => {
      const res = await fetch(`${API_URL}/vehicles/${vehicleId}/refills/${refillId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      return res.json();
    },
    delete: async (vehicleId: string, refillId: string) => {
      const res = await fetch(`${API_URL}/vehicles/${vehicleId}/refills/${refillId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      return res.json();
    }
  },
  expenses: {
    list: async (vehicleId: string) => {
      const res = await fetch(`${API_URL}/vehicles/${vehicleId}/expenses`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      return res.json();
    },
    create: async (vehicleId: string, data: any) => {
      const res = await fetch(`${API_URL}/vehicles/${vehicleId}/expenses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      return res.json();
    },
    update: async (vehicleId: string, expenseId: string, data: any) => {
      const res = await fetch(`${API_URL}/vehicles/${vehicleId}/expenses/${expenseId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      return res.json();
    },
    delete: async (vehicleId: string, expenseId: string) => {
      const res = await fetch(`${API_URL}/vehicles/${vehicleId}/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      return res.json();
    }
  }
};
