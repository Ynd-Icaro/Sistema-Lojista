import { IsString, IsOptional, IsObject, IsDateString, IsNumber, IsArray, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReportFiltersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  periodEnd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  paymentMethod?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  groupBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  technician?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stockStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showInactive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasOrders?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalSpentMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalSpentMax?: number;
}

export class SavePresetDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  reportType: string;

  @ApiProperty()
  @IsObject()
  filters: Record<string, any>;
}
