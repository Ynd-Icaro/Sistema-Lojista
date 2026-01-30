import { UserRoleType, UserStatusType } from './enums';

// User interfaces
export interface User {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: UserRoleType;
  status: UserStatusType;
  phone?: string;
  avatar?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: UserRoleType;
  phone?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: UserRoleType;
  status?: UserStatusType;
  phone?: string;
}

export interface InviteUserDto {
  email: string;
  name: string;
  role: UserRoleType;
}

// Company interfaces
export interface Company {
  id: string;
  name: string;
  tradeName?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  logo?: string;
  isActive: boolean;
  subscription?: Subscription;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  plan: 'FREE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'TRIAL';
  expiresAt?: string;
}

export interface UpdateCompanyDto {
  name?: string;
  tradeName?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}
