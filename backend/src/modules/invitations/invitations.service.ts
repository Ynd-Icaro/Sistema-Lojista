import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateInvitationDto, AcceptInvitationDto } from "./dto/invitation.dto";
import { v4 as uuidv4 } from "uuid";
import * as bcrypt from "bcrypt";
import { UserRole, UserRoleType } from "../../types";
import { EmailService } from "../notifications/services/email.service";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  SELLER: "Vendedor",
  VIEWER: "Visualizador",
};

@Injectable()
export class InvitationsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.invitation.findMany({
      where: { tenantId },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(tenantId: string, invitedBy: string, dto: CreateInvitationDto) {
    // Verificar se já existe um convite pendente para este email
    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        email: dto.email,
        tenantId,
        status: "PENDING",
      },
    });

    if (existingInvitation) {
      throw new ConflictException(
        "Já existe um convite pendente para este email",
      );
    }

    // Criar o convite com token único
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expira em 7 dias

    const invitation = await this.prisma.invitation.create({
      data: {
        email: dto.email,
        role: (dto.role || "SELLER") as UserRoleType,
        token,
        expiresAt,
        tenantId,
        invitedBy,
      },
      include: {
        tenant: {
          select: {
            name: true,
          },
        },
        inviter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Gerar o link de convite
    const inviteLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/invite/${token}`;

    // Enviar email com o convite
    const userRole = dto.role || "SELLER";
    try {
      await this.emailService.send({
        to: dto.email,
        subject: `Convite para ${invitation.tenant.name} - SmartFlux ERP`,
        html: this.generateInviteEmailHtml({
          inviteLink,
          tenantName: invitation.tenant.name,
          inviterName: invitation.inviter.name,
          role: roleLabels[userRole] || userRole,
          expiresAt,
        }),
      });
    } catch (error) {
      console.error("Erro ao enviar email de convite:", error);
      // Não lança erro para não impedir a criação do convite
    }

    return {
      ...invitation,
      inviteLink,
    };
  }

  private generateInviteEmailHtml(data: {
    inviteLink: string;
    tenantName: string;
    inviterName: string;
    role: string;
    expiresAt: Date;
  }): string {
    const expiresFormatted = data.expiresAt.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Convite SmartFlux ERP</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 20px 0;">
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px 40px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">SmartFlux ERP</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Sistema de Gestão Empresarial</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 22px;">Você foi convidado! 🎉</h2>
                    
                    <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      <strong>${data.inviterName}</strong> convidou você para fazer parte da equipe <strong>${data.tenantName}</strong> no SmartFlux ERP.
                    </p>
                    
                    <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                      <table cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td style="color: #64748b; font-size: 14px; padding-bottom: 8px;">Empresa:</td>
                          <td style="color: #1e293b; font-size: 14px; font-weight: 600; text-align: right; padding-bottom: 8px;">${data.tenantName}</td>
                        </tr>
                        <tr>
                          <td style="color: #64748b; font-size: 14px; padding-bottom: 8px;">Função:</td>
                          <td style="color: #1e293b; font-size: 14px; font-weight: 600; text-align: right; padding-bottom: 8px;">${data.role}</td>
                        </tr>
                        <tr>
                          <td style="color: #64748b; font-size: 14px;">Válido até:</td>
                          <td style="color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${expiresFormatted}</td>
                        </tr>
                      </table>
                    </div>
                    
                    <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                      Para aceitar o convite e criar sua conta, clique no botão abaixo:
                    </p>
                    
                    <!-- CTA Button -->
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${data.inviteLink}" 
                             style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);">
                            Aceitar Convite
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #94a3b8; font-size: 13px; margin: 20px 0 0 0;">
                      Se o botão não funcionar, copie e cole este link no seu navegador:
                    </p>
                    <p style="color: #3b82f6; font-size: 13px; word-break: break-all; margin: 8px 0 0 0;">
                      <a href="${data.inviteLink}" style="color: #3b82f6;">${data.inviteLink}</a>
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 25px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 13px; margin: 0;">
                      Este convite expira em 7 dias. Se você não solicitou este convite, pode ignorar este email.
                    </p>
                    <p style="color: #94a3b8; font-size: 12px; margin: 15px 0 0 0;">
                      © ${new Date().getFullYear()} SmartFlux ERP. Todos os direitos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  async findByToken(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        inviter: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException("Convite não encontrado");
    }

    if (invitation.status !== "PENDING") {
      throw new BadRequestException(
        "Este convite já foi utilizado ou cancelado",
      );
    }

    if (new Date() > invitation.expiresAt) {
      // Atualizar status para expirado
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      throw new BadRequestException("Este convite expirou");
    }

    return invitation;
  }

  async accept(dto: AcceptInvitationDto) {
    const invitation = await this.findByToken(dto.token);

    // Verificar se já existe um usuário com este email no tenant
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: invitation.email,
        tenantId: invitation.tenantId,
      },
    });

    if (existingUser) {
      // Se o usuário já existe, atualizar o papel e marcar convite como aceito
      const updatedUser = await this.prisma.$transaction(async (tx) => {
        // Atualizar papel do usuário se for diferente
        if (existingUser.role !== invitation.role) {
          await tx.user.update({
            where: { id: existingUser.id },
            data: { role: invitation.role },
          });
        }

        // Atualizar status do convite
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { status: "ACCEPTED" },
        });

        return await tx.user.findUnique({
          where: { id: existingUser.id },
          include: { tenant: true },
        });
      });

      const { password: _, refreshToken: __, ...result } = updatedUser!;
      return result;
    }

    // Criar o usuário
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      // Criar usuário
      const newUser = await tx.user.create({
        data: {
          email: invitation.email,
          password: hashedPassword,
          name: dto.name,
          role: invitation.role,
          tenantId: invitation.tenantId,
        },
        include: {
          tenant: true,
        },
      });

      // Atualizar status do convite
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      });

      return newUser;
    });

    const { password: _, refreshToken: __, ...result } = user;
    return result;
  }

  async cancel(id: string, tenantId: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id, tenantId },
    });

    if (!invitation) {
      throw new NotFoundException("Convite não encontrado");
    }

    if (invitation.status !== "PENDING") {
      throw new BadRequestException("Este convite não pode ser cancelado");
    }

    return this.prisma.invitation.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  }

  async resend(id: string, tenantId: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id, tenantId },
      include: {
        inviter: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException("Convite não encontrado");
    }

    // Atualizar a data de expiração
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const updated = await this.prisma.invitation.update({
      where: { id },
      data: {
        status: "PENDING",
        expiresAt,
      },
      include: {
        tenant: {
          select: {
            name: true,
          },
        },
      },
    });

    const inviteLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/invite/${invitation.token}`;

    // Reenviar email
    try {
      await this.emailService.send({
        to: invitation.email,
        subject: `Convite para ${updated.tenant.name} - SmartFlux ERP (Reenviado)`,
        html: this.generateInviteEmailHtml({
          inviteLink,
          tenantName: updated.tenant.name,
          inviterName: invitation.inviter?.name || "Um administrador",
          role: roleLabels[invitation.role] || invitation.role,
          expiresAt,
        }),
      });
    } catch (error) {
      console.error("Erro ao reenviar email de convite:", error);
    }

    return {
      ...updated,
      inviteLink,
    };
  }
}
