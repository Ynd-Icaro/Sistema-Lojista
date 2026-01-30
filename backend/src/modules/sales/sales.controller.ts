import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto, SaleQueryDto } from './dto/sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('sales')
@Controller('sales')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as vendas' })
  findAll(@CurrentUser('tenantId') tenantId: string, @Query() query: SaleQueryDto) {
    return this.salesService.findAll(tenantId, query);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Listar vendas recentes' })
  @ApiQuery({ name: 'limit', required: false })
  getRecentSales(@CurrentUser('tenantId') tenantId: string, @Query('limit') limit?: number) {
    return this.salesService.getRecentSales(tenantId, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas de vendas' })
  getSalesStats(
    @CurrentUser('tenantId') tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.salesService.getSalesStats(
      tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('daily')
  @ApiOperation({ summary: 'Vendas diárias dos últimos dias' })
  @ApiQuery({ name: 'days', required: false })
  getDailySales(@CurrentUser('tenantId') tenantId: string, @Query('days') days?: number) {
    return this.salesService.getDailySales(tenantId, days);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar venda por ID' })
  findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.salesService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar nova venda (PDV)' })
  create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSaleDto,
  ) {
    return this.salesService.create(tenantId, userId, dto);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancelar venda' })
  cancel(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body('reason') reason?: string,
  ) {
    return this.salesService.cancel(id, tenantId, userId, reason);
  }
}
