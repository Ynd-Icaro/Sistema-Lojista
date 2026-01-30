import { TransactionTypeValue, TransactionStatusType } from './enums';

// Transaction interfaces
export interface Transaction {
  id: string;
  companyId: string;
  type: TransactionTypeValue;
  categoryId: string;
  category?: TransactionCategory;
  description: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: TransactionStatusType;
  notes?: string;
  saleId?: string;
  serviceOrderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionCategory {
  id: string;
  companyId: string;
  name: string;
  type: TransactionTypeValue;
  description?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionDto {
  type: TransactionTypeValue;
  categoryId: string;
  description: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status?: TransactionStatusType;
  notes?: string;
}

export interface UpdateTransactionDto extends Partial<CreateTransactionDto> {}

export interface CreateTransactionCategoryDto {
  name: string;
  type: TransactionTypeValue;
  description?: string;
  color?: string;
}

export interface UpdateTransactionCategoryDto extends Partial<CreateTransactionCategoryDto> {}

// Financial dashboard interfaces
export interface FinancialDashboard {
  income: number;
  expense: number;
  balance: number;
  pendingIncome: number;
  pendingExpense: number;
  expensesByCategory: ExpenseByCategory[];
}

export interface ExpenseByCategory {
  category: string;
  total: number;
}

export interface CashFlowData {
  date: string;
  income: number;
  expense: number;
  balance: number;
}
