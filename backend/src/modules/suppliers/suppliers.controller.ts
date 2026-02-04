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
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { SuppliersService } from "./suppliers.service";
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierQueryDto,
} from "./dto/supplier.dto";

@Controller("suppliers")
@UseGuards(JwtAuthGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  findAll(
    @CurrentUser("tenantId") tenantId: string,
    @Query() query: SupplierQueryDto,
  ) {
    return this.suppliersService.findAll(tenantId, query);
  }

  @Get("stats")
  getStats(@CurrentUser("tenantId") tenantId: string) {
    return this.suppliersService.getStats(tenantId);
  }

  @Get("simple")
  getSimpleList(@CurrentUser("tenantId") tenantId: string) {
    return this.suppliersService.getSimpleList(tenantId);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser("tenantId") tenantId: string) {
    return this.suppliersService.findOne(id, tenantId);
  }

  @Post()
  create(
    @CurrentUser("tenantId") tenantId: string,
    @Body() dto: CreateSupplierDto,
  ) {
    return this.suppliersService.create(tenantId, dto);
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @CurrentUser("tenantId") tenantId: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, tenantId, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser("tenantId") tenantId: string) {
    return this.suppliersService.remove(id, tenantId);
  }
}
