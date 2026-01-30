import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto, UpdateTransactionDto, TransactionQueryDto, CreateCategoryDto } from './dto/financial.dto';
import { TransactionStatus, TransactionStatusType, PaymentMethod, PaymentMethodType } from '../../types';

@Injectable()
export class FinancialService {
  constructor(private prisma: PrismaService) {}

  // ============== TRANSACTIONS ==============

  async findAllTransactions(tenantId: string, query: TransactionQueryDto) {
    const { page = 1, limit = 20, search, type, status, categoryId, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (search) {
      where.description = { contains: search, mode: 'insensitive' };
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) where.dueDate.gte = new Date(startDate);
      if (endDate) where.dueDate.lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: {
            select: { id: true, name: true, color: true, icon: true },
          },
          sale: {
            select: { id: true, code: true },
          },
        },
        orderBy: { dueDate: 'desc' },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneTransaction(id: string, tenantId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
        sale: {
          include: {
            customer: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }

    return transaction;
  }

  async createTransaction(tenantId: string, dto: CreateTransactionDto) {
    return this.prisma.transaction.create({
      data: {
        tenantId,
        type: dto.type,
        description: dto.description,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        paidDate: dto.paidDate ? new Date(dto.paidDate) : null,
        status: (dto.status || TransactionStatus.PENDING) as TransactionStatusType,
        paymentMethod: dto.paymentMethod as PaymentMethodType | undefined,
        categoryId: dto.categoryId,
        reference: dto.reference,
        notes: dto.notes,
        recurrence: dto.recurrence,
      },
      include: {
        category: true,
      },
    });
  }

  async updateTransaction(id: string, tenantId: string, dto: UpdateTransactionDto) {
    await this.findOneTransaction(id, tenantId);

    const updateData: any = { ...dto };
    
    if (dto.dueDate) {
      updateData.dueDate = new Date(dto.dueDate);
    }
    
    if (dto.paidDate) {
      updateData.paidDate = new Date(dto.paidDate);
    }

    return this.prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });
  }

  async confirmTransaction(id: string, tenantId: string, paidDate?: string, paymentMethod?: string) {
    await this.findOneTransaction(id, tenantId);

    return this.prisma.transaction.update({
      where: { id },
      data: {
        status: TransactionStatus.CONFIRMED as TransactionStatusType,
        paidDate: paidDate ? new Date(paidDate) : new Date(),
        paymentMethod: (paymentMethod as PaymentMethodType) || undefined,
      },
    });
  }

