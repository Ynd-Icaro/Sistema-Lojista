import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Obter visão geral do dashboard' })
  getOverview(@CurrentUser() user: any) {
    return this.dashboardService.getOverview(user.tenantId);
  }

  @Get('sales-chart')
  @ApiOperation({ summary: 'Obter dados do gráfico de vendas' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getSalesChart(
    @CurrentUser() user: any,
    @Query('days') days?: string,
  ) {
    return this.dashboardService.getSalesChart(user.tenantId, days ? parseInt(days) : 7);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Obter produtos mais vendidos' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTopProducts(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
  ) {
    return this.dashboardService.getTopProducts(user.tenantId, limit ? parseInt(limit) : 5);
  }

  @Get('recent-sales')
  @ApiOperation({ summary: 'Obter vendas recentes' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getRecentSales(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
  ) {
    return this.dashboardService.getRecentSales(user.tenantId, limit ? parseInt(limit) : 5);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Obter produtos com estoque baixo' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getLowStockProducts(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
  ) {
    return this.dashboardService.getLowStockProducts(user.tenantId, limit ? parseInt(limit) : 5);
  }

  @Get('pending-orders')
  @ApiOperation({ summary: 'Obter ordens de serviço pendentes' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getPendingServiceOrders(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
  ) {
    return this.dashboardService.getPendingServiceOrders(user.tenantId, limit ? parseInt(limit) : 5);
  }

  @Get('financial')
  @ApiOperation({ summary: 'Obter resumo financeiro' })
  getFinancialSummary(@CurrentUser() user: any) {
    return this.dashboardService.getFinancialSummary(user.tenantId);
  }
}
