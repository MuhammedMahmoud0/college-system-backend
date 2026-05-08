# Workload-Based Index Map

This document maps new indexes to real query patterns found in the codebase and summarizes the expected impact.

## Implemented Indexes (Safe/High-Confidence)

### Announcements
- announcements(audience, publish_at)
  - Endpoints: GET /api/v1/config/announcements in src/controllers/systemConfigController.js
  - Query shape: WHERE audience IN (...) AND expire_at > now ORDER BY publish_at DESC
  - Expected impact: Faster audience filtering and reduced sort cost for announcement feeds.

### Academic Calendar
- academic_calendar(event_type, semester, event_date)
- academic_calendar(event_type, academic_year, event_date)
  - Endpoints: getRegistrationPeriod/getPaymentPeriod in src/utils/periodHelpers.js
  - Query shape: WHERE event_type IN (...) AND (semester = ? OR academic_year = ?) ORDER BY event_date ASC
  - Expected impact: Faster period-window lookups and less sort work.

### Community Feed
- community_posts(group_id, created_at)
- community_posts(author_id, created_at)
- post_comments(post_id, created_at)
- group_members(user_id, joined_at)
  - Endpoints: community feed and group/user posts in src/controllers/communityController.js
  - Query shape: WHERE group_id IN (...) ORDER BY created_at DESC; WHERE author_id = ? ORDER BY created_at DESC; comments ordered by created_at
  - Expected impact: Lower latency for feeds and comment lists under pagination.

### Course Materials
- course_materials(lecture_id, uploaded_at)
- course_materials(tutorial_lab_id, uploaded_at)
  - Endpoints: GET /api/v1/materials in src/controllers/materialsController.js
  - Query shape: WHERE lecture_id/tutor_lab_id ORDER BY uploaded_at DESC
  - Expected impact: Faster materials list and reduced sort cost.

### Course Offerings / Courses
- course_offerings(course_code)
- course_offerings(semester, year)
- course_offerings(semester, course_code)
- courses(department_id)
  - Endpoints: offering lists and registration in src/controllers/courseOfferingController.js and src/controllers/registrationController.js
  - Query shape: WHERE semester/year; ORDER BY semester DESC, course_code ASC
  - Expected impact: Faster offering lookup and better ordering performance.

### Enrollments
- enrollments(lecture_id, status)
- enrollments(tutorial_lab_id, status)
- enrollments(student_user_id, status)
  - Endpoints: attendance, registration, grading in src/controllers/attendanceController.js, src/controllers/registrationController.js, src/controllers/gradeController.js
  - Query shape: WHERE lecture_id/tutor_lab_id/student_user_id AND status = ?
  - Expected impact: Faster roster and eligibility checks.

### Exams
- exams(offering_id)
- exams(exam_date, start_time)
  - Endpoints: exam scheduling and reminders in src/controllers/examController.js and src/utils/examReminderJob.js
  - Query shape: WHERE exam_date range ORDER BY exam_date ASC, start_time ASC
  - Expected impact: Faster exam schedule queries and reminder job scans.

### Lectures / Tutorials
- lectures(offering_id)
- lectures(instructor_id)
- tutorials_labs(offering_id)
- tutorials_labs(ta_id)
  - Endpoints: dashboard lists and joins in src/controllers/doctorDashboardController.js and src/controllers/teachingAssistantDashboardController.js
  - Query shape: WHERE offering_id or instructor_id/ta_id
  - Expected impact: Faster instructor/TA course lookups.

### Notifications
- notifications(user_id, created_at)
- notifications(user_id, is_read)
  - Endpoints: notification list/unread counts in src/controllers/notificationController.js
  - Query shape: WHERE user_id ORDER BY created_at DESC; WHERE user_id AND is_read = false
  - Expected impact: Faster pagination and unread count queries.

### Tasks / Submissions
- tasks(lecture_id, due_date, created_at)
- tasks(tutorial_lab_id, due_date, created_at)
- task_submissions(task_id, submitted_at)
- task_submissions(task_id, student_id)
  - Endpoints: task lists and submission grading in src/controllers/taskController.js
  - Query shape: WHERE lecture_id/tutor_lab_id AND due_date window ORDER BY due_date ASC, created_at DESC; submissions ordered by submitted_at
  - Expected impact: Faster task lists and submission lookups.

## Deferred / Not Added Yet
- attendance indexes
  - Reason: Attendance is write-heavy; indexes deferred to prioritize write latency.
- payments/invoices composites for admin tables
  - Reason: Existing indexes cover many filters; add only after EXPLAIN shows hot-path sorts or seq scans.
- GIN trigram index for departments.name search
  - Reason: Optional; only if name search becomes a hotspot.

## Data Modeling Notes
- events.event_date remains a String for now; migration to DATE is deferred to avoid application-layer changes in this phase.
- semester format is mixed ("Fall" vs "Fall 2026"); standardize before further indexing on semester text.
