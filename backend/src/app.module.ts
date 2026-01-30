import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SalesModule } from './modules/sales/sales.module';
import { ServiceOrdersModule } from './modules/service-orders/service-orders.module';
import { FinancialModule } from './modules/financial/financial.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SettingsModule } from './modules/settings/settings.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AddressModule } from './modules/address/address.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    ProductsModule,
    CategoriesModule,
    SuppliersModule,
    CustomersModule,
    SalesModule,
    ServiceOrdersModule,
    FinancialModule,
    InvoicesModule,
    NotificationsModule,
    DashboardModule,
    SettingsModule,
    InvitationsModule,
    ReportsModule,
    AddressModule,
  ],
})
export class AppModule {}
