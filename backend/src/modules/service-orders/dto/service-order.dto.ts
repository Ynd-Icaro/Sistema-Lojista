import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray, ValidateNested, Min, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class ServiceOrderItemDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiProperty({ example: 'Troca de tela' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 150 })
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateServiceOrderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Cliente é obrigatório' })
  customerId: string;

  @ApiProperty({ example: 'Reparo de iPhone' })
  @IsString()
  @IsNotEmpty({ message: 'Título é obrigatório' })
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Smartphone' })
  @IsString()
  @IsOptional()
  deviceType?: string;

  @ApiPropertyOptional({ example: 'Apple' })
  @IsString()
  @IsOptional()
  deviceBrand?: string;

  @ApiPropertyOptional({ example: 'iPhone 14 Pro' })
  @IsString()
  @IsOptional()
  deviceModel?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deviceSerial?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deviceCondition?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reportedIssue?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  laborCost?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  estimatedDate?: string;

  @ApiPropertyOptional({ example: 90 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  warrantyDays?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ type: [ServiceOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceOrderItemDto)
  @IsOptional()
  items?: ServiceOrderItemDto[];
}

export class UpdateServiceOrderDto extends PartialType(CreateServiceOrderDto) {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  diagnosis?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  solution?: string;
}

export class ServiceOrderQueryDto {
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

  @ApiPropertyOptional({ enum: ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'DELIVERED', 'CANCELLED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;
}
