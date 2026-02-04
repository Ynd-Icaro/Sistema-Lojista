import { Module } from "@nestjs/common";
import { CustomersService } from "./customers.service";
import { CustomerImportExportService } from "./services/import-export.service";
import { CustomersController } from "./customers.controller";

@Module({
  providers: [CustomersService, CustomerImportExportService],
  controllers: [CustomersController],
  exports: [CustomersService],
})
export class CustomersModule {}
