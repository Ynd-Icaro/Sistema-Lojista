import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportFiltersDto } from './dto/reports.dto';
import { startOfDay, endOfDay, parseISO, subDays, subMonths } from 'date-fns';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // ========== SALES REPORT ==========
  async generateSalesReport(tenantId: string, filters: ReportFiltersDto) {
    const where: any = { tenantId };

    // Date filter
    if (filters.periodStart || filters.periodEnd) {
      where.createdAt = {};
      if (filters.periodStart) {
        where.createdAt.gte = startOfDay(parseISO(filters.periodStart));
      }
      if (filters.periodEnd) {
        where.createdAt.lte = endOfDay(parseISO(filters.periodEnd));
      }
    }

    // Status filter
    if (filters.status) {
      where.status = filters.status;
    }

    // Payment method filter
    if (filters.paymentMethod && filters.paymentMethod.length > 0) {
      where.paymentMethod = { in: filters.paymentMethod };
    }

    // Customer search filter
    if (filters.customer) {
      where.customer = {
        name: { contains: filters.customer, mode: 'insensitive' },
      };
    }

    // Total range filter
    if (filters.totalMin || filters.totalMax) {
      where.total = {};
      if (filters.totalMin) where.total.gte = filters.totalMin;
      if (filters.totalMax) where.total.lte = filters.totalMax;
    }

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate summary
    const totalSales = sales.reduce((sum, s) => sum + Number(s.total), 0);
    const totalItems = sales.reduce((sum, s) => sum + s.items.reduce((iSum, i) => iSum + i.quantity, 0), 0);
    const completedSales = sales.filter(s => s.status === 'COMPLETED');
    
    // Calculate growth compared to previous period
    let salesGrowth = 0;
    if (filters.periodStart && filters.periodEnd) {
      const periodDays = Math.ceil(
        (parseISO(filters.periodEnd).getTime() - parseISO(filters.periodStart).getTime()) / (1000 * 60 * 60 * 24)
      );
      const previousPeriodStart = subDays(parseISO(filters.periodStart), periodDays);
      const previousPeriodEnd = subDays(parseISO(filters.periodStart), 1);
      
      const previousSales = await this.prisma.sale.aggregate({
        where: {
          tenantId,
          createdAt: {
            gte: previousPeriodStart,
            lte: previousPeriodEnd,
          },
        },
        _sum: { total: true },
      });

      const previousTotal = Number(previousSales._sum.total || 0);
      if (previousTotal > 0) {
        salesGrowth = ((totalSales - previousTotal) / previousTotal) * 100;
      }
    }

    return {
      summary: {
        totalSales,
        totalOrders: sales.length,
        averageTicket: sales.length > 0 ? totalSales / sales.length : 0,
        totalItems,
        salesGrowth,
      },
      items: sales,
    };
  }

  // ========== PRODUCTS REPORT ==========
  async generateProductsReport(tenantId: string, filters: ReportFiltersDto) {
    const where: any = { tenantId };

    // Category filter
    if (filters.category) {
      where.category = {
        name: { contains: filters.category, mode: 'insensitive' },
      };
    }

    // Stock status filter
    if (filters.stockStatus) {
      switch (filters.stockStatus) {
        case 'out':
          where.stock = { lte: 0 };
          break;
        case 'low':
          where.AND = [
            { stock: { gt: 0 } },
            { stock: { lte: this.prisma.product.fields.minStock } },
          ];
          break;
        case 'normal':
          where.stock = { gt: 0 };
          break;
      }
    }

    // Show inactive filter
    if (!filters.showInactive) {
      where.isActive = true;
    }

    // Get products with sales data
    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    // Get sales data for period
    let salesData: Record<string, { quantity: number; revenue: number }> = {};
    if (filters.periodStart || filters.periodEnd) {
      const salesWhere: any = { 
        sale: { tenantId },
      };
      if (filters.periodStart) {
        salesWhere.sale.createdAt = { gte: startOfDay(parseISO(filters.periodStart)) };
      }
      if (filters.periodEnd) {
        salesWhere.sale.createdAt = { ...salesWhere.sale?.createdAt, lte: endOfDay(parseISO(filters.periodEnd)) };
      }

      const saleItems = await this.prisma.saleItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true, total: true },
        where: salesWhere,
      });

      salesData = saleItems.reduce((acc, item) => {
        acc[item.productId] = {
          quantity: item._sum.quantity || 0,
          revenue: Number(item._sum.total || 0),
        };
        return acc;
      }, {} as Record<string, { quantity: number; revenue: number }>);
    }

    // Map products with sales data
    const productsWithSales = products.map(product => ({
      ...product,
      soldQuantity: salesData[product.id]?.quantity || 0,
      revenue: salesData[product.id]?.revenue || 0,
    }));

    // Sort
    if (filters.sortBy) {
      productsWithSales.sort((a, b) => {
        switch (filters.sortBy) {
          case 'sales':
            return b.soldQuantity - a.soldQuantity;
          case 'revenue':
            return b.revenue - a.revenue;
          case 'stock':
            return b.stock - a.stock;
          case 'name':
            return a.name.localeCompare(b.name);
          default:
            return 0;
        }
      });
    }

    // Summary
    const totalProducts = products.length;
    const stockValue = products.reduce((sum, p) => sum + (p.stock * Number(p.costPrice || p.salePrice)), 0);
    const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
    const outOfStockCount = products.filter(p => p.stock <= 0).length;

    return {
      summary: {
        totalProducts,
        stockValue,
        lowStockCount,
        outOfStockCount,
      },
      items: productsWithSales,
    };
  }

  // ========== CUSTOMERS REPORT ==========
  async generateCustomersReport(tenantId: string, filters: ReportFiltersDto) {
    const where: any = { tenantId };

    // Search filter
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const customers = await this.prisma.customer.findMany({
      where,
      include: {
        _count: { select: { sales: true, serviceOrders: true } },
      },
    });

    // Get sales data per customer
    const salesByCustomer = await this.prisma.sale.groupBy({
      by: ['customerId'],
      _sum: { total: true },
      _count: true,
      _max: { createdAt: true },
      where: {
        tenantId,
        customerId: { not: null },
        status: 'COMPLETED',
        ...(filters.periodStart && {
          createdAt: { gte: startOfDay(parseISO(filters.periodStart)) },
        }),
        ...(filters.periodEnd && {
          createdAt: { lte: endOfDay(parseISO(filters.periodEnd)) },
        }),
      },
    });

    const salesMap = salesByCustomer.reduce((acc, item) => {
      if (item.customerId) {
        acc[item.customerId] = {
          totalSpent: Number(item._sum.total || 0),
          orderCount: item._count,
          lastOrderDate: item._max.createdAt,
        };
      }
      return acc;
    }, {} as Record<string, { totalSpent: number; orderCount: number; lastOrderDate: Date | null }>);

    // Map customers with sales data
    let customersWithSales = customers.map(customer => ({
      ...customer,
      totalSpent: salesMap[customer.id]?.totalSpent || 0,
      orderCount: salesMap[customer.id]?.orderCount || 0,
      lastOrderDate: salesMap[customer.id]?.lastOrderDate || null,
    }));

    // Filter by orders
    if (filters.hasOrders) {
      customersWithSales = customersWithSales.filter(c => c.orderCount > 0);
    }

    // Filter by total spent
    if (filters.totalSpentMin || filters.totalSpentMax) {
      customersWithSales = customersWithSales.filter(c => {
        if (filters.totalSpentMin && c.totalSpent < filters.totalSpentMin) return false;
        if (filters.totalSpentMax && c.totalSpent > filters.totalSpentMax) return false;
        return true;
      });
    }

    // Sort
    if (filters.sortBy) {
      customersWithSales.sort((a, b) => {
        switch (filters.sortBy) {
          case 'totalSpent':
            return b.totalSpent - a.totalSpent;
          case 'orderCount':
            return b.orderCount - a.orderCount;
          case 'lastOrder':
            return (b.lastOrderDate?.getTime() || 0) - (a.lastOrderDate?.getTime() || 0);
          case 'name':
            return a.name.localeCompare(b.name);
          default:
            return 0;
        }
      });
    }

    // Summary
    const totalRevenue = customersWithSales.reduce((sum, c) => sum + c.totalSpent, 0);
    const activeCustomers = customersWithSales.filter(c => c.orderCount > 0).length;

    return {
      summary: {
        totalCustomers: customers.length,
        activeCustomers,
        totalRevenue,
      },
      items: customersWithSales,
    };
  }

  // ========== FINANCIAL REPORT ==========
  async generateFinancialReport(tenantId: string, filters: ReportFiltersDto) {
    const where: any = { tenantId };

    // Date filter
    if (filters.periodStart || filters.periodEnd) {
      where.dueDate = {};
      if (filters.periodStart) {
        where.dueDate.gte = startOfDay(parseISO(filters.periodStart));
      }
      if (filters.periodEnd) {
        where.dueDate.lte = endOfDay(parseISO(filters.periodEnd));
      }
    }

    // Type filter
    if (filters.type) {
      where.type = filters.type;
    }

    // Status filter
    if (filters.status) {
      where.status = filters.status;
    }

    // Category filter
    if (filters.category) {
      where.category = { contains: filters.category, mode: 'insensitive' };
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      orderBy: { dueDate: 'desc' },
    });

    // Calculate summary
    const incomeTransactions = transactions.filter(t => t.type === 'INCOME');
    const expenseTransactions = transactions.filter(t => t.type === 'EXPENSE');
    
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const balance = totalIncome - totalExpenses;
    
    const pendingTransactions = transactions.filter(t => t.status === 'PENDING');
    const pendingAmount = pendingTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      summary: {
        totalIncome,
        totalExpenses,
        balance,
        pendingAmount,
      },
      items: transactions,
    };
  }

  // ========== SERVICE ORDERS REPORT ==========
  async generateServiceOrdersReport(tenantId: string, filters: ReportFiltersDto) {
    const where: any = { tenantId };

    // Date filter
    if (filters.periodStart || filters.periodEnd) {
      where.createdAt = {};
      if (filters.periodStart) {
        where.createdAt.gte = startOfDay(parseISO(filters.periodStart));
      }
      if (filters.periodEnd) {
        where.createdAt.lte = endOfDay(parseISO(filters.periodEnd));
      }
    }

    // Status filter
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        where.status = { in: filters.status };
      } else {
        where.status = filters.status;
      }
    }

    // Priority filter
    if (filters.priority) {
      where.priority = filters.priority;
    }

    // Technician filter
    if (filters.technician) {
      where.user = {
        name: { contains: filters.technician, mode: 'insensitive' },
      };
    }

    const serviceOrders = await this.prisma.serviceOrder.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Summary
    const total = serviceOrders.length;
    const completed = serviceOrders.filter(o => o.status === 'COMPLETED' || o.status === 'DELIVERED').length;
    const inProgress = serviceOrders.filter(o => o.status === 'IN_PROGRESS').length;
    const revenue = serviceOrders
      .filter(o => o.status === 'COMPLETED' || o.status === 'DELIVERED')
      .reduce((sum, o) => sum + Number(o.total), 0);

    return {
      summary: {
        total,
        completed,
        inProgress,
        revenue,
      },
      items: serviceOrders,
    };
  }

  // ========== INVOICES REPORT ==========
  async generateInvoicesReport(tenantId: string, filters: ReportFiltersDto) {
    const where: any = { tenantId };

    // Date filter
    if (filters.periodStart || filters.periodEnd) {
      where.issueDate = {};
      if (filters.periodStart) {
        where.issueDate.gte = startOfDay(parseISO(filters.periodStart));
      }
      if (filters.periodEnd) {
        where.issueDate.lte = endOfDay(parseISO(filters.periodEnd));
      }
    }

    // Type filter
    if (filters.type) {
      if (Array.isArray(filters.type)) {
        where.type = { in: filters.type };
      } else {
        where.type = filters.type;
      }
    }

    // Status filter
    if (filters.status) {
      where.status = filters.status;
    }

    // Total range filter
    if (filters.totalMin || filters.totalMax) {
      where.total = {};
      if (filters.totalMin) where.total.gte = filters.totalMin;
      if (filters.totalMax) where.total.lte = filters.totalMax;
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
      },
      orderBy: { issueDate: 'desc' },
    });

    // Summary
    const total = invoices.length;
    const issued = invoices.filter(i => i.status === 'ISSUED' || i.status === 'SENT').length;
    const cancelled = invoices.filter(i => i.status === 'CANCELLED').length;
    const totalValue = invoices
      .filter(i => i.status !== 'CANCELLED')
      .reduce((sum, i) => sum + Number(i.total), 0);

    return {
      summary: {
        total,
        issued,
        cancelled,
        totalValue,
      },
      items: invoices,
    };
  }

  // ========== EXPORT TO EXCEL ==========
  async exportToExcel(reportType: string, data: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Relatório');

    // Get columns based on report type
    const columns = this.getColumnsForReport(reportType);
    worksheet.columns = columns;

    // Add header style
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' },
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Add data rows
    data.items?.forEach((item: any) => {
      const rowData = this.mapItemToRow(reportType, item);
      worksheet.addRow(rowData);
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      if (column.width) return;
      let maxLength = 0;
      column.eachCell?.({ includeEmpty: true }, cell => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength + 2;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private getColumnsForReport(reportType: string): Partial<ExcelJS.Column>[] {
    switch (reportType) {
      case 'sales':
        return [
          { header: 'Código', key: 'code', width: 15 },
          { header: 'Data', key: 'date', width: 15 },
          { header: 'Cliente', key: 'customer', width: 30 },
          { header: 'Pagamento', key: 'paymentMethod', width: 15 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Total', key: 'total', width: 15 },
        ];
      case 'products':
        return [
          { header: 'SKU', key: 'sku', width: 15 },
          { header: 'Produto', key: 'name', width: 40 },
          { header: 'Categoria', key: 'category', width: 20 },
          { header: 'Estoque', key: 'stock', width: 10 },
          { header: 'Vendidos', key: 'sold', width: 10 },
          { header: 'Preço', key: 'price', width: 15 },
          { header: 'Faturamento', key: 'revenue', width: 15 },
        ];
      case 'customers':
        return [
          { header: 'Nome', key: 'name', width: 30 },
          { header: 'Email', key: 'email', width: 30 },
          { header: 'Telefone', key: 'phone', width: 20 },
          { header: 'Pedidos', key: 'orders', width: 10 },
          { header: 'Total Gasto', key: 'totalSpent', width: 15 },
          { header: 'Última Compra', key: 'lastOrder', width: 15 },
        ];
      case 'financial':
        return [
          { header: 'Data', key: 'date', width: 15 },
          { header: 'Descrição', key: 'description', width: 40 },
          { header: 'Categoria', key: 'category', width: 20 },
          { header: 'Tipo', key: 'type', width: 10 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Valor', key: 'amount', width: 15 },
        ];
      case 'serviceOrders':
        return [
          { header: 'Código', key: 'code', width: 15 },
          { header: 'Cliente', key: 'customer', width: 30 },
          { header: 'Título', key: 'title', width: 40 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Prioridade', key: 'priority', width: 15 },
          { header: 'Total', key: 'total', width: 15 },
        ];
      case 'invoices':
        return [
          { header: 'Número', key: 'number', width: 15 },
          { header: 'Tipo', key: 'type', width: 15 },
          { header: 'Cliente', key: 'customer', width: 30 },
          { header: 'Data', key: 'date', width: 15 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Valor', key: 'total', width: 15 },
        ];
      default:
        return [];
    }
  }

  private mapItemToRow(reportType: string, item: any): Record<string, any> {
    switch (reportType) {
      case 'sales':
        return {
          code: item.code,
          date: item.createdAt,
          customer: item.customer?.name || 'Consumidor Final',
          paymentMethod: item.paymentMethod,
          status: item.status,
          total: Number(item.total),
        };
      case 'products':
        return {
          sku: item.sku,
          name: item.name,
          category: item.category?.name || '-',
          stock: item.stock,
          sold: item.soldQuantity || 0,
          price: Number(item.salePrice),
          revenue: item.revenue || 0,
        };
      case 'customers':
        return {
          name: item.name,
          email: item.email || '-',
          phone: item.phone || '-',
          orders: item.orderCount || 0,
          totalSpent: item.totalSpent || 0,
          lastOrder: item.lastOrderDate || '-',
        };
      case 'financial':
        return {
          date: item.dueDate || item.createdAt,
          description: item.description,
          category: item.category || '-',
          type: item.type,
          status: item.status,
          amount: Number(item.amount),
        };
      case 'serviceOrders':
        return {
          code: item.code,
          customer: item.customer?.name || '-',
          title: item.title,
          status: item.status,
          priority: item.priority,
          total: Number(item.total),
        };
      case 'invoices':
        return {
          number: item.number,
          type: item.type,
          customer: item.customer?.name || item.recipientName || 'Consumidor Final',
          date: item.issueDate,
          status: item.status,
          total: Number(item.total),
        };
      default:
        return item;
    }
  }

  // ========== GENERATE PDF HTML ==========
  generatePdfHtml(reportType: string, data: any, filters: ReportFiltersDto): string {
    const reportTitle = this.getReportTitle(reportType);
    const periodText = filters.periodStart && filters.periodEnd
      ? `Período: ${filters.periodStart} a ${filters.periodEnd}`
      : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${reportTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #4F46E5; }
          .header p { margin: 5px 0; color: #666; }
          .summary { display: flex; gap: 20px; margin-bottom: 30px; flex-wrap: wrap; }
          .summary-card { background: #f8f9fa; padding: 15px; border-radius: 8px; flex: 1; min-width: 150px; }
          .summary-card h3 { margin: 0 0 5px 0; font-size: 14px; color: #666; }
          .summary-card p { margin: 0; font-size: 24px; font-weight: bold; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #4F46E5; color: white; }
          tr:hover { background: #f5f5f5; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #999; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          @media print {
            body { padding: 0; }
            .summary-card { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SmartFlux ERP</h1>
          <h2>${reportTitle}</h2>
          <p>${periodText}</p>
          <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
        </div>
        
        ${this.generateSummaryHtml(reportType, data.summary)}
        ${this.generateTableHtml(reportType, data.items)}
        
        <div class="footer">
          <p>Documento gerado automaticamente pelo SmartFlux ERP</p>
        </div>
      </body>
      </html>
    `;
  }

  private getReportTitle(reportType: string): string {
    const titles: Record<string, string> = {
      sales: 'Relatório de Vendas',
      products: 'Relatório de Produtos',
      customers: 'Relatório de Clientes',
      financial: 'Relatório Financeiro',
      serviceOrders: 'Relatório de Ordens de Serviço',
      invoices: 'Relatório de Notas Fiscais',
    };
    return titles[reportType] || 'Relatório';
  }

  private generateSummaryHtml(reportType: string, summary: any): string {
    if (!summary) return '';

    const formatCurrency = (v: number) => 
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    let cards = '';
    switch (reportType) {
      case 'sales':
        cards = `
          <div class="summary-card"><h3>Total em Vendas</h3><p>${formatCurrency(summary.totalSales || 0)}</p></div>
          <div class="summary-card"><h3>Nº de Vendas</h3><p>${summary.totalOrders || 0}</p></div>
          <div class="summary-card"><h3>Ticket Médio</h3><p>${formatCurrency(summary.averageTicket || 0)}</p></div>
          <div class="summary-card"><h3>Itens Vendidos</h3><p>${summary.totalItems || 0}</p></div>
        `;
        break;
      case 'products':
        cards = `
          <div class="summary-card"><h3>Total de Produtos</h3><p>${summary.totalProducts || 0}</p></div>
          <div class="summary-card"><h3>Valor em Estoque</h3><p>${formatCurrency(summary.stockValue || 0)}</p></div>
          <div class="summary-card"><h3>Estoque Baixo</h3><p>${summary.lowStockCount || 0}</p></div>
          <div class="summary-card"><h3>Sem Estoque</h3><p>${summary.outOfStockCount || 0}</p></div>
        `;
        break;
      case 'customers':
        cards = `
          <div class="summary-card"><h3>Total de Clientes</h3><p>${summary.totalCustomers || 0}</p></div>
          <div class="summary-card"><h3>Clientes Ativos</h3><p>${summary.activeCustomers || 0}</p></div>
          <div class="summary-card"><h3>Receita Total</h3><p>${formatCurrency(summary.totalRevenue || 0)}</p></div>
        `;
        break;
      case 'financial':
        cards = `
          <div class="summary-card"><h3>Receitas</h3><p style="color: green">${formatCurrency(summary.totalIncome || 0)}</p></div>
          <div class="summary-card"><h3>Despesas</h3><p style="color: red">${formatCurrency(summary.totalExpenses || 0)}</p></div>
          <div class="summary-card"><h3>Saldo</h3><p>${formatCurrency(summary.balance || 0)}</p></div>
          <div class="summary-card"><h3>Pendentes</h3><p style="color: orange">${formatCurrency(summary.pendingAmount || 0)}</p></div>
        `;
        break;
      case 'serviceOrders':
        cards = `
          <div class="summary-card"><h3>Total de OS</h3><p>${summary.total || 0}</p></div>
          <div class="summary-card"><h3>Concluídas</h3><p>${summary.completed || 0}</p></div>
          <div class="summary-card"><h3>Em Andamento</h3><p>${summary.inProgress || 0}</p></div>
          <div class="summary-card"><h3>Faturamento</h3><p>${formatCurrency(summary.revenue || 0)}</p></div>
        `;
        break;
      case 'invoices':
        cards = `
          <div class="summary-card"><h3>Total de Notas</h3><p>${summary.total || 0}</p></div>
          <div class="summary-card"><h3>Emitidas</h3><p>${summary.issued || 0}</p></div>
          <div class="summary-card"><h3>Canceladas</h3><p>${summary.cancelled || 0}</p></div>
          <div class="summary-card"><h3>Valor Total</h3><p>${formatCurrency(summary.totalValue || 0)}</p></div>
        `;
        break;
    }

    return `<div class="summary">${cards}</div>`;
  }

  private generateTableHtml(reportType: string, items: any[]): string {
    if (!items || items.length === 0) return '<p>Nenhum dado encontrado.</p>';

    const formatCurrency = (v: number) => 
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    
    const formatDate = (d: string | Date) => {
      if (!d) return '-';
      const date = typeof d === 'string' ? new Date(d) : d;
      return date.toLocaleDateString('pt-BR');
    };

    let headers = '';
    let rows = '';

    switch (reportType) {
      case 'sales':
        headers = '<th>Código</th><th>Data</th><th>Cliente</th><th>Pagamento</th><th>Status</th><th class="text-right">Total</th>';
        rows = items.map(item => `
          <tr>
            <td>#${item.code}</td>
            <td>${formatDate(item.createdAt)}</td>
            <td>${item.customer?.name || 'Consumidor Final'}</td>
            <td>${item.paymentMethod}</td>
            <td>${item.status}</td>
            <td class="text-right">${formatCurrency(Number(item.total))}</td>
          </tr>
        `).join('');
        break;
      
      case 'products':
        headers = '<th>SKU</th><th>Produto</th><th>Categoria</th><th class="text-center">Estoque</th><th class="text-center">Vendidos</th><th class="text-right">Preço</th><th class="text-right">Faturamento</th>';
        rows = items.map(item => `
          <tr>
            <td>${item.sku || '-'}</td>
            <td>${item.name}</td>
            <td>${item.category?.name || '-'}</td>
            <td class="text-center">${item.stock}</td>
            <td class="text-center">${item.soldQuantity || 0}</td>
            <td class="text-right">${formatCurrency(Number(item.salePrice))}</td>
            <td class="text-right">${formatCurrency(item.revenue || 0)}</td>
          </tr>
        `).join('');
        break;
      
      case 'customers':
        headers = '<th>Nome</th><th>Email</th><th>Telefone</th><th class="text-center">Pedidos</th><th class="text-right">Total Gasto</th><th>Última Compra</th>';
        rows = items.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${item.email || '-'}</td>
            <td>${item.phone || '-'}</td>
            <td class="text-center">${item.orderCount || 0}</td>
            <td class="text-right">${formatCurrency(item.totalSpent || 0)}</td>
            <td>${item.lastOrderDate ? formatDate(item.lastOrderDate) : '-'}</td>
          </tr>
        `).join('');
        break;
      
      case 'financial':
        headers = '<th>Data</th><th>Descrição</th><th>Categoria</th><th>Status</th><th class="text-right">Valor</th>';
        rows = items.map(item => `
          <tr>
            <td>${formatDate(item.dueDate || item.createdAt)}</td>
            <td>${item.description}</td>
            <td>${item.category || '-'}</td>
            <td>${item.status}</td>
            <td class="text-right" style="color: ${item.type === 'INCOME' ? 'green' : 'red'}">
              ${item.type === 'INCOME' ? '+' : '-'}${formatCurrency(Number(item.amount))}
            </td>
          </tr>
        `).join('');
        break;
      
      case 'serviceOrders':
        headers = '<th>Código</th><th>Cliente</th><th>Título</th><th>Status</th><th>Prioridade</th><th class="text-right">Total</th>';
        rows = items.map(item => `
          <tr>
            <td>#${item.code}</td>
            <td>${item.customer?.name || '-'}</td>
            <td>${item.title}</td>
            <td>${item.status}</td>
            <td>${item.priority}</td>
            <td class="text-right">${formatCurrency(Number(item.total))}</td>
          </tr>
        `).join('');
        break;
      
      case 'invoices':
        headers = '<th>Número</th><th>Tipo</th><th>Cliente</th><th>Data</th><th>Status</th><th class="text-right">Valor</th>';
        rows = items.map(item => `
          <tr>
            <td>${item.number}</td>
            <td>${item.type}</td>
            <td>${item.customer?.name || item.recipientName || 'Consumidor Final'}</td>
            <td>${formatDate(item.issueDate)}</td>
            <td>${item.status}</td>
            <td class="text-right">${formatCurrency(Number(item.total))}</td>
          </tr>
        `).join('');
        break;
    }

    return `
      <table>
        <thead><tr>${headers}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  // ========== PRESETS ==========
  async getPresets(tenantId: string) {
    // For now, return empty array - implement preset storage if needed
    return [];
  }

  async savePreset(tenantId: string, name: string, reportType: string, filters: Record<string, any>) {
    // For now, just return success - implement preset storage if needed
    return { id: Date.now().toString(), name, reportType, filters };
  }

  async deletePreset(tenantId: string, id: string) {
    // For now, just return success - implement preset storage if needed
    return { message: 'Preset excluído com sucesso' };
  }
}
