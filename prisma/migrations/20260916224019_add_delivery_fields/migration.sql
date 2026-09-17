/*
  Warnings:

  - Added the required column `downloadToken` to the `DeliveredOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileName` to the `DeliveredOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileUrl` to the `DeliveredOrder` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DeliveredOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "downloadToken" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_DeliveredOrder" ("id", "orderId", "productId", "sentAt", "shop") SELECT "id", "orderId", "productId", "sentAt", "shop" FROM "DeliveredOrder";
DROP TABLE "DeliveredOrder";
ALTER TABLE "new_DeliveredOrder" RENAME TO "DeliveredOrder";
CREATE UNIQUE INDEX "DeliveredOrder_downloadToken_key" ON "DeliveredOrder"("downloadToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
