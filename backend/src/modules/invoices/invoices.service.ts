import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateInvoiceDto, InvoiceQueryDto, GenerateInvoiceDto } from './dto/invoice.dto';
import { InvoiceType, InvoiceTypeType } from '../../types';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(tenantId: string, query: InvoiceQueryDto) {
    const { page = 1, limit = 20, search, type, status, customerId, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { recipientName: { contains: search, mode: 'insensitive' } },
        { accessKey: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) where.issueDate.gte = new Date(startDate);
      if (endDate) where.issueDate.lte = new Date(endDate);
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: {
            select: { id: true, name: true, phone: true, email: true },
          },
          sale: {
            select: { id: true, code: true },
          },
          serviceOrder: {
            select: { id: true, code: true },
          },
        },
        orderBy: { issueDate: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        sale: {
          include: {
            items: {
              include: {
                product: {
                  select: { id: true, name: true, sku: true },
                },
              },
            },
          },
        },
        serviceOrder: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Nota fiscal não encontrada');
    }

    return invoice;
  }

  async findByAccessKey(accessKey: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { accessKey },
      include: {
        customer: true,
        sale: {
          include: {
            items: {
              include: {
                product: {
                  select: { id: true, name: true, sku: true },
                },
              },
            },
          },
        },
        serviceOrder: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Nota fiscal não encontrada');
    }

    return invoice;
  }

  async create(tenantId: string, dto: CreateInvoiceDto) {
    // Get tenant info
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    // Get next number
    const lastInvoice = await this.prisma.invoice.findFirst({
      where: { tenantId, series: dto.series || '1' },
      orderBy: { number: 'desc' },
      select: { number: true },
    });

    const nextNumber = lastInvoice 
      ? (parseInt(lastInvoice.number) + 1).toString().padStart(9, '0')
      : '000000001';

    // Generate access key (simulated)
    const accessKey = this.generateAccessKey(tenantId, nextNumber);

    // Get customer info if provided
    let customer: any = null;
    if (dto.customerId) {
      customer = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
      });
    }

    // Get sale items if sale provided
    let items = dto.items || [];
    let subtotal = dto.subtotal || 0;
    
    if (dto.saleId) {
      const sale = await this.prisma.sale.findUnique({
        where: { id: dto.saleId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (sale) {
        items = sale.items.map((item) => ({
          description: item.product.name,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
        }));
        subtotal = Number(sale.subtotal);
      }
    }

    // Calculate totals
    const discount = dto.discount || 0;
    const tax = dto.tax || 0;
    const total = subtotal - discount + tax;

    // Calculate warranty expiration
    let warrantyExpires: Date | null = null;
    if (dto.warrantyDays && dto.warrantyDays > 0) {
      warrantyExpires = new Date();
      warrantyExpires.setDate(warrantyExpires.getDate() + dto.warrantyDays);
    }

    // Generate QR Code
    const qrCodeData = `${this.configService.get('FRONTEND_URL')}/invoice/${accessKey}`;
    const qrCode = await QRCode.toDataURL(qrCodeData);

    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        saleId: dto.saleId,
        serviceOrderId: dto.serviceOrderId,
        type: (dto.type || InvoiceType.SALE) as InvoiceTypeType,
        status: 'ISSUED',
        number: nextNumber,
        series: dto.series || '1',
        issueDate: new Date(),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        
        subtotal,
        discount,
        tax,
        total,
        
        // Issuer info (from tenant or config)
        issuerName: tenant?.name || this.configService.get('COMPANY_NAME'),
        issuerCnpj: tenant?.cnpj || this.configService.get('COMPANY_CNPJ'),
        issuerAddress: tenant?.address || this.configService.get('COMPANY_ADDRESS'),
        issuerCity: tenant?.city || this.configService.get('COMPANY_CITY'),
        issuerState: tenant?.state || this.configService.get('COMPANY_STATE'),
        issuerPhone: tenant?.phone || this.configService.get('COMPANY_PHONE'),
        issuerEmail: tenant?.email || this.configService.get('COMPANY_EMAIL'),
        
        // Recipient info
        recipientName: customer?.name || dto.recipientName,
        recipientDoc: customer?.cpfCnpj || dto.recipientDoc,
        recipientAddress: customer?.address ? `${customer.address}, ${customer.number || ''} ${customer.complement || ''}`.trim() : dto.recipientAddress,
        recipientCity: customer?.city || dto.recipientCity,
        recipientState: customer?.state || dto.recipientState,
        recipientPhone: customer?.phone || dto.recipientPhone,
        recipientEmail: customer?.email || dto.recipientEmail,
        
        description: dto.description,
        items: JSON.stringify(items),
        notes: dto.notes,
        internalNotes: dto.internalNotes,
        
        accessKey,
        qrCode,
        
        warrantyDays: dto.warrantyDays,
        warrantyExpires,
      },
      include: {
        customer: true,
      },
    });

    return invoice;
  }

  async sendToCustomer(id: string, tenantId: string, methods: ('email' | 'whatsapp')[] = ['email', 'whatsapp']) {
    const invoice = await this.findOne(id, tenantId);

    if (!invoice.customer) {
      throw new BadRequestException('Nota fiscal não possui cliente vinculado');
    }

    const customer = invoice.customer;
    const results: any[] = [];

    // Get tenant for copy
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    // Send to customer
    if (methods.includes('email') && customer.email) {
      const emailResult = await this.notificationsService.sendInvoiceEmail(
        tenantId,
        customer.id,
        customer.email,
        invoice,
      );
      results.push({ method: 'email', recipient: customer.email, ...emailResult });
    }

    if (methods.includes('whatsapp') && (customer.whatsapp || customer.phone)) {
      const phone = customer.whatsapp || customer.phone;
      if (phone) {
        const whatsappResult = await this.notificationsService.sendInvoiceWhatsApp(
          tenantId,
          customer.id,
          phone,
          invoice,
        );
        results.push({ method: 'whatsapp', recipient: phone, ...whatsappResult });
      }
    }

    // Send copy to tenant/user
    if (tenant?.email) {
      await this.notificationsService.sendInvoiceEmail(
        tenantId,
        null,
        tenant.email,
        invoice,
        true, // isCopy
      );
    }

    // Update invoice sent info
    await this.prisma.invoice.update({
      where: { id },
      data: {
        sentAt: new Date(),
        sentTo: customer.email || customer.phone,
        sentMethod: methods.join(','),
      },
    });

    return {
      message: 'Nota fiscal enviada com sucesso',
      results,
    };
  }

  async cancel(id: string, tenantId: string, reason: string) {
    const invoice = await this.findOne(id, tenantId);

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Nota fiscal já está cancelada');
    }

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    });
  }

  async delete(id: string, tenantId: string) {
    const invoice = await this.findOne(id, tenantId);

    if (invoice.status === 'ISSUED' || invoice.status === 'SENT') {
      throw new BadRequestException('Não é possível excluir uma nota fiscal já emitida. Cancele-a primeiro.');
    }

    await this.prisma.invoice.delete({
      where: { id },
    });

    return { message: 'Nota fiscal excluída com sucesso' };
  }

  async generateFromSource(tenantId: string, dto: GenerateInvoiceDto) {
    // Validate that at least one source is provided
    if (!dto.saleId && !dto.serviceOrderId) {
      throw new BadRequestException('É necessário informar uma venda ou ordem de serviço');
    }

    let customerId: string | undefined;
    let items: any[] = [];
    let subtotal = 0;
    let discount = 0;
    let description = '';

    // Get data from Sale
    if (dto.saleId) {
      const sale = await this.prisma.sale.findFirst({
        where: { id: dto.saleId, tenantId },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!sale) {
        throw new NotFoundException('Venda não encontrada');
      }

      customerId = sale.customerId || undefined;
      items = sale.items.map((item) => ({
        description: item.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      }));
      subtotal = Number(sale.subtotal);
      discount = Number(sale.discount || 0);
      description = `Nota fiscal referente à venda #${sale.code}`;
    }

    // Get data from Service Order
    if (dto.serviceOrderId) {
      const serviceOrder = await this.prisma.serviceOrder.findFirst({
        where: { id: dto.serviceOrderId, tenantId },
        include: {
          customer: true,
          items: true,
        },
      });

      if (!serviceOrder) {
        throw new NotFoundException('Ordem de serviço não encontrada');
      }

      customerId = serviceOrder.customerId || undefined;
      items = serviceOrder.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      }));
      
      // Add labor cost if exists
      if (serviceOrder.laborCost && Number(serviceOrder.laborCost) > 0) {
        items.push({
          description: 'Mão de obra',
          quantity: 1,
          unitPrice: Number(serviceOrder.laborCost),
          total: Number(serviceOrder.laborCost),
        });
      }
      
      subtotal = items.reduce((sum, item) => sum + item.total, 0);
      discount = Number(serviceOrder.discount || 0);
      description = `Nota fiscal referente à ordem de serviço #${serviceOrder.code}`;
    }

    // Create the invoice
    return this.create(tenantId, {
      type: dto.type,
      customerId,
      saleId: dto.saleId,
      serviceOrderId: dto.serviceOrderId,
      subtotal,
      discount,
      items,
      description,
      notes: dto.notes,
      warrantyDays: dto.warrantyDays,
    });
  }

  async generatePdf(id: string, tenantId: string): Promise<{ buffer: Buffer; filename: string }> {
    const invoice = await this.findOne(id, tenantId);
    const html = this.generateInvoiceHtml(invoice, true);
    
    // For now, return the HTML as a "pseudo-PDF" buffer
    // In production, use puppeteer or similar library
    // Example with puppeteer:
    // const browser = await puppeteer.launch();
    // const page = await browser.newPage();
    // await page.setContent(html);
    // const pdf = await page.pdf({ format: 'A4' });
    // await browser.close();
    // return { buffer: pdf, filename: `nota-${invoice.number}.pdf` };

    // Simplified version - returns HTML that can be printed as PDF
    const buffer = Buffer.from(html, 'utf-8');
    return { 
      buffer, 
      filename: `nota-${invoice.number}.html`,
    };
  }

  async getInvoiceHtml(id: string, tenantId: string, forPrint: boolean = false) {
    const invoice = await this.findOne(id, tenantId);
    return this.generateInvoiceHtml(invoice, forPrint);
  }

  private generateAccessKey(tenantId: string, number: string): string {
    // Simulated access key generation
    // In production, this would follow NF-e/NFS-e specifications
    const timestamp = Date.now().toString(36);
    const random = uuidv4().replace(/-/g, '').substring(0, 8);
    return `SF${timestamp}${number}${random}`.toUpperCase();
  }

  private generateInvoiceHtml(invoice: any, forPrint: boolean = false): string {
    const items = typeof invoice.items === 'string' 
      ? JSON.parse(invoice.items) 
      : invoice.items || [];

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    };

    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('pt-BR');
    };

    const printScript = forPrint ? `
    <script>
      window.onload = function() {
        window.print();
      };
    </script>
    ` : '';

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nota Fiscal ${invoice.number}</title>
  ${printScript}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #333; background: #f5f5f5; }
    .invoice { max-width: 800px; margin: 20px auto; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #fff; padding: 30px; }
    .header h1 { font-size: 24px; margin-bottom: 5px; }
    .header p { opacity: 0.9; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .badge-issued { background: #22c55e; }
    .badge-cancelled { background: #ef4444; }
    .badge-warranty { background: #f59e0b; }
    .content { padding: 30px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 14px; font-weight: 600; color: #6366f1; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #e5e7eb; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .info-block h4 { font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 3px; }
    .info-block p { font-size: 13px; color: #111; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #f3f4f6; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #6b7280; }
    td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
    .text-right { text-align: right; }
    .totals { background: #f9fafb; padding: 20px; margin-top: 20px; }
    .totals-row { display: flex; justify-content: space-between; padding: 5px 0; }
    .totals-row.total { font-size: 18px; font-weight: 700; color: #6366f1; border-top: 2px solid #e5e7eb; padding-top: 15px; margin-top: 10px; }
    .qr-section { text-align: center; padding: 20px; border-top: 1px solid #e5e7eb; }
    .qr-section img { max-width: 120px; }
    .qr-section p { font-size: 10px; color: #6b7280; margin-top: 10px; }
    .warranty-box { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin-top: 20px; }
    .warranty-box h4 { color: #92400e; margin-bottom: 5px; }
    .warranty-box p { color: #78350f; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 11px; color: #6b7280; }
    @media print {
      body { background: #fff; }
      .invoice { box-shadow: none; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div>
          <h1>${invoice.issuerName || 'SmartFlux ERP'}</h1>
          <p>CNPJ: ${invoice.issuerCnpj || 'Não informado'}</p>
          <p>${invoice.issuerAddress || ''} - ${invoice.issuerCity || ''} / ${invoice.issuerState || ''}</p>
        </div>
        <div style="text-align: right;">
          <span class="badge ${invoice.status === 'ISSUED' ? 'badge-issued' : 'badge-cancelled'}">
            ${invoice.status === 'ISSUED' ? 'Emitida' : 'Cancelada'}
          </span>
          ${invoice.warrantyDays ? `<span class="badge badge-warranty" style="margin-left: 5px;">Garantia ${invoice.warrantyDays} dias</span>` : ''}
        </div>
      </div>
    </div>
    
    <div class="content">
      <div class="section">
        <div class="grid">
          <div class="info-block">
            <h4>Número da Nota</h4>
            <p style="font-size: 20px; font-weight: 700; color: #6366f1;">${invoice.number}</p>
          </div>
          <div class="info-block" style="text-align: right;">
            <h4>Data de Emissão</h4>
            <p>${formatDate(invoice.issueDate)}</p>
          </div>
        </div>
      </div>

      <div class="section">
        <h3 class="section-title">Destinatário</h3>
        <div class="grid">
          <div class="info-block">
            <h4>Nome/Razão Social</h4>
            <p>${invoice.recipientName || 'Consumidor Final'}</p>
          </div>
          <div class="info-block">
            <h4>CPF/CNPJ</h4>
            <p>${invoice.recipientDoc || 'Não informado'}</p>
          </div>
          <div class="info-block">
            <h4>Endereço</h4>
            <p>${invoice.recipientAddress || 'Não informado'}</p>
          </div>
          <div class="info-block">
            <h4>Cidade/UF</h4>
            <p>${invoice.recipientCity || '-'} / ${invoice.recipientState || '-'}</p>
          </div>
        </div>
      </div>

      <div class="section">
        <h3 class="section-title">Itens</h3>
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th class="text-right">Qtd</th>
              <th class="text-right">Valor Unit.</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item: any) => `
              <tr>
                <td>${item.description}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                <td class="text-right">${formatCurrency(item.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="totals">
        <div class="totals-row">
          <span>Subtotal</span>
          <span>${formatCurrency(Number(invoice.subtotal))}</span>
        </div>
        ${Number(invoice.discount) > 0 ? `
        <div class="totals-row">
          <span>Desconto</span>
          <span style="color: #22c55e;">- ${formatCurrency(Number(invoice.discount))}</span>
        </div>
        ` : ''}
        ${Number(invoice.tax) > 0 ? `
        <div class="totals-row">
          <span>Impostos</span>
          <span>${formatCurrency(Number(invoice.tax))}</span>
        </div>
        ` : ''}
        <div class="totals-row total">
          <span>TOTAL</span>
          <span>${formatCurrency(Number(invoice.total))}</span>
        </div>
      </div>

      ${invoice.warrantyDays ? `
      <div class="warranty-box">
        <h4>⚠️ Garantia</h4>
        <p>Este produto/serviço possui garantia de <strong>${invoice.warrantyDays} dias</strong> 
        válida até <strong>${formatDate(invoice.warrantyExpires)}</strong>.</p>
        <p style="margin-top: 5px; font-size: 11px;">Guarde este documento para eventual necessidade de acionar a garantia.</p>
      </div>
      ` : ''}

      ${invoice.notes ? `
      <div class="section" style="margin-top: 20px;">
        <h3 class="section-title">Observações</h3>
        <p>${invoice.notes}</p>
      </div>
      ` : ''}

      <div class="qr-section">
        ${invoice.qrCode ? `<img src="${invoice.qrCode}" alt="QR Code" />` : ''}
        <p>Chave de Acesso: ${invoice.accessKey}</p>
        <p>Consulte a autenticidade em: ${this.configService.get('FRONTEND_URL')}/invoice/${invoice.accessKey}</p>
      </div>
    </div>

    <div class="footer">
      <p>Documento gerado pelo sistema SmartFlux ERP</p>
      <p>Este documento não possui valor fiscal oficial, serve apenas para fins de controle interno e garantia.</p>
    </div>
  </div>
</body>
</html>
    `;
  }
}
