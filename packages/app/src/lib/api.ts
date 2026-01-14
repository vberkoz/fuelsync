import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token = useAuthStore.getState().idToken;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const handleAuthError = async () => {
  await new Promise(resolve => setTimeout(resolve, 3000));
  useAuthStore.getState().clearAuth();
  window.location.replace('/login');
};

const safeFetch = async (url: string, options?: RequestInit) => {
  try {
    const res = await fetch(url, options);
    if (res.status === 401) {
      console.error('Authentication error - redirecting to login in 3 seconds');
      await handleAuthError();
      throw new Error('Session expired');
    }
    return res;
  } catch (error: any) {
    if (error.message === 'Session expired') throw error;
    if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      console.error('Network error - redirecting to login in 3 seconds');
      await handleAuthError();
    }
    throw error;
  }
};

const handleResponse = async (res: Response) => {
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
    },
    getPhoto: async (vehicleId: string, refillId: string, photoType: 'odometer' | 'pump' | 'receipt' = 'odometer') => {
      console.log('API getPhoto called with:', { vehicleId, refillId, photoType });
      const url = new URL(`${API_URL}/vehicles/${vehicleId}/refills/${refillId}/photo`);
      url.searchParams.set('type', photoType);
      console.log('Photo API URL:', url.toString());
      const res = await safeFetch(url.toString(), {
        headers: getAuthHeaders()
      });
      console.log('Photo API response status:', res.status);
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
    },
    getPhoto: async (vehicleId: string, expenseId: string, photoType: 'odometer' | 'receipt' = 'receipt') => {
      const url = new URL(`${API_URL}/vehicles/${vehicleId}/expenses/${expenseId}/photo`);
      url.searchParams.set('type', photoType);
      const res = await safeFetch(url.toString(), {
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
  insights: {
    getMonthlySummary: async (vehicleId: string) => {
      const res = await safeFetch(`${API_URL}/vehicles/${vehicleId}/insights/monthly-summary`, {
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
  profile: {
    get: async () => {
      const res = await safeFetch(`${API_URL}/users/me`, {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    },
    update: async (data: any) => {
      const res = await safeFetch(`${API_URL}/users/me`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    }
  },
  auth: {
    changePassword: async (data: { oldPassword: string; newPassword: string }) => {
      const accessToken = useAuthStore.getState().accessToken;
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { Authorization: `Bearer ${accessToken}` })
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to change password');
      }
      return res.json();
    }
  },
  reminders: {
    list: async () => {
      const res = await safeFetch(`${API_URL}/reminders`, {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    },
    create: async (data: any) => {
      const res = await safeFetch(`${API_URL}/reminders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    update: async (reminderId: string, data: any) => {
      const res = await safeFetch(`${API_URL}/reminders/${reminderId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    delete: async (reminderId: string) => {
      const res = await safeFetch(`${API_URL}/reminders/${reminderId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    }
  },
  brands: {
    list: async () => {
      const res = await fetch(`${API_URL}/brands`);
      return handleResponse(res);
    }
  },
  categories: {
    list: async () => {
      const res = await safeFetch(`${API_URL}/categories`, {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    },
    create: async (name: string) => {
      const res = await safeFetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name })
      });
      return handleResponse(res);
    }
  },
  ocr: {
    extract: async (image: string, scanType: string, lastOdometer?: number) => {
      const res = await safeFetch(`${API_URL}/ocr/extract`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ image, scanType, lastOdometer })
      });
      return handleResponse(res);
    }
  },
  uploads: {
    createPresigned: async (fileType: string, mediaType: string) => {
      const res = await safeFetch(`${API_URL}/uploads/presigned`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ fileType, mediaType })
      });
      return handleResponse(res);
    },
    uploadFile: async (file: File, mediaType: string) => {
      const { uploadUrl, key } = await api.uploads.createPresigned(file.type, mediaType);
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });
      return key;
    },
    getUrl: async (key: string) => {
      const res = await safeFetch(`${API_URL}/uploads/get-url`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ key })
      });
      return handleResponse(res);
    }
  }
};
