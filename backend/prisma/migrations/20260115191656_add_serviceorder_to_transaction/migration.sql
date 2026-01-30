-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "serviceOrderId" TEXT;

-- CreateIndex
CREATE INDEX "transactions_serviceOrderId_idx" ON "transactions"("serviceOrderId");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
