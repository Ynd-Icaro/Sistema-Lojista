import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  IsBoolean,
  IsEnum,
  IsDateString,
  IsArray,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Type, Transform } from "class-transformer";

export class CreateCustomerDto {
  @ApiProperty({
    example: "João Silva",
    description: "Nome completo do cliente",
  })
  @IsString({ message: "Nome deve ser uma string" })
  @IsNotEmpty({ message: "Nome é obrigatório" })
  name: string;

  @ApiPropertyOptional({
    example: "PF",
    enum: ["PF", "PJ"],
    description: "Tipo de pessoa (PF ou PJ)",
  })
  @IsString({ message: "Tipo deve ser uma string" })
  @IsOptional()
  @IsEnum(["PF", "PJ"], { message: "Tipo deve ser PF ou PJ" })
  type?: string;

  @ApiPropertyOptional({
    example: "joao@email.com",
    description: "Email do cliente",
  })
  @IsEmail({}, { message: "Email deve ter um formato válido" })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: "48999999999",
    description: "Telefone do cliente",
  })
  @IsString({ message: "Telefone deve ser uma string" })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: "48999999999",
    description: "WhatsApp do cliente",
  })
  @IsString({ message: "WhatsApp deve ser uma string" })
  @IsOptional()
  whatsapp?: string;

  @ApiPropertyOptional({
    example: "000.000.000-00",
    description: "CPF ou CNPJ do cliente",
  })
  @IsString({ message: "CPF/CNPJ deve ser uma string" })
  @IsOptional()
  cpfCnpj?: string;

  @ApiPropertyOptional({ example: "0000000", description: "RG do cliente" })
  @IsString({ message: "RG deve ser uma string" })
  @IsOptional()
  rg?: string;

  @ApiPropertyOptional({
    example: "1990-01-01",
    description: "Data de nascimento",
  })
  @IsDateString(
    {},
    { message: "Data de nascimento deve ter formato válido (YYYY-MM-DD)" },
  )
  @IsOptional()
  birthDate?: string;

  @ApiPropertyOptional({
    example: "M",
    enum: ["M", "F", "O"],
    description: "Gênero",
  })
  @IsString({ message: "Gênero deve ser uma string" })
  @IsOptional()
  @IsEnum(["M", "F", "O"], { message: "Gênero deve ser M, F ou O" })
  gender?: string;

  @ApiPropertyOptional({ example: "Rua Exemplo" })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: "123" })
  @IsString()
  @IsOptional()
  number?: string;

  @ApiPropertyOptional({ example: "Apto 101" })
  @IsString()
  @IsOptional()
  complement?: string;

  @ApiPropertyOptional({ example: "Centro" })
  @IsString()
  @IsOptional()
  neighborhood?: string;

  @ApiPropertyOptional({ example: "Florianópolis" })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: "SC" })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: "88000-000" })
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: ["vip", "atacado"] })
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
  @Transform(({ value }) => value === "true")
  isActive?: boolean;
}
