-- DropIndex
DROP INDEX "invoices_paypal_order_id_key";

-- CreateIndex
CREATE INDEX "invoices_paypal_order_id_idx" ON "invoices"("paypal_order_id");
