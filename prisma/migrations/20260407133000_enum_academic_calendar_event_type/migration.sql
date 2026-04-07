-- CreateEnum
CREATE TYPE "academic_calendar_event_type" AS ENUM (
    'semester_start',
    'semester_end',
    'registration_start',
    'registration_end',
    'payment_start',
    'payment_end',
    'registration_deadline',
    'exam_week',
    'midterm',
    'final_exam',
    'holiday',
    'orientation',
    'other'
);

-- AlterTable
ALTER TABLE "academic_calendar"
ALTER COLUMN "event_type" TYPE "academic_calendar_event_type"
USING (
    CASE "event_type"
        WHEN 'semester_start' THEN 'semester_start'::"academic_calendar_event_type"
        WHEN 'semester_end' THEN 'semester_end'::"academic_calendar_event_type"
        WHEN 'registration_start' THEN 'registration_start'::"academic_calendar_event_type"
        WHEN 'registration_end' THEN 'registration_end'::"academic_calendar_event_type"
        WHEN 'payment_start' THEN 'payment_start'::"academic_calendar_event_type"
        WHEN 'payment_end' THEN 'payment_end'::"academic_calendar_event_type"
        WHEN 'registration_deadline' THEN 'registration_deadline'::"academic_calendar_event_type"
        WHEN 'exam_week' THEN 'exam_week'::"academic_calendar_event_type"
        WHEN 'midterm' THEN 'midterm'::"academic_calendar_event_type"
        WHEN 'final_exam' THEN 'final_exam'::"academic_calendar_event_type"
        WHEN 'holiday' THEN 'holiday'::"academic_calendar_event_type"
        WHEN 'orientation' THEN 'orientation'::"academic_calendar_event_type"
        ELSE 'other'::"academic_calendar_event_type"
    END
);
