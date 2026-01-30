// Customer interfaces
export interface Customer {
  id: string;
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  cpfCnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  name: string;
  email?: string;
  phone?: string;
  cpfCnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}
