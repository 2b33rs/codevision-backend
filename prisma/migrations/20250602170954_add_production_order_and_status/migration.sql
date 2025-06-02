/*
  Warnings:

  - A unique constraint covering the columns `[newOrderId]` on the table `Complaint` will be added. If there are existing duplicate values, this will fail.
  - Made the column `createNewOrder` on table `Complaint` required. This step will fail if there are existing NULL values in that column.
  - Made the column `amountInProduction` on table `StandardProduct` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "PRODUCTION_ORDER_STATUS" AS ENUM ('ORDER_RECEIVED', 'AUTHORISED', 'DYEING', 'PRINTING', 'COMPLETED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "POSITION_STATUS" ADD VALUE 'OPEN';
ALTER TYPE "POSITION_STATUS" ADD VALUE 'READY_FOR_PICKUP';
ALTER TYPE "POSITION_STATUS" ADD VALUE 'OUTSOURCING_REQUESTED';

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_customerId_fkey";

-- AlterTable
ALTER TABLE "Complaint" ALTER COLUMN "createNewOrder" SET NOT NULL;

-- AlterTable
ALTER TABLE "StandardProduct" ALTER COLUMN "amountInProduction" SET NOT NULL;

-- CreateTable
CREATE TABLE "ProductionOrder" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "positionId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "designUrl" TEXT NOT NULL,
    "orderType" TEXT NOT NULL,
    "dyeingNecessary" BOOLEAN NOT NULL,
    "productTemplate" JSONB NOT NULL,
    "Status" "PRODUCTION_ORDER_STATUS" NOT NULL,

    CONSTRAINT "ProductionOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Complaint_newOrderId_key" ON "Complaint"("newOrderId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_newOrderId_fkey" FOREIGN KEY ("newOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
