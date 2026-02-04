import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "./services/email.service";
import { WhatsAppService } from "./services/whatsapp.service";

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private whatsAppService: WhatsAppService,
  ) {}

  async sendInvoiceEmail(
    tenantId: string,
    customerId: string | null,
    email: string,
    invoice: any,
    isCopy = false,
  ) {
    const subject = isCopy
      ? `[Cópia] Nota Fiscal ${invoice.number} - ${invoice.recipientName || "Cliente"}`
      : `Nota Fiscal ${invoice.number} - SmartFlux`;

    const html = this.generateInvoiceEmailHtml(invoice, isCopy);

    try {
      await this.emailService.send({
        to: email,
        subject,
        html,
      });

      // Log notification
      await this.prisma.notificationLog.create({
        data: {
          tenantId,
          customerId,
          type: "EMAIL",
          status: "SENT",
          recipient: email,
          subject,
          content: `Nota Fiscal ${invoice.number}`,
          sentAt: new Date(),
          metadata: { invoiceId: invoice.id, isCopy },
        },
      });

      return { success: true, message: "Email enviado com sucesso" };
    } catch (error) {
      await this.prisma.notificationLog.create({
        data: {
          tenantId,
          customerId,
          type: "EMAIL",
          status: "FAILED",
          recipient: email,
          subject,
          content: `Nota Fiscal ${invoice.number}`,
          errorMsg: error.message,
          metadata: { invoiceId: invoice.id },
        },
      });

      return { success: false, message: error.message };
    }
  }

  async sendInvoiceWhatsApp(
    tenantId: string,
    customerId: string | null,
    phone: string,
    invoice: any,
  ) {
    const message = this.generateInvoiceWhatsAppMessage(invoice);

    try {
      await this.whatsAppService.send({
        to: phone,
        message,
      });

      await this.prisma.notificationLog.create({
        data: {
          tenantId,
          customerId,
          type: "WHATSAPP",
          status: "SENT",
          recipient: phone,
          content: message,
          sentAt: new Date(),
          metadata: { invoiceId: invoice.id },
        },
      });

      return { success: true, message: "WhatsApp enviado com sucesso" };
    } catch (error) {
      await this.prisma.notificationLog.create({
        data: {
          tenantId,
          customerId,
          type: "WHATSAPP",
          status: "FAILED",
          recipient: phone,
          content: message,
          errorMsg: error.message,
          metadata: { invoiceId: invoice.id },
        },
      });

      return { success: false, message: error.message };
    }
  }

  async sendSaleConfirmation(tenantId: string, sale: any) {
    if (!sale.customer) return;

    const customer = sale.customer;
    const message = this.generateSaleConfirmationMessage(sale);

    if (customer.email) {
      await this.emailService.send({
        to: customer.email,
        subject: `Compra confirmada - Pedido ${sale.code}`,
        html: this.generateSaleEmailHtml(sale),
      });
    }

    if (customer.whatsapp || customer.phone) {
      await this.whatsAppService.send({
        to: customer.whatsapp || customer.phone,
        message,
      });
    }
  }

  async sendServiceOrderUpdate(tenantId: string, order: any, status: string) {
    if (!order.customer) return;

    const customer = order.customer;
    const message = this.generateServiceOrderMessage(order, status);

    // // WhatsApp - Envia em CREATED e COMPLETED
    // if ((customer.whatsapp || customer.phone) && (status === 'COMPLETED' || status === 'DELIVERED')) {
    //   try {
    //     await this.whatsAppService.send({
    //       to: customer.whatsapp || customer.phone,
    //       message,
    //     });

    //     await this.prisma.notificationLog.create({
    //       data: {
    //         tenantId,
    //         customerId: customer.id,
    //         type: 'WHATSAPP',
    //         status: 'SENT',
    //         recipient: customer.whatsapp || customer.phone,
    //         content: message.substring(0, 500),
    //         sentAt: new Date(),
    //         metadata: { serviceOrderId: order.id, statusChange: status },
    //       },
    //     });
    //   } catch (error) {
    //     await this.prisma.notificationLog.create({
    //       data: {
    //         tenantId,
    //         customerId: customer.id,
    //         type: 'WHATSAPP',
    //         status: 'FAILED',
    //         recipient: customer.whatsapp || customer.phone,
    //         content: message.substring(0, 500),
    //         errorMsg: error.message,
    //         metadata: { serviceOrderId: order.id, statusChange: status },
    //       },
    //     });
    //   }
    // }

    // Email - Envia em todos os status
    if (customer.email) {
      try {
        await this.emailService.send({
          to: customer.email,
          subject: `${this.getStatusEmoji(status)} OS ${order.code} - ${this.getStatusLabel(status)}`,
          html: this.generateServiceOrderEmailHtml(order, status),
        });

        await this.prisma.notificationLog.create({
          data: {
            tenantId,
            customerId: customer.id,
            type: "EMAIL",
            status: "SENT",
            recipient: customer.email,
            subject: `OS ${order.code} - ${this.getStatusLabel(status)}`,
            content: `Atualização de status para ${this.getStatusLabel(status)}`,
            sentAt: new Date(),
            metadata: { serviceOrderId: order.id, statusChange: status },
          },
        });
      } catch (error) {
        await this.prisma.notificationLog.create({
          data: {
            tenantId,
            customerId: customer.id,
            type: "EMAIL",
            status: "FAILED",
            recipient: customer.email,
            subject: `OS ${order.code} - ${this.getStatusLabel(status)}`,
            content: `Atualização de status para ${this.getStatusLabel(status)}`,
            errorMsg: error.message,
            metadata: { serviceOrderId: order.id, statusChange: status },
          },
        });
      }
    }
  }
  async getNotificationLogs(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.notificationLog.findMany({
        where: { tenantId },
        skip,
        take: limit,
        include: {
          customer: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.notificationLog.count({ where: { tenantId } }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private generateInvoiceEmailHtml(invoice: any, isCopy: boolean): string {
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #fff; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .info-box { background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .info-row:last-child { border-bottom: none; }
    .label { color: #6b7280; font-size: 12px; text-transform: uppercase; }
    .value { font-weight: 600; color: #111; }
    .total { font-size: 24px; color: #6366f1; text-align: center; padding: 20px; }
    .btn { display: inline-block; background: #6366f1; color: #fff; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
    ${isCopy ? ".copy-banner { background: #fef3c7; color: #92400e; padding: 10px; text-align: center; font-weight: 600; }" : ""}
  </style>
</head>
<body>
  <div class="container">
    ${isCopy ? '<div class="copy-banner">📋 CÓPIA - Esta é uma cópia da nota fiscal enviada ao cliente</div>' : ""}
    <div class="header">
      <h1>📄 Nota Fiscal</h1>
      <p>Nº ${invoice.number}</p>
    </div>
    <div class="content">
      <div class="info-box">
        <div class="info-row">
          <span class="label">Cliente</span>
          <span class="value">${invoice.recipientName || "Consumidor Final"}</span>
        </div>
        <div class="info-row">
          <span class="label">Data</span>
          <span class="value">${new Date(invoice.issueDate).toLocaleDateString("pt-BR")}</span>
        </div>
        ${
          invoice.warrantyDays
            ? `
        <div class="info-row">
          <span class="label">Garantia</span>
          <span class="value">${invoice.warrantyDays} dias (até ${new Date(invoice.warrantyExpires).toLocaleDateString("pt-BR")})</span>
        </div>
        `
            : ""
        }
      </div>
      
      <div class="total">
        <div class="label">Valor Total</div>
        <div>${formatCurrency(Number(invoice.total))}</div>
      </div>
      
      <p style="text-align: center; color: #6b7280;">
        Utilize a chave de acesso abaixo para consultar sua nota fiscal:
      </p>
      <p style="text-align: center; font-family: monospace; background: #f3f4f6; padding: 10px; border-radius: 4px; font-size: 11px;">
        ${invoice.accessKey}
      </p>
    </div>
    <div class="footer">
      <p>Esta mensagem foi enviada automaticamente pelo SmartFlux ERP.</p>
      <p>Em caso de dúvidas, entre em contato conosco.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private generateInvoiceWhatsAppMessage(invoice: any): string {
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
    };

    let message = `📄 *NOTA FISCAL ${invoice.number}*\n\n`;
    message += `👤 Cliente: ${invoice.recipientName || "Consumidor Final"}\n`;
    message += `📅 Data: ${new Date(invoice.issueDate).toLocaleDateString("pt-BR")}\n`;
    message += `💰 Valor: *${formatCurrency(Number(invoice.total))}*\n`;

    if (invoice.warrantyDays) {
      message += `\n🛡️ *GARANTIA*\n`;
      message += `Prazo: ${invoice.warrantyDays} dias\n`;
      message += `Válida até: ${new Date(invoice.warrantyExpires).toLocaleDateString("pt-BR")}\n`;
    }

    message += `\n🔑 Chave de Acesso:\n\`${invoice.accessKey}\`\n`;
    message += `\n_Guarde este comprovante para sua segurança._`;

    return message;
  }

  private generateSaleConfirmationMessage(sale: any): string {
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
    };

    let message = `✅ *COMPRA CONFIRMADA*\n\n`;
    message += `📦 Pedido: *${sale.code}*\n`;
    message += `💰 Total: *${formatCurrency(Number(sale.total))}*\n`;
    message += `💳 Pagamento: ${this.getPaymentMethodLabel(sale.paymentMethod)}\n`;
    message += `\nObrigado pela preferência! 🙏`;

    return message;
  }

  private generateSaleEmailHtml(sale: any): string {
    return `<h1>Compra Confirmada</h1><p>Pedido ${sale.code}</p>`;
  }

  private generateServiceOrderMessage(order: any, status: string): string {
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
    };

    const customerName = order.customer?.name || "Cliente";
    const isDelivery = order.notes?.toLowerCase().includes("entrega") || false;

    let message = "";

    switch (status) {
      case "CREATED":
        message = `🔧 *ORDEM DE SERVIÇO CRIADA*\n\n`;
        message += `Olá *${customerName}*!\n\n`;
        message += `Sua ordem de serviço foi registrada com sucesso.\n\n`;
        message += `📋 *Detalhes:*\n`;
        message += `• Número: *#${order.code}*\n`;
        if (order.deviceType) {
          message += `• Dispositivo: ${order.deviceType}`;
          if (order.deviceBrand) message += ` - ${order.deviceBrand}`;
          if (order.deviceModel) message += ` (${order.deviceModel})`;
          message += `\n`;
        }
        if (order.reportedIssue)
          message += `• Problema: ${order.reportedIssue}\n`;
        message += `• Status: 🟡 Pendente\n\n`;
        message += `Você receberá atualizações sobre o andamento.\n\n`;
        message += `_SmartFlux ERP_`;
        break;

      case "IN_PROGRESS":
        message = `🔧 *SERVIÇO EM ANDAMENTO*\n\n`;
        message += `Olá *${customerName}*!\n\n`;
        message += `Sua OS *#${order.code}* está agora em andamento! 🔵\n\n`;
        if (order.deviceType)
          message += `📱 Dispositivo: ${order.deviceType}\n\n`;
        message += `Nossos técnicos estão trabalhando no seu equipamento.\n`;
        message += `Você será notificado quando o serviço for concluído.\n\n`;
        message += `_SmartFlux ERP_`;
        break;

      case "WAITING_PARTS":
        message = `📦 *AGUARDANDO PEÇAS*\n\n`;
        message += `Olá *${customerName}*!\n\n`;
        message += `Sua OS *#${order.code}* está aguardando peças para continuidade do serviço.\n\n`;
        if (order.deviceType)
          message += `📱 Dispositivo: ${order.deviceType}\n\n`;
        message += `Assim que as peças chegarem, daremos continuidade ao serviço.\n`;
        message += `Você será notificado sobre qualquer atualização.\n\n`;
        message += `_SmartFlux ERP_`;
        break;

      case "CANCELLED":
        message = `❌ *ORDEM DE SERVIÇO CANCELADA*\n\n`;
        message += `Olá *${customerName}*!\n\n`;
        message += `A OS *#${order.code}* foi cancelada.\n\n`;
        if (order.deviceType)
          message += `📱 Dispositivo: ${order.deviceType}\n\n`;
        message += `Em caso de dúvidas, entre em contato conosco.\n\n`;
        message += `_SmartFlux ERP_`;
        break;

      case "COMPLETED":
        const actionMsg = isDelivery
          ? "🚚 *Seu pedido será entregue em breve!*"
          : "📍 *Seu dispositivo está pronto para retirada!*";

        message = `✅ *SERVIÇO CONCLUÍDO!*\n\n`;
        message += `Olá *${customerName}*!\n\n`;
        message += `Temos uma ótima notícia! 🎉\n`;
        message += `Sua ordem de serviço *#${order.code}* foi concluída com sucesso!\n\n`;
        message += `${actionMsg}\n\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `📋 *RESUMO DO SERVIÇO*\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `👤 *Cliente:* ${customerName}\n`;
        message += `🔢 *Nº da OS:* #${order.code}\n`;

        if (order.deviceType) {
          message += `📱 *Dispositivo:* ${order.deviceType}`;
          if (order.deviceBrand) message += ` - ${order.deviceBrand}`;
          if (order.deviceModel) message += ` (${order.deviceModel})`;
          message += `\n`;
        }

        if (order.reportedIssue)
          message += `⚠️ *Problema Relatado:* ${order.reportedIssue}\n`;
        if (order.diagnosis)
          message += `🔍 *Diagnóstico:* ${order.diagnosis}\n`;
        if (order.total)
          message += `\n💰 *Valor Total:* ${formatCurrency(Number(order.total))}\n`;

        message += `\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `Obrigado pela confiança! 💙\n\n`;
        message += `_SmartFlux ERP_`;
        break;

      case "DELIVERED":
        message = `🎉 *ENTREGA REALIZADA*\n\n`;
        message += `Olá *${customerName}*!\n\n`;
        message += `Sua OS *#${order.code}* foi entregue com sucesso!\n\n`;
        message += `Obrigado por escolher nossos serviços! 💙\n\n`;
        if (order.warrantyDays) {
          message += `🛡️ *Garantia:* ${order.warrantyDays} dias\n\n`;
        }
        message += `Em caso de dúvidas, estamos à disposição.\n\n`;
        message += `_SmartFlux ERP_`;
        break;

      default:
        message = `📋 *OS ${order.code}*\nStatus: ${this.getStatusLabel(status)}`;
    }

    return message;
  }

  private generateServiceOrderEmailHtml(order: any, status: string): string {
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
    };

    const customerName = order.customer?.name || "Cliente";
    const isDelivery = order.notes?.toLowerCase().includes("entrega") || false;

    let statusColor = "#6366f1";
    let statusBg = "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)";
    let statusIcon = "📋";
    let statusTitle = "Ordem de Serviço";
    let actionMessage = "";

    switch (status) {
      case "CREATED":
        statusColor = "#f59e0b";
        statusBg = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
        statusIcon = "🔧";
        statusTitle = "Ordem de Serviço Criada";
        actionMessage =
          "Sua ordem de serviço foi registrada e em breve será atendida.";
        break;
      case "PENDING":
        statusColor = "#eab308";
        statusBg = "linear-gradient(135deg, #eab308 0%, #ca8a04 100%)";
        statusIcon = "🟡";
        statusTitle = "Ordem de Serviço Pendente";
        actionMessage =
          "Sua ordem de serviço está na fila e será atendida em breve.";
        break;
      case "IN_PROGRESS":
        statusColor = "#3b82f6";
        statusBg = "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";
        statusIcon = "🔧";
        statusTitle = "Serviço em Andamento";
        actionMessage = "Nossos técnicos estão trabalhando no seu equipamento.";
        break;
      case "WAITING_PARTS":
        statusColor = "#f97316";
        statusBg = "linear-gradient(135deg, #f97316 0%, #ea580c 100%)";
        statusIcon = "📦";
        statusTitle = "Aguardando Peças";
        actionMessage =
          "Estamos aguardando peças para dar continuidade ao seu serviço.";
        break;
      case "COMPLETED":
        statusColor = "#10b981";
        statusBg = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
        statusIcon = "✅";
        statusTitle = "Serviço Concluído!";
        actionMessage = isDelivery
          ? "🚚 Seu pedido será entregue em breve!"
          : "📍 Seu dispositivo está pronto para retirada!";
        break;
      case "DELIVERED":
        statusColor = "#8b5cf6";
        statusBg = "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)";
        statusIcon = "🎉";
        statusTitle = "Entrega Realizada";
        actionMessage = "Obrigado por escolher nossos serviços!";
        break;
      case "CANCELLED":
        statusColor = "#ef4444";
        statusBg = "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
        statusIcon = "❌";
        statusTitle = "Ordem de Serviço Cancelada";
        actionMessage =
          "Esta ordem de serviço foi cancelada. Em caso de dúvidas, entre em contato.";
        break;
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: ${statusBg}; color: #fff; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header .icon { font-size: 48px; margin-bottom: 10px; }
    .content { padding: 30px; }
    .greeting { font-size: 20px; color: #1e293b; margin-bottom: 15px; }
    .action-box { background: ${statusColor}15; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; border: 2px solid ${statusColor}30; }
    .action-box p { color: ${statusColor}; font-weight: 600; font-size: 16px; margin: 0; }
    .info-box { background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
    .info-row:last-child { border-bottom: none; }
    .label { color: #6b7280; font-size: 13px; }
    .value { font-weight: 600; color: #1e293b; text-align: right; }
    .total-row { background: ${statusColor}10; margin: -20px; margin-top: 10px; padding: 15px 20px; border-radius: 0 0 12px 12px; }
    .total-row .value { color: ${statusColor}; font-size: 20px; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">${statusIcon}</div>
      <h1>${statusTitle}</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">OS #${order.code}</p>
    </div>
    
    <div class="content">
      <p class="greeting">Olá, ${customerName}! 👋</p>
      
      <div class="action-box">
        <p>${actionMessage}</p>
      </div>
      
      <div class="info-box">
        <div class="info-row">
          <span class="label">Número da OS</span>
          <span class="value">#${order.code}</span>
        </div>
        <div class="info-row">
          <span class="label">Status</span>
          <span class="value" style="color: ${statusColor};">${this.getStatusLabel(status)}</span>
        </div>
        ${
          order.deviceType
            ? `
        <div class="info-row">
          <span class="label">Dispositivo</span>
          <span class="value">${order.deviceType}${order.deviceBrand ? ` - ${order.deviceBrand}` : ""}${order.deviceModel ? ` (${order.deviceModel})` : ""}</span>
        </div>
        `
            : ""
        }
        ${
          order.reportedIssue
            ? `
        <div class="info-row">
          <span class="label">Problema Relatado</span>
          <span class="value">${order.reportedIssue}</span>
        </div>
        `
            : ""
        }
        ${
          order.diagnosis && status === "COMPLETED"
            ? `
        <div class="info-row">
          <span class="label">Diagnóstico</span>
          <span class="value">${order.diagnosis}</span>
        </div>
        `
            : ""
        }
        ${
          order.warrantyDays &&
          (status === "COMPLETED" || status === "DELIVERED")
            ? `
        <div class="info-row">
          <span class="label">Garantia</span>
          <span class="value">${order.warrantyDays} dias</span>
        </div>
        `
            : ""
        }
        ${
          order.total && (status === "COMPLETED" || status === "DELIVERED")
            ? `
        <div class="info-row total-row">
          <span class="label" style="font-weight: 600;">Valor Total</span>
          <span class="value">${formatCurrency(Number(order.total))}</span>
        </div>
        `
            : ""
        }
      </div>
      
      <p style="color: #64748b; text-align: center; margin-top: 30px;">
        Obrigado pela confiança! 💙
      </p>
    </div>
    
    <div class="footer">
      <p style="margin: 0;">Esta mensagem foi enviada automaticamente pelo SmartFlux ERP.</p>
      <p style="margin: 10px 0 0;">Em caso de dúvidas, entre em contato conosco.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  async sendLowStockAlert(tenantId: string, lowStockProducts: any[]) {
    if (lowStockProducts.length === 0) return;

    // Get tenant settings
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const settings = (tenant?.settings as any) || {};
    const emailForNotifications = settings?.company?.email || tenant?.email;

    if (!emailForNotifications) return;

    const subject = `🚨 Alerta de Estoque Baixo - ${lowStockProducts.length} produto(s)`;
    const html = this.generateLowStockAlertEmailHtml(lowStockProducts);

    try {
      await this.emailService.send({
        to: emailForNotifications,
        subject,
        html,
      });

      // Log notification
      await this.prisma.notificationLog.create({
        data: {
          tenantId,
          type: "EMAIL",
          status: "SENT",
          recipient: emailForNotifications,
          subject,
          content: `Alerta de estoque baixo para ${lowStockProducts.length} produtos`,
          sentAt: new Date(),
          metadata: {
            lowStockProducts: lowStockProducts.map((p) => ({
              id: p.id,
              name: p.name,
              stock: p.stock,
              minStock: p.minStock,
            })),
          },
        },
      });

      return {
        success: true,
        message: "Alerta de estoque enviado com sucesso",
      };
    } catch (error) {
      console.error("Low stock alert email error:", error);
      return { success: false, message: "Falha ao enviar alerta de estoque" };
    }
  }

  private generateLowStockAlertEmailHtml(products: any[]): string {
    const productRows = products
      .map(
        (product) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${product.sku || "N/A"}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${product.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center; color: #e53e3e; font-weight: bold;">${product.stock}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${product.minStock}</td>
      </tr>
    `,
      )
      .join("");

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Alerta de Estoque Baixo</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #e53e3e, #c53030); color: white; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">🚨 Alerta de Estoque Baixo</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Produtos com estoque crítico detectados</p>
    </div>

    <div style="padding: 30px;">
      <p>Olá,</p>
      <p>Detectamos <strong>${products.length} produto(s)</strong> com estoque abaixo do nível mínimo configurado:</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f9f9f9; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background: #e53e3e; color: white;">
            <th style="padding: 12px; text-align: left;">SKU</th>
            <th style="padding: 12px; text-align: left;">Produto</th>
            <th style="padding: 12px; text-align: center;">Estoque Atual</th>
            <th style="padding: 12px; text-align: center;">Estoque Mínimo</th>
          </tr>
        </thead>
        <tbody>
          ${productRows}
        </tbody>
      </table>

      <p style="color: #e53e3e; font-weight: bold;">⚠️ Ação recomendada: Reabasteça estes produtos o mais breve possível para evitar rupturas de estoque.</p>

      <div style="background: #f0f9ff; border-left: 4px solid #3182ce; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #2c5282;"><strong>Dica:</strong> Você pode ajustar os níveis de estoque mínimo nas configurações do produto ou configurar alertas automáticos mais frequentes.</p>
      </div>

      <p>Atenciosamente,<br>
      <strong>SmartFlux ERP</strong></p>
    </div>

    <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
      <p>Este é um email automático do sistema SmartFlux ERP. Não responda este email.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getStatusEmoji(status: string): string {
    const emojis: Record<string, string> = {
      CREATED: "🔧",
      PENDING: "🟡",
      IN_PROGRESS: "🔵",
      WAITING_PARTS: "📦",
      COMPLETED: "✅",
      DELIVERED: "🎉",
      CANCELLED: "❌",
    };
    return emojis[status] || "📋";
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      CREATED: "Criado",
      PENDING: "Pendente",
      IN_PROGRESS: "Em Andamento",
      WAITING_PARTS: "Aguardando Peças",
      COMPLETED: "Concluído",
      DELIVERED: "Entregue",
      CANCELLED: "Cancelado",
    };
    return labels[status] || status;
  }

  private getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      CASH: "Dinheiro",
      CREDIT_CARD: "Cartão de Crédito",
      DEBIT_CARD: "Cartão de Débito",
      PIX: "PIX",
      BANK_TRANSFER: "Transferência",
      BOLETO: "Boleto",
    };
    return labels[method] || method;
  }
}
