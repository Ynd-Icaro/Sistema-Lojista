// Enums - Sincronizado com backend/src/types/enums.ts

export const UserRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  SELLER: 'SELLER',
  VIEWER: 'VIEWER',
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;

export type UserStatusType = (typeof UserStatus)[keyof typeof UserStatus];

export const PaymentMethod = {
  CASH: 'CASH',
  CREDIT_CARD: 'CREDIT_CARD',
  DEBIT_CARD: 'DEBIT_CARD',
  PIX: 'PIX',
  BANK_TRANSFER: 'BANK_TRANSFER',
  BOLETO: 'BOLETO',
  INSTALLMENT: 'INSTALLMENT',
} as const;

export type PaymentMethodType = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  PARTIAL: 'PARTIAL',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

export type PaymentStatusType = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const SaleStatus = {
  DRAFT: 'DRAFT',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

export type SaleStatusType = (typeof SaleStatus)[keyof typeof SaleStatus];

export const OrderStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_PARTS: 'WAITING_PARTS',
  WAITING_APPROVAL: 'WAITING_APPROVAL',
  COMPLETED: 'COMPLETED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatusType = (typeof OrderStatus)[keyof typeof OrderStatus];

export const OrderPriority = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type OrderPriorityType = (typeof OrderPriority)[keyof typeof OrderPriority];

export const TransactionType = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
} as const;

export type TransactionTypeValue = (typeof TransactionType)[keyof typeof TransactionType];

export const TransactionStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
} as const;

export type TransactionStatusType = (typeof TransactionStatus)[keyof typeof TransactionStatus];

export const InvoiceType = {
  SALE: 'SALE',
  SERVICE: 'SERVICE',
  WARRANTY: 'WARRANTY',
} as const;

export type InvoiceTypeValue = (typeof InvoiceType)[keyof typeof InvoiceType];

export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  ISSUED: 'ISSUED',
  SENT: 'SENT',
  CANCELLED: 'CANCELLED',
} as const;

export type InvoiceStatusType = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

// Labels para exibição na UI
export const statusLabels: Record<string, string> = {
  // Order Status
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em Andamento',
  WAITING_PARTS: 'Aguardando Peças',
  WAITING_APPROVAL: 'Aguardando Aprovação',
  COMPLETED: 'Concluído',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
  // Transaction Status
  CONFIRMED: 'Confirmado',
  // Sale Status
  DRAFT: 'Rascunho',
  REFUNDED: 'Reembolsado',
  // Payment Status
  PAID: 'Pago',
  PARTIAL: 'Parcial',
  // Invoice Status
  ISSUED: 'Emitida',
  SENT: 'Enviada',
  // User Status
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  SUSPENDED: 'Suspenso',
};

export const priorityLabels: Record<string, string> = {
  LOW: 'Baixa',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

export const paymentMethodLabels: Record<string, string> = {
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  PIX: 'PIX',
  BANK_TRANSFER: 'Transferência',
  BOLETO: 'Boleto',
  INSTALLMENT: 'Parcelado',
};

export const userRoleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  SELLER: 'Vendedor',
  VIEWER: 'Visualizador',
};

export const transactionTypeLabels: Record<string, string> = {
  INCOME: 'Receita',
  EXPENSE: 'Despesa',
};

export const invoiceTypeLabels: Record<string, string> = {
  SALE: 'Venda',
  SERVICE: 'Serviço',
  WARRANTY: 'Garantia',
};

// Colors para badges/UI
export const statusColors: Record<string, string> = {
  PENDING: 'badge-warning',
  IN_PROGRESS: 'badge-info',
  WAITING_PARTS: 'badge-gray',
  WAITING_APPROVAL: 'badge-warning',
  COMPLETED: 'badge-success',
  DELIVERED: 'badge-primary',
  CANCELLED: 'badge-danger',
  CONFIRMED: 'badge-success',
  DRAFT: 'badge-gray',
  REFUNDED: 'badge-warning',
  PAID: 'badge-success',
  PARTIAL: 'badge-warning',
  ISSUED: 'badge-info',
  SENT: 'badge-success',
  ACTIVE: 'badge-success',
  INACTIVE: 'badge-gray',
  SUSPENDED: 'badge-danger',
};

export const priorityColors: Record<string, string> = {
  LOW: 'text-slate-600',
  NORMAL: 'text-primary-600',
  HIGH: 'text-warning-600',
  URGENT: 'text-danger-600',
};
