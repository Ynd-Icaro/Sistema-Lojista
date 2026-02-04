import { Module, Global } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";
import { EmailService } from "./services/email.service";
import { WhatsAppService } from "./services/whatsapp.service";

@Global()
@Module({
  providers: [NotificationsService, EmailService, WhatsAppService],
  controllers: [NotificationsController],
  exports: [NotificationsService, EmailService, WhatsAppService],
})
export class NotificationsModule {}
