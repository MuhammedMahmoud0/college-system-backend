-- Announcements
CREATE INDEX "idx_announcements_audience_publish_at"
    ON "announcements" ("audience", "publish_at");

-- Academic calendar
CREATE INDEX "idx_academic_calendar_event_type_semester_event_date"
    ON "academic_calendar" ("event_type", "semester", "event_date");
CREATE INDEX "idx_academic_calendar_event_type_academic_year_event_date"
    ON "academic_calendar" ("event_type", "academic_year", "event_date");

-- Group memberships
CREATE INDEX "idx_group_members_user_id_joined_at"
    ON "group_members" ("user_id", "joined_at");

-- Community posts/comments
CREATE INDEX "idx_community_posts_group_id_created_at"
    ON "community_posts" ("group_id", "created_at");
CREATE INDEX "idx_community_posts_author_id_created_at"
    ON "community_posts" ("author_id", "created_at");
CREATE INDEX "idx_post_comments_post_id_created_at"
    ON "post_comments" ("post_id", "created_at");

-- Course materials
CREATE INDEX "idx_course_materials_lecture_id_uploaded_at"
    ON "course_materials" ("lecture_id", "uploaded_at");
CREATE INDEX "idx_course_materials_tutorial_lab_id_uploaded_at"
    ON "course_materials" ("tutorial_lab_id", "uploaded_at");

-- Course offerings/courses
CREATE INDEX "idx_course_offerings_course_code"
    ON "course_offerings" ("course_code");
CREATE INDEX "idx_course_offerings_semester_year"
    ON "course_offerings" ("semester", "year");
CREATE INDEX "idx_course_offerings_semester_course_code"
    ON "course_offerings" ("semester", "course_code");
CREATE INDEX "idx_courses_department_id"
    ON "courses" ("department_id");

-- Enrollments
CREATE INDEX "idx_enrollments_lecture_id_status"
    ON "enrollments" ("lecture_id", "status");
CREATE INDEX "idx_enrollments_tutorial_lab_id_status"
    ON "enrollments" ("tutorial_lab_id", "status");
CREATE INDEX "idx_enrollments_student_user_id_status"
    ON "enrollments" ("student_user_id", "status");

-- Exams
CREATE INDEX "idx_exams_offering_id"
    ON "exams" ("offering_id");
CREATE INDEX "idx_exams_exam_date_start_time"
    ON "exams" ("exam_date", "start_time");

-- Lectures/tutorials
CREATE INDEX "idx_lectures_offering_id"
    ON "lectures" ("offering_id");
CREATE INDEX "idx_lectures_instructor_id"
    ON "lectures" ("instructor_id");
CREATE INDEX "idx_tutorials_labs_offering_id"
    ON "tutorials_labs" ("offering_id");
CREATE INDEX "idx_tutorials_labs_ta_id"
    ON "tutorials_labs" ("ta_id");

-- Notifications
CREATE INDEX "idx_notifications_user_id_created_at"
    ON "notifications" ("user_id", "created_at");
CREATE INDEX "idx_notifications_user_id_is_read"
    ON "notifications" ("user_id", "is_read");

-- Tasks/submissions
CREATE INDEX "idx_tasks_lecture_id_due_date_created_at"
    ON "tasks" ("lecture_id", "due_date", "created_at");
CREATE INDEX "idx_tasks_tutorial_lab_id_due_date_created_at"
    ON "tasks" ("tutorial_lab_id", "due_date", "created_at");
CREATE INDEX "idx_task_submissions_task_id_submitted_at"
    ON "task_submissions" ("task_id", "submitted_at");
CREATE INDEX "idx_task_submissions_task_id_student_id"
    ON "task_submissions" ("task_id", "student_id");