  async cancelTransaction(id: string, tenantId: string) {
    await this.findOneTransaction(id, tenantId);

    return this.prisma.transaction.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async removeTransaction(id: string, tenantId: string) {
    const transaction = await this.findOneTransaction(id, tenantId);

    if (transaction.saleId) {
      throw new BadRequestException('Não é possível remover transação vinculada a uma venda');
    }

    await this.prisma.transaction.delete({
      where: { id },
    });

    return { message: 'Transação removida com sucesso' };
  }

  // ============== CATEGORIES ==============

  async findAllCategories(tenantId: string) {
    return this.prisma.transactionCategory.findMany({
      where: {
        OR: [
          { tenantId },
          { tenantId: null, isSystem: true },
        ],
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  async createCategory(tenantId: string, dto: CreateCategoryDto) {
    return this.prisma.transactionCategory.create({
      data: {
        ...dto,
        tenantId,
      },
    });
  }

  async updateCategory(id: string, tenantId: string, dto: Partial<CreateCategoryDto>) {
    const category = await this.prisma.transactionCategory.findFirst({
      where: { id, tenantId },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    if (category.isSystem) {
      throw new BadRequestException('Não é possível editar categoria do sistema');
    }

    return this.prisma.transactionCategory.update({
      where: { id },
      data: dto,
    });
  }

  async removeCategory(id: string, tenantId: string) {
    const category = await this.prisma.transactionCategory.findFirst({
      where: { id, tenantId },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    if (category.isSystem) {
      throw new BadRequestException('Não é possível remover categoria do sistema');
    }

    // Check if has transactions
    const transactionsCount = await this.prisma.transaction.count({
      where: { categoryId: id },
    });

    if (transactionsCount > 0) {
      throw new BadRequestException('Categoria possui transações vinculadas');
    }

    await this.prisma.transactionCategory.delete({
      where: { id },
    });

    return { message: 'Categoria removida com sucesso' };
  }

  // ============== REPORTS ==============

  async getBalance(tenantId: string, startDate?: Date, endDate?: Date) {
    const where: any = { tenantId, status: 'CONFIRMED' };

    if (startDate || endDate) {
      where.paidDate = {};
      if (startDate) where.paidDate.gte = startDate;
      if (endDate) where.paidDate.lte = endDate;
    }

    const [income, expense] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { ...where, type: 'INCOME' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...where, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = Number(income._sum.amount || 0);
    const totalExpense = Number(expense._sum.amount || 0);
    const balance = totalIncome - totalExpense;

    return {
      income: totalIncome,
      expense: totalExpense,
      balance,
    };
  }

  async getCashFlow(tenantId: string, months = 6) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        tenantId,
        status: 'CONFIRMED',
        paidDate: { gte: startDate },
      },
      select: {
        type: true,
        amount: true,
        paidDate: true,
      },
    });

    // Group by month
    const monthlyData = new Map();

    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      monthlyData.set(key, { 
        date: `${monthNames[date.getMonth()]}/${date.getFullYear().toString().slice(-2)}`,
        month: key, 
        income: 0, 
        expense: 0, 
        balance: 0 
      });
    }

    for (const transaction of transactions) {
      if (transaction.paidDate) {
        const key = `${transaction.paidDate.getFullYear()}-${String(transaction.paidDate.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData.has(key)) {
          const data = monthlyData.get(key);
          const amount = Number(transaction.amount);
          if (transaction.type === 'INCOME') {
            data.income += amount;
          } else {
            data.expense += amount;
          }
          data.balance = data.income - data.expense;
        }
      }
    }

    return Array.from(monthlyData.values()).reverse();
  }

  async getPendingTransactions(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [overdue, dueToday, upcoming] = await Promise.all([
      // Atrasados
      this.prisma.transaction.findMany({
        where: {
          tenantId,
          status: 'PENDING',
          dueDate: { lt: today },
        },
        include: {
          category: { select: { name: true, color: true } },
        },
        orderBy: { dueDate: 'asc' },
      }),
      // Vencem hoje
      this.prisma.transaction.findMany({
        where: {
          tenantId,
          status: 'PENDING',
          dueDate: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        },
        include: {
          category: { select: { name: true, color: true } },
        },
      }),
      // Próximos 7 dias
      this.prisma.transaction.findMany({
        where: {
          tenantId,
          status: 'PENDING',
          dueDate: {
            gte: new Date(today.getTime() + 24 * 60 * 60 * 1000),
            lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          category: { select: { name: true, color: true } },
        },
        orderBy: { dueDate: 'asc' },
      }),
    ]);

    return {
      overdue: {
        count: overdue.length,
        total: overdue.reduce((acc, t) => acc + Number(t.amount), 0),
        items: overdue,
      },
      dueToday: {
        count: dueToday.length,
        total: dueToday.reduce((acc, t) => acc + Number(t.amount), 0),
        items: dueToday,
      },
      upcoming: {
        count: upcoming.length,
        total: upcoming.reduce((acc, t) => acc + Number(t.amount), 0),
        items: upcoming,
      },
    };
  }

  async getExpensesByCategory(tenantId: string, startDate?: Date, endDate?: Date) {
    const where: any = { tenantId, type: 'EXPENSE', status: 'CONFIRMED' };

    if (startDate || endDate) {
      where.paidDate = {};
      if (startDate) where.paidDate.gte = startDate;
      if (endDate) where.paidDate.lte = endDate;
    }

    const expenses = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    const categoryIds = expenses.map((e) => e.categoryId).filter((id): id is string => id !== null);
    const categories = await this.prisma.transactionCategory.findMany({
      where: { id: { in: categoryIds } },
    });

    return expenses.map((e) => {
      const category = categories.find((c) => c.id === e.categoryId);
      return {
        categoryId: e.categoryId,
        categoryName: category?.name || 'Sem categoria',
        categoryColor: category?.color || '#64748b',
        total: Number(e._sum.amount),
        count: e._count,
      };
    }).sort((a, b) => b.total - a.total);
  }

  async getDashboardSummary(tenantId: string) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const [currentMonth, lastMonth, pendingExpense, pendingIncome, overdue, expensesByCategory] = await Promise.all([
      this.getBalance(tenantId, startOfMonth, today),
      this.getBalance(tenantId, startOfLastMonth, endOfLastMonth),
      // Despesas pendentes
      this.prisma.transaction.aggregate({
        where: { tenantId, status: 'PENDING', type: 'EXPENSE' },
        _sum: { amount: true },
        _count: true,
      }),
      // Receitas pendentes (a receber)
      this.prisma.transaction.aggregate({
        where: { tenantId, status: 'PENDING', type: 'INCOME' },
        _sum: { amount: true },
        _count: true,
      }),
      // Atrasados (despesas)
      this.prisma.transaction.aggregate({
        where: {
          tenantId,
          status: 'PENDING',
          type: 'EXPENSE',
          dueDate: { lt: today },
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.getExpensesByCategory(tenantId, startOfMonth, today),
    ]);

    // Calculate growth
    const incomeGrowth = lastMonth.income > 0 
      ? ((currentMonth.income - lastMonth.income) / lastMonth.income) * 100 
      : 0;
    const expenseGrowth = lastMonth.expense > 0 
      ? ((currentMonth.expense - lastMonth.expense) / lastMonth.expense) * 100 
      : 0;

    return {
      // Dados diretos para compatibilidade com a página
      income: currentMonth.income,
      expense: currentMonth.expense,
      balance: currentMonth.balance,
      // Dados detalhados
      currentMonth: {
        income: currentMonth.income,
        expense: currentMonth.expense,
        balance: currentMonth.balance,
        incomeGrowth: Math.round(incomeGrowth * 100) / 100,
        expenseGrowth: Math.round(expenseGrowth * 100) / 100,
      },
      // Despesas pendentes (a pagar)
      pending: {
        total: Number(pendingExpense._sum.amount || 0),
        count: pendingExpense._count,
      },
      // Receitas pendentes (a receber)
      receivable: {
        total: Number(pendingIncome._sum.amount || 0),
        count: pendingIncome._count,
      },
      // Atrasados
      overdue: {
        total: Number(overdue._sum.amount || 0),
        count: overdue._count,
      },
      expensesByCategory: expensesByCategory.map((cat) => ({
        category: cat.categoryName,
        total: cat.total,
        color: cat.categoryColor,
      })),
    };
  }
}
