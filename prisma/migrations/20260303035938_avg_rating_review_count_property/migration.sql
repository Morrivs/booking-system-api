/*
  Warnings:

  - You are about to drop the column `avgRating` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `reviewCount` on the `Review` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "avgRating",
DROP COLUMN "reviewCount";
