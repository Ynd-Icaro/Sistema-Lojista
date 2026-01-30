import { OrderStatusType, OrderPriorityType } from './enums';
import { Customer } from './customer';

// Service Order interfaces
export interface ServiceOrder {
  id: string;
  companyId: string;
  orderNumber: string;
  customerId: string;
  customer?: Customer;
  title: string;
  description: string;
  device?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  accessories?: string;
  problemReported: string;
  diagnosis?: string;
  solution?: string;
  estimatedCost?: number;
  finalCost?: number;
  status: OrderStatusType;
  priority: OrderPriorityType;
  technicianId?: string;
  technician?: any; // User
  startedAt?: string;
  completedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceOrderDto {
  customerId: string;
  title: string;
  description: string;
  device?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  accessories?: string;
  problemReported: string;
  estimatedCost?: number;
  priority?: OrderPriorityType;
}

export interface UpdateServiceOrderDto extends Partial<CreateServiceOrderDto> {
  status?: OrderStatusType;
  diagnosis?: string;
  solution?: string;
  finalCost?: number;
  technicianId?: string;
}
