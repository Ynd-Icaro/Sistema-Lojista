import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const [
      // Current month metrics
      salesThisMonth,
      revenueThisMonth,
      customersThisMonth,
      
      // Last month metrics
      salesLastMonth,
      revenueLastMonth,
      
      // Today metrics
      salesToday,
      revenueToday,
      
      // General counts
      totalProducts,
      totalCustomers,
      lowStockCount,
      pendingOrders,
    ] = await Promise.all([
      // Sales this month
      this.prisma.sale.count({
        where: { tenantId, status: 'COMPLETED', createdAt: { gte: startOfMonth } },
      }),
      
      // Revenue this month
      this.prisma.sale.aggregate({
        where: { tenantId, status: 'COMPLETED', createdAt: { gte: startOfMonth } },
        _sum: { total: true },
      }),
      
      // New customers this month
      this.prisma.customer.count({
        where: { tenantId, createdAt: { gte: startOfMonth } },
      }),
      
      // Sales last month
      this.prisma.sale.count({
        where: { tenantId, status: 'COMPLETED', createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      }),
      
      // Revenue last month
      this.prisma.sale.aggregate({
        where: { tenantId, status: 'COMPLETED', createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { total: true },
      }),
      
      // Sales today
      this.prisma.sale.count({
        where: { tenantId, status: 'COMPLETED', createdAt: { gte: today } },
      }),
      
      // Revenue today
      this.prisma.sale.aggregate({
        where: { tenantId, status: 'COMPLETED', createdAt: { gte: today } },
        _sum: { total: true },
      }),
      
      // Total products
      this.prisma.product.count({
        where: { tenantId, isActive: true },
      }),
      
      // Total customers
      this.prisma.customer.count({
        where: { tenantId, isActive: true },
      }),
      
      // Low stock products
      this.prisma.product.count({
        where: { tenantId, isActive: true, stock: { lte: 5 } },
      }),
      
      // Pending service orders
      this.prisma.serviceOrder.count({
        where: { tenantId, status: { in: ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS'] } },
      }),
    ]);

    // Calculate growth percentages
    const currentRevenue = Number(revenueThisMonth._sum.total || 0);
    const lastRevenue = Number(revenueLastMonth._sum.total || 0);
    const revenueGrowth = lastRevenue > 0 
      ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 
      : 0;

    const salesGrowth = salesLastMonth > 0 
      ? ((salesThisMonth - salesLastMonth) / salesLastMonth) * 100 
      : 0;

    return {
      today: {
        sales: salesToday,
        revenue: Number(revenueToday._sum.total || 0),
      },
      thisMonth: {
        sales: salesThisMonth,
        revenue: currentRevenue,
        newCustomers: customersThisMonth,
        salesGrowth: Math.round(salesGrowth * 100) / 100,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      },
      totals: {
        products: totalProducts,
        customers: totalCustomers,
        lowStock: lowStockCount,
        pendingOrders,
      },
    };
  }

  async getSalesChart(tenantId: string, days = 7) {
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
      const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
      dailyMap.set(key, { date: key, day: dayName, total: 0, count: 0 });
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

  async getTopProducts(tenantId: string, limit = 5) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const topProducts = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          tenantId,
          status: 'COMPLETED',
          createdAt: { gte: startOfMonth },
        },
      },
      _sum: {
        quantity: true,
        total: true,
      },
      orderBy: {
        _sum: {
          total: 'desc',
        },
      },
      take: limit,
    });

    const productIds = topProducts.map((p) => p.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        sku: true,
        salePrice: true,
      },
    });

    return topProducts.map((tp) => {
      const product = products.find((p) => p.id === tp.productId);
      return {
        id: tp.productId,
        name: product?.name || 'Produto removido',
        sku: product?.sku,
        quantity: tp._sum.quantity || 0,
        revenue: Number(tp._sum.total || 0),
      };
    });
  }

  async getRecentSales(tenantId: string, limit = 5) {
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

  async getLowStockProducts(tenantId: string, limit = 5) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        isActive: true,
        stock: { lte: 5 },
      },
      take: limit,
      orderBy: { stock: 'asc' },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        minStock: true,
      },
    });
  }

  async getPendingServiceOrders(tenantId: string, limit = 5) {
    return this.prisma.serviceOrder.findMany({
      where: {
        tenantId,
        status: { in: ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS'] },
      },
      take: limit,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
      },
    });
  }

  async getFinancialSummary(tenantId: string) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [income, expense, pending] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: {
          tenantId,
          type: 'INCOME',
          status: 'CONFIRMED',
          paidDate: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          tenantId,
          type: 'EXPENSE',
          status: 'CONFIRMED',
          paidDate: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          tenantId,
          status: 'PENDING',
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const totalIncome = Number(income._sum.amount || 0);
    const totalExpense = Number(expense._sum.amount || 0);

    return {
      income: totalIncome,
      expense: totalExpense,
      balance: totalIncome - totalExpense,
      pending: {
        total: Number(pending._sum.amount || 0),
        count: pending._count,
      },
    };
  }
}
