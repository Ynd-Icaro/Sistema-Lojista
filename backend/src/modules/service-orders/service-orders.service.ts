import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { InvoicesService } from "../invoices/invoices.service";
import {
  CreateServiceOrderDto,
  UpdateServiceOrderDto,
  ServiceOrderQueryDto,
} from "./dto/service-order.dto";
import {
  TransactionStatus,
  TransactionStatusType,
  PaymentMethod,
  PaymentMethodType,
} from "../../types";

@Injectable()
export class ServiceOrdersService {
  private readonly logger = new Logger(ServiceOrdersService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => InvoicesService))
    private invoicesService: InvoicesService,
  ) {}

  async findAll(tenantId: string, query: ServiceOrderQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      customerId,
      startDate,
      endDate,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
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

    const [orders, total] = await Promise.all([
      this.prisma.serviceOrder.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              whatsapp: true,
            },
          },
          user: {
            select: { id: true, name: true },
          },
          _count: {
            select: { items: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.serviceOrder.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOverdueCount(tenantId: string) {
    const now = new Date();

    const overdueCount = await this.prisma.serviceOrder.count({
      where: {
        tenantId,
        estimatedDate: {
          lt: now,
        },
        status: {
          notIn: ["COMPLETED", "DELIVERED", "CANCELLED"],
        },
      },
    });

    return { count: overdueCount };
  }

  async findOne(id: string, tenantId: string) {
    const order = await this.prisma.serviceOrder.findFirst({
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
        invoices: {
          select: { id: true, number: true, status: true, type: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException("Ordem de serviço não encontrada");
    }

    return order;
  }

  async create(tenantId: string, userId: string, dto: CreateServiceOrderDto) {
    // Generate order code
    const lastOrder = await this.prisma.serviceOrder.findFirst({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      select: { code: true },
    });

    const nextNumber = lastOrder
      ? parseInt(lastOrder.code.replace("OS", "")) + 1
      : 1;
    const code = `OS${nextNumber.toString().padStart(6, "0")}`;

    // Calculate totals
    let partsCost = 0;
    const itemsData =
      dto.items?.map((item) => {
        const itemTotal = item.unitPrice * item.quantity;
        partsCost += itemTotal;
        return {
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: itemTotal,
        };
      }) || [];

    const laborCost = dto.laborCost || 0;
    const discount = dto.discount || 0;
    const total = laborCost + partsCost - discount;

    const order = await this.prisma.serviceOrder.create({
      data: {
        tenantId,
        userId,
        customerId: dto.customerId,
        code,
        title: dto.title,
        description: dto.description,
        deviceType: dto.deviceType,
        deviceBrand: dto.deviceBrand,
        deviceModel: dto.deviceModel,
        deviceSerial: dto.deviceSerial,
        deviceCondition: dto.deviceCondition,
        reportedIssue: dto.reportedIssue,
        laborCost,
        partsCost,
        discount,
        total,
        priority: dto.priority || "NORMAL",
        estimatedDate: dto.estimatedDate ? new Date(dto.estimatedDate) : null,
        warrantyDays: dto.warrantyDays || 90,
        notes: dto.notes,
        items: {
          create: itemsData,
        },
      },
      include: {
        customer: true,
        items: true,
      },
    });

    // Enviar notificação de OS criada (email)
    if (order.customer) {
      try {
        await this.notificationsService.sendServiceOrderUpdate(
          tenantId,
          {
            ...order,
            code: order.code,
          },
          "CREATED",
        );
      } catch (error) {
        this.logger.error(
          `Erro ao enviar notificação de OS criada: ${error.message}`,
        );
      }
    }

    return order;
  }

  async update(id: string, tenantId: string, dto: UpdateServiceOrderDto) {
    await this.findOne(id, tenantId);

    // Recalculate totals if items changed
    let partsCost;
    let itemsData;

    if (dto.items) {
      partsCost = 0;
      itemsData = dto.items.map((item) => {
        const itemTotal = item.unitPrice * item.quantity;
        partsCost += itemTotal;
        return {
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: itemTotal,
        };
      });
    }

    const updateData: any = { ...dto };
    delete updateData.items;

    if (partsCost !== undefined) {
      updateData.partsCost = partsCost;
      updateData.total = (dto.laborCost || 0) + partsCost - (dto.discount || 0);
    }

    if (dto.estimatedDate) {
      updateData.estimatedDate = new Date(dto.estimatedDate);
    }

    return this.prisma.$transaction(async (tx) => {
      if (itemsData) {
        await tx.serviceOrderItem.deleteMany({
          where: { serviceOrderId: id },
        });

        await tx.serviceOrderItem.createMany({
          data: itemsData.map((item) => ({
            ...item,
            serviceOrderId: id,
          })),
        });
      }

      return tx.serviceOrder.update({
        where: { id },
        data: updateData,
        include: {
          customer: true,
          items: true,
        },
      });
    });
  }

  async updateStatus(
    id: string,
    tenantId: string,
    status: string,
    notes?: string,
  ) {
    const order = await this.findOne(id, tenantId);
    const previousStatus = order.status;

    const updateData: any = { status };

    if (status === "COMPLETED") {
      updateData.completedAt = new Date();
    } else if (status === "DELIVERED") {
      updateData.deliveredAt = new Date();
    }

    if (notes) {
      updateData.notes = `${order.notes || ""}\n[${status}]: ${notes}`;
    }

    const updatedOrder = await this.prisma.serviceOrder.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        items: true,
      },
    });

    // Quando CONCLUIR: Criar transação financeira + NF de serviço
    if (status === "COMPLETED" && previousStatus !== "COMPLETED") {
      try {
        // Busca categoria "Serviços" para a transação
        const serviceCategory = await this.prisma.transactionCategory.findFirst(
          {
            where: {
              tenantId,
              name: "Serviços",
              type: "INCOME",
            },
          },
        );

        // Criar transação financeira (receita)
        if (Number(updatedOrder.total) > 0) {
          await this.prisma.transaction.create({
            data: {
              tenantId,
              serviceOrderId: updatedOrder.id,
              type: "INCOME",
              description: `OS #${updatedOrder.code} - ${updatedOrder.title}`,
              amount: Number(updatedOrder.total),
              dueDate: new Date(),
              status: TransactionStatus.PENDING as TransactionStatusType,
              categoryId: serviceCategory?.id,
              reference: updatedOrder.code,
              notes: `Ordem de serviço: ${updatedOrder.title}\nCliente: ${updatedOrder.customer?.name || "N/A"}`,
            },
          });
          this.logger.log(
            `Transação financeira criada: OS #${updatedOrder.code} - R$ ${updatedOrder.total}`,
          );
        }

        // Gerar Nota Fiscal de Serviço
        const invoice = await this.invoicesService.generateFromSource(
          tenantId,
          {
            type: "SERVICE",
            serviceOrderId: updatedOrder.id,
            warrantyDays: updatedOrder.warrantyDays || 90,
            notes: `Referente à Ordem de Serviço #${updatedOrder.code}`,
          },
        );
        this.logger.log(
          `NF de serviço gerada: ${invoice.number} para OS #${updatedOrder.code}`,
        );
      } catch (error) {
        this.logger.error(
          `Erro ao criar transação/NF para OS #${updatedOrder.code}: ${error.message}`,
        );
      }
    }

    // Quando ENTREGAR: Enviar NF por email para o cliente
    if (status === "DELIVERED" && previousStatus !== "DELIVERED") {
      try {
        // Buscar NF vinculada à OS
        const invoice = await this.prisma.invoice.findFirst({
          where: { serviceOrderId: updatedOrder.id, tenantId },
          orderBy: { createdAt: "desc" },
        });

        if (invoice && updatedOrder.customer?.email) {
          await this.invoicesService.sendToCustomer(invoice.id, tenantId, [
            "email",
          ]);
          this.logger.log(
            `NF ${invoice.number} enviada por email para ${updatedOrder.customer.email}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Erro ao enviar NF por email para OS #${updatedOrder.code}: ${error.message}`,
        );
      }
    }

    // Enviar notificações para TODAS as mudanças de status
    if (updatedOrder.customer && status !== previousStatus) {
      try {
        await this.notificationsService.sendServiceOrderUpdate(
          tenantId,
          {
            ...updatedOrder,
            code: updatedOrder.code,
          },
          status,
        );
        this.logger.log(
          `Notificação enviada: OS #${updatedOrder.code} - ${previousStatus} → ${status}`,
        );
      } catch (error) {
        this.logger.error(
          `Erro ao enviar notificação de mudança de status: ${error.message}`,
        );
      }
    }

    return updatedOrder;
  }

  async remove(id: string, tenantId: string) {
    const order = await this.findOne(id, tenantId);

    if (order.status !== "PENDING" && order.status !== "CANCELLED") {
      throw new BadRequestException(
        "Só é possível remover OS pendentes ou canceladas",
      );
    }

    await this.prisma.serviceOrder.delete({
      where: { id },
    });

    return { message: "Ordem de serviço removida com sucesso" };
  }

  async getStats(tenantId: string) {
    const [pending, inProgress, completed, delivered] = await Promise.all([
      this.prisma.serviceOrder.count({
        where: { tenantId, status: "PENDING" },
      }),
      this.prisma.serviceOrder.count({
        where: { tenantId, status: "IN_PROGRESS" },
      }),
      this.prisma.serviceOrder.count({
        where: { tenantId, status: "COMPLETED" },
      }),
      this.prisma.serviceOrder.count({
        where: { tenantId, status: "DELIVERED" },
      }),
    ]);

    return { pending, inProgress, completed, delivered };
  }
}
