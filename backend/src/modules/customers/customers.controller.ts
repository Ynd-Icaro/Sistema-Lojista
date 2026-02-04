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
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { CustomersService } from "./customers.service";
import { CustomerImportExportService } from "./services/import-export.service";
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerQueryDto,
} from "./dto/customer.dto";
import {
  ImportCustomersDto,
  ExportCustomersDto,
} from "./dto/import-export.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("customers")
@Controller("customers")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly importExportService: CustomerImportExportService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Listar todos os clientes" })
  findAll(
    @CurrentUser("tenantId") tenantId: string,
    @Query() query: CustomerQueryDto,
  ) {
    return this.customersService.findAll(tenantId, query);
  }

  @Get("top")
  @ApiOperation({ summary: "Listar melhores clientes" })
  @ApiQuery({ name: "limit", required: false })
  getTopCustomers(
    @CurrentUser("tenantId") tenantId: string,
    @Query("limit") limit?: number,
  ) {
    return this.customersService.getTopCustomers(tenantId, limit);
  }

  @Get(":id")
  @ApiOperation({ summary: "Buscar cliente por ID" })
  findOne(@Param("id") id: string, @CurrentUser("tenantId") tenantId: string) {
    return this.customersService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: "Criar novo cliente" })
  create(
    @CurrentUser("tenantId") tenantId: string,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customersService.create(tenantId, dto);
  }

  @Put(":id")
  @ApiOperation({ summary: "Atualizar cliente" })
  update(
    @Param("id") id: string,
    @CurrentUser("tenantId") tenantId: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, tenantId, dto);
  }

  @Put(":id/points")
  @ApiOperation({ summary: "Adicionar pontos ao cliente" })
  addPoints(
    @Param("id") id: string,
    @CurrentUser("tenantId") tenantId: string,
    @Body("points") points: number,
  ) {
    return this.customersService.addPoints(id, tenantId, points);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remover cliente" })
  remove(@Param("id") id: string, @CurrentUser("tenantId") tenantId: string) {
    return this.customersService.remove(id, tenantId);
  }

  @Get("import/template")
  @ApiOperation({ summary: "Baixar template de importação de clientes" })
  getImportTemplate(@CurrentUser("tenantId") tenantId: string) {
    return this.importExportService.getImportTemplate(tenantId);
  }

  @Post("import")
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "Importar clientes via Excel" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "Arquivo Excel (.xlsx) com os dados dos clientes",
        },
      },
    },
  })
  importCustomers(
    @CurrentUser("tenantId") tenantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.importExportService.importCustomers(tenantId, file.buffer);
  }

  @Post("export")
  @ApiOperation({ summary: "Exportar clientes para Excel" })
  exportCustomers(
    @CurrentUser("tenantId") tenantId: string,
    @Body() dto: ExportCustomersDto,
  ) {
    return this.importExportService.exportCustomers(tenantId, dto);
  }
}
