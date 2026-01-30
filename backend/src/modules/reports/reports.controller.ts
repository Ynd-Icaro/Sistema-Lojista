import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Res,
  Header,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReportsService } from './reports.service';
import { ReportFiltersDto, SavePresetDto } from './dto/reports.dto';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('sales')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gerar relatório de vendas' })
  generateSalesReport(
    @CurrentUser('tenantId') tenantId: string,
    @Body() filters: ReportFiltersDto,
  ) {
    return this.reportsService.generateSalesReport(tenantId, filters);
  }

  @Post('products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gerar relatório de produtos' })
  generateProductsReport(
    @CurrentUser('tenantId') tenantId: string,
    @Body() filters: ReportFiltersDto,
  ) {
    return this.reportsService.generateProductsReport(tenantId, filters);
  }

  @Post('customers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gerar relatório de clientes' })
  generateCustomersReport(
    @CurrentUser('tenantId') tenantId: string,
    @Body() filters: ReportFiltersDto,
  ) {
    return this.reportsService.generateCustomersReport(tenantId, filters);
  }

  @Post('financial')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gerar relatório financeiro' })
  generateFinancialReport(
    @CurrentUser('tenantId') tenantId: string,
    @Body() filters: ReportFiltersDto,
  ) {
    return this.reportsService.generateFinancialReport(tenantId, filters);
  }

  @Post('serviceOrders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gerar relatório de ordens de serviço' })
  generateServiceOrdersReport(
    @CurrentUser('tenantId') tenantId: string,
    @Body() filters: ReportFiltersDto,
  ) {
    return this.reportsService.generateServiceOrdersReport(tenantId, filters);
  }

  @Post('invoices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gerar relatório de notas fiscais' })
  generateInvoicesReport(
    @CurrentUser('tenantId') tenantId: string,
    @Body() filters: ReportFiltersDto,
  ) {
    return this.reportsService.generateInvoicesReport(tenantId, filters);
  }

  // ========== EXPORT ENDPOINTS ==========
  @Post(':reportType/export/pdf')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'Exportar relatório em PDF' })
  async exportPdf(
    @Param('reportType') reportType: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body() filters: ReportFiltersDto,
    @Res() res: Response,
  ) {
    // Generate report data first
    const data = await this.getReportData(reportType, tenantId, filters);
    
    // Generate HTML for PDF
    const html = this.reportsService.generatePdfHtml(reportType, data, filters);
    
    // For now, return HTML - in production use puppeteer to generate PDF
    res.set({
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="relatorio-${reportType}.html"`,
    });
    return res.send(html);
  }

  @Post(':reportType/export/excel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiOperation({ summary: 'Exportar relatório em Excel' })
  async exportExcel(
    @Param('reportType') reportType: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body() filters: ReportFiltersDto,
    @Res() res: Response,
  ) {
    // Generate report data first
    const data = await this.getReportData(reportType, tenantId, filters);
    
    // Generate Excel buffer
    const buffer = await this.reportsService.exportToExcel(reportType, data);
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="relatorio-${reportType}.xlsx"`,
      'Content-Length': buffer.length,
    });
    return res.send(buffer);
  }

  // ========== PRESETS ==========
  @Get('presets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar presets de relatórios' })
  getPresets(@CurrentUser('tenantId') tenantId: string) {
    return this.reportsService.getPresets(tenantId);
  }

  @Post('presets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Salvar preset de relatório' })
  savePreset(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: SavePresetDto,
  ) {
    return this.reportsService.savePreset(tenantId, dto.name, dto.reportType, dto.filters);
  }

  @Delete('presets/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir preset de relatório' })
  deletePreset(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.reportsService.deletePreset(tenantId, id);
  }

  // ========== HELPER ==========
  private async getReportData(reportType: string, tenantId: string, filters: ReportFiltersDto) {
    switch (reportType) {
      case 'sales':
        return this.reportsService.generateSalesReport(tenantId, filters);
      case 'products':
        return this.reportsService.generateProductsReport(tenantId, filters);
      case 'customers':
        return this.reportsService.generateCustomersReport(tenantId, filters);
      case 'financial':
        return this.reportsService.generateFinancialReport(tenantId, filters);
      case 'serviceOrders':
        return this.reportsService.generateServiceOrdersReport(tenantId, filters);
      case 'invoices':
        return this.reportsService.generateInvoicesReport(tenantId, filters);
      default:
        throw new Error('Tipo de relatório inválido');
    }
  }
}
