/*
  Warnings:

  - A unique constraint covering the columns `[googleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `department_id` to the `Semesters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Semesters" ADD COLUMN     "department_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "picture" TEXT,
ALTER COLUMN "password" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- AddForeignKey
ALTER TABLE "Semesters" ADD CONSTRAINT "Semesters_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
