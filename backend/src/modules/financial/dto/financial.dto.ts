import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum, IsDateString, Min, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class CreateTransactionDto {
  @ApiProperty({ enum: ['INCOME', 'EXPENSE'] })
  @IsEnum(['INCOME', 'EXPENSE'])
  type: 'INCOME' | 'EXPENSE';

  @ApiProperty({ example: 'Pagamento fornecedor' })
  @IsString()
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  description: string;

  @ApiProperty({ example: 1500 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: '2026-01-20' })
  @IsDateString()
  @IsNotEmpty({ message: 'Data de vencimento é obrigatória' })
  dueDate: string;

  @ApiPropertyOptional({ example: '2026-01-20' })
  @IsDateString()
  @IsOptional()
  paidDate?: string;

  @ApiPropertyOptional({ enum: ['PENDING', 'CONFIRMED', 'CANCELLED'] })
  @IsEnum(['PENDING', 'CONFIRMED', 'CANCELLED'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ enum: ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BANK_TRANSFER', 'BOLETO'] })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'NF-12345' })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ enum: ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] })
  @IsString()
  @IsOptional()
  recurrence?: string;
}

export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {}

export class ConfirmTransactionDto {
  @ApiPropertyOptional({ example: '2026-01-20' })
  @IsDateString()
  @IsOptional()
  paidDate?: string;

  @ApiPropertyOptional({ enum: ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BANK_TRANSFER', 'BOLETO'] })
  @IsString()
  @IsOptional()
  paymentMethod?: string;
}

export class CreateCategoryDto {
  @ApiProperty({ example: 'Marketing' })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiProperty({ enum: ['INCOME', 'EXPENSE'] })
  @IsEnum(['INCOME', 'EXPENSE'])
  type: 'INCOME' | 'EXPENSE';

  @ApiPropertyOptional({ example: '#6366f1' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: 'megaphone' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class TransactionQueryDto {
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

  @ApiPropertyOptional({ enum: ['INCOME', 'EXPENSE'] })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ enum: ['PENDING', 'CONFIRMED', 'CANCELLED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;
}
