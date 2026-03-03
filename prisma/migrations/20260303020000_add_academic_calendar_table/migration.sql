-- CreateTable
CREATE TABLE "academic_calendar" (
    "id" SERIAL NOT NULL,
    "event_name" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_date" DATE NOT NULL,
    "end_date" DATE,
    "description" TEXT,
    "semester" TEXT,
    "academic_year" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "created_by_user_id" UUID,

    CONSTRAINT "academic_calendar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "academic_calendar_event_date_idx" ON "academic_calendar"("event_date");

-- CreateIndex
CREATE INDEX "academic_calendar_event_type_idx" ON "academic_calendar"("event_type");

-- CreateIndex
CREATE INDEX "academic_calendar_semester_idx" ON "academic_calendar"("semester");

-- AddForeignKey
ALTER TABLE "academic_calendar" ADD CONSTRAINT "academic_calendar_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
