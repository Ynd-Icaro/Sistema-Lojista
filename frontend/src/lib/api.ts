import axios from 'axios';
import Cookies from 'js-cookie';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configuração de cookies robusta
const COOKIE_OPTIONS = {
  expires: 30,
  path: '/',
  sameSite: 'lax' as const,
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
};

const REFRESH_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  expires: 90,
};

// Helper para salvar token de forma segura
const saveToken = (name: string, value: string, options = COOKIE_OPTIONS) => {
  Cookies.set(name, value, options);
  // Backup no localStorage caso cookies sejam limpos
  try {
    localStorage.setItem(`backup_${name}`, value);
  } catch (e) {
    // localStorage não disponível
  }
};

// Helper para recuperar token (cookies primeiro, depois backup)
const getToken = (name: string): string | undefined => {
  let value = Cookies.get(name);
  
  // Se não encontrou no cookie, tenta backup
  if (!value) {
    try {
      const backup = localStorage.getItem(`backup_${name}`);
      if (backup) {
        // Restaura o cookie a partir do backup
        const options = name === 'refreshToken' ? REFRESH_COOKIE_OPTIONS : COOKIE_OPTIONS;
        Cookies.set(name, backup, options);
        value = backup;
      }
    } catch (e) {
      // localStorage não disponível
    }
  }
  
  return value;
};

// Helper para remover tokens
const removeTokens = () => {
  Cookies.remove('token', { path: '/' });
  Cookies.remove('refreshToken', { path: '/' });
  try {
    localStorage.removeItem('backup_token');
    localStorage.removeItem('backup_refreshToken');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth-storage');
  } catch (e) {
    // localStorage não disponível
  }
};

// Flag para evitar múltiplas tentativas de refresh
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// Interceptor para adicionar token
api.interceptors.request.use(
  (config) => {
    const token = getToken('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros e renovar token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = getToken('refreshToken');

      // Se não há refresh token ou já tentamos, redireciona para login
      if (!refreshToken) {
        removeTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Aguarda o refresh atual terminar
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken, user } = response.data;

        // Atualiza os cookies com configuração robusta
        saveToken('token', accessToken, COOKIE_OPTIONS);
        if (newRefreshToken) {
          saveToken('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);
        }
        
        // Atualiza user backup se retornado
        if (user) {
          try {
            localStorage.setItem('auth_user', JSON.stringify(user));
          } catch (e) {
            // localStorage não disponível
          }
        }

        // Notifica todos os requests pendentes
        onTokenRefreshed(accessToken);
        isRefreshing = false;

        // Refaz a requisição original com o novo token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        removeTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { name: string; email: string; password: string; tenantName: string }) =>
    api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  profile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.patch('/auth/profile', data),
};

// Dashboard API
export const dashboardApi = {
  getOverview: () => api.get('/dashboard/overview'),
  getSalesChart: (days?: number) => api.get('/dashboard/sales-chart', { params: { days } }),
  getTopProducts: (limit?: number) => api.get('/dashboard/top-products', { params: { limit } }),
  getRecentSales: (limit?: number) => api.get('/dashboard/recent-sales', { params: { limit } }),
  getLowStock: (limit?: number) => api.get('/dashboard/low-stock', { params: { limit } }),
  getPendingOrders: (limit?: number) => api.get('/dashboard/pending-orders', { params: { limit } }),
  getFinancial: () => api.get('/dashboard/financial'),
};

// Products API
export const productsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; categoryId?: string }) =>
    api.get('/products', { params }),
  getOne: (id: string) => api.get(`/products/${id}`),
  getStats: () => api.get('/products/stats'),
  getLowStock: () => api.get('/products/low-stock'),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  updateStock: (id: string, data: { quantity: number; type: string; reason?: string }) =>
    api.put(`/products/${id}/stock`, data),
  // Import/Export
  getImportTemplate: () => api.get('/products/import/template', { responseType: 'blob' }),
  importProducts: (file: File, options?: { updateExisting?: boolean; defaultCategoryId?: string }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.updateExisting) formData.append('updateExisting', 'true');
    if (options?.defaultCategoryId) formData.append('defaultCategoryId', options.defaultCategoryId);
    return api.post('/products/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  exportProducts: (params?: { categoryId?: string; status?: string; includeVariations?: boolean; format?: 'xlsx' | 'csv' }) =>
    api.get('/products/export', { params, responseType: 'blob' }),
  getProductsForReview: () => api.get('/products/review'),
  approveImport: (id: string) => api.put(`/products/${id}/approve-import`),
  // Variations
  getWithVariations: (id: string) => api.get(`/products/${id}/variations`),
  linkVariations: (parentProductId: string, variationIds: string[]) =>
    api.post('/products/variations/link', { parentProductId, variationIds }),
  unlinkVariations: (variationIds: string[]) =>
    api.post('/products/variations/unlink', { variationIds }),
};

// Categories API
export const categoriesApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/categories', { params }),
  getOne: (id: string) => api.get(`/categories/${id}`),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Suppliers API
export const suppliersApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; city?: string; state?: string; isActive?: boolean }) =>
    api.get('/suppliers', { params }),
  getOne: (id: string) => api.get(`/suppliers/${id}`),
  getSimpleList: () => api.get('/suppliers/simple'),
  getStats: () => api.get('/suppliers/stats'),
  create: (data: any) => api.post('/suppliers', data),
  update: (id: string, data: any) => api.put(`/suppliers/${id}`, data),
  delete: (id: string) => api.delete(`/suppliers/${id}`),
};

