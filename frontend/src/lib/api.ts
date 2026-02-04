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
    api.post('/auth/login', { email, password }).then(res => res.data),
  register: (data: { name: string; email: string; password: string; tenantName: string }) =>
    api.post('/auth/register', data).then(res => res.data),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }).then(res => res.data),
  resetPassword: (data: { email: string; code: string; newPassword: string }) =>
    api.post('/auth/reset-password', data).then(res => res.data),
  me: () => api.get('/auth/me').then(res => res.data),
  profile: () => api.get('/auth/profile').then(res => res.data),
  updateProfile: (data: any) => api.patch('/auth/profile', data).then(res => res.data),
};

// Dashboard API
export const dashboardApi = {
  getOverview: () => api.get('/dashboard/overview').then(res => res.data),
  getSalesChart: (days?: number) => api.get('/dashboard/sales-chart', { params: { days } }).then(res => res.data),
  getTopProducts: (limit?: number) => api.get('/dashboard/top-products', { params: { limit } }).then(res => res.data),
  getRecentSales: (limit?: number) => api.get('/dashboard/recent-sales', { params: { limit } }).then(res => res.data),
  getLowStock: (limit?: number) => api.get('/dashboard/low-stock', { params: { limit } }).then(res => res.data),
  getPendingOrders: (limit?: number) => api.get('/dashboard/pending-orders', { params: { limit } }).then(res => res.data),
  getFinancial: () => api.get('/dashboard/financial').then(res => res.data),
};

// Products API
export const productsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; categoryId?: string }) =>
    api.get('/products', { params }).then(res => res.data),
  getOne: (id: string) => api.get(`/products/${id}`).then(res => res.data),
  getStats: () => api.get('/products/stats').then(res => res.data),
  getLowStock: () => api.get('/products/low-stock').then(res => res.data),
  create: (data: any) => api.post('/products', data).then(res => res.data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/products/${id}`).then(res => res.data),
  updateStock: (id: string, data: { quantity: number; type: string; reason?: string }) =>
    api.put(`/products/${id}/stock`, data).then(res => res.data),
  // Import/Export
  getImportTemplate: () => api.get('/products/import/template', { responseType: 'blob' }),
  importProducts: (file: File, options?: { updateExisting?: boolean; defaultCategoryId?: string }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.updateExisting) formData.append('updateExisting', 'true');
    if (options?.defaultCategoryId) formData.append('defaultCategoryId', options.defaultCategoryId);
    return api.post('/products/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data);
  },
  exportProducts: (params?: { categoryId?: string; status?: string; includeVariations?: boolean; format?: 'xlsx' | 'csv' }) =>
    api.get('/products/export', { params, responseType: 'blob' }),
  getProductsForReview: () => api.get('/products/review').then(res => res.data),
  approveImport: (id: string) => api.put(`/products/${id}/approve-import`).then(res => res.data),
  // Variations
  getWithVariations: (id: string) => api.get(`/products/${id}/variations`).then(res => res.data),
  createVariation: (parentProductId: string, data: any) => 
    api.post(`/products/${parentProductId}/variations`, data).then(res => res.data),
  getVariations: (parentProductId: string) => 
    api.get(`/products/${parentProductId}/variations/list`).then(res => res.data),
  updateVariation: (variationId: string, data: any) => 
    api.put(`/products/variation/${variationId}`, data).then(res => res.data),
  deleteVariation: (variationId: string) => 
    api.delete(`/products/variation/${variationId}`).then(res => res.data),
  linkVariations: (parentProductId: string, variationIds: string[]) =>
    api.post('/products/variations/link', { parentProductId, variationIds }).then(res => res.data),
  unlinkVariations: (variationIds: string[]) =>
    api.post('/products/variations/unlink', { variationIds }).then(res => res.data),
};

// Categories API
export const categoriesApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/categories', { params }).then(res => res.data),
  getOne: (id: string) => api.get(`/categories/${id}`).then(res => res.data),
  create: (data: any) => api.post('/categories', data).then(res => res.data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/categories/${id}`).then(res => res.data),
};

