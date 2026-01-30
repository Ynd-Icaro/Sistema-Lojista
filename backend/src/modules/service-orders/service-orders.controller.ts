import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ServiceOrdersService } from './service-orders.service';
import { CreateServiceOrderDto, UpdateServiceOrderDto, ServiceOrderQueryDto } from './dto/service-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('service-orders')
@Controller('service-orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ServiceOrdersController {
  constructor(private readonly serviceOrdersService: ServiceOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as ordens de serviço' })
  findAll(@CurrentUser('tenantId') tenantId: string, @Query() query: ServiceOrderQueryDto) {
    return this.serviceOrdersService.findAll(tenantId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas de ordens de serviço' })
  getStats(@CurrentUser('tenantId') tenantId: string) {
    return this.serviceOrdersService.getStats(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar ordem de serviço por ID' })
  findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.serviceOrdersService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar nova ordem de serviço' })
  create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateServiceOrderDto,
  ) {
    return this.serviceOrdersService.create(tenantId, userId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar ordem de serviço' })
  update(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: UpdateServiceOrderDto,
  ) {
    return this.serviceOrdersService.update(id, tenantId, dto);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Atualizar status da ordem de serviço' })
  updateStatus(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body('status') status: string,
    @Body('notes') notes?: string,
  ) {
    return this.serviceOrdersService.updateStatus(id, tenantId, status, notes);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover ordem de serviço' })
  remove(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.serviceOrdersService.remove(id, tenantId);
  }
}
