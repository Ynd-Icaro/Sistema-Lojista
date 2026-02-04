import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierQueryDto,
} from "./dto/supplier.dto";

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: SupplierQueryDto) {
    const { page = 1, limit = 20, search, city, state, isActive } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { tradeName: { contains: search, mode: "insensitive" } },
        { cpfCnpj: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
      ];
    }

    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }

    if (state) {
      where.state = state;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [suppliers, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { products: true },
          },
        },
        orderBy: { name: "asc" },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return {
      data: suppliers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, tenantId },
      include: {
        products: {
          take: 10,
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            sku: true,
            stock: true,
            costPrice: true,
            salePrice: true,
          },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException("Fornecedor não encontrado");
    }

    return supplier;
  }

  async create(tenantId: string, dto: CreateSupplierDto) {
    // Verificar se já existe fornecedor com mesmo CNPJ
    if (dto.cpfCnpj) {
      const existing = await this.prisma.supplier.findFirst({
        where: { tenantId, cpfCnpj: dto.cpfCnpj },
      });

      if (existing) {
        throw new ConflictException(
          "Já existe um fornecedor com este CPF/CNPJ",
        );
      }
    }

    return this.prisma.supplier.create({
      data: {
        tenantId,
        ...dto,
        tags: dto.tags || [],
        bankInfo: dto.bankInfo || {},
      },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateSupplierDto) {
    await this.findOne(id, tenantId);

    // Verificar se já existe outro fornecedor com mesmo CNPJ
    if (dto.cpfCnpj) {
      const existing = await this.prisma.supplier.findFirst({
        where: {
          tenantId,
          cpfCnpj: dto.cpfCnpj,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(
          "Já existe outro fornecedor com este CPF/CNPJ",
        );
      }
    }

    return this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, tenantId: string) {
    const supplier = await this.findOne(id, tenantId);

    // Verificar se há produtos vinculados
    const productsCount = await this.prisma.product.count({
      where: { supplierId: id },
    });

    if (productsCount > 0) {
      throw new ConflictException(
        `Não é possível excluir: ${productsCount} produto(s) vinculado(s) a este fornecedor`,
      );
    }

    await this.prisma.supplier.delete({ where: { id } });

    return { message: "Fornecedor excluído com sucesso" };
  }

  async getStats(tenantId: string) {
    const [total, active, withProducts] = await Promise.all([
      this.prisma.supplier.count({ where: { tenantId } }),
      this.prisma.supplier.count({ where: { tenantId, isActive: true } }),
      this.prisma.supplier.count({
        where: {
          tenantId,
          products: { some: {} },
        },
      }),
    ]);

    // Top fornecedores por quantidade de produtos
    const topByProducts = await this.prisma.supplier.findMany({
      where: { tenantId },
      take: 5,
      orderBy: {
        products: { _count: "desc" },
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return {
      total,
      active,
      inactive: total - active,
      withProducts,
      withoutProducts: total - withProducts,
      topByProducts,
    };
  }

  async getSimpleList(tenantId: string) {
    return this.prisma.supplier.findMany({
      where: { tenantId, isActive: true },
      select: {
        id: true,
        name: true,
        tradeName: true,
        cpfCnpj: true,
      },
      orderBy: { name: "asc" },
    });
  }
}
