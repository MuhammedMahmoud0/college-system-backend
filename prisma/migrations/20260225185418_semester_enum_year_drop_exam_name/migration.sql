/*
  Warnings:

  - You are about to drop the column `exam_name` on the `exams` table. All the data in the column will be lost.
  - Added the required column `year` to the `course_offerings` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `semester` on the `course_offerings` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "semester_type" AS ENUM ('Spring', 'Fall', 'Summer', 'Winter');

-- AlterTable
ALTER TABLE "course_offerings" ADD COLUMN     "year" INTEGER NOT NULL,
DROP COLUMN "semester",
ADD COLUMN     "semester" "semester_type" NOT NULL;

-- AlterTable
ALTER TABLE "exams" DROP COLUMN "exam_name";
