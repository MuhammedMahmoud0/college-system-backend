-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_enrollment_id_fkey";

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