// Customers API
export const customersApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/customers', { params }),
  getOne: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
};

// Sales API
export const salesApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; startDate?: string; endDate?: string }) =>
    api.get('/sales', { params }),
  getOne: (id: string) => api.get(`/sales/${id}`),
  create: (data: any) => api.post('/sales', data),
  cancel: (id: string, reason: string) => api.post(`/sales/${id}/cancel`, { reason }),
};

// Service Orders API
export const serviceOrdersApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get('/service-orders', { params }),
  getOne: (id: string) => api.get(`/service-orders/${id}`),
  getStats: () => api.get('/service-orders/stats'),
  getOverdueCount: () => api.get('/service-orders/overdue-count'),
  create: (data: any) => api.post('/service-orders', data),
  update: (id: string, data: any) => api.put(`/service-orders/${id}`, data),
  updateStatus: (id: string, status: string, notes?: string) =>
    api.put(`/service-orders/${id}/status`, { status, notes }),
  delete: (id: string) => api.delete(`/service-orders/${id}`),
};

// Financial API
export const financialApi = {
  getTransactions: (params?: { page?: number; limit?: number; type?: string; status?: string }) =>
    api.get('/financial/transactions', { params }),
  createTransaction: (data: any) => api.post('/financial/transactions', data),
  updateTransaction: (id: string, data: any) => api.put(`/financial/transactions/${id}`, data),
  deleteTransaction: (id: string) => api.delete(`/financial/transactions/${id}`),
  confirmPayment: (id: string, paidDate?: string, paymentMethod?: string) =>
    api.put(`/financial/transactions/${id}/confirm`, { paidDate, paymentMethod }),
  getCategories: () => api.get('/financial/categories'),
  createCategory: (data: any) => api.post('/financial/categories', data),
  getBalance: () => api.get('/financial/balance'),
  getCashFlow: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/financial/cash-flow', { params }),
  getDashboard: () => api.get('/financial/dashboard'),
};

