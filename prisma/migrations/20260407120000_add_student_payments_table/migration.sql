-- CreateTable
CREATE TABLE "student_payments" (
    "id" SERIAL NOT NULL,
    "student_user_id" UUID NOT NULL,
    "semester" "semester_type" NOT NULL,
    "year" INTEGER NOT NULL,
    "total_amount" DECIMAL NOT NULL,
    "invoice_count" INTEGER NOT NULL,
    "gateway" "payment_gateway" NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "paid_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_payments_student_user_id_semester_year_key" ON "student_payments"("student_user_id", "semester", "year");

-- CreateIndex
CREATE UNIQUE INDEX "student_payments_gateway_transaction_id_key" ON "student_payments"("gateway", "transaction_id");

-- CreateIndex
CREATE INDEX "student_payments_student_user_id_idx" ON "student_payments"("student_user_id");

-- CreateIndex
CREATE INDEX "student_payments_semester_year_idx" ON "student_payments"("semester", "year");

-- AddForeignKey
ALTER TABLE "student_payments" ADD CONSTRAINT "student_payments_student_user_id_fkey" FOREIGN KEY ("student_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
