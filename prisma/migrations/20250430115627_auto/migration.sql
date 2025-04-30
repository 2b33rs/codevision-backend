/*
  Warnings:

  - You are about to drop the column `status` on the `Order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `addr_hnr` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `addr_ort` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `addr_plz` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `addr_strasse` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cust_type` to the `Customer` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PosStatus" AS ENUM ('Offen', 'Fertigmaterial_angefragt', 'Produktion_benachrichtigt', 'in_Färberei', 'in_Druckerei', 'Produktion_fertiggestellt', 'Fertigmaterial_abholbereit', 'Bereit_zum_Versand', 'Versand_erfolgt', 'Abgeschlossen', 'Storniert');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('Webshop', 'Firmenkunde');

-- CreateEnum
CREATE TYPE "ShirtKind" AS ENUM ('Standard', 'V_Ausschnitt', 'Polo');

-- CreateEnum
CREATE TYPE "ShirtSize" AS ENUM ('S', 'M', 'L', 'XL');

-- CreateEnum
CREATE TYPE "Complaintkind" AS ENUM ('intern', 'extern');

-- CreateEnum
CREATE TYPE "PosLogSource" AS ENUM ('PROD', 'MAWI', 'VV', 'Webshop');

-- CreateEnum
CREATE TYPE "addr_Land" AS ENUM ('DE');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "addr_hnr" TEXT NOT NULL,
ADD COLUMN     "addr_land" "addr_Land" NOT NULL DEFAULT 'DE',
ADD COLUMN     "addr_ort" TEXT NOT NULL,
ADD COLUMN     "addr_plz" TEXT NOT NULL,
ADD COLUMN     "addr_strasse" TEXT NOT NULL,
ADD COLUMN     "addr_zusatz" TEXT,
ADD COLUMN     "cust_type" "CustomerType" NOT NULL,
ADD COLUMN     "telefon" TEXT;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "status",
ALTER COLUMN "orderNumber" SET DATA TYPE TEXT;

-- DropEnum
DROP TYPE "OrderStatus";

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT,
    "pos_number" INTEGER NOT NULL,
    "Status" "PosStatus" NOT NULL DEFAULT 'Offen',

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProdCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ProdCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" JSONB,
    "kindofshirt" "ShirtKind",
    "sizeofshirt" "ShirtSize",
    "Design" TEXT,
    "prodCategoryId" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" TEXT NOT NULL,
    "positionId" TEXT,
    "customerId" TEXT NOT NULL,
    "Reason" TEXT NOT NULL,
    "CompKind" "Complaintkind" NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PositionLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "positionId" TEXT NOT NULL,
    "from" "PosStatus",
    "to" "PosStatus" NOT NULL,
    "editedBy" "PosLogSource" NOT NULL,

    CONSTRAINT "PositionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Position_id_key" ON "Position"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ProdCategory_id_key" ON "ProdCategory"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Product_id_key" ON "Product"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Complaint_id_key" ON "Complaint"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PositionLog_id_key" ON "PositionLog"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_id_key" ON "Customer"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_prodCategoryId_fkey" FOREIGN KEY ("prodCategoryId") REFERENCES "ProdCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionLog" ADD CONSTRAINT "PositionLog_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
