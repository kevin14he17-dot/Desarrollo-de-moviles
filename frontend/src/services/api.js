import axios from 'axios';
import useAuthStore from '../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores y refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        try {
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh-token`,
            { refreshToken }
          );

          const { accessToken, user } = response.data.data;
          useAuthStore.setState({ token: accessToken, user });

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          useAuthStore.setState({ user: null, token: null, refreshToken: null });
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  register: (userData) => apiClient.post('/auth/register', userData),
  login: (username, password) =>
    apiClient.post('/auth/login', { username, password }),
  getCurrentUser: () => apiClient.get('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword: newPassword,
    }),
};

// Products services
export const productService = {
  getProducts: (page = 1, pageSize = 50, searchTerm = '') =>
    apiClient.get('/products', { params: { page, pageSize, searchTerm } }),
  getProductById: (id) => apiClient.get(`/products/${id}`),
  createProduct: (data) => apiClient.post('/products', data),
  updateProduct: (id, data) => apiClient.put(`/products/${id}`, data),
  deleteProduct: (id) => apiClient.delete(`/products/${id}`),
  uploadProductImage: (id, formData) => apiClient.post(`/products/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const productImageUrl = (id) => {
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');
  return `${base}/uploads/products/${id}.png`;};

// Inventory services
export const inventoryService = {
  getInventory: (page = 1, pageSize = 50, filters = {}) =>
    apiClient.get('/inventory/stock', { params: { page, pageSize, ...filters } }),
  registerEntrada: (data) => apiClient.post('/inventory/entrada', data),
  registerSalida: (data) => apiClient.post('/inventory/salida', data),
  getKardex: (page = 1, pageSize = 50, filters = {}) =>
    apiClient.get('/inventory/kardex', { params: { page, pageSize, ...filters } }),
  getStockCritico: () => apiClient.get('/inventory/critico'),
  getInventoryValue: () => apiClient.get('/inventory/valor'),
};

// Cash drawer services
export const cashDrawerService = {
  openCashDrawer: (data) =>
    apiClient.post('/cash-drawer/open', data),
  getCurrentCashDrawer: () => apiClient.get('/cash-drawer/current'),
  addMovement: (data) => apiClient.post('/cash-drawer/movement', data),
  closeCashDrawer: (data) => apiClient.post('/cash-drawer/close', data),
  getCashDrawerHistory: (page = 1, pageSize = 50, filters = {}) =>
    apiClient.get('/cash-drawer/history', {
      params: { page, pageSize, ...filters },
    }),
  getCashSummary: (cashDrawerId) =>
    apiClient.get(`/cash-drawer/${cashDrawerId}/summary`),
};

// Sales services
export const salesService = {
  createSale: (data) => apiClient.post('/sales', data),
  getSales: (page = 1, pageSize = 50, filters = {}) =>
    apiClient.get('/sales', { params: { page, pageSize, ...filters } }),
  getSaleById: (id) => apiClient.get(`/sales/${id}`),
  cancelSale: (id) => apiClient.delete(`/sales/${id}`),
};

// Reports services
export const reportsService = {
  getSalesReport: (days = 7, filters = {}) =>
    apiClient.get('/reports/sales', { params: { days, ...filters } }),
  getTopProducts: (limit = 10, filters = {}) =>
    apiClient.get('/reports/products', { params: { limit, ...filters } }),
  getCashReport: (filters = {}) =>
    apiClient.get('/reports/cash', { params: filters }),
  getExecutiveSummary: (filters = {}) =>
    apiClient.get('/reports/daily-summary', { params: filters }),
  getPaymentMethodsAnalysis: (filters = {}) =>
    apiClient.get('/reports/payment-methods', { params: filters }),
  getPaymentMethodsReport: (days = 7, filters = {}) =>
    apiClient.get('/reports/payment-methods', { params: { days, ...filters } }),
  getInventoryAlerts: () => apiClient.get('/reports/alerts'),
};

export const settingsService = {
  getQRStatus: () => apiClient.get('/settings/qr'),
  uploadQR: (tipo, formData) => apiClient.post(`/settings/qr/${tipo}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteQR: (tipo) => apiClient.delete(`/settings/qr/${tipo}`),
};

export default apiClient;
