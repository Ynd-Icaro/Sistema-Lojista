import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../../prisma/prisma.service";
import * as nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: any[];
  tenantId?: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from?: string;
}

@Injectable()
export class EmailService {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  private async getSmtpConfig(tenantId?: string): Promise<SmtpConfig> {
    // Se tenantId for fornecido, buscar configurações do tenant
    if (tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      const settings = (tenant?.settings as any) || {};

      if (settings.smtpHost && settings.smtpUser && settings.smtpPassword) {
        return {
          host: settings.smtpHost,
          port: settings.smtpPort || 587,
          user: settings.smtpUser,
          pass: settings.smtpPassword,
          from: settings.smtpFrom,
        };
      }
    }

    // Fallback para configurações do .env
    return {
      host: this.configService.get("SMTP_HOST") || "",
      port: parseInt(this.configService.get("SMTP_PORT") || "587", 10),
      user: this.configService.get("SMTP_USER") || "",
      pass: this.configService.get("SMTP_PASS") || "",
    };
  }

  private createTransporter(config: SmtpConfig): nodemailer.Transporter {
    const isSecure = config.port === 465;

    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: isSecure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      // Habilita TLS para portas não-seguras (como 587)
      ...(isSecure ? {} : { tls: { rejectUnauthorized: false } }),
    });
  }

  async send(options: SendEmailOptions): Promise<void> {
    const smtpConfig = await this.getSmtpConfig(options.tenantId);
    
    if (!smtpConfig.host || !smtpConfig.user || !smtpConfig.pass) {
      throw new Error("Configurações SMTP não encontradas. Configure o servidor de email.");
    }

    const transporter = this.createTransporter(smtpConfig);

    // Usa o email de remetente configurado ou o email de autenticação
    const from = smtpConfig.from 
      ? `SmartFlux ERP <${smtpConfig.from}>`
      : `SmartFlux ERP <${smtpConfig.user}>`;

    try {
      await transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      });
    } catch (error) {
      console.error("Email send error:", error);
      throw new Error(`Falha ao enviar email: ${error.message}`);
    }
  }

  async verify(tenantId?: string): Promise<{ success: boolean; message: string }> {
    try {
      const smtpConfig = await this.getSmtpConfig(tenantId);
      
      if (!smtpConfig.host || !smtpConfig.user || !smtpConfig.pass) {
        return {
          success: false,
          message: "Configurações SMTP incompletas. Verifique host, usuário e senha."
        };
      }

      const transporter = this.createTransporter(smtpConfig);
      await transporter.verify();
      
      return {
        success: true,
        message: "Conexão SMTP estabelecida com sucesso!"
      };
    } catch (error) {
      console.error("Email verification failed:", error);
      return {
        success: false,
        message: `Falha na conexão SMTP: ${error.message}`
      };
    }
  }

  async testConnection(tenantId: string, testEmail: string): Promise<{ success: boolean; message: string }> {
    try {
      const verifyResult = await this.verify(tenantId);
      if (!verifyResult.success) {
        return verifyResult;
      }

      // Enviar email de teste
      await this.send({
        to: testEmail,
        subject: "Teste de Conexão SMTP - SmartFlux ERP",
        html: `
          <h2>✅ Teste de Conexão Realizado com Sucesso!</h2>
          <p>Este é um email de teste para verificar se as configurações SMTP estão funcionando corretamente.</p>
          <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          <hr>
          <p><em>SmartFlux ERP - Sistema de Gestão</em></p>
        `,
        tenantId,
      });

      return {
        success: true,
        message: "Email de teste enviado com sucesso!"
      };
    } catch (error) {
      console.error("Test email failed:", error);
      return {
        success: false,
        message: `Falha ao enviar email de teste: ${error.message}`
      };
    }
  }
}
