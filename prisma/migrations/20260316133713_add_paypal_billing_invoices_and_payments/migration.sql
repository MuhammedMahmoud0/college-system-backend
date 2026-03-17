-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "payment_gateway" AS ENUM ('paypal');

-- CreateTable
CREATE TABLE "invoices" (
    "id" SERIAL NOT NULL,
    "student_user_id" UUID NOT NULL,
    "enrollment_id" INTEGER,
    "course_code" TEXT NOT NULL,
    "semester" "semester_type" NOT NULL,
    "year" INTEGER NOT NULL,
    "credit_hours" INTEGER NOT NULL,
    "credit_price" DECIMAL NOT NULL,
    "total_amount" DECIMAL NOT NULL,
    "status" "payment_status" NOT NULL DEFAULT 'pending',
    "paypal_order_id" TEXT,
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
CREATE UNIQUE INDEX "invoices_enrollment_id_key" ON "invoices"("enrollment_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_paypal_order_id_key" ON "invoices"("paypal_order_id");

-- CreateIndex
CREATE INDEX "invoices_student_user_id_idx" ON "invoices"("student_user_id");

-- CreateIndex
CREATE INDEX "invoices_semester_year_idx" ON "invoices"("semester", "year");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "payments_invoice_id_idx" ON "payments"("invoice_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_gateway_transaction_id_key" ON "payments"("gateway", "transaction_id");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_student_user_id_fkey" FOREIGN KEY ("student_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
