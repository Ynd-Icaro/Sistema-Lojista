import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { ProductsService } from "./products.service";
import { ProductsController } from "./products.controller";
import { ProductImportExportService } from "./services/import-export.service";

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  providers: [ProductsService, ProductImportExportService],
  controllers: [ProductsController],
  exports: [ProductsService, ProductImportExportService],
})
export class ProductsModule {}
