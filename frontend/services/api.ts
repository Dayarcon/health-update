import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const { refreshToken } = useAuthStore.getState();

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data.data;
          useAuthStore.setState({ accessToken });

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          useAuthStore.getState().clearAuth();
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: async (email: string, password: string, name: string, role: 'patient' | 'caregiver') => {
    const response = await api.post('/auth/register', {
      email,
      password,
      name,
      role,
    });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Patient endpoints
export const patientAPI = {
  create: async (name: string, age: number) => {
    const response = await api.post('/patients', { name, age });
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/patients');
    return response.data;
  },

  getOne: async (id: string) => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.patch(`/patients/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/patients/${id}`);
    return response.data;
  },
};

// Report endpoints
export const reportAPI = {
  upload: async (patientId: string, file: any, reportType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', patientId);
    formData.append('reportType', reportType);

    const response = await api.post('/reports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getByPatient: async (patientId: string) => {
    const response = await api.get(`/reports/patients/${patientId}`);
    return response.data;
  },

  getOne: async (id: string) => {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/reports/${id}`);
    return response.data;
  },
};

// Caregiver endpoints
export const caregiverAPI = {
  invite: async (email: string, relationship: string) => {
    const response = await api.post('/caregivers/invite', {
      email,
      relationship,
    });
    return response.data;
  },

  acceptInvitation: async (invitationCode: string) => {
    const response = await api.post('/caregivers/accept-invitation', {
      invitationCode,
    });
    return response.data;
  },

  getMyCaregivers: async () => {
    const response = await api.get('/caregivers/my-caregivers');
    return response.data;
  },

  getMyPatients: async () => {
    const response = await api.get('/caregivers/my-patients');
    return response.data;
  },

  getPatientReports: async (patientId: string) => {
    const response = await api.get(`/caregivers/patients/${patientId}/reports`);
    return response.data;
  },

  removeCaregiver: async (id: string) => {
    const response = await api.delete(`/caregivers/${id}`);
    return response.data;
  },

  updatePermissions: async (id: string, permissions: any) => {
    const response = await api.patch(`/caregivers/${id}/permissions`, {
      permissions,
    });
    return response.data;
  },
};

// Notification endpoints
export const notificationAPI = {
  getAll: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },
};

export default api;
