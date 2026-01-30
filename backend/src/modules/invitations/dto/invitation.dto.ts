import { IsEmail, IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvitationDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiPropertyOptional({ example: 'SELLER', enum: ['ADMIN', 'MANAGER', 'SELLER', 'VIEWER'] })
  @IsEnum(['ADMIN', 'MANAGER', 'SELLER', 'VIEWER'])
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({ example: 'João Silva' })
  @IsString()
  @IsOptional()
  name?: string;
}

export class AcceptInvitationDto {
  @ApiProperty({ example: 'token-uuid' })
  @IsString()
  @IsNotEmpty({ message: 'Token é obrigatório' })
  token: string;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiProperty({ example: 'Senha@123' })
  @IsString()
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  password: string;
}

export class ResendInvitationDto {
  @ApiProperty({ example: 'invitation-uuid' })
  @IsString()
  @IsNotEmpty({ message: 'ID do convite é obrigatório' })
  invitationId: string;
}
