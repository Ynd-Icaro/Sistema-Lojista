import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { TenantsService } from "./tenants.service";
import { CreateTenantDto, UpdateTenantDto } from "./dto/tenant.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Public } from "../auth/decorators/public.decorator";

@ApiTags("tenants")
@Controller("tenants")
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Public()
  @Get("slug/:slug")
  @ApiOperation({ summary: "Buscar empresa por slug" })
  findBySlug(@Param("slug") slug: string) {
    return this.tenantsService.findBySlug(slug);
  }

  @Public()
  @Post()
  @ApiOperation({ summary: "Criar nova empresa" })
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Listar todas as empresas" })
  findAll(@Query("page") page?: number, @Query("limit") limit?: number) {
    return this.tenantsService.findAll(page, limit);
  }

  @Get("current")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Buscar empresa do usuário logado" })
  findCurrent(@CurrentUser("tenantId") tenantId: string) {
    return this.tenantsService.findOne(tenantId);
  }

  @Get("current/stats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Estatísticas da empresa do usuário logado" })
  getStats(@CurrentUser("tenantId") tenantId: string) {
    return this.tenantsService.getStats(tenantId);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Buscar empresa por ID" })
  findOne(@Param("id") id: string) {
    return this.tenantsService.findOne(id);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Atualizar empresa" })
  update(@Param("id") id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Remover empresa" })
  remove(@Param("id") id: string) {
    return this.tenantsService.remove(id);
  }
}
