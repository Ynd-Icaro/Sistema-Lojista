import { SaleStatusType, PaymentMethodType, PaymentStatusType } from './enums';
import { Customer } from './customer';
import { Product } from './product';

// Sale interfaces
export interface Sale {
  id: string;
  companyId: string;
  saleNumber: string;
  customerId?: string;
  customer?: Customer;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethodType;
  paymentStatus: PaymentStatusType;
  status: SaleStatusType;
  notes?: string;
  sellerId: string;
  seller?: any; // User
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface CreateSaleDto {
  customerId?: string;
  items: CreateSaleItemDto[];
  discount?: number;
  paymentMethod: PaymentMethodType;
  notes?: string;
}

export interface CreateSaleItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

// Cart interfaces para PDV
export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}
