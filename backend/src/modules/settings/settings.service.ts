import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  UpdateCompanyDto,
  UpdateNotificationsDto,
  UpdatePermissionsDto,
  ViewSettingsDto,
  GeneralSettingsDto,
  RolePermissionDto,
  UpdateUserPermissionsDto,
  UpdateViewProfilesDto,
  ViewProfile,
} from "./dto/settings.dto";
import * as nodemailer from "nodemailer";

// Permissões padrão do sistema
const DEFAULT_PERMISSIONS: RolePermissionDto[] = [
  {
    role: "ADMIN",
    displayName: "Administrador",
    hierarchyLevel: 1,
    permissions: [
      {
        module: "dashboard",
        view: true,
        create: true,
        edit: true,
        delete: true,
        export: true,
      },
      {
        module: "pdv",
        view: true,
        create: true,
        edit: true,
        delete: true,
        export: true,
      },
      {
        module: "vendas",
        view: true,
        create: true,
        edit: true,
        delete: true,
        export: true,
      },
      {
        module: "produtos",
        view: true,
        create: true,
        edit: true,
        delete: true,
        export: true,
      },
      {
        module: "categorias",
        view: true,
        create: true,
        edit: true,
        delete: true,
        export: true,
      },
      {
        module: "clientes",
        view: true,
        create: true,
        edit: true,
        delete: true,
        export: true,
      },
      {
        module: "ordens-servico",
        view: true,
        create: true,
        edit: true,
        delete: true,
        export: true,
      },
      {
        module: "financeiro",
        view: true,
        create: true,
        edit: true,
        delete: true,
        export: true,
      },
      {
        module: "notas",
        view: true,
        create: true,
        edit: true,
        delete: true,
        export: true,
      },
      {
        module: "usuarios",
        view: true,
        create: true,
        edit: true,
        delete: true,
        export: true,
      },
      {
        module: "configuracoes",
        view: true,
        create: true,
        edit: true,
        delete: true,
        export: true,
      },
    ],
  },
  {
    role: "MANAGER",
    displayName: "Gerente",
    hierarchyLevel: 2,
    permissions: [
      {
        module: "dashboard",
        view: true,
        create: true,
        edit: true,
        delete: false,
        export: true,
      },
      {
        module: "pdv",
        view: true,
        create: true,
        edit: true,
        delete: true,
        export: true,
      },
      {
        module: "vendas",
        view: true,
        create: true,
        edit: true,
        delete: false,
        export: true,
      },
      {
        module: "produtos",
        view: true,
        create: true,
        edit: true,
        delete: true,
        export: true,
      },
      {
        module: "categorias",
        view: true,
        create: true,
        edit: true,
        delete: true,
        export: true,
      },
      {
        module: "clientes",
        view: true,
        create: true,
        edit: true,
        delete: false,
        export: true,
      },
      {
        module: "ordens-servico",
        view: true,
        create: true,
        edit: true,
        delete: false,
        export: true,
      },
      {
        module: "financeiro",
        view: true,
        create: true,
        edit: true,
        delete: false,
        export: true,
      },
      {
        module: "notas",
        view: true,
        create: true,
        edit: false,
        delete: false,
        export: true,
      },
      {
        module: "usuarios",
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "configuracoes",
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
    ],
  },
  {
    role: "SELLER",
    displayName: "Vendedor",
    hierarchyLevel: 3,
    permissions: [
      {
        module: "dashboard",
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "pdv",
        view: true,
        create: true,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "vendas",
        view: true,
        create: true,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "produtos",
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "categorias",
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "clientes",
        view: true,
        create: true,
        edit: true,
        delete: false,
        export: false,
      },
      {
        module: "ordens-servico",
        view: true,
        create: true,
        edit: true,
        delete: false,
        export: false,
      },
      {
        module: "financeiro",
        view: false,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "notas",
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "usuarios",
        view: false,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "configuracoes",
        view: false,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
    ],
  },
  {
    role: "VIEWER",
    displayName: "Visualizador",
    hierarchyLevel: 4,
    permissions: [
      {
        module: "dashboard",
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "pdv",
        view: false,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "vendas",
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "produtos",
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "categorias",
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "clientes",
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "ordens-servico",
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "financeiro",
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "notas",
        view: true,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "usuarios",
        view: false,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
      {
        module: "configuracoes",
        view: false,
        create: false,
        edit: false,
        delete: false,
        export: false,
      },
    ],
  },
];

const DEFAULT_VIEW_SETTINGS = {
  compactMode: false,
  darkMode: false,
  itemsPerPage: 20,
  showInactiveItems: false,
  defaultCurrency: "BRL",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24h",
};

const DEFAULT_GENERAL_SETTINGS = {
  requireApprovalForDiscounts: false,
  maxDiscountPercent: 15,
  allowNegativeStock: false,
  lowStockThreshold: 10,
  autoGenerateInvoice: true,
  warrantyDays: 90,
  loyaltyPointsPerReal: 1,
  loyaltyPointsValue: 0.1,
};

// Perfis de visualização padrão do sistema
const DEFAULT_VIEW_PROFILES = [
  {
    profile: "full",
    displayName: "Acesso Completo",
    description: "Acesso total a todos os módulos e funcionalidades",
    allowedModules: [
      "dashboard",
      "pdv",
      "vendas",
      "produtos",
      "categorias",
      "clientes",
      "ordens-servico",
      "financeiro",
      "notas",
      "usuarios",
      "configuracoes",
    ],
    defaultPage: "/dashboard",
  },
  {
    profile: "manager",
    displayName: "Gerente",
    description: "Acesso gerencial sem configurações de sistema",
    allowedModules: [
      "dashboard",
      "pdv",
      "vendas",
      "produtos",
      "categorias",
      "clientes",
      "ordens-servico",
      "financeiro",
      "notas",
      "usuarios",
    ],
    defaultPage: "/dashboard",
  },
  {
    profile: "sales",
    displayName: "Consultor de Vendas",
    description: "Acesso a vendas, produtos e clientes",
    allowedModules: [
      "dashboard",
      "pdv",
      "vendas",
      "produtos",
      "categorias",
      "clientes",
    ],
    defaultPage: "/dashboard/pdv",
  },
  {
    profile: "store",
    displayName: "Atendente de Loja",
    description: "Acesso apenas ao PDV e ordens de serviço",
    allowedModules: ["pdv", "ordens-servico", "clientes"],
    defaultPage: "/dashboard/pdv",
  },
  {
    profile: "financial",
    displayName: "Financeiro",
    description: "Acesso ao módulo financeiro e relatórios",
    allowedModules: ["dashboard", "financeiro", "vendas", "notas"],
    defaultPage: "/dashboard/financeiro",
  },
  {
    profile: "viewer",
    displayName: "Visualizador",
    description: "Somente visualização, sem poder criar/editar",
    allowedModules: ["dashboard", "vendas", "produtos", "clientes"],
    defaultPage: "/dashboard",
  },
  {
    profile: "custom",
    displayName: "Personalizado",
    description: "Permissões definidas manualmente",
    allowedModules: [],
    defaultPage: "/dashboard",
  },
];

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const settings = (tenant?.settings as any) || {};

    return {
      company: {
        name: settings?.company?.name || tenant?.name || "",
        document: settings?.company?.document || tenant?.cnpj || "",
        email: settings?.company?.email || tenant?.email || "",
        phone: settings?.company?.phone || tenant?.phone || "",
        address: settings?.company?.address || tenant?.address || "",
        city: settings?.company?.city || tenant?.city || "",
        state: settings?.company?.state || tenant?.state || "",
        zipCode: settings?.company?.zipCode || tenant?.zipCode || "",
      },
      notifications: {
        emailEnabled: settings?.emailEnabled ?? true,
        whatsappEnabled: settings?.whatsappEnabled ?? false,
        smtpHost: settings?.smtpHost || "",
        smtpPort: settings?.smtpPort || 587,
        smtpUser: settings?.smtpUser || "",
        smtpPassword: "",
        smtpFrom: settings?.smtpFrom || "",
        evolutionApiUrl: settings?.evolutionApiUrl || "",
        evolutionApiKey: "",
        evolutionInstance: settings?.evolutionInstance || "",
      },
      permissions: settings?.permissions || DEFAULT_PERMISSIONS,
      viewSettings: settings?.viewSettings || DEFAULT_VIEW_SETTINGS,
      generalSettings: {
        ...DEFAULT_GENERAL_SETTINGS,
        ...settings?.generalSettings,
      },
    };
  }

  async getPermissions(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const settings = (tenant?.settings as any) || {};
    return settings?.permissions || DEFAULT_PERMISSIONS;
  }

  async getUserPermissions(tenantId: string, userRole: string) {
    const permissions = await this.getPermissions(tenantId);
    const rolePermissions = permissions.find((p: any) => p.role === userRole);
    return (
      rolePermissions || DEFAULT_PERMISSIONS.find((p) => p.role === userRole)
    );
  }

  async checkPermission(
    tenantId: string,
    userRole: string,
    module: string,
    action: string,
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(tenantId, userRole);
    if (!permissions) return false;

    const modulePermission = permissions.permissions.find(
      (p: any) => p.module === module,
    );
    if (!modulePermission) return false;

    return modulePermission[action] === true;
  }

  async updateCompany(tenantId: string, data: UpdateCompanyDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const currentSettings = (tenant?.settings as any) || {};

    const updatedSettings = {
      ...currentSettings,
      company: {
        name: data.name || "",
        document: data.document || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        zipCode: data.zipCode || "",
      },
    };

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: updatedSettings,
      },
    });
  }

  async updateNotifications(tenantId: string, data: UpdateNotificationsDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const currentSettings = (tenant?.settings as any) || {};

    const updatedSettings = {
      ...currentSettings,
      emailEnabled: data.emailEnabled,
      whatsappEnabled: data.whatsappEnabled,
      smtpHost: data.smtpHost,
      smtpPort: data.smtpPort,
      smtpUser: data.smtpUser,
      smtpFrom: data.smtpFrom,
      evolutionApiUrl: data.evolutionApiUrl,
      evolutionInstance: data.evolutionInstance,
    };

    // Only update password if provided
    if (data.smtpPassword) {
      updatedSettings.smtpPassword = data.smtpPassword;
    }

    if (data.evolutionApiKey) {
      updatedSettings.evolutionApiKey = data.evolutionApiKey;
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: updatedSettings,
      },
    });
  }

  async testEmailConnection(tenantId: string, userEmail: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const settings = (tenant?.settings as any) || {};

    // Verificar se as configurações SMTP estão preenchidas
    if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPassword) {
      throw new BadRequestException(
        "Configure o servidor SMTP, usuário e senha antes de testar a conexão"
      );
    }

    const port = settings.smtpPort || 587;
    const isSecure = port === 465;

    // Criar transporter temporário com as configurações do tenant
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: port,
      secure: isSecure,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword,
      },
      ...(isSecure ? {} : { tls: { rejectUnauthorized: false } }),
    });

    try {
      // Verificar conexão
      await transporter.verify();

      // Enviar email de teste
      const from = settings.smtpFrom 
        ? `${tenant?.name || 'SmartFlux ERP'} <${settings.smtpFrom}>`
        : `${tenant?.name || 'SmartFlux ERP'} <${settings.smtpUser}>`;

      await transporter.sendMail({
        from,
        to: userEmail,
        subject: "✅ Bem-vindo ao Sistema de Gestão de Vendas!",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%); border-radius: 16px 16px 0 0; padding: 40px 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
                  ⚡ SmartFlux ERP
                </h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                  Sistema de Gestão de Vendas
                </p>
              </div>
              
              <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <div style="width: 80px; height: 80px; background: #10B981; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 40px;">✓</span>
                  </div>
                  <h2 style="color: #1e293b; margin: 0 0 10px 0; font-size: 24px;">
                    Conexão Estabelecida com Sucesso!
                  </h2>
                </div>
                
                <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                  Olá! 👋
                </p>
                
                <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                  <strong>Seu e-mail está autorizado para enviar as notificações do sistema para os clientes.</strong>
                </p>
                
                <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                  Essas notificações em alguns casos são notificações automáticas, incluindo:
                </p>
                
                <ul style="color: #475569; font-size: 15px; line-height: 1.8; padding-left: 20px; margin-bottom: 30px;">
                  <li>📧 Confirmação de pedidos e vendas</li>
                  <li>📝 Envio de notas fiscais e recibos</li>
                  <li>🔧 Atualizações de ordens de serviço</li>
                  <li>💰 Lembretes de pagamentos</li>
                  <li>🎉 Promoções e ofertas especiais</li>
                </ul>
                
                <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                  <p style="color: #64748b; font-size: 14px; margin: 0;">
                    <strong>Configuração utilizada:</strong><br>
                    Servidor: ${settings.smtpHost}<br>
                    Porta: ${port}<br>
                    Usuário: ${settings.smtpUser}
                  </p>
                </div>
                
                <p style="color: #94a3b8; font-size: 14px; text-align: center; margin: 0;">
                  Este é um e-mail de teste enviado automaticamente.<br>
                  ${tenant?.name || 'SmartFlux ERP'} • ${new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `Bem-vindo ao Sistema de Gestão de Vendas!

Seu e-mail está autorizado para enviar as notificações do sistema para os clientes.

Essas notificações em alguns casos são notificações automáticas, incluindo:
- Confirmação de pedidos e vendas
- Envio de notas fiscais e recibos
- Atualizações de ordens de serviço
- Lembretes de pagamentos
- Promoções e ofertas especiais

Configuração utilizada:
Servidor: ${settings.smtpHost}
Porta: ${port}
Usuário: ${settings.smtpUser}

Este é um e-mail de teste enviado automaticamente.
${tenant?.name || 'SmartFlux ERP'} • ${new Date().toLocaleDateString('pt-BR')}`,
      });

      return {
        success: true,
        message: "E-mail de teste enviado com sucesso! Verifique sua caixa de entrada.",
      };
    } catch (error: any) {
      console.error("SMTP Test Error:", error);
      
      let errorMessage = "Falha ao conectar com o servidor SMTP.";
      
      if (error.code === 'EAUTH') {
        errorMessage = "Erro de autenticação. Verifique o usuário e senha.";
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = "Conexão recusada. Verifique o servidor e a porta.";
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = "Tempo de conexão esgotado. Verifique o servidor e a porta.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new BadRequestException(errorMessage);
    }
  }

  async updatePermissions(
    tenantId: string,
    userRole: string,
    data: UpdatePermissionsDto,
  ) {
    // Only ADMIN can update permissions
    if (userRole !== "ADMIN") {
      throw new ForbiddenException(
        "Apenas administradores podem alterar permissões",
      );
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const currentSettings = (tenant?.settings as any) || {};

    const updatedSettings = {
      ...currentSettings,
      permissions: data.roles,
    };

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: updatedSettings,
      },
    });

    return {
      message: "Permissões atualizadas com sucesso",
      permissions: data.roles,
    };
  }

  async updateViewSettings(tenantId: string, data: ViewSettingsDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const currentSettings = (tenant?.settings as any) || {};

    const updatedSettings = {
      ...currentSettings,
      viewSettings: {
        ...currentSettings.viewSettings,
        ...data,
      },
    };

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: updatedSettings,
      },
    });

    return {
      message: "Configurações de visualização atualizadas",
      viewSettings: updatedSettings.viewSettings,
    };
  }

  async updateGeneralSettings(
    tenantId: string,
    userRole: string,
    data: GeneralSettingsDto,
  ) {
    // Only ADMIN and MANAGER can update general settings
    if (!["ADMIN", "MANAGER"].includes(userRole)) {
      throw new ForbiddenException(
        "Sem permissão para alterar configurações gerais",
      );
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const currentSettings = (tenant?.settings as any) || {};

    const updatedSettings = {
      ...currentSettings,
      generalSettings: {
        ...currentSettings.generalSettings,
        ...data,
      },
    };

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: updatedSettings,
      },
    });

    return {
      message: "Configurações gerais atualizadas",
      generalSettings: updatedSettings.generalSettings,
    };
  }

  async resetPermissionsToDefault(tenantId: string, userRole: string) {
    if (userRole !== "ADMIN") {
      throw new ForbiddenException(
        "Apenas administradores podem resetar permissões",
      );
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const currentSettings = (tenant?.settings as any) || {};

    const updatedSettings = {
      ...currentSettings,
      permissions: DEFAULT_PERMISSIONS,
    };

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: updatedSettings,
      },
    });

    return {
      message: "Permissões resetadas para o padrão",
      permissions: DEFAULT_PERMISSIONS,
    };
  }

  // ====== MÉTODOS PARA PERMISSÕES INDIVIDUAIS DE USUÁRIO ======

  async getViewProfiles(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const settings = (tenant?.settings as any) || {};
    return settings?.viewProfiles || DEFAULT_VIEW_PROFILES;
  }

  async updateViewProfiles(
    tenantId: string,
    userRole: string,
    data: UpdateViewProfilesDto,
  ) {
    if (userRole !== "ADMIN") {
      throw new ForbiddenException(
        "Apenas administradores podem alterar perfis de visualização",
      );
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const currentSettings = (tenant?.settings as any) || {};

    const updatedSettings = {
      ...currentSettings,
      viewProfiles: data.profiles,
    };

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: updatedSettings,
      },
    });

    return {
      message: "Perfis de visualização atualizados",
      viewProfiles: data.profiles,
    };
  }

  async getUserIndividualPermissions(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        settings: true,
      },
    });

    if (!user) {
      throw new NotFoundException("Usuário não encontrado");
    }

    const userSettings = (user.settings as any) || {};
    const viewProfiles = await this.getViewProfiles(tenantId);

    // Obter o perfil de visualização do usuário
    const viewProfile =
      userSettings?.viewProfile || this.getDefaultViewProfileForRole(user.role);
    const profileConfig =
      viewProfiles.find((p: any) => p.profile === viewProfile) ||
      viewProfiles.find((p: any) => p.profile === "viewer");

    return {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      viewProfile: userSettings?.viewProfile || viewProfile,
      useCustomPermissions: userSettings?.useCustomPermissions || false,
      customPermissions: userSettings?.customPermissions || null,
      allowedModules:
        userSettings?.allowedModules || profileConfig?.allowedModules || [],
      defaultPage:
        userSettings?.defaultPage || profileConfig?.defaultPage || "/dashboard",
      canApplyDiscounts: userSettings?.canApplyDiscounts ?? true,
      maxDiscountPercent: userSettings?.maxDiscountPercent ?? 15,
      canProcessRefunds:
        userSettings?.canProcessRefunds ??
        (user.role === "ADMIN" || user.role === "MANAGER"),
      canAccessReports:
        userSettings?.canAccessReports ?? user.role !== "VIEWER",
      canExportData: userSettings?.canExportData ?? user.role !== "VIEWER",
    };
  }

  private getDefaultViewProfileForRole(role: string): ViewProfile {
    const roleProfileMap: Record<string, ViewProfile> = {
      ADMIN: "full",
      MANAGER: "manager",
      SELLER: "sales",
      VIEWER: "viewer",
    };
    return roleProfileMap[role] || "viewer";
  }

  async updateUserIndividualPermissions(
    tenantId: string,
    userRole: string,
    data: UpdateUserPermissionsDto,
  ) {
    // Verificar permissão
    if (!["ADMIN", "MANAGER"].includes(userRole)) {
      throw new ForbiddenException(
        "Sem permissão para alterar permissões de usuários",
      );
    }

    const targetUser = await this.prisma.user.findFirst({
      where: { id: data.userId, tenantId },
    });

    if (!targetUser) {
      throw new NotFoundException("Usuário não encontrado");
    }

    // MANAGER não pode editar permissões de ADMIN
    if (userRole === "MANAGER" && targetUser.role === "ADMIN") {
      throw new ForbiddenException(
        "Gerentes não podem alterar permissões de administradores",
      );
    }

    const currentSettings = (targetUser.settings as any) || {};

    const updatedSettings = {
      ...currentSettings,
      viewProfile: data.viewProfile ?? currentSettings.viewProfile,
      useCustomPermissions:
        data.useCustomPermissions ?? currentSettings.useCustomPermissions,
      customPermissions:
        data.customPermissions ?? currentSettings.customPermissions,
      allowedModules: data.allowedModules ?? currentSettings.allowedModules,
      defaultPage: data.defaultPage ?? currentSettings.defaultPage,
      canApplyDiscounts:
        data.canApplyDiscounts ?? currentSettings.canApplyDiscounts,
      maxDiscountPercent:
        data.maxDiscountPercent ?? currentSettings.maxDiscountPercent,
      canProcessRefunds:
        data.canProcessRefunds ?? currentSettings.canProcessRefunds,
      canAccessReports:
        data.canAccessReports ?? currentSettings.canAccessReports,
      canExportData: data.canExportData ?? currentSettings.canExportData,
    };

    await this.prisma.user.update({
      where: { id: data.userId },
      data: {
        settings: updatedSettings,
      },
    });

    return {
      message: "Permissões do usuário atualizadas",
      userId: data.userId,
      permissions: updatedSettings,
    };
  }

  async getAllUsersWithPermissions(tenantId: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        settings: true,
      },
      orderBy: { name: "asc" },
    });

    const viewProfiles = await this.getViewProfiles(tenantId);

    return users.map((user) => {
      const userSettings = (user.settings as any) || {};
      const viewProfile =
        userSettings?.viewProfile ||
        this.getDefaultViewProfileForRole(user.role);
      const profileConfig = viewProfiles.find(
        (p: any) => p.profile === viewProfile,
      );

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        viewProfile: viewProfile,
        viewProfileName: profileConfig?.displayName || "Personalizado",
        useCustomPermissions: userSettings?.useCustomPermissions || false,
        allowedModules:
          userSettings?.allowedModules || profileConfig?.allowedModules || [],
      };
    });
  }

  async resetUserPermissionsToDefault(
    tenantId: string,
    userRole: string,
    userId: string,
  ) {
    if (!["ADMIN", "MANAGER"].includes(userRole)) {
      throw new ForbiddenException(
        "Sem permissão para resetar permissões de usuários",
      );
    }

    const targetUser = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!targetUser) {
      throw new NotFoundException("Usuário não encontrado");
    }

    if (userRole === "MANAGER" && targetUser.role === "ADMIN") {
      throw new ForbiddenException(
        "Gerentes não podem alterar permissões de administradores",
      );
    }

    const defaultProfile = this.getDefaultViewProfileForRole(targetUser.role);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        settings: {
          viewProfile: defaultProfile,
          useCustomPermissions: false,
          customPermissions: null,
          allowedModules: null,
          defaultPage: null,
          canApplyDiscounts: null,
          maxDiscountPercent: null,
          canProcessRefunds: null,
          canAccessReports: null,
          canExportData: null,
        },
      },
    });

    return {
      message: "Permissões do usuário resetadas para o padrão do cargo",
      userId,
      viewProfile: defaultProfile,
    };
  }

  // Obter permissões efetivas de um usuário (combinando role + individual)
  async getEffectiveUserPermissions(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: {
        id: true,
        role: true,
        settings: true,
      },
    });

    if (!user) {
      throw new NotFoundException("Usuário não encontrado");
    }

    const userSettings = (user.settings as any) || {};

    // Se usa permissões customizadas, retorna elas
    if (userSettings?.useCustomPermissions && userSettings?.customPermissions) {
      return {
        source: "custom",
        permissions: userSettings.customPermissions,
        viewProfile: userSettings.viewProfile || "custom",
        allowedModules: userSettings.allowedModules || [],
        defaultPage: userSettings.defaultPage || "/dashboard",
        canApplyDiscounts: userSettings.canApplyDiscounts ?? true,
        maxDiscountPercent: userSettings.maxDiscountPercent ?? 15,
        canProcessRefunds: userSettings.canProcessRefunds ?? false,
        canAccessReports: userSettings.canAccessReports ?? true,
        canExportData: userSettings.canExportData ?? true,
      };
    }

    // Caso contrário, usa permissões baseadas no role
    const rolePermissions = await this.getUserPermissions(tenantId, user.role);
    const viewProfiles = await this.getViewProfiles(tenantId);
    const viewProfile =
      userSettings?.viewProfile || this.getDefaultViewProfileForRole(user.role);
    const profileConfig = viewProfiles.find(
      (p: any) => p.profile === viewProfile,
    );

    return {
      source: "role",
      permissions: rolePermissions?.permissions || [],
      viewProfile: viewProfile,
      allowedModules:
        userSettings?.allowedModules || profileConfig?.allowedModules || [],
      defaultPage:
        userSettings?.defaultPage || profileConfig?.defaultPage || "/dashboard",
      canApplyDiscounts: userSettings?.canApplyDiscounts ?? true,
      maxDiscountPercent: userSettings?.maxDiscountPercent ?? 15,
      canProcessRefunds:
        userSettings?.canProcessRefunds ??
        (user.role === "ADMIN" || user.role === "MANAGER"),
      canAccessReports:
        userSettings?.canAccessReports ?? user.role !== "VIEWER",
      canExportData: userSettings?.canExportData ?? user.role !== "VIEWER",
    };
  }
}
