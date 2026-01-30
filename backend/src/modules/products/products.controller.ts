import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, Res, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ProductsService } from './products.service';
import { ProductImportExportService } from './services/import-export.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto, UpdateStockDto } from './dto/product.dto';
import { ImportProductsDto, ExportProductsDto, LinkVariationDto, UnlinkVariationDto } from './dto/import-export.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly importExportService: ProductImportExportService,
  ) {}

  // ==================== ROTAS ESPECÍFICAS PRIMEIRO ====================
  // IMPORTANTE: Rotas específicas devem vir ANTES de rotas com parâmetros (:id)
  // Caso contrário, NestJS trata 'review', 'export', etc. como IDs de produto

  @Get()
  @ApiOperation({ summary: 'Listar todos os produtos' })
  findAll(@CurrentUser('tenantId') tenantId: string, @Query() query: ProductQueryDto) {
    return this.productsService.findAll(tenantId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas de produtos' })
  getStats(@CurrentUser('tenantId') tenantId: string) {
    return this.productsService.getStats(tenantId);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Listar produtos com estoque baixo' })
  getLowStock(@CurrentUser('tenantId') tenantId: string) {
    return this.productsService.getLowStock(tenantId);
  }

  @Get('top-selling')
  @ApiOperation({ summary: 'Listar produtos mais vendidos' })
  @ApiQuery({ name: 'days', required: false })
  getTopSelling(@CurrentUser('tenantId') tenantId: string, @Query('days') days?: number) {
    return this.productsService.getTopSelling(tenantId, days);
  }

  @Get('barcode/:barcode')
  @ApiOperation({ summary: 'Buscar produto por código de barras' })
  findByBarcode(@Param('barcode') barcode: string, @CurrentUser('tenantId') tenantId: string) {
    return this.productsService.findByBarcode(barcode, tenantId);
  }

  // ==================== IMPORT/EXPORT (ANTES DE :id) ====================

  @Get('import/template')
  @ApiOperation({ summary: 'Baixar modelo de importação de produtos' })
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  async getImportTemplate(@Res() res: Response) {
    const buffer = await this.importExportService.getImportTemplate();
    res.set({
      'Content-Disposition': 'attachment; filename="modelo_importacao_produtos.xlsx"',
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Post('import')
  @ApiOperation({ summary: 'Importar produtos via arquivo Excel/CSV' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        updateExisting: { type: 'boolean' },
        defaultCategoryId: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importProducts(
    @CurrentUser('tenantId') tenantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ImportProductsDto,
  ) {
    if (!file) {
      throw new Error('Arquivo não enviado');
    }
    return this.importExportService.importProducts(tenantId, file.buffer, {
      updateExisting: dto.updateExisting,
      defaultCategoryId: dto.defaultCategoryId,
    });
  }

  @Get('export')
  @ApiOperation({ summary: 'Exportar produtos para Excel/CSV' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive', 'review'] })
  @ApiQuery({ name: 'includeVariations', required: false })
  @ApiQuery({ name: 'format', required: false, enum: ['xlsx', 'csv'] })
  async exportProducts(
    @CurrentUser('tenantId') tenantId: string,
    @Query() query: ExportProductsDto,
    @Res() res: Response,
  ) {
    const format = query.format || 'xlsx';
    const buffer = await this.importExportService.exportProducts(tenantId, query);
    
    const contentType = format === 'csv' 
      ? 'text/csv' 
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const filename = `produtos_${new Date().toISOString().split('T')[0]}.${format}`;

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Get('review')
  @ApiOperation({ summary: 'Listar produtos pendentes de revisão' })
  getProductsForReview(@CurrentUser('tenantId') tenantId: string) {
    return this.importExportService.getProductsForReview(tenantId);
  }

  // ==================== VARIATIONS (ANTES DE :id) ====================

  @Post('variations/link')
  @ApiOperation({ summary: 'Vincular produtos como variações de um produto principal' })
  linkVariations(@CurrentUser('tenantId') tenantId: string, @Body() dto: LinkVariationDto) {
    return this.importExportService.linkVariations(tenantId, dto.parentProductId, dto.variationIds);
  }

  @Post('variations/unlink')
  @ApiOperation({ summary: 'Desvincular variações de um produto principal' })
  unlinkVariations(@CurrentUser('tenantId') tenantId: string, @Body() dto: UnlinkVariationDto) {
    return this.importExportService.unlinkVariations(tenantId, dto.variationIds);
  }

  // ==================== ROTAS COM PARÂMETROS (:id) POR ÚLTIMO ====================

  @Get(':id')
  @ApiOperation({ summary: 'Buscar produto por ID' })
  findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.productsService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo produto' })
  create(@CurrentUser('tenantId') tenantId: string, @Body() dto: CreateProductDto) {
    return this.productsService.create(tenantId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar produto' })
  update(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, tenantId, dto);
  }

  @Put(':id/stock')
  @ApiOperation({ summary: 'Atualizar estoque do produto' })
  updateStock(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: UpdateStockDto,
  ) {
    return this.productsService.updateStock(id, tenantId, dto.quantity, dto.type, dto.reason);
  }

  @Put(':id/approve-import')
  @ApiOperation({ summary: 'Aprovar importação de produto' })
  approveImport(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.importExportService.approveImport(tenantId, id);
  }

  @Get(':id/variations')
  @ApiOperation({ summary: 'Buscar produto com suas variações' })
  getProductWithVariations(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.importExportService.getProductWithVariations(tenantId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover produto' })
  remove(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.productsService.remove(id, tenantId);
  }
}
