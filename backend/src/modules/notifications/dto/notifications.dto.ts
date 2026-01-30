import { IsString, IsOptional, IsEmail, IsArray, IsObject } from 'class-validator';

export class SendEmailDto {
  @IsEmail()
  to: string;

  @IsString()
  subject: string;

  @IsString()
  html: string;

  @IsString()
  @IsOptional()
  text?: string;

  @IsArray()
  @IsOptional()
  attachments?: { filename: string; content: Buffer | string }[];
}

export class SendWhatsAppDto {
  @IsString()
  phone: string;

  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  mediaUrl?: string;
}

export class ServiceOrderNotificationDto {
  @IsString()
  serviceOrderId: string;

  @IsString()
  type: 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELIVERED';
}

export class NotificationTemplateDto {
  @IsString()
  customerName: string;

  @IsString()
  orderNumber: string;

  @IsString()
  @IsOptional()
  deviceType?: string;

  @IsString()
  @IsOptional()
  deviceBrand?: string;

  @IsString()
  @IsOptional()
  deviceModel?: string;

  @IsString()
  @IsOptional()
  reportedIssue?: string;

  @IsString()
  @IsOptional()
  diagnosis?: string;

  @IsString()
  @IsOptional()
  total?: string;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  companyPhone?: string;

  @IsString()
  @IsOptional()
  isDelivery?: boolean;
}