// Invoices API
export const invoicesApi = {
  getAll: (params?: { page?: number; limit?: number; type?: string; status?: string; search?: string }) => 
    api.get('/invoices', { params }),
  getOne: (id: string) => api.get(`/invoices/${id}`),
  create: (data: any) => api.post('/invoices', data),
  generate: (data: { saleId?: string; serviceOrderId?: string; type: string; warrantyDays?: number; notes?: string }) => 
    api.post('/invoices/generate', data),
  send: (id: string, methods: ('email' | 'whatsapp')[]) => api.post(`/invoices/${id}/send`, { methods }),
  sendEmail: (id: string) => api.post(`/invoices/${id}/send-email`),
  sendWhatsApp: (id: string) => api.post(`/invoices/${id}/send-whatsapp`),
  download: (id: string) => api.get(`/invoices/${id}/download`, { responseType: 'blob' }),
  getHtml: (id: string) => api.get(`/invoices/${id}/html`),
  print: (id: string) => api.get(`/invoices/${id}/print`),
  cancel: (id: string, reason: string) => api.put(`/invoices/${id}/cancel`, { reason }),
  delete: (id: string) => api.delete(`/invoices/${id}`),
};

// Users API
export const usersApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/users', { params }),
  getOne: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Settings API
export const settingsApi = {
  get: () => api.get('/settings'),
  updateCompany: (data: any) => api.patch('/settings/company', data),
  updateNotifications: (data: any) => api.patch('/settings/notifications', data),
  // Permissions
  getPermissions: () => api.get('/settings/permissions'),
  getUserPermissions: () => api.get('/settings/permissions/user'),
  checkPermission: (module: string, action: string) => 
    api.get('/settings/permissions/check', { params: { module, action } }),
  updatePermissions: (data: any) => api.patch('/settings/permissions', data),
  resetPermissions: () => api.post('/settings/permissions/reset'),
  // View Settings
  updateViewSettings: (data: any) => api.patch('/settings/view', data),
  // General Settings
  updateGeneralSettings: (data: any) => api.patch('/settings/general', data),
  // View Profiles
  getViewProfiles: () => api.get('/settings/view-profiles'),
  updateViewProfiles: (data: any) => api.patch('/settings/view-profiles', data),
  // Individual User Permissions
  getAllUsersWithPermissions: () => api.get('/settings/users-permissions'),
  getUserIndividualPermissions: (userId: string) => api.get(`/settings/user-permissions/${userId}`),
  updateUserIndividualPermissions: (data: any) => api.patch('/settings/user-permissions', data),
  resetUserPermissions: (userId: string) => api.post(`/settings/user-permissions/${userId}/reset`),
  getEffectiveUserPermissions: (userId: string) => api.get(`/settings/user-permissions/${userId}/effective`),
  getMyPermissions: () => api.get('/settings/my-permissions'),
};

// Invitations API
export const invitationsApi = {
  getAll: () => api.get('/invitations'),
  create: (data: { email: string; role?: string; name?: string }) => 
    api.post('/invitations', data),
  getByToken: (token: string) => api.get(`/invitations/token/${token}`),
  accept: (data: { token: string; name: string; password: string }) =>
    api.post('/invitations/accept', data),
  cancel: (id: string) => api.delete(`/invitations/${id}`),
  resend: (id: string) => api.post(`/invitations/${id}/resend`),
};

// Reports API
export const reportsApi = {
  generate: (reportType: string, filters: Record<string, any>) =>
    api.post(`/reports/${reportType}`, filters),
  exportPdf: (reportType: string, filters: Record<string, any>) =>
    api.post(`/reports/${reportType}/export/pdf`, filters, { responseType: 'blob' }),
  exportExcel: (reportType: string, filters: Record<string, any>) =>
    api.post(`/reports/${reportType}/export/excel`, filters, { responseType: 'blob' }),
  getPresets: () => api.get('/reports/presets'),
  savePreset: (data: { name: string; reportType: string; filters: Record<string, any> }) =>
    api.post('/reports/presets', data),
  deletePreset: (id: string) => api.delete(`/reports/presets/${id}`),
};

// Address API (CEP)
export interface AddressResponse {
  cep: string;
  street: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  ibgeCode: string;
  ddd: string;
}

export const addressApi = {
  findByCep: (cep: string) => api.get<AddressResponse>(`/address/cep/${cep}`),
  searchByAddress: (uf: string, city: string, street: string) =>
    api.get<AddressResponse[]>('/address/search', { params: { uf, city, street } }),
  getStates: () => api.get<{ code: string; name: string }[]>('/address/states'),
};
