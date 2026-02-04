import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  UpdatePasswordDto,
  UpdateProfileDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from "./dto/auth.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { Public } from "./decorators/public.decorator";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login de usuário" })
  @ApiResponse({ status: 200, description: "Login realizado com sucesso" })
  @ApiResponse({ status: 401, description: "Credenciais inválidas" })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Registrar novo usuário" })
  @ApiResponse({ status: 201, description: "Usuário criado com sucesso" })
  @ApiResponse({ status: 400, description: "Dados inválidos" })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Renovar token de acesso" })
  @ApiResponse({ status: 200, description: "Token renovado com sucesso" })
  @ApiResponse({ status: 401, description: "Token inválido" })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Public()
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Solicitar redefinição de senha" })
  @ApiResponse({
    status: 200,
    description: "Código de verificação enviado para o email",
  })
  @ApiResponse({ status: 400, description: "Email não encontrado" })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Redefinir senha com código de verificação" })
  @ApiResponse({ status: 200, description: "Senha redefinida com sucesso" })
  @ApiResponse({ status: 400, description: "Código inválido ou expirado" })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Logout de usuário" })
  @ApiResponse({ status: 200, description: "Logout realizado com sucesso" })
  async logout(@Request() req) {
    return this.authService.logout(req.user.id);
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Obter perfil do usuário logado" })
  @ApiResponse({ status: 200, description: "Perfil retornado com sucesso" })
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }

  @Post("change-password")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Alterar senha do usuário" })
  @ApiResponse({ status: 200, description: "Senha alterada com sucesso" })
  @ApiResponse({ status: 400, description: "Senha atual incorreta" })
  async updatePassword(@Request() req, @Body() dto: UpdatePasswordDto) {
    return this.authService.updatePassword(
      req.user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Patch("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Atualizar perfil do usuário" })
  @ApiResponse({ status: 200, description: "Perfil atualizado com sucesso" })
  async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, dto);
  }
}
