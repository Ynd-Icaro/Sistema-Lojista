import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import * as XLSX from "xlsx";
import { v4 as uuidv4 } from "uuid";

export interface ImportResult {
  created: number;
  updated: number;
  review: number;
  errors: number;
  errorDetails: Array<{
    row: number;
    message: string;
    data?: any;
  }>;
}

interface ProductRow {
  sku?: string;
  nome?: string;
  name?: string;
  descricao?: string;
  description?: string;
  fornecedor?: string;
  supplier?: string;
  codigo_fornecedor?: string;
  supplierCode?: string;
  marca?: string;
  brand?: string;
  cor?: string;
  color?: string;
  tamanho?: string;
  size?: string;
  material?: string;
  origem?: string;
  origin?: string;
  ncm?: string;
  categoria?: string;
  category?: string;
  custo?: number;
  costPrice?: number;
  preco_custo?: number;
  preco?: number;
  price?: number;
  preco_venda?: number;
  salePrice?: number;
  preco_promo?: number;
  promoPrice?: number;
  estoque?: number;
  stock?: number;
  estoque_minimo?: number;
  minStock?: number;
  unidade?: string;
  unit?: string;
  codigo_barras?: string;
  barcode?: string;
  ativo?: boolean | string;
  isActive?: boolean | string;
}

@Injectable()
export class ProductImportExportService {
  constructor(private prisma: PrismaService) {}

