import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CustomersService } from '../customers/customers.service';
import { ProductsService } from '../products/products.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateSaleDto, SaleQueryDto } from './dto/sale.dto';
import { PaymentMethod, PaymentMethodType, TransactionStatus, TransactionStatusType } from '../../types';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private customersService: CustomersService,
    private productsService: ProductsService,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(tenantId: string, query: SaleQueryDto) {
    const { page = 1, limit = 20, search, status, startDate, endDate, customerId } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [sales, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: {
            select: { id: true, name: true, phone: true },
          },
          user: {
            select: { id: true, name: true },
          },
          _count: {
            select: { items: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      data: sales,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        user: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true },
            },
          },
        },
        payments: true,
        invoices: {
          select: { id: true, number: true, status: true, type: true },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException('Venda não encontrada');
    }

    return sale;
  }

  async create(tenantId: string, userId: string, dto: CreateSaleDto) {
    // Generate sale code
    const lastSale = await this.prisma.sale.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: { code: true },
    });

    const nextNumber = lastSale 
      ? parseInt(lastSale.code.replace('V', '')) + 1 
      : 1;
    const code = `V${nextNumber.toString().padStart(6, '0')}`;

    // Calculate totals
    let subtotal = 0;
    const itemsData: any[] = [];

    for (const item of dto.items) {
      const product = await this.productsService.findOne(item.productId, tenantId);
      
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Estoque insuficiente para ${product.name}`);
      }

      const itemTotal = item.unitPrice * item.quantity - (item.discount || 0);
      subtotal += itemTotal;

      itemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        total: itemTotal,
        notes: item.notes,
      });
    }

    const discount = dto.discount || 0;
    const tax = dto.tax || 0;
    const total = subtotal - discount + tax;

    // Pre-fetch all products for stock movements
    const productIds = dto.items.map(item => item.productId);
    const productsForStock = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, stock: true },
    });
    const productStockMap = new Map(productsForStock.map(p => [p.id, p.stock]));

    // Create sale with items in transaction with extended timeout for PgBouncer
    const sale = await this.prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          tenantId,
          userId,
          customerId: dto.customerId,
          code,
          subtotal,
          discount,
          discountType: dto.discountType || 'FIXED',
          tax,
          total,
          paidAmount: dto.paidAmount || total,
          changeAmount: (dto.paidAmount || total) - total,
          paymentMethod: (dto.paymentMethod || PaymentMethod.CASH) as PaymentMethodType,
          paymentStatus: 'PAID',
          status: 'COMPLETED',
          notes: dto.notes,
          completedAt: new Date(),
          items: {
            create: itemsData,
          },
          payments: dto.payments ? {
            create: dto.payments.map(p => ({
              method: p.method as PaymentMethodType,
              amount: p.amount,
              installments: p.installments || 1,
              cardBrand: p.cardBrand,
              notes: p.notes,
            })),
          } : {
            create: {
              method: (dto.paymentMethod || PaymentMethod.CASH) as PaymentMethodType,
              amount: total,
            },
          },
        },
        include: {
          customer: true,
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true },
              },
            },
          },
          payments: true,
        },
      });

      // Update product stock and create movements in parallel
      const stockUpdates = dto.items.map(async (item) => {
        const previousStock = Number(productStockMap.get(item.productId) || 0);
        const newStock = previousStock - item.quantity;

        // Update stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        // Create stock movement
        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            type: 'OUT',
            quantity: item.quantity,
            reason: `Venda ${code}`,
            reference: newSale.id,
            previousStock,
            newStock,
            userId,
          },
        });
      });

      await Promise.all(stockUpdates);

      // Create financial transaction
      await tx.transaction.create({
        data: {
          tenantId,
          saleId: newSale.id,
          type: 'INCOME',
          description: `Venda ${code}`,
          amount: total,
          dueDate: new Date(),
          paidDate: new Date(),
          status: TransactionStatus.CONFIRMED as TransactionStatusType,
          paymentMethod: (dto.paymentMethod || PaymentMethod.CASH) as PaymentMethodType,
        },
      });

      // Update customer stats if exists
      if (dto.customerId) {
        await this.customersService.updateTotalSpent(dto.customerId);
      }

      return newSale;
    }, {
      maxWait: 10000, // 10 seconds max wait for transaction
      timeout: 30000, // 30 seconds timeout for the entire transaction
    });

    // Send sale confirmation email (don't block the response)
    this.notificationsService.sendSaleConfirmation(tenantId, sale).catch(error => {
      console.error('Failed to send sale confirmation email:', error);
    });

    return sale;
  }

  async cancel(id: string, tenantId: string, userId: string, reason?: string) {
    const sale = await this.findOne(id, tenantId);

    if (sale.status === 'CANCELLED') {
      throw new BadRequestException('Venda já está cancelada');
    }

    // Pre-fetch all products for stock movements
    const productIds = sale.items.map(item => item.productId);
    const productsForStock = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, stock: true },
    });
    const productStockMap = new Map(productsForStock.map(p => [p.id, p.stock]));

    // Reverse stock and financial with extended timeout
    await this.prisma.$transaction(async (tx) => {
      // Update sale status
      await tx.sale.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'CANCELLED',
          cancelledAt: new Date(),
          notes: reason ? `${sale.notes || ''}\n[CANCELAMENTO]: ${reason}` : sale.notes,
        },
      });

      // Restore product stock and create movements in parallel
      const stockUpdates = sale.items.map(async (item) => {
        const currentStock = productStockMap.get(item.productId) || 0;
        const newStock = currentStock + item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
          },
        });

        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            type: 'IN',
            quantity: item.quantity,
            reason: `Cancelamento da venda ${sale.code}`,
            reference: sale.id,
            previousStock: currentStock,
            newStock,
            userId,
          },
        });
      });

      await Promise.all(stockUpdates);

      // Cancel financial transaction
      await tx.transaction.updateMany({
        where: { saleId: id },
        data: { status: TransactionStatus.CANCELLED },
      });

      // Update customer stats
      if (sale.customerId) {
        await this.customersService.updateTotalSpent(sale.customerId);
      }
    }, {
      maxWait: 10000,
      timeout: 30000,
    });

    return { message: 'Venda cancelada com sucesso' };
  }

  async getRecentSales(tenantId: string, limit = 10) {
    return this.prisma.sale.findMany({
      where: { tenantId, status: 'COMPLETED' },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, name: true },
        },
        _count: {
          select: { items: true },
        },
      },
    });
  }

  async getSalesStats(tenantId: string, startDate?: Date, endDate?: Date) {
    const where: any = { tenantId, status: 'COMPLETED' };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [totals, count] = await Promise.all([
      this.prisma.sale.aggregate({
        where,
        _sum: {
          total: true,
          discount: true,
        },
        _avg: {
          total: true,
        },
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      totalRevenue: totals._sum.total || 0,
      totalDiscount: totals._sum.discount || 0,
      averageTicket: totals._avg.total || 0,
      salesCount: count,
    };
  }

  async getDailySales(tenantId: string, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const sales = await this.prisma.sale.findMany({
      where: {
        tenantId,
        status: 'COMPLETED',
        createdAt: { gte: startDate },
      },
      select: {
        total: true,
        createdAt: true,
      },
    });

    // Group by day
    const dailyMap = new Map();
    
    for (let i = 0; i <= days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      dailyMap.set(key, { date: key, total: 0, count: 0 });
    }

    for (const sale of sales) {
      const key = sale.createdAt.toISOString().split('T')[0];
      if (dailyMap.has(key)) {
        const day = dailyMap.get(key);
        day.total += Number(sale.total);
        day.count += 1;
      }
    }

    return Array.from(dailyMap.values()).reverse();
  }
}
