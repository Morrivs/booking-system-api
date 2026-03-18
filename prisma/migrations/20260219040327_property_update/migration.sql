/*
  Warnings:

  - Added the required column `hostId` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pricePerNight` to the `Property` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "hostId" TEXT NOT NULL,
ADD COLUMN     "pricePerNight" DOUBLE PRECISION NOT NULL;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
