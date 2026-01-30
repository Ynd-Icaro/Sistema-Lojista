import { IsBoolean, IsEmail, IsOptional, IsString, IsNumber, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCompanyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  document?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;
}

export class UpdateNotificationsDto {
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  whatsappEnabled?: boolean;

  @IsOptional()
  @IsString()
  smtpHost?: string;

  @IsOptional()
  @IsNumber()
  smtpPort?: number;

  @IsOptional()
  @IsString()
  smtpUser?: string;

  @IsOptional()
  @IsString()
  smtpPassword?: string;

  @IsOptional()
  @IsString()
  smtpFrom?: string;

  @IsOptional()
  @IsString()
  evolutionApiUrl?: string;

  @IsOptional()
  @IsString()
  evolutionApiKey?: string;

  @IsOptional()
  @IsString()
  evolutionInstance?: string;
}

// Módulos do sistema
export type SystemModule = 
  | 'dashboard' 
  | 'pdv' 
  | 'vendas' 
  | 'produtos' 
  | 'categorias'
  | 'clientes' 
  | 'ordens-servico' 
  | 'financeiro' 
  | 'notas' 
  | 'usuarios' 
  | 'configuracoes';

// Ações possíveis por módulo
export type ModuleAction = 'view' | 'create' | 'edit' | 'delete' | 'export';

// Permissões por módulo
export class ModulePermissionDto {
  @IsString()
  module: SystemModule;

  @IsBoolean()
  view: boolean;

  @IsBoolean()
  create: boolean;

  @IsBoolean()
  edit: boolean;

  @IsBoolean()
  delete: boolean;

  @IsBoolean()
  export: boolean;
}

// Configuração de papel/função
export class RolePermissionDto {
  @IsString()
  role: string; // ADMIN, MANAGER, SELLER, VIEWER

  @IsString()
  displayName: string;

  @IsNumber()
  hierarchyLevel: number; // 1 = mais alto, 4 = mais baixo

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModulePermissionDto)
  permissions: ModulePermissionDto[];
}

// DTO para atualizar permissões
export class UpdatePermissionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RolePermissionDto)
  roles: RolePermissionDto[];
}

// DTO para configurações de visualização
export class ViewSettingsDto {
  @IsOptional()
  @IsBoolean()
  compactMode?: boolean;

  @IsOptional()
  @IsBoolean()
  darkMode?: boolean;

  @IsOptional()
  @IsNumber()
  itemsPerPage?: number;

  @IsOptional()
  @IsBoolean()
  showInactiveItems?: boolean;

  @IsOptional()
  @IsString()
  defaultCurrency?: string;

  @IsOptional()
  @IsString()
  dateFormat?: string;

  @IsOptional()
  @IsString()
  timeFormat?: string;
}

// DTO para configurações gerais
export class GeneralSettingsDto {
  @IsOptional()
  @IsBoolean()
  requireApprovalForDiscounts?: boolean;

  @IsOptional()
  @IsNumber()
  maxDiscountPercent?: number;

  @IsOptional()
  @IsBoolean()
  allowNegativeStock?: boolean;

  @IsOptional()
  @IsNumber()
  lowStockThreshold?: number;

  @IsOptional()
  @IsBoolean()
  autoGenerateInvoice?: boolean;

  @IsOptional()
  @IsNumber()
  warrantyDays?: number;

  @IsOptional()
  @IsNumber()
  loyaltyPointsPerReal?: number;

  @IsOptional()
  @IsNumber()
  loyaltyPointsValue?: number;
}

// ====== PERMISSÕES INDIVIDUAIS POR USUÁRIO ======

// Perfis de visualização predefinidos
export type ViewProfile = 
  | 'full' // Acesso completo (admin)
  | 'manager' // Gerente - vê tudo menos config de sistema
  | 'sales' // Consultor de vendas - produtos, vendas, clientes, PDV
  | 'store' // Apenas loja - só PDV e ordens de serviço
  | 'financial' // Financeiro - financeiro, vendas, relatórios
  | 'viewer' // Somente visualização
  | 'custom'; // Permissões customizadas

// Configuração de perfil de visualização
export class ViewProfileConfigDto {
  @IsString()
  profile: ViewProfile;

  @IsString()
  displayName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  allowedModules: string[]; // Módulos que o perfil pode ver no menu

  @IsOptional()
  @IsString()
  defaultPage?: string; // Página inicial para este perfil
}

// Permissões individuais do usuário
export class UserPermissionsDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  viewProfile?: ViewProfile;

  @IsOptional()
  @IsBoolean()
  useCustomPermissions?: boolean; // Se true, ignora role e usa permissões customizadas

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModulePermissionDto)
  customPermissions?: ModulePermissionDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedModules?: string[]; // Módulos visíveis no menu (override do perfil)

  @IsOptional()
  @IsString()
  defaultPage?: string; // Página inicial personalizada

  @IsOptional()
  @IsBoolean()
  canApplyDiscounts?: boolean;

  @IsOptional()
  @IsNumber()
  maxDiscountPercent?: number;

  @IsOptional()
  @IsBoolean()
  canProcessRefunds?: boolean;

  @IsOptional()
  @IsBoolean()
  canAccessReports?: boolean;

  @IsOptional()
  @IsBoolean()
  canExportData?: boolean;
}

// DTO para atualizar permissões de um usuário específico
export class UpdateUserPermissionsDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  viewProfile?: ViewProfile;

  @IsOptional()
  @IsBoolean()
  useCustomPermissions?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModulePermissionDto)
  customPermissions?: ModulePermissionDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedModules?: string[];

  @IsOptional()
  @IsString()
  defaultPage?: string;

  @IsOptional()
  @IsBoolean()
  canApplyDiscounts?: boolean;

  @IsOptional()
  @IsNumber()
  maxDiscountPercent?: number;

  @IsOptional()
  @IsBoolean()
  canProcessRefunds?: boolean;

  @IsOptional()
  @IsBoolean()
  canAccessReports?: boolean;

  @IsOptional()
  @IsBoolean()
  canExportData?: boolean;
}

// DTO para configurar perfis de visualização globais
export class UpdateViewProfilesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ViewProfileConfigDto)
  profiles: ViewProfileConfigDto[];
}
