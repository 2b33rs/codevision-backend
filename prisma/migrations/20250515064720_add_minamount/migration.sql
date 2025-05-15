/*
  Warnings:

  - You are about to drop the column `MinAmount` on the `StandardProduct` table. All the data in the column will be lost.
  - Added the required column `minAmount` to the `StandardProduct` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StandardProduct" DROP COLUMN "MinAmount",
ADD COLUMN     "minAmount" INTEGER NOT NULL;
