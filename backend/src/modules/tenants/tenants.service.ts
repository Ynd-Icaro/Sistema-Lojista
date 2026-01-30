import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.tenant.count(),
    ]);

    return {
      data: tenants,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return tenant;
  }

  async create(dto: CreateTenantDto) {
    // Check if slug already exists
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });

    if (existingTenant) {
      throw new BadRequestException('Slug já está em uso');
    }

    // Create tenant with admin user
    const tenant = await this.prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          cnpj: dto.cnpj,
          email: dto.email,
          phone: dto.phone,
          address: dto.address,
          city: dto.city,
          state: dto.state,
          zipCode: dto.zipCode,
        },
      });

      // Create admin user if provided
      if (dto.adminEmail && dto.adminPassword) {
        const hashedPassword = await bcrypt.hash(dto.adminPassword, 10);
        
        await tx.user.create({
          data: {
            email: dto.adminEmail,
            password: hashedPassword,
            name: dto.adminName || 'Administrador',
            role: 'ADMIN',
            tenantId: newTenant.id,
          },
        });
      }

      // Create default transaction categories
      await tx.transactionCategory.createMany({
        data: [
          { name: 'Vendas', type: 'INCOME', color: '#22c55e', icon: 'shopping-cart', isSystem: true, tenantId: newTenant.id },
          { name: 'Serviços', type: 'INCOME', color: '#3b82f6', icon: 'wrench', isSystem: true, tenantId: newTenant.id },
          { name: 'Outros Recebimentos', type: 'INCOME', color: '#8b5cf6', icon: 'plus-circle', isSystem: true, tenantId: newTenant.id },
          { name: 'Fornecedores', type: 'EXPENSE', color: '#ef4444', icon: 'truck', isSystem: true, tenantId: newTenant.id },
          { name: 'Salários', type: 'EXPENSE', color: '#f97316', icon: 'users', isSystem: true, tenantId: newTenant.id },
          { name: 'Aluguel', type: 'EXPENSE', color: '#eab308', icon: 'home', isSystem: true, tenantId: newTenant.id },
          { name: 'Energia/Água', type: 'EXPENSE', color: '#14b8a6', icon: 'zap', isSystem: true, tenantId: newTenant.id },
          { name: 'Internet/Telefone', type: 'EXPENSE', color: '#6366f1', icon: 'wifi', isSystem: true, tenantId: newTenant.id },
          { name: 'Impostos', type: 'EXPENSE', color: '#ec4899', icon: 'file-text', isSystem: true, tenantId: newTenant.id },
          { name: 'Outros Gastos', type: 'EXPENSE', color: '#64748b', icon: 'minus-circle', isSystem: true, tenantId: newTenant.id },
        ],
      });

      return newTenant;
    });

    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findOne(id);

    return this.prisma.tenant.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.tenant.delete({
      where: { id },
    });

    return { message: 'Empresa removida com sucesso' };
  }

  async getStats(tenantId: string) {
    const [
      usersCount,
      productsCount,
      customersCount,
      salesCount,
      ordersCount,
    ] = await Promise.all([
      this.prisma.user.count({ where: { tenantId } }),
      this.prisma.product.count({ where: { tenantId } }),
      this.prisma.customer.count({ where: { tenantId } }),
      this.prisma.sale.count({ where: { tenantId } }),
      this.prisma.serviceOrder.count({ where: { tenantId } }),
    ]);

    return {
      users: usersCount,
      products: productsCount,
      customers: customersCount,
      sales: salesCount,
      serviceOrders: ordersCount,
    };
  }
}