// Suppliers API
export const suppliersApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; city?: string; state?: string; isActive?: boolean }) =>
    api.get('/suppliers', { params }).then(res => res.data),
  getOne: (id: string) => api.get(`/suppliers/${id}`).then(res => res.data),
  getSimpleList: () => api.get('/suppliers/simple').then(res => res.data),
  getStats: () => api.get('/suppliers/stats').then(res => res.data),
  create: (data: any) => api.post('/suppliers', data).then(res => res.data),
  update: (id: string, data: any) => api.put(`/suppliers/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/suppliers/${id}`).then(res => res.data),
};

// Customers API
export const customersApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/customers', { params }).then(res => res.data),
  getOne: (id: string) => api.get(`/customers/${id}`).then(res => res.data),
  create: (data: any) => api.post('/customers', data).then(res => res.data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/customers/${id}`).then(res => res.data),
  downloadTemplate: () => api.get('/customers/import/template', { responseType: 'blob' }).then(res => res.data),
  import: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/customers/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  },
  export: (params?: any) => api.post('/customers/export', params, { responseType: 'blob' }).then(res => res.data),
};

// Sales API
export const salesApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; startDate?: string; endDate?: string }) =>
    api.get('/sales', { params }).then(res => res.data),
  getOne: (id: string) => api.get(`/sales/${id}`).then(res => res.data),
  create: (data: any) => api.post('/sales', data).then(res => res.data),
  cancel: (id: string, reason: string) => api.post(`/sales/${id}/cancel`, { reason }).then(res => res.data),
};

// Service Orders API
export const serviceOrdersApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get('/service-orders', { params }).then(res => res.data),
  getOne: (id: string) => api.get(`/service-orders/${id}`).then(res => res.data),
  getStats: () => api.get('/service-orders/stats').then(res => res.data),
  getOverdueCount: () => api.get('/service-orders/overdue-count').then(res => res.data),
  create: (data: any) => api.post('/service-orders', data).then(res => res.data),
  update: (id: string, data: any) => api.put(`/service-orders/${id}`, data).then(res => res.data),
  updateStatus: (id: string, status: string, notes?: string) =>
    api.put(`/service-orders/${id}/status`, { status, notes }).then(res => res.data),
  delete: (id: string) => api.delete(`/service-orders/${id}`).then(res => res.data),
};

// Financial API
export const financialApi = {
  getTransactions: (params?: { page?: number; limit?: number; type?: string; status?: string }) =>
    api.get('/financial/transactions', { params }).then(res => res.data),
  createTransaction: (data: any) => api.post('/financial/transactions', data).then(res => res.data),
  updateTransaction: (id: string, data: any) => api.put(`/financial/transactions/${id}`, data).then(res => res.data),
  deleteTransaction: (id: string) => api.delete(`/financial/transactions/${id}`).then(res => res.data),
  confirmPayment: (id: string, paidDate?: string, paymentMethod?: string) =>
    api.put(`/financial/transactions/${id}/confirm`, { paidDate, paymentMethod }).then(res => res.data),
  getCategories: () => api.get('/financial/categories').then(res => res.data),
  createCategory: (data: any) => api.post('/financial/categories', data).then(res => res.data),
  getBalance: () => api.get('/financial/balance').then(res => res.data),
  getCashFlow: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/financial/cash-flow', { params }).then(res => res.data),
  getDashboard: () => api.get('/financial/dashboard').then(res => res.data),
};

// Invoices API
export const invoicesApi = {
  getAll: (params?: { page?: number; limit?: number; type?: string; status?: string; search?: string }) =>
    api.get('/invoices', { params }).then(res => res.data),
  getOne: (id: string) => api.get(`/invoices/${id}`).then(res => res.data),
  create: (data: any) => api.post('/invoices', data).then(res => res.data),
  generate: (data: { saleId?: string; serviceOrderId?: string; type: string; warrantyDays?: number; notes?: string }) =>
    api.post('/invoices/generate', data).then(res => res.data),
  send: (id: string, methods: ('email' | 'whatsapp')[]) => api.post(`/invoices/${id}/send`, { methods }).then(res => res.data),
  sendEmail: (id: string) => api.post(`/invoices/${id}/send-email`).then(res => res.data),
  sendWhatsApp: (id: string) => api.post(`/invoices/${id}/send-whatsapp`).then(res => res.data),
  download: (id: string) => api.get(`/invoices/${id}/download`, { responseType: 'blob' }),
  getHtml: (id: string) => api.get(`/invoices/${id}/html`).then(res => res.data),
  print: (id: string) => api.get(`/invoices/${id}/print`).then(res => res.data),
  cancel: (id: string, reason: string) => api.put(`/invoices/${id}/cancel`, { reason }).then(res => res.data),
  delete: (id: string) => api.delete(`/invoices/${id}`).then(res => res.data),
};

// Users API
export const usersApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/users', { params }).then(res => res.data),
  getOne: (id: string) => api.get(`/users/${id}`).then(res => res.data),
  create: (data: any) => api.post('/users', data).then(res => res.data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/users/${id}`).then(res => res.data),
};

