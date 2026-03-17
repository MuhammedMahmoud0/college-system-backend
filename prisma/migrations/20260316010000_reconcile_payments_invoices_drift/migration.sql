-- Reconcile drift caused by existing payment tables/enums in the target database.
-- This migration makes migration history reflect existing schema without requiring a reset.

-- CreateEnum
CREATE TYPE "payment_gateway" AS ENUM ('stripe');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- CreateTable
CREATE TABLE "invoices" (
    "id" SERIAL NOT NULL,
    "student_user_id" UUID NOT NULL,
    "semester" "semester_type" NOT NULL,
    "year" INTEGER NOT NULL,
    "total_amount" DECIMAL NOT NULL,
    "status" "payment_status" NOT NULL DEFAULT 'pending',
    "stripe_session_id" TEXT,
    "payment_date" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "invoice_id" INTEGER NOT NULL,
    "gateway" "payment_gateway" NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "status" "payment_status" NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_stripe_session_id_key" ON "invoices"("stripe_session_id");

-- CreateIndex
CREATE INDEX "invoices_semester_year_idx" ON "invoices"("semester", "year");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_student_user_id_idx" ON "invoices"("student_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_gateway_transaction_id_key" ON "payments"("gateway", "transaction_id");

-- CreateIndex
CREATE INDEX "payments_invoice_id_idx" ON "payments"("invoice_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_student_user_id_fkey" FOREIGN KEY ("student_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
