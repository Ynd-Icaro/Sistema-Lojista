import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";

export class CreateTenantDto {
  @ApiProperty({ example: "Minha Loja" })
  @IsString()
  @IsNotEmpty({ message: "Nome é obrigatório" })
  name: string;

  @ApiProperty({ example: "minha-loja" })
  @IsString()
  @IsNotEmpty({ message: "Slug é obrigatório" })
  slug: string;

  @ApiPropertyOptional({ example: "00.000.000/0001-00" })
  @IsString()
  @IsOptional()
  cnpj?: string;

  @ApiPropertyOptional({ example: "contato@minhaloja.com.br" })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: "48999999999" })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: "Rua Exemplo, 123" })
  @IsString()
  @IsOptional()
  address?: string;

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

  // Admin user creation
  @ApiPropertyOptional({ example: "admin@minhaloja.com.br" })
  @IsEmail()
  @IsOptional()
  adminEmail?: string;

  @ApiPropertyOptional({ example: "Senha@123" })
  @IsString()
  @MinLength(6)
  @IsOptional()
  adminPassword?: string;

  @ApiPropertyOptional({ example: "Administrador" })
  @IsString()
  @IsOptional()
  adminName?: string;
}

export class UpdateTenantDto extends PartialType(CreateTenantDto) {}
