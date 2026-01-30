import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@smartflux.com.br' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({ example: 'senha123' })
  @IsString()
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  password: string;

  @ApiPropertyOptional({ example: 'tenant-uuid' })
  @IsString()
  @IsOptional()
  tenantId?: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'usuario@empresa.com.br' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({ example: 'Senha@123' })
  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  password: string;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiPropertyOptional({ example: '48999999999' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'tenant-uuid', description: 'ID da empresa existente (opcional)' })
  @IsString()
  @IsOptional()
  tenantId?: string;

  @ApiPropertyOptional({ example: 'Minha Empresa', description: 'Nome da nova empresa (cria um tenant novo)' })
  @IsString()
  @IsOptional()
  tenantName?: string;

  @ApiPropertyOptional({ example: 'SELLER', enum: ['ADMIN', 'MANAGER', 'SELLER', 'VIEWER'] })
  @IsEnum(['ADMIN', 'MANAGER', 'SELLER', 'VIEWER'])
  @IsOptional()
  role?: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Refresh token é obrigatório' })
  refreshToken: string;
}

export class UpdatePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Senha atual é obrigatória' })
  currentPassword: string;

  @ApiProperty()
  @IsString()
  @MinLength(6, { message: 'Nova senha deve ter no mínimo 6 caracteres' })
  @IsNotEmpty({ message: 'Nova senha é obrigatória' })
  newPassword: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'João Silva' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'usuario@empresa.com.br' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  currentPassword?: string;

  @ApiPropertyOptional()
  @IsString()
  @MinLength(6, { message: 'Nova senha deve ter no mínimo 6 caracteres' })
  @IsOptional()
  newPassword?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  confirmPassword?: string;
}
