/*
  Warnings:

  - You are about to drop the column `ProdCat` on the `StandardProduct` table. All the data in the column will be lost.
  - Added the required column `MinAmount` to the `StandardProduct` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productCategory` to the `StandardProduct` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "COMPLAINT_REASONS" AS ENUM ('WRONG_SIZE', 'WRONG_COLOR', 'PRINT_INCORRECT', 'PRINT_OFF_CENTER', 'DAMAGED_ITEM', 'STAINED', 'LATE_DELIVERY', 'WRONG_PRODUCT', 'MISSING_ITEM', 'BAD_QUALITY', 'NOT_AS_DESCRIBED', 'OTHER');

-- AlterTable
ALTER TABLE "StandardProduct" DROP COLUMN "ProdCat",
ADD COLUMN     "MinAmount" INTEGER NOT NULL,
ADD COLUMN     "productCategory" "ProductCategory" NOT NULL,
ALTER COLUMN "color" SET DATA TYPE TEXT;
