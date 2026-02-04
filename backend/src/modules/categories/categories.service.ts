import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCategoryDto, UpdateCategoryDto } from "./dto/category.dto";

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, includeProducts = false) {
    return this.prisma.category.findMany({
      where: { tenantId },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async findOne(id: string, tenantId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId },
      include: {
        parent: true,
        children: true,
        products: {
          take: 10,
          select: {
            id: true,
            name: true,
            sku: true,
            salePrice: true,
          },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException("Categoria não encontrada");
    }

    return category;
  }

  async create(tenantId: string, dto: CreateCategoryDto) {
    // Check if name already exists
    const existing = await this.prisma.category.findFirst({
      where: { name: dto.name, tenantId },
    });

    if (existing) {
      throw new BadRequestException("Categoria com este nome já existe");
    }

    return this.prisma.category.create({
      data: {
        ...dto,
        tenantId,
      },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateCategoryDto) {
    await this.findOne(id, tenantId);

    // Check if name already exists (excluding current)
    if (dto.name) {
      const existing = await this.prisma.category.findFirst({
        where: {
          name: dto.name,
          tenantId,
          NOT: { id },
        },
      });

      if (existing) {
        throw new BadRequestException("Categoria com este nome já existe");
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, tenantId: string) {
    const category = await this.findOne(id, tenantId);

    // Check if has products
    if (category._count.products > 0) {
      throw new BadRequestException(
        "Não é possível remover categoria com produtos vinculados",
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { message: "Categoria removida com sucesso" };
  }
}
