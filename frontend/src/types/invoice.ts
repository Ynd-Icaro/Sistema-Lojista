import { InvoiceTypeValue, InvoiceStatusType } from './enums';
import { Sale } from './sale';
import { ServiceOrder } from './service-order';

// Invoice interfaces
export interface Invoice {
  id: string;
  companyId: string;
  invoiceNumber: string;
  type: InvoiceTypeValue;
  saleId?: string;
  sale?: Sale;
  serviceOrderId?: string;
  serviceOrder?: ServiceOrder;
  status: InvoiceStatusType;
  issuedAt?: string;
  sentAt?: string;
  cancelledAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceDto {
  type: InvoiceTypeValue;
  saleId?: string;
  serviceOrderId?: string;
  notes?: string;
}

export interface UpdateInvoiceDto {
  status?: InvoiceStatusType;
  notes?: string;
}
