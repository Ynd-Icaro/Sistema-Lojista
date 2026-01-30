import { IsNotEmpty, IsOptional, IsString, IsEmail, IsBoolean, IsEnum, IsDateString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class CreateCustomerDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiPropertyOptional({ example: 'PF', enum: ['PF', 'PJ'] })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: 'joao@email.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '48999999999' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: '48999999999' })
  @IsString()
  @IsOptional()
  whatsapp?: string;

  @ApiPropertyOptional({ example: '000.000.000-00' })
  @IsString()
  @IsOptional()
  cpfCnpj?: string;

  @ApiPropertyOptional({ example: '0000000' })
  @IsString()
  @IsOptional()
  rg?: string;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @ApiPropertyOptional({ example: 'M', enum: ['M', 'F', 'O'] })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ example: 'Rua Exemplo' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: '123' })
  @IsString()
  @IsOptional()
  number?: string;

  @ApiPropertyOptional({ example: 'Apto 101' })
  @IsString()
  @IsOptional()
  complement?: string;

  @ApiPropertyOptional({ example: 'Centro' })
  @IsString()
  @IsOptional()
  neighborhood?: string;

  @ApiPropertyOptional({ example: 'Florianópolis' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'SC' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: '88000-000' })
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: ['vip', 'atacado'] })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}

export class CustomerQueryDto {
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
  @Transform(({ value }) => value === 'true')
  isActive?: boolean;
}
