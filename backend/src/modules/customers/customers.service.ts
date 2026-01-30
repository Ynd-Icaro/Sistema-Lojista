import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto, CustomerQueryDto } from './dto/customer.dto';
import { toISODateTime } from '../../common/utils/data-sanitizer';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: CustomerQueryDto) {
    const { page = 1, limit = 20, search, isActive } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { cpfCnpj: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: customers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        sales: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            code: true,
            total: true,
            status: true,
            createdAt: true,
          },
        },
        serviceOrders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            code: true,
            title: true,
            status: true,
            total: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            sales: true,
            serviceOrders: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return customer;
  }

  async findByDocument(cpfCnpj: string, tenantId: string) {
    return this.prisma.customer.findFirst({
      where: { cpfCnpj, tenantId },
    });
  }

  async create(tenantId: string, dto: CreateCustomerDto) {
    // Check if document already exists
    if (dto.cpfCnpj) {
      const existing = await this.findByDocument(dto.cpfCnpj, tenantId);
      if (existing) {
        throw new BadRequestException('CPF/CNPJ já cadastrado');
      }
    }

    // Converte birthDate para DateTime se existir
    const birthDate = toISODateTime(dto.birthDate);

    // Prepara os dados limpando campos vazios
    const data: any = {
      name: dto.name,
      tenantId,
    };

    // Adiciona campos opcionais apenas se não forem vazios
    if (dto.type) data.type = dto.type;
    if (dto.email) data.email = dto.email;
    if (dto.phone) data.phone = dto.phone;
    if (dto.whatsapp) data.whatsapp = dto.whatsapp;
    if (dto.cpfCnpj) data.cpfCnpj = dto.cpfCnpj;
    if (dto.rg) data.rg = dto.rg;
    if (birthDate) data.birthDate = birthDate;
    if (dto.gender) data.gender = dto.gender;
    if (dto.address) data.address = dto.address;
    if (dto.number) data.number = dto.number;
    if (dto.complement) data.complement = dto.complement;
    if (dto.neighborhood) data.neighborhood = dto.neighborhood;
    if (dto.city) data.city = dto.city;
    if (dto.state) data.state = dto.state;
    if (dto.zipCode) data.zipCode = dto.zipCode;
    if (dto.notes) data.notes = dto.notes;
    if (dto.tags) data.tags = dto.tags;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.customer.create({ data });
  }

  async update(id: string, tenantId: string, dto: UpdateCustomerDto) {
    const customer = await this.findOne(id, tenantId);

    // Check if document already exists (excluding current)
    if (dto.cpfCnpj && dto.cpfCnpj !== customer.cpfCnpj) {
      const existing = await this.findByDocument(dto.cpfCnpj, tenantId);
      if (existing) {
        throw new BadRequestException('CPF/CNPJ já cadastrado');
      }
    }

    // Prepara os dados para atualização
    const data: any = {};

    // Adiciona campos apenas se foram fornecidos
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.type !== undefined) data.type = dto.type || null;
    if (dto.email !== undefined) data.email = dto.email || null;
    if (dto.phone !== undefined) data.phone = dto.phone || null;
    if (dto.whatsapp !== undefined) data.whatsapp = dto.whatsapp || null;
    if (dto.cpfCnpj !== undefined) data.cpfCnpj = dto.cpfCnpj || null;
    if (dto.rg !== undefined) data.rg = dto.rg || null;
    if (dto.birthDate !== undefined) data.birthDate = toISODateTime(dto.birthDate) || null;
    if (dto.gender !== undefined) data.gender = dto.gender || null;
    if (dto.address !== undefined) data.address = dto.address || null;
    if (dto.number !== undefined) data.number = dto.number || null;
    if (dto.complement !== undefined) data.complement = dto.complement || null;
    if (dto.neighborhood !== undefined) data.neighborhood = dto.neighborhood || null;
    if (dto.city !== undefined) data.city = dto.city || null;
    if (dto.state !== undefined) data.state = dto.state || null;
    if (dto.zipCode !== undefined) data.zipCode = dto.zipCode || null;
    if (dto.notes !== undefined) data.notes = dto.notes || null;
    if (dto.tags !== undefined) data.tags = dto.tags;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, tenantId: string) {
    const customer = await this.findOne(id, tenantId);

    // Check if has sales or orders
    if (customer._count.sales > 0 || customer._count.serviceOrders > 0) {
      // Soft delete
      await this.prisma.customer.update({
        where: { id },
        data: { isActive: false },
      });
      return { message: 'Cliente desativado (possui vendas/OS vinculadas)' };
    }

    await this.prisma.customer.delete({
      where: { id },
    });

    return { message: 'Cliente removido com sucesso' };
  }

  async getTopCustomers(tenantId: string, limit = 10) {
    return this.prisma.customer.findMany({
      where: { tenantId, isActive: true },
      orderBy: { totalSpent: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        totalSpent: true,
        points: true,
        lastPurchase: true,
        _count: {
          select: { sales: true },
        },
      },
    });
  }

  async addPoints(id: string, tenantId: string, points: number) {
    await this.findOne(id, tenantId);

    return this.prisma.customer.update({
      where: { id },
      data: {
        points: { increment: points },
      },
    });
  }

  async updateTotalSpent(customerId: string) {
    const total = await this.prisma.sale.aggregate({
      where: {
        customerId,
        status: 'COMPLETED',
      },
      _sum: {
        total: true,
      },
    });

    const lastSale = await this.prisma.sale.findFirst({
      where: { customerId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        totalSpent: total._sum.total || 0,
        lastPurchase: lastSale?.createdAt,
      },
    });
  }
}
