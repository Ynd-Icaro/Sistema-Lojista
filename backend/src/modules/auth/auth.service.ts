import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, RegisterDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { UserRole, UserRoleType } from '../../types';
import { EmailService } from '../notifications/services/email.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string, tenantId?: string) {
    const whereClause: any = { email };
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const user = await this.prisma.user.findFirst({
      where: whereClause,
      include: {
        tenant: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Usuário inativo ou suspenso');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const { password: _, refreshToken: __, ...result } = user;
    return result;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password, dto.tenantId);
    
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    // Update last login and refresh token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        refreshToken,
      },
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async register(dto: RegisterDto) {
    let tenantId = dto.tenantId;

    // Se tenantName for fornecido, criar novo tenant
    if (dto.tenantName) {
      // Criar slug único para o tenant
      const slug = dto.tenantName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Verificar se slug já existe
      const existingTenant = await this.prisma.tenant.findUnique({
        where: { slug },
      });

      if (existingTenant) {
        throw new BadRequestException('Já existe uma empresa com este nome');
      }

      // Criar novo tenant
      const newTenant = await this.prisma.tenant.create({
        data: {
          name: dto.tenantName,
          slug: `${slug}-${Date.now()}`,
          isActive: true,
          settings: {
            primaryColor: '#3B82F6',
            secondaryColor: '#1E40AF',
            plan: 'FREE',
          },
        },
      });

      tenantId = newTenant.id;

      // Quando criar novo tenant, usuário será ADMIN
      dto.role = UserRole.ADMIN;
    }

    if (!tenantId) {
      throw new BadRequestException('É necessário informar o ID da empresa ou nome para criar uma nova');
    }

    // Check if tenant exists (para caso tenantId seja fornecido diretamente)
    if (dto.tenantId && !dto.tenantName) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new BadRequestException('Empresa não encontrada');
      }
    }

    // Check if email already exists in tenant
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        tenantId: tenantId,
      },
    });

    if (existingUser) {
      throw new BadRequestException('Email já cadastrado nesta empresa');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        phone: dto.phone,
        role: (dto.role || UserRole.SELLER) as UserRoleType,
        tenantId: tenantId,
      },
      include: {
        tenant: true,
      },
    });

    // Gerar tokens para auto-login após registro
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    const { password: _, refreshToken: __, ...result } = user;
    return {
      user: result,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const decoded = this.jwtService.verify(dto.refreshToken);
      
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        include: { tenant: true },
      });

      if (!user || user.refreshToken !== dto.refreshToken) {
        throw new UnauthorizedException('Token inválido');
      }

      const payload = {
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(payload);
      const newRefreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken },
      });

      const { password: _, refreshToken: __, ...result } = user;

      return {
        user: result,
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Logout realizado com sucesso' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const { password, refreshToken, ...result } = user;
    return result;
  }

  async updatePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Senha atual incorreta');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Senha alterada com sucesso' };
  }

  async updateProfile(userId: string, data: { name?: string; email?: string; currentPassword?: string; newPassword?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const updateData: any = {};

    if (data.name) {
      updateData.name = data.name;
    }

    if (data.email && data.email !== user.email) {
      // Check if email is already in use
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: data.email,
          tenantId: user.tenantId,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new BadRequestException('Email já está em uso');
      }

      updateData.email = data.email;
    }

    // Update password if provided
    if (data.newPassword && data.currentPassword) {
      const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Senha atual incorreta');
      }
      updateData.password = await bcrypt.hash(data.newPassword, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { tenant: true },
    });

    const { password, refreshToken, ...result } = updatedUser;
    return result;
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException('Email não encontrado');
    }

    // Generate a 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Update user with reset code
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetCode,
        resetCodeExpiresAt: expiresAt,
      },
    });

    // Send email
    const subject = 'Código de Verificação - SmartFlux ERP';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Redefinição de Senha</h2>
        <p>Olá ${user.name},</p>
        <p>Recebemos uma solicitação para redefinir sua senha no SmartFlux ERP.</p>
        <p>Seu código de verificação é:</p>
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
          ${resetCode}
        </div>
        <p>Este código é válido por 15 minutos.</p>
        <p>Se você não solicitou esta redefinição, ignore este email.</p>
        <br>
        <p>Atenciosamente,<br>Equipe SmartFlux ERP</p>
      </div>
    `;

    try {
      await this.emailService.send({
        to: dto.email,
        subject,
        html,
      });
    } catch (error) {
      console.error('Erro ao enviar email de redefinição:', error);
      throw new BadRequestException('Erro ao enviar email. Tente novamente.');
    }

    return { message: 'Código de verificação enviado para seu email' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException('Email não encontrado');
    }

    if (!user.resetCode || !user.resetCodeExpiresAt) {
      throw new BadRequestException('Código de verificação não encontrado. Solicite um novo código.');
    }

    if (user.resetCode !== dto.code) {
      throw new BadRequestException('Código de verificação inválido');
    }

    if (new Date() > user.resetCodeExpiresAt) {
      throw new BadRequestException('Código de verificação expirado. Solicite um novo código.');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    // Update password and clear reset code
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetCode: null,
        resetCodeExpiresAt: null,
      },
    });

    return { message: 'Senha redefinida com sucesso' };
  }
}
