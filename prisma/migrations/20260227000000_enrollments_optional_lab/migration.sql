-- Add auto-increment id column as new primary key
ALTER TABLE "enrollments" ADD COLUMN "id" SERIAL NOT NULL;

-- Drop old composite primary key
ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_pkey";

-- Set new primary key on id
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id");

-- Make tutorial_lab_id nullable (so a student can hold a lecture spot without a lab)
ALTER TABLE "enrollments" ALTER COLUMN "tutorial_lab_id" DROP NOT NULL;

-- Drop old foreign key on tutorial_lab_id if it exists (PostgreSQL will keep it, but we need to ensure it allows NULL)
-- FK constraints in PostgreSQL naturally allow NULL, so no change needed for the FK itself.

-- Add unique constraint: one enrollment per (student, lecture)
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_user_id_lecture_id_key" UNIQUE ("student_user_id", "lecture_id");