// Settings API
export const settingsApi = {
  get: () => api.get('/settings').then(res => res.data),
  updateCompany: (data: any) => api.patch('/settings/company', data).then(res => res.data),
  updateNotifications: (data: any) => api.patch('/settings/notifications', data).then(res => res.data),
  // Permissions
  getPermissions: () => api.get('/settings/permissions').then(res => res.data),
  getUserPermissions: () => api.get('/settings/permissions/user').then(res => res.data),
  checkPermission: (module: string, action: string) =>
    api.get('/settings/permissions/check', { params: { module, action } }).then(res => res.data),
  updatePermissions: (data: any) => api.patch('/settings/permissions', data).then(res => res.data),
  resetPermissions: () => api.post('/settings/permissions/reset').then(res => res.data),
  // View Settings
  updateViewSettings: (data: any) => api.patch('/settings/view', data).then(res => res.data),
  // General Settings
  updateGeneralSettings: (data: any) => api.patch('/settings/general', data).then(res => res.data),
  // View Profiles
  getViewProfiles: () => api.get('/settings/view-profiles').then(res => res.data),
  updateViewProfiles: (data: any) => api.patch('/settings/view-profiles', data).then(res => res.data),
  // Individual User Permissions
  getAllUsersWithPermissions: () => api.get('/settings/users-permissions').then(res => res.data),
  getUserIndividualPermissions: (userId: string) => api.get(`/settings/user-permissions/${userId}`).then(res => res.data),
  updateUserIndividualPermissions: (data: any) => api.patch('/settings/user-permissions', data).then(res => res.data),
  resetUserPermissions: (userId: string) => api.post(`/settings/user-permissions/${userId}/reset`).then(res => res.data),
  getEffectiveUserPermissions: (userId: string) => api.get(`/settings/user-permissions/${userId}/effective`).then(res => res.data),
  getMyPermissions: () => api.get('/settings/my-permissions').then(res => res.data),
};

// Invitations API
export const invitationsApi = {
  getAll: () => api.get('/invitations').then(res => res.data),
  create: (data: { email: string; role?: string; name?: string }) =>
    api.post('/invitations', data).then(res => res.data),
  getByToken: (token: string) => api.get(`/invitations/token/${token}`).then(res => res.data),
  accept: (data: { token: string; name: string; password: string }) =>
    api.post('/invitations/accept', data).then(res => res.data),
  cancel: (id: string) => api.delete(`/invitations/${id}`).then(res => res.data),
  resend: (id: string) => api.post(`/invitations/${id}/resend`).then(res => res.data),
};

// Reports API
export const reportsApi = {
  generate: (reportType: string, filters: Record<string, any>) =>
    api.post(`/reports/${reportType}`, filters).then(res => res.data),
  exportPdf: (reportType: string, filters: Record<string, any>) =>
    api.post(`/reports/${reportType}/export/pdf`, filters, { responseType: 'blob' }),
  exportExcel: (reportType: string, filters: Record<string, any>) =>
    api.post(`/reports/${reportType}/export/excel`, filters, { responseType: 'blob' }),
  getPresets: () => api.get('/reports/presets').then(res => res.data),
  savePreset: (data: { name: string; reportType: string; filters: Record<string, any> }) =>
    api.post('/reports/presets', data).then(res => res.data),
  deletePreset: (id: string) => api.delete(`/reports/presets/${id}`).then(res => res.data),
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
  findByCep: (cep: string) => api.get<AddressResponse>(`/address/cep/${cep}`).then(res => res.data),
  searchByAddress: (uf: string, city: string, street: string) =>
    api.get<AddressResponse[]>('/address/search', { params: { uf, city, street } }).then(res => res.data),
  getStates: () => api.get<{ code: string; name: string }[]>('/address/states').then(res => res.data),
};
