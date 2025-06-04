/*
  Warnings:

  - Added the required column `productionorder_number` to the `ProductionOrder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "PRODUCTION_ORDER_STATUS" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "ProductionOrder" ADD COLUMN     "productionorder_number" INTEGER NOT NULL;