  async importProducts(
    tenantId: string,
    fileBuffer: Buffer,
    options: { updateExisting?: boolean; defaultCategoryId?: string } = {},
  ): Promise<ImportResult> {
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows: ProductRow[] = XLSX.utils.sheet_to_json(worksheet);

    const result: ImportResult = {
      created: 0,
      updated: 0,
      review: 0,
      errors: 0,
      errorDetails: [],
    };

    // Buscar categorias existentes para mapear
    const categories = await this.prisma.category.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    });
    const categoryMap = new Map(
      categories.map((c) => [c.name.toLowerCase(), c.id]),
    );

    // Buscar SKUs existentes
    const existingProducts = await this.prisma.product.findMany({
      where: { tenantId },
      select: { id: true, sku: true },
    });
    const existingSkuMap = new Map(existingProducts.map((p) => [p.sku, p.id]));

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 porque Excel começa em 1 e tem header

      try {
        // Normalizar campos (suporta português e inglês)
        const name = row.nome || row.name;
        const supplierName = row.fornecedor || row.supplier;
        const costPrice = row.custo || row.costPrice || row.preco_custo || 0;
        const salePrice =
          row.preco || row.price || row.preco_venda || row.salePrice;
        const sku = row.sku || this.generateSku();

        // Validar campos obrigatórios
        const validationErrors: string[] = [];
        if (!name) validationErrors.push("Nome é obrigatório");
        if (salePrice === undefined || salePrice === null)
          validationErrors.push("Preço de venda é obrigatório");

        if (validationErrors.length > 0) {
          result.errors++;
          result.errorDetails.push({
            row: rowNumber,
            message: validationErrors.join(", "),
            data: row,
          });
          continue;
        }

        // Verificar se precisa de revisão
        const needsReview: string[] = [];
        if (!supplierName) needsReview.push("Fornecedor não informado");
        if (!row.categoria && !row.category && !options.defaultCategoryId) {
          needsReview.push("Categoria não informada");
        }

        // Mapear categoria
        const categoryName = row.categoria || row.category;
        let categoryId = options.defaultCategoryId || null;
        if (categoryName) {
          const foundCategoryId = categoryMap.get(categoryName.toLowerCase());
          if (foundCategoryId) {
            categoryId = foundCategoryId as string;
          } else {
            needsReview.push(`Categoria "${categoryName}" não encontrada`);
          }
        }

        const importStatus = needsReview.length > 0 ? "REVIEW" : "OK";
        const importNotes =
          needsReview.length > 0 ? needsReview.join("; ") : null;

        // Preparar dados do produto
        const productData = {
          tenantId,
          sku,
          name: name!,
          description: row.descricao || row.description || null,
          supplierName: supplierName || null,
          supplierCode: row.codigo_fornecedor || row.supplierCode || null,
          brand: row.marca || row.brand || null,
          color: row.cor || row.color || null,
          size: row.tamanho || row.size || null,
          material: row.material || null,
          origin: row.origem || row.origin || null,
          ncm: row.ncm || null,
          categoryId,
          costPrice: Number(costPrice) || 0,
          salePrice: Number(salePrice),
          promoPrice:
            row.preco_promo || row.promoPrice
              ? Number(row.preco_promo || row.promoPrice)
              : null,
          stock: Number(row.estoque || row.stock || 0),
          minStock: Number(row.estoque_minimo || row.minStock || 5),
          unit: row.unidade || row.unit || "UN",
          barcode: row.codigo_barras || row.barcode || null,
          isActive: this.parseBoolean(row.ativo ?? row.isActive ?? true),
          importStatus: importStatus as any,
          importNotes,
        };

        // Verificar se já existe
        const existingId = existingSkuMap.get(sku);

        if (existingId && options.updateExisting) {
          // Atualizar existente
          await this.prisma.product.update({
            where: { id: existingId },
            data: {
              ...productData,
              tenantId: undefined,
              sku: undefined,
            },
          });
          result.updated++;
          if (importStatus === "REVIEW") {
            result.review++;
          }
        } else if (existingId) {
          // SKU já existe e não deve atualizar
          result.errors++;
          result.errorDetails.push({
            row: rowNumber,
            message: `SKU "${sku}" já existe`,
          });
        } else {
          // Criar novo
          await this.prisma.product.create({ data: productData });
          result.created++;

          if (importStatus === "REVIEW") {
            result.review++;
          }
        }
      } catch (error) {
        result.errors++;
        result.errorDetails.push({
          row: rowNumber,
          message: `Erro: ${error.message}`,
          data: row,
        });
      }
    }

    return result;
  }

  async exportProducts(
    tenantId: string,
    options: {
      categoryId?: string;
      status?: string;
      includeVariations?: boolean;
      format?: "xlsx" | "csv";
    } = {},
  ): Promise<Buffer> {
    const where: any = { tenantId };

    if (options.categoryId) {
      where.categoryId = options.categoryId;
    }

    if (options.status === "review") {
      where.importStatus = "REVIEW";
    } else if (options.status === "active") {
      where.isActive = true;
    } else if (options.status === "inactive") {
      where.isActive = false;
    }

    if (!options.includeVariations) {
      where.isVariation = false;
    }

    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        supplier: { select: { name: true } },
        parentProduct: { select: { name: true, sku: true } },
      },
      orderBy: { name: "asc" },
    });

    // Preparar dados para exportação
    const data = products.map((p) => ({
      SKU: p.sku,
      "Código de Barras": p.barcode || "",
      Nome: p.name,
      Descrição: p.description || "",
      Categoria: p.category?.name || "",
      Fornecedor: p.supplier?.name || p.supplierName || "",
      "Código Fornecedor": p.supplierCode || "",
      Marca: p.brand || "",
      Cor: p.color || "",
      Tamanho: p.size || "",
      Material: p.material || "",
      Origem: p.origin || "",
      NCM: p.ncm || "",
      "Preço de Custo": Number(p.costPrice),
      "Preço de Venda": Number(p.salePrice),
      "Preço Promocional": p.promoPrice ? Number(p.promoPrice) : "",
      Estoque: p.stock,
      "Estoque Mínimo": p.minStock,
      Unidade: p.unit,
      "É Variação": p.isVariation ? "Sim" : "Não",
      "Produto Principal": p.parentProduct?.name || "",
      "Status Importação": p.importStatus,
      "Observações Importação": p.importNotes || "",
      Ativo: p.isActive ? "Sim" : "Não",
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 15 }, // SKU
      { wch: 15 }, // Código de Barras
      { wch: 40 }, // Nome
      { wch: 50 }, // Descrição
      { wch: 20 }, // Categoria
      { wch: 25 }, // Fornecedor
      { wch: 15 }, // Código Fornecedor
      { wch: 15 }, // Marca
      { wch: 12 }, // Cor
      { wch: 12 }, // Tamanho
      { wch: 15 }, // Material
      { wch: 12 }, // Origem
      { wch: 12 }, // NCM
      { wch: 12 }, // Preço Custo
      { wch: 12 }, // Preço Venda
      { wch: 15 }, // Preço Promo
      { wch: 10 }, // Estoque
      { wch: 12 }, // Estoque Min
      { wch: 8 }, // Unidade
      { wch: 12 }, // É Variação
      { wch: 25 }, // Produto Principal
      { wch: 15 }, // Status Import
      { wch: 30 }, // Obs Import
      { wch: 8 }, // Ativo
    ];
    worksheet["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Produtos");

    const format = options.format || "xlsx";
    if (format === "csv") {
      return Buffer.from(XLSX.utils.sheet_to_csv(worksheet), "utf-8");
    }

    return Buffer.from(
      XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
    );
  }

  async getImportTemplate(): Promise<Buffer> {
    // Modelo com dados em colunas (formato padrão Excel)
    const templateData = [
      [
        "sku",
        "nome",
        "descricao",
        "categoria",
        "fornecedor",
        "codigo_fornecedor",
        "marca",
        "cor",
        "tamanho",
        "material",
        "origem",
        "ncm",
        "preco_custo",
        "preco_venda",
        "preco_promo",
        "estoque",
        "estoque_minimo",
        "unidade",
        "codigo_barras",
        "ativo",
      ],
      [
        "PROD001",
        "Camiseta Básica Azul",
        "Camiseta 100% algodão",
        "Vestuário",
        "Fornecedor ABC",
        "FOR001",
        "Marca X",
        "Azul",
        "M",
        "Algodão",
        "Nacional",
        "61091000",
        50.0,
        99.9,
        79.9,
        100,
        10,
        "UN",
        "7891234567890",
        "Sim",
      ],
      [
        "PROD002",
        "Calça Jeans",
        "Calça jeans tradicional",
        "Vestuário",
        "Fornecedor XYZ",
        "FOR002",
        "Marca Y",
        "Azul Escuro",
        "42",
        "Jeans",
        "Nacional",
        "62034200",
        80.0,
        159.9,
        "",
        50,
        5,
        "UN",
        "7891234567891",
        "Sim",
      ],
      [
        "PROD003",
        "Tênis Esportivo",
        "",
        "",
        "Fornecedor ABC",
        "",
        "",
        "Preto",
        "40",
        "",
        "Importado",
        "",
        120.0,
        249.9,
        199.9,
        30,
        5,
        "PAR",
        "",
        "Sim",
      ],
      [
        "",
        "Produto sem SKU (será gerado)",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        49.9,
        "",
        10,
        5,
        "UN",
        "",
        "Sim",
      ],
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);

    // Ajustar largura das colunas
    worksheet["!cols"] = [
      { wch: 12 }, // sku
      { wch: 35 }, // nome
      { wch: 30 }, // descricao
      { wch: 15 }, // categoria
      { wch: 20 }, // fornecedor
      { wch: 18 }, // codigo_fornecedor
      { wch: 12 }, // marca
      { wch: 12 }, // cor
      { wch: 10 }, // tamanho
      { wch: 12 }, // material
      { wch: 12 }, // origem
      { wch: 12 }, // ncm
      { wch: 12 }, // preco_custo
      { wch: 12 }, // preco_venda
      { wch: 12 }, // preco_promo
      { wch: 10 }, // estoque
      { wch: 14 }, // estoque_minimo
      { wch: 8 }, // unidade
      { wch: 16 }, // codigo_barras
      { wch: 8 }, // ativo
    ];

    // Adicionar aba de instruções em formato de tabela
    const instructionsData = [
      ["CAMPO", "OBRIGATÓRIO", "DESCRIÇÃO", "EXEMPLO"],
      [
        "sku",
        "Não*",
        "Código único do produto. Se não informado, será gerado automaticamente",
        "PROD001",
      ],
      ["nome", "SIM", "Nome do produto", "Camiseta Básica Azul"],
      [
        "descricao",
        "Não",
        "Descrição detalhada do produto",
        "Camiseta 100% algodão",
      ],
      [
        "categoria",
        "Recomendado",
        "Nome da categoria (deve existir no sistema)",
        "Vestuário",
      ],
      ["fornecedor", "Recomendado", "Nome do fornecedor", "Fornecedor ABC"],
      ["codigo_fornecedor", "Não", "Código do produto no fornecedor", "FOR001"],
      ["marca", "Não", "Marca do produto", "Marca X"],
      ["cor", "Não", "Cor do produto", "Azul"],
      ["tamanho", "Não", "Tamanho (P, M, G, GG, 38, 40, etc)", "M"],
      ["material", "Não", "Material do produto", "Algodão"],
      ["origem", "Não", "Origem do produto", "Nacional ou Importado"],
      ["ncm", "Não", "Código NCM para nota fiscal", "61091000"],
      ["preco_custo", "Não", "Preço de custo (padrão: 0)", "50.00"],
      ["preco_venda", "SIM", "Preço de venda", "99.90"],
      ["preco_promo", "Não", "Preço promocional", "79.90"],
      ["estoque", "Não", "Quantidade em estoque (padrão: 0)", "100"],
      ["estoque_minimo", "Não", "Estoque mínimo para alerta (padrão: 5)", "10"],
      ["unidade", "Não", "Unidade de medida (padrão: UN)", "UN, KG, MT, PAR"],
      ["codigo_barras", "Não", "Código de barras EAN", "7891234567890"],
      ["ativo", "Não", "Produto ativo? (padrão: Sim)", "Sim ou Não"],
      ["", "", "", ""],
      ["OBSERVAÇÕES:", "", "", ""],
      ["", "• Campos marcados como SIM são obrigatórios", "", ""],
      [
        "",
        '• Produtos sem fornecedor ou categoria entram com status "Verificar Importação"',
        "",
        "",
      ],
      [
        "",
        "• SKUs duplicados serão ignorados (exceto se opção de atualizar estiver ativa)",
        "",
        "",
      ],
      [
        "",
        "• O sistema aceita nomes de colunas em português ou inglês",
        "",
        "",
      ],
      ["", "• Use ponto (.) para decimais nos preços: 99.90", "", ""],
    ];

    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
    instructionsSheet["!cols"] = [
      { wch: 18 }, // Campo
      { wch: 14 }, // Obrigatório
      { wch: 60 }, // Descrição
      { wch: 25 }, // Exemplo
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Modelo");
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instruções");

    return Buffer.from(
      XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
    );
  }

  async linkVariations(
    tenantId: string,
    parentProductId: string,
    variationIds: string[],
  ): Promise<any> {
    // Verificar se o produto principal existe
    const parentProduct = await this.prisma.product.findFirst({
      where: { id: parentProductId, tenantId },
    });

    if (!parentProduct) {
      throw new BadRequestException("Produto principal não encontrado");
    }

    // Atualizar produto principal como isMainProduct
    await this.prisma.product.update({
      where: { id: parentProductId },
      data: { isMainProduct: true },
    });

    // Vincular variações
    const updated = await this.prisma.product.updateMany({
      where: {
        id: { in: variationIds },
        tenantId,
      },
      data: {
        parentProductId,
        isVariation: true,
      },
    });

    return {
      message: "Variações vinculadas com sucesso",
      linkedCount: updated.count,
    };
  }

  async unlinkVariations(
    tenantId: string,
    variationIds: string[],
  ): Promise<any> {
    const updated = await this.prisma.product.updateMany({
      where: {
        id: { in: variationIds },
        tenantId,
      },
      data: {
        parentProductId: null,
        isVariation: false,
      },
    });

    return {
      message: "Variações desvinculadas com sucesso",
      unlinkedCount: updated.count,
    };
  }

  async getProductsForReview(tenantId: string) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        importStatus: "REVIEW",
      },
      include: {
        category: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async approveImport(tenantId: string, productId: string) {
    return this.prisma.product.update({
      where: { id: productId },
      data: {
        importStatus: "OK",
        importNotes: null,
      },
    });
  }

  async getProductWithVariations(tenantId: string, productId: string) {
    return this.prisma.product.findFirst({
      where: { id: productId, tenantId },
      include: {
        category: { select: { id: true, name: true } },
        variations: {
          select: {
            id: true,
            sku: true,
            name: true,
            supplier: true,
            color: true,
            size: true,
            costPrice: true,
            salePrice: true,
            stock: true,
            isActive: true,
          },
        },
        parentProduct: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
      },
    });
  }

  private generateSku(): string {
    const prefix = "PRD";
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  private parseBoolean(value: any): boolean {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const lower = value.toLowerCase();
      return (
        lower === "sim" || lower === "yes" || lower === "true" || lower === "1"
      );
    }
    return Boolean(value);
  }
}
