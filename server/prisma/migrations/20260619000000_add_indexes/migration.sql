-- CreateIndex
CREATE INDEX "clients_user_id_idx" ON "clients"("user_id");

-- CreateIndex
CREATE INDEX "credits_user_id_status_idx" ON "credits"("user_id", "status");

-- CreateIndex
CREATE INDEX "credits_user_id_due_date_idx" ON "credits"("user_id", "due_date");

-- CreateIndex
CREATE INDEX "credits_client_id_idx" ON "credits"("client_id");

-- CreateIndex
CREATE INDEX "payments_user_id_date_idx" ON "payments"("user_id", "date");

-- CreateIndex
CREATE INDEX "payments_credit_id_is_voided_idx" ON "payments"("credit_id", "is_voided");

-- CreateIndex
CREATE INDEX "payments_credit_id_idx" ON "payments"("credit_id");

-- CreateIndex
CREATE INDEX "users_last_activity_at_idx" ON "users"("last_activity_at");
