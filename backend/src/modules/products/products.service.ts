import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(tenantId: string, query: ProductQueryDto) {
    const { page = 1, limit = 20, search, categoryId, isActive, lowStock } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { importName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (lowStock) {
      where.stock = { lte: this.prisma.product.fields.minStock };
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: {
            select: { id: true, name: true, color: true },
          },
          supplier: {
            select: { id: true, name: true, tradeName: true },
          },
          linkedProduct: {
            select: { id: true, name: true, sku: true },
          },
          _count: {
            select: { linkedProducts: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
        supplier: true,
        linkedProduct: true,
        linkedProducts: {
          select: {
            id: true,
            name: true,
            sku: true,
            salePrice: true,
            stock: true,
          },
        },
        stockMovements: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    return product;
  }

  async findBySku(sku: string, tenantId: string) {
    return this.prisma.product.findFirst({
      where: { sku, tenantId },
    });
  }

  async findByBarcode(barcode: string, tenantId: string) {
    return this.prisma.product.findFirst({
      where: { barcode, tenantId },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async create(tenantId: string, dto: CreateProductDto) {
    // Check if SKU already exists
    const existingSku = await this.findBySku(dto.sku, tenantId);
    if (existingSku) {
      throw new BadRequestException('SKU já está em uso');
    }

    // Check if barcode already exists
    if (dto.barcode) {
      const existingBarcode = await this.findByBarcode(dto.barcode, tenantId);
      if (existingBarcode) {
        throw new BadRequestException('Código de barras já está em uso');
      }
    }

    // Prepara os dados com campos obrigatórios
    const data: any = {
      sku: dto.sku,
      name: dto.name,
      costPrice: dto.costPrice ?? 0,
      salePrice: dto.salePrice ?? 0,
      tenantId,
    };

    // Adiciona campos opcionais
    if (dto.barcode) data.barcode = dto.barcode;
    if (dto.description) data.description = dto.description;
    if (dto.importName) data.importName = dto.importName;
    if (dto.promoPrice !== undefined) data.promoPrice = dto.promoPrice;
    if (dto.stock !== undefined) data.stock = dto.stock;
    if (dto.minStock !== undefined) data.minStock = dto.minStock;
    if (dto.maxStock !== undefined) data.maxStock = dto.maxStock;
    if (dto.unit) data.unit = dto.unit;
    if (dto.weight !== undefined) data.weight = dto.weight;
    if (dto.ncm) data.ncm = dto.ncm;
    if (dto.cest) data.cest = dto.cest;
    if (dto.origin) data.origin = dto.origin;
    if (dto.categoryId) data.categoryId = dto.categoryId;
    if (dto.linkedProductId) data.linkedProductId = dto.linkedProductId;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const product = await this.prisma.product.create({
      data,
      include: {
        category: true,
      },
    });

    // Create initial stock movement
    if (dto.stock && dto.stock > 0) {
      await this.prisma.stockMovement.create({
        data: {
          tenantId,
          productId: product.id,
          type: 'IN',
          quantity: dto.stock,
          reason: 'Estoque inicial',
          previousStock: 0,
          newStock: dto.stock,
        },
      });
    }

    return product;
  }

  async update(id: string, tenantId: string, dto: UpdateProductDto) {
    const product = await this.findOne(id, tenantId);

    // Check if SKU already exists (excluding current)
    if (dto.sku && dto.sku !== product.sku) {
      const existingSku = await this.findBySku(dto.sku, tenantId);
      if (existingSku) {
        throw new BadRequestException('SKU já está em uso');
      }
    }

    // Handle stock change
    if (dto.stock !== undefined && dto.stock !== product.stock) {
      const previousStock = product.stock;
      const newStock = dto.stock;
      const type = newStock > previousStock ? 'IN' : 'OUT';
      const quantity = Math.abs(newStock - previousStock);

      await this.prisma.stockMovement.create({
        data: {
          tenantId,
          productId: id,
          type,
          quantity,
          reason: 'Ajuste manual de estoque',
          previousStock,
          newStock,
        },
      });
    }

    // Prepara os dados para atualização, limpando campos vazios
    const data: any = {};
    
    if (dto.sku !== undefined) data.sku = dto.sku;
    if (dto.barcode !== undefined) data.barcode = dto.barcode || null;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description || null;
    if (dto.importName !== undefined) data.importName = dto.importName || null;
    if (dto.costPrice !== undefined) data.costPrice = dto.costPrice;
    if (dto.salePrice !== undefined) data.salePrice = dto.salePrice;
    if (dto.promoPrice !== undefined) data.promoPrice = dto.promoPrice;
    if (dto.stock !== undefined) data.stock = dto.stock;
    if (dto.minStock !== undefined) data.minStock = dto.minStock;
    if (dto.unit !== undefined) data.unit = dto.unit || null;
    // categoryId vazio deve ser null, não string vazia
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId || null;
    if (dto.linkedProductId !== undefined) data.linkedProductId = dto.linkedProductId || null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
      },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    // Check if product has sales
    const salesCount = await this.prisma.saleItem.count({
      where: { productId: id },
    });

    if (salesCount > 0) {
      // Soft delete - just deactivate
      await this.prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
      return { message: 'Produto desativado (possui vendas vinculadas)' };
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return { message: 'Produto removido com sucesso' };
  }

  async updateStock(id: string, tenantId: string, quantity: number, type: 'IN' | 'OUT' | 'ADJUSTMENT', reason?: string) {
    const product = await this.findOne(id, tenantId);
    const previousStock = product.stock;
    
    let newStock: number;
    if (type === 'ADJUSTMENT') {
      // Para ajuste, a quantidade é o novo valor absoluto do estoque
      newStock = quantity;
    } else {
      newStock = type === 'IN' ? previousStock + quantity : previousStock - quantity;
    }

    if (newStock < 0) {
      throw new BadRequestException('Estoque insuficiente');
    }

    const movementQuantity = type === 'ADJUSTMENT' 
      ? Math.abs(newStock - previousStock) 
      : quantity;

    const movementType = type === 'ADJUSTMENT'
      ? (newStock > previousStock ? 'IN' : 'OUT')
      : type;

    await this.prisma.$transaction([
      this.prisma.product.update({
        where: { id },
        data: { stock: newStock },
      }),
      this.prisma.stockMovement.create({
        data: {
          tenantId,
          productId: id,
          type: movementType,
          quantity: movementQuantity,
          reason: reason || (type === 'ADJUSTMENT' 
            ? 'Ajuste de estoque' 
            : (type === 'IN' ? 'Entrada de estoque' : 'Saída de estoque')),
          previousStock,
          newStock,
        },
      }),
    ]);

    // Check for low stock alert after stock update
    if (newStock <= product.minStock && newStock > 0) {
      // Send low stock alert (don't block the response)
      this.notificationsService.sendLowStockAlert(tenantId, [product]).catch(error => {
        console.error('Failed to send low stock alert:', error);
      });
    }

    return { previousStock, newStock, quantity, type };
  }

  async getStats(tenantId: string) {
    const [
      totalProducts,
      lowStockCount,
      reviewCount,
      totalValue,
    ] = await Promise.all([
      // Total de produtos ativos
      this.prisma.product.count({
        where: { tenantId, isActive: true },
      }),
      // Produtos com estoque baixo (estoque <= estoque mínimo)
      this.prisma.product.count({
        where: {
          tenantId,
          isActive: true,
          OR: [
            { stock: { lte: 5 } },
            // Usando raw query para comparar stock com minStock
          ],
        },
      }),
      // Produtos pendentes de revisão
      this.prisma.product.count({
        where: { tenantId, importStatus: 'REVIEW' },
      }),
      // Valor total do estoque
      this.prisma.product.aggregate({
        where: { tenantId, isActive: true },
        _sum: {
          stock: true,
        },
      }),
    ]);

    // Calcular valor total do estoque (soma de salePrice * stock)
    const products = await this.prisma.product.findMany({
      where: { tenantId, isActive: true },
      select: { stock: true, salePrice: true },
    });

    const stockValue = products.reduce((sum, p) => sum + (p.stock * Number(p.salePrice)), 0);

    // Buscar produtos com estoque menor ou igual ao minStock
    const lowStockProducts = await this.prisma.product.count({
      where: {
        tenantId,
        isActive: true,
        stock: { lte: 5 },
      },
    });

    return {
      totalProducts,
      lowStockCount: lowStockProducts,
      reviewCount,
      stockValue,
    };
  }

  async getLowStock(tenantId: string) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        isActive: true,
        stock: { lte: 5 },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        minStock: true,
      },
      orderBy: { stock: 'asc' },
      take: 20,
    });
  }

  async getTopSelling(tenantId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const topProducts = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          tenantId,
          status: 'COMPLETED',
          createdAt: { gte: startDate },
        },
      },
      _sum: {
        quantity: true,
        total: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 10,
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
        ...product,
        totalQuantity: tp._sum.quantity,
        totalRevenue: tp._sum.total,
      };
    });
  }

  async createVariation(parentProductId: string, tenantId: string, dto: CreateVariationDto) {
    return this.createVariations(parentProductId, tenantId, [dto]);
  }
    const parentProduct = await this.findOne(parentProductId, tenantId);
    
    if (!parentProduct) {
      throw new NotFoundException('Produto pai não encontrado');
    }

    const createdVariations: any[] = [];

    for (const variationData of variations) {
      // Gerar SKU único para a variação
      const baseSku = parentProduct.sku;
      const variationSuffix = this.generateVariationSuffix(variationData);
      const sku = `${baseSku}-${variationSuffix}`;

      // Verificar se SKU já existe
      const existingSku = await this.findBySku(sku, tenantId);
      if (existingSku) {
        throw new BadRequestException(`SKU ${sku} já existe`);
      }

      // Criar nome da variação
      const variationName = this.generateVariationName(parentProduct.name, variationData);

      const variation = await this.prisma.product.create({
        data: {
          tenantId,
          parentProductId,
          sku,
          name: variationName,
          description: parentProduct.description,
          shortDescription: parentProduct.shortDescription,
          categoryId: parentProduct.categoryId,
          supplierId: parentProduct.supplierId,
          brand: parentProduct.brand,
          model: parentProduct.model,
          color: variationData.color || parentProduct.color,
          size: variationData.size || parentProduct.size,
          material: parentProduct.material,
          gender: parentProduct.gender,
          ageGroup: parentProduct.ageGroup,
          season: parentProduct.season,
          style: parentProduct.style,
          origin: parentProduct.origin,
          ncm: parentProduct.ncm,
          cest: parentProduct.cest,
          cfop: parentProduct.cfop,
          csosn: parentProduct.csosn,
          cstIcms: parentProduct.cstIcms,
          cstPis: parentProduct.cstPis,
          cstCofins: parentProduct.cstCofins,
          icmsRate: parentProduct.icmsRate,
          ipiRate: parentProduct.ipiRate,
          pisRate: parentProduct.pisRate,
          cofinsRate: parentProduct.cofinsRate,
          costPrice: variationData.costPrice || parentProduct.costPrice,
          salePrice: variationData.salePrice || parentProduct.salePrice,
          promoPrice: parentProduct.promoPrice,
          promoStartDate: parentProduct.promoStartDate,
          promoEndDate: parentProduct.promoEndDate,
          wholesalePrice: parentProduct.wholesalePrice,
          wholesaleMinQty: parentProduct.wholesaleMinQty,
          profitMargin: parentProduct.profitMargin,
          stock: variationData.stock || 0,
          minStock: parentProduct.minStock,
          maxStock: parentProduct.maxStock,
          unit: parentProduct.unit,
          packQuantity: parentProduct.packQuantity,
          weight: parentProduct.weight,
          grossWeight: parentProduct.grossWeight,
          width: parentProduct.width,
          height: parentProduct.height,
          depth: parentProduct.depth,
          images: variationData.images || parentProduct.images,
          mainImage: variationData.images?.[0] || parentProduct.mainImage,
          tags: parentProduct.tags || [],
          isVariation: true,
          isMainProduct: false,
          isActive: true,
          warrantyMonths: parentProduct.warrantyMonths,
        },
      });

      // Criar movimento de estoque inicial se stock > 0
      if (variation.stock && variation.stock > 0) {
        await this.prisma.stockMovement.create({
          data: {
            tenantId,
            productId: variation.id,
            type: 'IN',
            quantity: variation.stock,
            reason: 'Estoque inicial - Variação',
            previousStock: 0,
            newStock: variation.stock,
          },
        });
      }

      createdVariations.push(variation);
    }

    // Atualizar produto pai para marcar como produto principal
    await this.prisma.product.update({
      where: { id: parentProductId },
      data: { 
        isMainProduct: true,
        variationAttributes: variations[0] ? Object.keys(variations[0]).filter(key => 
          ['color', 'size'].includes(key) && variations[0][key]
        ) : []
      },
    });

    return createdVariations;
  }

  async getVariations(parentProductId: string, tenantId: string) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        parentProductId,
        isVariation: true,
      },
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
        _count: {
          select: { stockMovements: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateVariation(id: string, tenantId: string, dto: any) {
    const variation = await this.findOne(id, tenantId);
    
    if (!variation.isVariation) {
      throw new BadRequestException('Este produto não é uma variação');
    }

    return this.update(id, tenantId, dto);
  }

  async deleteVariation(id: string, tenantId: string) {
    const variation = await this.findOne(id, tenantId);
    
    if (!variation.isVariation) {
      throw new BadRequestException('Este produto não é uma variação');
    }

    // Verificar se tem vendas
    const salesCount = await this.prisma.saleItem.count({
      where: { productId: id },
    });

    if (salesCount > 0) {
      throw new BadRequestException('Não é possível excluir variação com vendas registradas');
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return { message: 'Variação excluída com sucesso' };
  }

  private generateVariationSuffix(variationData: any): string {
    const parts: string[] = [];
    if (variationData.color) parts.push(variationData.color.toLowerCase().replace(/\s+/g, ''));
    if (variationData.size) parts.push(variationData.size.toLowerCase().replace(/\s+/g, ''));
    return parts.join('-') || 'var';
  }

  private generateVariationName(baseName: string, variationData: any): string {
    const parts: string[] = [];
    if (variationData.color) parts.push(variationData.color);
    if (variationData.size) parts.push(variationData.size);
    return parts.join(' - ');
  }
}
