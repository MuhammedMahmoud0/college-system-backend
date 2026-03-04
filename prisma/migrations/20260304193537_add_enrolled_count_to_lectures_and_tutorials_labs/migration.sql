-- AlterTable
ALTER TABLE "lectures" ADD COLUMN     "enrolled_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "tutorials_labs" ADD COLUMN     "enrolled_count" INTEGER NOT NULL DEFAULT 0;
