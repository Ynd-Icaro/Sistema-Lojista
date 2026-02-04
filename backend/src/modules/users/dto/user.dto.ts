import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsEnum,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({ example: "usuario@empresa.com.br" })
  @IsEmail({}, { message: "Email inválido" })
  @IsNotEmpty({ message: "Email é obrigatório" })
  email: string;

  @ApiProperty({ example: "Senha@123" })
  @IsString()
  @MinLength(6, { message: "Senha deve ter no mínimo 6 caracteres" })
  @IsNotEmpty({ message: "Senha é obrigatória" })
  password: string;

  @ApiProperty({ example: "João Silva" })
  @IsString()
  @IsNotEmpty({ message: "Nome é obrigatório" })
  name: string;

  @ApiPropertyOptional({ example: "48999999999" })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: "SELLER",
    enum: ["ADMIN", "MANAGER", "SELLER", "VIEWER"],
  })
  @IsEnum(["ADMIN", "MANAGER", "SELLER", "VIEWER"])
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({
    example: "ACTIVE",
    enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
  })
  @IsEnum(["ACTIVE", "INACTIVE", "SUSPENDED"])
  @IsOptional()
  status?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ example: "https://example.com/avatar.jpg" })
  @IsString()
  @IsOptional()
  avatar?: string;
}
