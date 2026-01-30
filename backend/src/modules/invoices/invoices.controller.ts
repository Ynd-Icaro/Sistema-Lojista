import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Res, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto, InvoiceQueryDto, SendInvoiceDto, GenerateInvoiceDto } from './dto/invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todas as notas fiscais' })
  findAll(@CurrentUser('tenantId') tenantId: string, @Query() query: InvoiceQueryDto) {
    return this.invoicesService.findAll(tenantId, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar nota fiscal por ID' })
  findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.invoicesService.findOne(id, tenantId);
  }

  @Public()
  @Get('access/:accessKey')
  @ApiOperation({ summary: 'Buscar nota fiscal pela chave de acesso (público)' })
  findByAccessKey(@Param('accessKey') accessKey: string) {
    return this.invoicesService.findByAccessKey(accessKey);
  }

  @Get(':id/html')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Header('Content-Type', 'text/html')
  @ApiOperation({ summary: 'Obter HTML da nota fiscal' })
  async getHtml(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string, @Res() res: Response) {
    const html = await this.invoicesService.getInvoiceHtml(id, tenantId);
    return res.send(html);
  }

  @Public()
  @Get('access/:accessKey/html')
  @Header('Content-Type', 'text/html')
  @ApiOperation({ summary: 'Obter HTML da nota fiscal (público)' })
  async getHtmlPublic(@Param('accessKey') accessKey: string, @Res() res: Response) {
    const invoice = await this.invoicesService.findByAccessKey(accessKey);
    const html = await this.invoicesService.getInvoiceHtml(invoice.id, invoice.tenantId);
    return res.send(html);
  }

  @Get(':id/download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'Download da nota fiscal em PDF' })
  async download(
    @Param('id') id: string, 
    @CurrentUser('tenantId') tenantId: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.invoicesService.generatePdf(id, tenantId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    return res.send(buffer);
  }

  @Get(':id/print')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Header('Content-Type', 'text/html')
  @ApiOperation({ summary: 'Página de impressão da nota fiscal' })
  async print(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string, @Res() res: Response) {
    const html = await this.invoicesService.getInvoiceHtml(id, tenantId, true);
    return res.send(html);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar nova nota fiscal' })
  create(@CurrentUser('tenantId') tenantId: string, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(tenantId, dto);
  }

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gerar nota fiscal a partir de venda ou ordem de serviço' })
  generate(@CurrentUser('tenantId') tenantId: string, @Body() dto: GenerateInvoiceDto) {
    return this.invoicesService.generateFromSource(tenantId, dto);
  }

  @Post(':id/send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar nota fiscal para o cliente' })
  sendToCustomer(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: SendInvoiceDto,
  ) {
    return this.invoicesService.sendToCustomer(id, tenantId, dto.methods);
  }

  @Post(':id/send-email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar nota fiscal por e-mail' })
  sendEmail(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.invoicesService.sendToCustomer(id, tenantId, ['email']);
  }

  @Post(':id/send-whatsapp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar nota fiscal por WhatsApp' })
  sendWhatsApp(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.invoicesService.sendToCustomer(id, tenantId, ['whatsapp']);
  }

  @Put(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar nota fiscal' })
  cancel(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body('reason') reason: string,
  ) {
    return this.invoicesService.cancel(id, tenantId, reason);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir nota fiscal' })
  delete(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.invoicesService.delete(id, tenantId);
  }
}
