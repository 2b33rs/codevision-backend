/*
  Warnings:

  - The `shirtSize` column on the `Position` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `shirtSize` column on the `StandardProduct` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[newOrderId]` on the table `Complaint` will be added. If there are existing duplicate values, this will fail.
  - Made the column `createNewOrder` on table `Complaint` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `productCategory` on the `Position` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `productCategory` on the `StandardProduct` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `amountInProduction` on table `StandardProduct` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_customerId_fkey";

-- AlterTable
ALTER TABLE "Complaint" ALTER COLUMN "createNewOrder" SET NOT NULL;

-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "typ" TEXT[],
DROP COLUMN "shirtSize",
ADD COLUMN     "shirtSize" TEXT,
DROP COLUMN "productCategory",
ADD COLUMN     "productCategory" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "StandardProduct" ADD COLUMN     "typ" TEXT[],
DROP COLUMN "shirtSize",
ADD COLUMN     "shirtSize" TEXT,
DROP COLUMN "productCategory",
ADD COLUMN     "productCategory" TEXT NOT NULL,
ALTER COLUMN "amountInProduction" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Complaint_newOrderId_key" ON "Complaint"("newOrderId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_newOrderId_fkey" FOREIGN KEY ("newOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
