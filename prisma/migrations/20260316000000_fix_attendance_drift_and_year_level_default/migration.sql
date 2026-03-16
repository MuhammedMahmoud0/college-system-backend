-- Resolve drift: these columns were dropped directly in the DB without a migration.
-- Using IF EXISTS so this is a no-op if they are already absent.
ALTER TABLE "attendance" DROP COLUMN IF EXISTS "is_live";
ALTER TABLE "attendance" DROP COLUMN IF EXISTS "latitude";
ALTER TABLE "attendance" DROP COLUMN IF EXISTS "longitude";

-- Add default value for year_level in student_profiles
ALTER TABLE "student_profiles" ALTER COLUMN "year_level" SET DEFAULT 1;