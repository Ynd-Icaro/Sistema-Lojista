import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsEnum, Min, IsArray, IsDateString, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class CreateProductDto {
  // Identificação
  @ApiProperty({ example: 'PROD001' })
  @IsString()
  @IsNotEmpty({ message: 'SKU é obrigatório' })
  sku: string;

  @ApiPropertyOptional({ example: '7891234567890' })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional({ example: '7891234567890' })
  @IsString()
  @IsOptional()
  gtin?: string;

  @ApiProperty({ example: 'iPhone 15 Pro Max' })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiPropertyOptional({ example: 'Smartphone Apple iPhone 15 Pro Max 256GB' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'iPhone 15 - o mais avançado' })
  @IsString()
  @IsOptional()
  shortDescription?: string;

  @ApiPropertyOptional({ example: 'iPhone 15' })
  @IsString()
  @IsOptional()
  importName?: string;

  // Categoria e Fornecedor
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  supplierId?: string;

  @ApiPropertyOptional({ example: 'FORN-001' })
  @IsString()
  @IsOptional()
  supplierCode?: string;

  @ApiPropertyOptional({ example: 'Fornecedor XYZ' })
  @IsString()
  @IsOptional()
  supplierName?: string;

  // Características do Produto
  @ApiPropertyOptional({ example: 'Apple' })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({ example: 'A2849' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ example: 'Titanium Natural' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: '256GB' })
  @IsString()
  @IsOptional()
  size?: string;

  @ApiPropertyOptional({ example: 'Titânio e Vidro' })
  @IsString()
  @IsOptional()
  material?: string;

  @ApiPropertyOptional({ example: 'Unissex' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ example: 'Adulto' })
  @IsString()
  @IsOptional()
  ageGroup?: string;

  @ApiPropertyOptional({ example: '2024' })
  @IsString()
  @IsOptional()
  season?: string;

  @ApiPropertyOptional({ example: 'Premium' })
  @IsString()
  @IsOptional()
  style?: string;

  // Informações Fiscais
  @ApiPropertyOptional({ example: '0' })
  @IsString()
  @IsOptional()
  origin?: string;

  @ApiPropertyOptional({ example: '85171200' })
  @IsString()
  @IsOptional()
  ncm?: string;

  @ApiPropertyOptional({ example: '2106010' })
  @IsString()
  @IsOptional()
  cest?: string;

  @ApiPropertyOptional({ example: '5102' })
  @IsString()
  @IsOptional()
  cfop?: string;

  @ApiPropertyOptional({ example: '102' })
  @IsString()
  @IsOptional()
  csosn?: string;

  @ApiPropertyOptional({ example: '00' })
  @IsString()
  @IsOptional()
  cstIcms?: string;

  @ApiPropertyOptional({ example: '01' })
  @IsString()
  @IsOptional()
  cstPis?: string;

  @ApiPropertyOptional({ example: '01' })
  @IsString()
  @IsOptional()
  cstCofins?: string;

  @ApiPropertyOptional({ example: 18 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  icmsRate?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  ipiRate?: number;

  @ApiPropertyOptional({ example: 1.65 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  pisRate?: number;

  @ApiPropertyOptional({ example: 7.6 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  cofinsRate?: number;

  // Preços
  @ApiPropertyOptional({ example: 5000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  costPrice?: number;

  @ApiProperty({ example: 7999.99 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty({ message: 'Preço de venda é obrigatório' })
  @Type(() => Number)
  salePrice: number;

  @ApiPropertyOptional({ example: 7499.99 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  promoPrice?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  promoStartDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  promoEndDate?: string;

  @ApiPropertyOptional({ example: 6999.99 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  wholesalePrice?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  wholesaleMinQty?: number;

  @ApiPropertyOptional({ example: 35.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  profitMargin?: number;

  // Estoque
  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  stock?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minStock?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  maxStock?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  idealStock?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  reorderPoint?: number;

  @ApiPropertyOptional({ example: 'UN' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ example: 6 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  packQuantity?: number;

  // Dimensões
  @ApiPropertyOptional({ example: 0.5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  weight?: number;

  @ApiPropertyOptional({ example: 0.6 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  grossWeight?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  width?: number;

  @ApiPropertyOptional({ example: 8 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  height?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  depth?: number;

  // Localização
  @ApiPropertyOptional({ example: 'A-01' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: 'Prateleira 3' })
  @IsString()
  @IsOptional()
  shelf?: string;

  @ApiPropertyOptional({ example: 'Gaveta 5' })
  @IsString()
  @IsOptional()
  bin?: string;

  // Mídia
  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mainImage?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  videoUrl?: string;

  // Variações e Tags
  @ApiPropertyOptional({ example: ['iphone', 'apple', 'smartphone'] })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  attributes?: Record<string, any>;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  variationAttributes?: string[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isMainProduct?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isVariation?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  parentProductId?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isLinkableProduct?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  linkedProductId?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isKit?: boolean;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  kitItems?: Array<{ productId: string; quantity: number }>;

  // Controle
  @ApiPropertyOptional({ example: 12 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  warrantyMonths?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  batchNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  serialNumber?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isNewArrival?: boolean;

  // SEO
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  metaTitle?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  metaDescription?: string;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class ProductQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  lowStock?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  isVariation?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  isFeatured?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  isPromo?: boolean;
}

export class UpdateStockDto {
  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ enum: ['IN', 'OUT', 'ADJUSTMENT'] })
  @IsEnum(['IN', 'OUT', 'ADJUSTMENT'])
  type: 'IN' | 'OUT' | 'ADJUSTMENT';

  @ApiPropertyOptional({ example: 'Compra de fornecedor' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  purchasePrice?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  batchNumber?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  expirationDate?: string;
}

export class CreateVariationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  parentProductId: string;

  @ApiProperty({ example: 'Azul' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ example: 'G' })
  @IsString()
  @IsOptional()
  size?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  costPrice?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  salePrice?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  stock?: number;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  images?: string[];
}

export class BulkVariationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  parentProductId: string;

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  colors: string[];

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  sizes: string[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  generateSku?: boolean;
}
