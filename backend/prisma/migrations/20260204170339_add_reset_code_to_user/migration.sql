/*
  Warnings:

  - Added the required column `tenantId` to the `stock_movements` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProductImportStatus" AS ENUM ('OK', 'REVIEW', 'ERROR');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "ageGroup" TEXT,
ADD COLUMN     "attributes" JSONB DEFAULT '{}',
ADD COLUMN     "availableStock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "averagePurchasePrice" DECIMAL(10,2),
ADD COLUMN     "batchNumber" TEXT,
ADD COLUMN     "bin" TEXT,
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "cest" TEXT,
ADD COLUMN     "cfop" TEXT,
ADD COLUMN     "cofinsRate" DECIMAL(5,2),
ADD COLUMN     "color" TEXT,
ADD COLUMN     "csosn" TEXT,
ADD COLUMN     "cstCofins" TEXT,
ADD COLUMN     "cstIcms" TEXT,
ADD COLUMN     "cstPis" TEXT,
ADD COLUMN     "expirationDate" TIMESTAMP(3),
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "grossWeight" DECIMAL(10,3),
ADD COLUMN     "gtin" TEXT,
ADD COLUMN     "icmsRate" DECIMAL(5,2),
ADD COLUMN     "idealStock" INTEGER,
ADD COLUMN     "importNotes" TEXT,
ADD COLUMN     "importStatus" "ProductImportStatus" NOT NULL DEFAULT 'OK',
ADD COLUMN     "ipiRate" DECIMAL(5,2),
ADD COLUMN     "isBestSeller" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isKit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isNewArrival" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVariation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kitItems" JSONB DEFAULT '[]',
ADD COLUMN     "lastPurchaseDate" TIMESTAMP(3),
ADD COLUMN     "lastPurchasePrice" DECIMAL(10,2),
ADD COLUMN     "location" TEXT,
ADD COLUMN     "mainImage" TEXT,
ADD COLUMN     "material" TEXT,
ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "metaTitle" TEXT,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "ncm" TEXT,
ADD COLUMN     "origin" TEXT DEFAULT '0',
ADD COLUMN     "packQuantity" INTEGER DEFAULT 1,
ADD COLUMN     "parentProductId" TEXT,
ADD COLUMN     "pisRate" DECIMAL(5,2),
ADD COLUMN     "profitMargin" DECIMAL(5,2),
ADD COLUMN     "promoEndDate" TIMESTAMP(3),
ADD COLUMN     "promoStartDate" TIMESTAMP(3),
ADD COLUMN     "reorderPoint" INTEGER,
ADD COLUMN     "reservedStock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "salesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "season" TEXT,
ADD COLUMN     "serialNumber" TEXT,
ADD COLUMN     "shelf" TEXT,
ADD COLUMN     "shortDescription" TEXT,
ADD COLUMN     "size" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "style" TEXT,
ADD COLUMN     "supplierCode" TEXT,
ADD COLUMN     "supplierId" TEXT,
ADD COLUMN     "supplierName" TEXT,
ADD COLUMN     "variationAttributes" JSONB DEFAULT '[]',
ADD COLUMN     "videoUrl" TEXT,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "warrantyMonths" INTEGER,
ADD COLUMN     "wholesaleMinQty" INTEGER,
ADD COLUMN     "wholesalePrice" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "resetCode" TEXT,
ADD COLUMN     "resetCodeExpiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PJ',
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
    "cpfCnpj" TEXT,
    "ie" TEXT,
    "im" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "website" TEXT,
    "contactPerson" TEXT,
    "address" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT DEFAULT 'Brasil',
    "paymentTerms" TEXT,
    "leadTime" INTEGER,
    "minOrderValue" DECIMAL(10,2),
    "notes" TEXT,
    "rating" INTEGER DEFAULT 0,
    "tags" JSONB DEFAULT '[]',
    "bankInfo" JSONB DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "suppliers_tenantId_idx" ON "suppliers"("tenantId");

-- CreateIndex
CREATE INDEX "suppliers_name_idx" ON "suppliers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_tenantId_cpfCnpj_key" ON "suppliers"("tenantId", "cpfCnpj");

-- CreateIndex
CREATE INDEX "products_gtin_idx" ON "products"("gtin");

-- CreateIndex
CREATE INDEX "products_supplierId_idx" ON "products"("supplierId");

-- CreateIndex
CREATE INDEX "stock_movements_tenantId_idx" ON "stock_movements"("tenantId");

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_parentProductId_fkey" FOREIGN KEY ("parentProductId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
