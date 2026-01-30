import { Module, forwardRef } from '@nestjs/common';
import { ServiceOrdersService } from './service-orders.service';
import { ServiceOrdersController } from './service-orders.controller';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [forwardRef(() => InvoicesModule)],
  providers: [ServiceOrdersService],
  controllers: [ServiceOrdersController],
  exports: [ServiceOrdersService],
})
export class ServiceOrdersModule {}
