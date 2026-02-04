import { IsOptional, IsBoolean, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ImportCustomersDto {
  @ApiPropertyOptional({ description: 'Atualizar clientes existentes' })
  @IsOptional()
  @IsBoolean()
  updateExisting?: boolean;

  @ApiPropertyOptional({ description: 'Delimitador do CSV' })
  @IsOptional()
  @IsString()
  delimiter?: string;
}

export class ExportCustomersDto {
  @ApiPropertyOptional({ description: 'Formato de exportação' })
  @IsOptional()
  @IsString()
  format?: 'xlsx' | 'csv';

  @ApiPropertyOptional({ description: 'Incluir apenas clientes ativos' })
  @IsOptional()
  @IsBoolean()
  activeOnly?: boolean;
}