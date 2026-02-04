import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto, UpdateCategoryDto } from "./dto/category.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("categories")
@Controller("categories")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: "Listar todas as categorias" })
  findAll(@CurrentUser("tenantId") tenantId: string) {
    return this.categoriesService.findAll(tenantId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar categoria por ID" })
  findOne(@Param("id") id: string, @CurrentUser("tenantId") tenantId: string) {
    return this.categoriesService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: "Criar nova categoria" })
  create(
    @CurrentUser("tenantId") tenantId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(tenantId, dto);
  }

  @Put(":id")
  @ApiOperation({ summary: "Atualizar categoria" })
  update(
    @Param("id") id: string,
    @CurrentUser("tenantId") tenantId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, tenantId, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remover categoria" })
  remove(@Param("id") id: string, @CurrentUser("tenantId") tenantId: string) {
    return this.categoriesService.remove(id, tenantId);
  }
}
