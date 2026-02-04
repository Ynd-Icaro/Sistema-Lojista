import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsDateString,
  Min,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type, Transform } from "class-transformer";

export class InvoiceItemDto {
  @ApiProperty({ example: "iPhone 15 Pro" })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 7999.99 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ example: 7999.99 })
  @IsNumber()
  @Min(0)
  total: number;
}

export class CreateInvoiceDto {
  @ApiPropertyOptional({ enum: ["SALE", "SERVICE", "WARRANTY"] })
  @IsEnum(["SALE", "SERVICE", "WARRANTY"])
  @IsOptional()
  type?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  saleId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  serviceOrderId?: string;

  @ApiPropertyOptional({ example: "1" })
  @IsString()
  @IsOptional()
  series?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ example: 1000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  subtotal?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  tax?: number;

  // Recipient info (if no customer)
  @ApiPropertyOptional({ example: "João Silva" })
  @IsString()
  @IsOptional()
  recipientName?: string;

  @ApiPropertyOptional({ example: "000.000.000-00" })
  @IsString()
  @IsOptional()
  recipientDoc?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  recipientAddress?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  recipientCity?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  recipientState?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  recipientPhone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  recipientEmail?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ type: [InvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  @IsOptional()
  items?: InvoiceItemDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  internalNotes?: string;

  @ApiPropertyOptional({ example: 90 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  warrantyDays?: number;
}

export class SendInvoiceDto {
  @ApiProperty({ example: ["email", "whatsapp"] })
  @IsArray()
  @IsEnum(["email", "whatsapp"], { each: true })
  methods: ("email" | "whatsapp")[];
}

export class GenerateInvoiceDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  saleId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  serviceOrderId?: string;

  @ApiProperty({ enum: ["SALE", "SERVICE", "WARRANTY"], example: "SALE" })
  @IsEnum(["SALE", "SERVICE", "WARRANTY"])
  type: string;

  @ApiPropertyOptional({ example: 90 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  warrantyDays?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class InvoiceQueryDto {
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

  @ApiPropertyOptional({ enum: ["SALE", "SERVICE", "WARRANTY"] })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ enum: ["DRAFT", "ISSUED", "SENT", "CANCELLED"] })
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
