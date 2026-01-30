import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto, CustomerQueryDto } from './dto/customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('customers')
@Controller('customers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os clientes' })
  findAll(@CurrentUser('tenantId') tenantId: string, @Query() query: CustomerQueryDto) {
    return this.customersService.findAll(tenantId, query);
  }

  @Get('top')
  @ApiOperation({ summary: 'Listar melhores clientes' })
  @ApiQuery({ name: 'limit', required: false })
  getTopCustomers(@CurrentUser('tenantId') tenantId: string, @Query('limit') limit?: number) {
    return this.customersService.getTopCustomers(tenantId, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.customersService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo cliente' })
  create(@CurrentUser('tenantId') tenantId: string, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(tenantId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar cliente' })
  update(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, tenantId, dto);
  }

  @Put(':id/points')
  @ApiOperation({ summary: 'Adicionar pontos ao cliente' })
  addPoints(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body('points') points: number,
  ) {
    return this.customersService.addPoints(id, tenantId, points);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover cliente' })
  remove(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.customersService.remove(id, tenantId);
  }
}
