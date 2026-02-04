import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

interface SendWhatsAppOptions {
  to: string;
  message: string;
  mediaUrl?: string;
}

@Injectable()
export class WhatsAppService {
  private apiUrl: string;
  private apiKey: string;
  private instance: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get("WHATSAPP_API_URL") || "";
    this.apiKey = this.configService.get("WHATSAPP_API_KEY") || "";
    this.instance = this.configService.get("WHATSAPP_INSTANCE") || "";
  }

  async send(options: SendWhatsAppOptions): Promise<void> {
    // Format phone number
    const phone = this.formatPhone(options.to);

    // Check if API is configured
    if (!this.apiUrl || !this.apiKey) {
      console.log("[WhatsApp] API not configured, simulating send to:", phone);
      console.log("[WhatsApp] Message:", options.message);
      return;
    }

    try {
      // Example for Evolution API
      const response = await fetch(
        `${this.apiUrl}/message/sendText/${this.instance}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: this.apiKey,
          },
          body: JSON.stringify({
            number: phone,
            options: {
              delay: 1200,
            },
            textMessage: {
              text: options.message,
            },
          }),
        },
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`WhatsApp API error: ${error}`);
      }
    } catch (error) {
      console.error("WhatsApp send error:", error);
      throw new Error(`Falha ao enviar WhatsApp: ${error.message}`);
    }
  }

  private formatPhone(phone: string): string {
    // Remove non-numeric characters
    let cleaned = phone.replace(/\D/g, "");

    // Add Brazil country code if needed
    if (cleaned.length === 10 || cleaned.length === 11) {
      cleaned = "55" + cleaned;
    }

    return cleaned;
  }

  async checkConnection(): Promise<boolean> {
    if (!this.apiUrl || !this.apiKey) {
      return false;
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/instance/connectionState/${this.instance}`,
        {
          headers: {
            apikey: this.apiKey,
          },
        },
      );

      const data = await response.json();
      return data.instance?.state === "open";
    } catch (error) {
      console.error("WhatsApp connection check failed:", error);
      return false;
    }
  }
}
