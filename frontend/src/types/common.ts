// Common/Shared interfaces

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// Query params
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

// Form field config
export interface SelectOption {
  value: string;
  label: string;
}

// Dashboard stats
export interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  pendingOrders: number;
  lowStockProducts: number;
}
