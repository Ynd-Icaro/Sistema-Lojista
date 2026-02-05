import { IsNotEmpty, IsOptional, IsString, IsBoolean, Length } from "class-validator";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";

export class CreateCategoryDto {
  @ApiProperty({ example: "Eletrônicos" })
  @IsString({ message: "Nome deve ser um texto válido" })
  @IsNotEmpty({ message: "Nome é obrigatório" })
  @Length(2, 100, { message: "Nome deve ter entre 2 e 100 caracteres" })
  name: string;

  @ApiPropertyOptional({ example: "Produtos eletrônicos em geral" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: "#6366f1" })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: "laptop" })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
