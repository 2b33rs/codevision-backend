CREATE TYPE "POSITION_STATUS" AS ENUM ('OPEN', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'READY_FOR_SHIPMENT', 'OUTSOURCING_REQUESTED', 'READY_FOR_INSPECTION', 'INSPECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PRODUCTION_ORDER_STATUS" AS ENUM ('ORDER_RECEIVED', 'AUTHORISED', 'DYEING', 'PRINTING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ComplaintReason" AS ENUM ('WRONG_SIZE', 'WRONG_COLOR', 'PRINT_INCORRECT', 'PRINT_OFF_CENTER', 'DAMAGED_ITEM', 'STAINED', 'LATE_DELIVERY', 'WRONG_PRODUCT', 'MISSING_ITEM', 'BAD_QUALITY', 'NOT_AS_DESCRIBED', 'CANCELLATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('T_SHIRT');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('WEBSHOP', 'BUSINESS');

-- CreateEnum
CREATE TYPE "ShirtSize" AS ENUM ('S', 'M', 'L', 'XL');

-- CreateEnum
CREATE TYPE "ComplaintKind" AS ENUM ('INTERN', 'EXTERN');

-- CreateEnum
CREATE TYPE "PosLogSource" AS ENUM ('PROD', 'MAWI', 'VV', 'WEBSHOP');

-- CreateEnum
CREATE TYPE "addr_Land" AS ENUM ('DE');

-- CreateTable
CREATE TABLE "Customer"
(
    "id"           TEXT           NOT NULL,
    "createdAt"    TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3)   NOT NULL,
    "deletedAt"    TIMESTAMP(3),
    "email"        TEXT,
    "name"         TEXT,
    "phone"        TEXT,
    "addr_country" "addr_Land"             DEFAULT 'DE',
    "addr_city"    TEXT,
    "addr_zip"     TEXT,
    "addr_street"  TEXT,
    "addr_line1"   TEXT,
    "addr_line2"   TEXT,
    "customerType" "CustomerType" NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order"
(
    "id"          TEXT         NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    "deletedAt"   TIMESTAMP(3),
    "seq"         SERIAL       NOT NULL,
    "orderNumber" VARCHAR(8)   NOT NULL,
    "customerId"  TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position"
(
    "id"                TEXT              NOT NULL,
    "createdAt"         TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3)      NOT NULL,
    "deletedAt"         TIMESTAMP(3),
    "orderId"           TEXT              NOT NULL,
    "standardProductId" TEXT,
    "pos_number"        INTEGER           NOT NULL,
    "description"       TEXT,
    "Status"            "POSITION_STATUS" NOT NULL DEFAULT 'IN_PROGRESS',
    "amount"            INTEGER           NOT NULL,
    "name"              TEXT              NOT NULL,
    "color"             TEXT,
    "shirtSize"         "ShirtSize",
    "productCategory"   "ProductCategory" NOT NULL,
    "design"            TEXT              NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

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
    "materialId" INTEGER NOT NULL,
    "Status" "PRODUCTION_ORDER_STATUS" NOT NULL,
    "productionorder_number" INTEGER NOT NULL,

    CONSTRAINT "ProductionOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandardProduct"
(
    "id"                 TEXT              NOT NULL,
    "createdAt"          TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3)      NOT NULL,
    "deletedAt"          TIMESTAMP(3),
    "name"               TEXT              NOT NULL,
    "color"              TEXT,
    "shirtSize"          "ShirtSize",
    "productCategory"    "ProductCategory" NOT NULL,
    "MinAmount"          INTEGER           NOT NULL,
    "currentStock"       INTEGER           NOT NULL DEFAULT 0,
    "amountInProduction" INTEGER                    DEFAULT 0,

    CONSTRAINT "StandardProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint"
(
    "id"              TEXT              NOT NULL,
    "createdAt"       TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3)      NOT NULL,
    "deletedAt"       TIMESTAMP(3),
    "positionId"      TEXT              NOT NULL,
    "ComplaintReason" "ComplaintReason" NOT NULL,
    "ComplaintKind"   "ComplaintKind"   NOT NULL,
    "createNewOrder"  Boolean,
    "newOrderId"      TEXT,
    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_id_key" ON "Customer" ("id");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer" ("email");

-- CreateIndex
CREATE UNIQUE INDEX "Position_id_key" ON "Position" ("id");

-- AddForeignKey
ALTER TABLE "Order"
    ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position"
    ADD CONSTRAINT "Position_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint"
    ADD CONSTRAINT "Complaint_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
