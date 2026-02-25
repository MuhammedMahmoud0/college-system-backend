/*
  Warnings:

  - You are about to drop the column `exam_name` on the `exams` table. All the data in the column will be lost.
  - Added the required column `year` to the `course_offerings` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `semester` on the `course_offerings` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "semester_type" AS ENUM ('Spring', 'Fall', 'Summer', 'Winter');

-- AlterTable: add year with a temporary default to handle existing rows
ALTER TABLE "course_offerings" ADD COLUMN "year" INTEGER NOT NULL DEFAULT 2025;
ALTER TABLE "course_offerings" ALTER COLUMN "year" DROP DEFAULT;

-- AlterTable: replace text semester with enum semester
ALTER TABLE "course_offerings" DROP COLUMN "semester";
ALTER TABLE "course_offerings" ADD COLUMN "semester" "semester_type" NOT NULL DEFAULT 'Fall';
ALTER TABLE "course_offerings" ALTER COLUMN "semester" DROP DEFAULT;

-- AlterTable
ALTER TABLE "exams" DROP COLUMN "exam_name";
