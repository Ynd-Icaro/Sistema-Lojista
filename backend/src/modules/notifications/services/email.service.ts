import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: any[];
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const port = parseInt(this.configService.get("SMTP_PORT") || "587", 10);
    // Porta 465 usa SSL/TLS implícito, outras portas (587, 25) usam STARTTLS
    const isSecure = port === 465;

    this.transporter = nodemailer.createTransport({
      host: this.configService.get("SMTP_HOST"),
      port: port,
      secure: isSecure,
      auth: {
        user: this.configService.get("SMTP_USER"),
        pass: this.configService.get("SMTP_PASS"),
      },
      // Habilita TLS para portas não-seguras (como 587)
      ...(isSecure ? {} : { tls: { rejectUnauthorized: false } }),
    });
  }

  async send(options: SendEmailOptions): Promise<void> {
    // Usa o próprio email de autenticação como remetente (evita problemas de SPF/DKIM)
    const smtpUser = this.configService.get("SMTP_USER");
    const from = `Icaro de Oliveira <${smtpUser}>`;

    try {
      await this.transporter.sendMail({
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

  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error("Email verification failed:", error);
      return false;
    }
  }
}
