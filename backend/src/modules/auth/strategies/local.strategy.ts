import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AuthService } from "../auth.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true,
    });
  }

  async validate(req: any, email: string, password: string): Promise<any> {
    const tenantId = req.body.tenantId;
    if (!tenantId) {
      throw new UnauthorizedException("ID da empresa é obrigatório");
    }

    const user = await this.authService.validateUser(email, password, tenantId);
    if (!user) {
      throw new UnauthorizedException("Credenciais inválidas");
    }
    return user;
  }
}
