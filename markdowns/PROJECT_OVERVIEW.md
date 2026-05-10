# College System Backend - AI Handoff Guide

## 1) What this project is

This repository is a **Node.js + Express + Prisma backend** for a university/college management platform.

It provides:

-   Authentication and role-based authorization
-   User management (students, staff, admins, leaders)
-   Course catalog + offerings + registration
-   Attendance sessions (QR + live monitoring)
-   Grades and GPA analytics
-   Exams and exam reminders
-   Tasks and submissions
-   Materials upload/download (Supabase Storage)
-   Community posts/groups/events
-   Notifications with preferences + realtime push
-   Admin and doctor dashboards

It exposes a REST API under `/api/v1/*`, Swagger docs at `/docs`, and Socket.IO for realtime events.

---

## 2) Tech stack and packages

### Runtime & framework

-   `express@5.2.1` - HTTP API framework
-   `node` ES Modules (`"type": "module"`)

### Database & ORM

-   `@prisma/client@7.1.0` - Prisma Client
-   `prisma@7.2.0` (devDependency) - schema/migrations/generate CLI
-   `@prisma/adapter-pg@7.1.0` - Prisma PostgreSQL adapter
-   `pg@8.16.3` - PostgreSQL driver

### Auth & security

-   `jsonwebtoken@9.0.3` - JWT signing/verification
-   `bcryptjs@3.0.3` - Password hashing

### File upload & storage

-   `multer@2.0.2` - Multipart file handling in memory
-   `@supabase/supabase-js@2.93.2` - Supabase storage/client integration

### Realtime & jobs

-   `socket.io@4.8.3` - WebSocket-based realtime features
-   `bullmq@5.71.0` - Background queue for large Excel imports
-   `ioredis@5.10.0` - Redis connection for BullMQ

### Docs, logs, utilities

-   `swagger-jsdoc@6.2.8` + `swagger-ui-express@5.0.1` - API docs aggregation + UI
-   `winston@3.9.0` - Logging
-   `dotenv@17.2.3` - Env variable loading
-   `exceljs@4.4.0` - Excel import/export handling
-   `uuid@13.0.0` - UUID generation utilities
-   `prisma-erd-generator@2.4.2` (devDependency) - ERD generation support

---

## 3) Project architecture

## 3.1 Layering pattern

The code follows a practical MVC-style shape:

1. `src/routes/*` defines route paths + middleware + controller mapping
2. `src/controllers/*` contains request/business logic
3. `src/config/connection.js` provides Prisma client access
4. `src/utils/*` contains cross-cutting services (socket, notifications, queue, etc.)

No separate service/repository folder exists for all domains, but utilities and selectors are reused where relevant.

## 3.2 App bootstrap flow (`src/server.js`)

Startup sequence:

1. Load env vars
2. Connect DB via Prisma
3. Create Express app + HTTP server
4. Initialize Socket.IO and attach to app
5. Start exam reminder scheduler
6. Initialize Excel import queue worker (if Redis is configured)
7. Register middleware (`express.json`, BigInt JSON serialization)
8. Mount all route modules
9. Mount Swagger on `/docs`
10. Start server and register graceful shutdown handlers

## 3.3 Auth model

-   JWT token created on login (`/api/v1/auth/login`)
-   Middleware expects `Authorization: Bearer <token>`
-   `authMiddleware` verifies token and populates `req.user`
-   `authorizationMiddleware(...roles)` enforces role-based access

Supported roles (from Prisma enum):

-   `student`
-   `leader`
-   `doctor`
-   `teaching_assistant`
-   `admin`
-   `super_admin`

---

## 4) Main directories and responsibilities

-   `src/server.js` - Application entrypoint
-   `src/config/connection.js` - Prisma client setup with `PrismaPg` adapter
-   `src/config/swagger.js` - Aggregates all domain swagger definitions into one spec
-   `src/routes/` - Route definitions per domain
-   `src/controllers/` - Business logic per domain
-   `src/middlewares/authMiddleware.js` - auth + role checks
-   `src/middlewares/uploadMiddleware.js` - multer config for avatars/files/excel
-   `src/utils/socketIO.js` - realtime socket auth/events/rooms
-   `src/utils/notificationService.js` - shared notification dispatch logic
-   `src/utils/examReminderJob.js` - daily exam reminder scheduler
-   `src/utils/userImportQueue.js` - BullMQ queue/worker for large Excel imports
-   `src/utils/userImportService.js` - actual excel parsing/import logic
-   `src/utils/supabase.js` - Supabase client initialization
-   `prisma/schema.prisma` - data model
-   `prisma/migrations/` - migration history
-   `prisma/seed.js` - seed script
-   `src/swagger/*.swagger.js` - endpoint docs per module

---

## 5) Environment variables (operational contract)

Minimum required:

-   `DATABASE_URL`
-   `JWT_SECRET`
-   `PORT` (optional, defaults to 3000)

Supabase storage (needed for material/avatar file workflows):

-   `SUPABASE_URL`
-   `SUPABASE_SERVICE_ROLE_KEY`

Redis/BullMQ (optional, enables async Excel import):

-   `REDIS_URL` **or** `REDIS_HOST` (+ optional `REDIS_PORT`, `REDIS_USERNAME`, `REDIS_PASSWORD`, `REDIS_DB`)
-   `EXCEL_IMPORT_ASYNC_THRESHOLD` (default `200` rows)
-   `USER_IMPORT_WORKER_CONCURRENCY` (default `3`)

Behavior:

-   If Redis is not configured/reachable, Excel import falls back to synchronous processing.

---

## 6) NPM scripts

-   `npm run dev` - run server with `node --watch`
-   `npm start` - run server normally
-   `npm run prisma:migrate` - run Prisma migrations (`prisma migrate dev`)
-   `npm run prisma:generate` - generate Prisma client
-   `npm run seed` - run seed script (`node prisma/seed.js`)
-   `npm run db:studio` - open Prisma Studio

---

## 7) Data model overview (Prisma)

Core entities:

-   Identity & org: `users`, `student_profiles`, `departments`, `financials`
-   Academic catalog: `courses`, `course_prerequisites`, `course_offerings`, `lectures`, `tutorials_labs`
-   Enrollment & assessment: `enrollments`, `grade_distributions`, `tasks`, `task_submissions`, `exams`
-   Attendance: `attendance` (+ runtime in-memory session map in controller/socket flow)
-   Content: `files`, `course_materials`
-   Social/community: `community_groups`, `group_members`, `community_posts`, `post_comments`, `post_likes`, `events`
-   Communication: `notifications`, `notification_preferences`, `announcements`
-   Calendar/system: `academic_calendar`

Important enums:

-   `user_role`, `semester_type`, `enrollment_status`, `notification_type`, `audience_type`

Notes:

-   Prisma model names in this project are plural (e.g., `users`, `courses`) and controller queries use those names.

---

## 8) Realtime behavior (Socket.IO)

Socket auth:

-   Client must pass JWT token in `socket.handshake.auth.token`

Notification rooms:

-   On connection, user joins `notifications:<userId>` room for personal push notifications

Attendance rooms/events:

-   Session room format: `session:<sessionId>`
-   Events handled include:
    -   `join-session`
    -   `scan-qr`
    -   `toggle-attendance`
    -   `leave-session`
-   Server emits updates like:
    -   `session-joined`
    -   `student-marked-present`
    -   `attendance-toggled`
    -   `qr-code-updated`

QR behavior:

-   QR codes auto-refresh periodically (`QR_REFRESH_INTERVAL`) and broadcast updates to session room participants.

---

## 9) Background jobs and async processing

### 9.1 Daily exam reminders

-   `src/utils/examReminderJob.js`
-   Scheduled to align with next midnight, then runs every 24h
-   Finds tomorrow’s exams and sends per-student notifications (`type: exam_deadline`)

### 9.2 Excel import queue

-   `src/utils/userImportQueue.js`
-   Queue name: `user_excel_imports`
-   Uses BullMQ worker + Redis for large imports
-   Tracks progress and exposes job status via API
-   Fallback to sync when queue unavailable

---

## 10) Complete mounted API map

Base URL prefix: `/api/v1`

Health/root:

-   `GET /` - status payload (`status`, `timestamp`, `uptime`)

Swagger:

-   `GET /docs` - interactive docs UI

### 10.1 Auth (`/api/v1/auth`)

-   `POST /login` - login, returns JWT
-   `GET /me` - current user profile from token

### 10.2 Users (`/api/v1`)

-   `GET /users` - list users (authenticated)
-   `POST /users` - create non-student user (admin/super_admin)
-   `PATCH /users/:id` - update user + optional avatar upload (admin/super_admin)
-   `DELETE /users/:id` - delete user (admin/super_admin)
-   `POST /users/students` - create student (admin/super_admin)
-   `GET /users/management/students` - paged students/leaders (admin/super_admin)
-   `GET /users/management/staff` - paged doctor/TA (admin/super_admin)
-   `GET /users/management/leaders` - leaders list (admin/super_admin)
-   `PATCH /users/students/:id/role` - promote/demote student↔leader (admin/super_admin)
-   `POST /users/upload-excel` - bulk non-student import (admin/super_admin)
-   `POST /users/upload-excel/students` - bulk student import (admin/super_admin)
-   `GET /users/upload-excel/jobs/:jobId` - async import status (admin/super_admin)

### 10.3 Student profile (`/api/v1/student`)

-   `GET /profile` - student profile (student)
-   `PUT /profile` - update profile + optional avatar upload (student)

### 10.4 Student settings (`/api/v1/student-settings`)

-   `PUT /password` - update password (student)

### 10.5 Leaderboard (`/api/v1/leaderboard`)

-   `GET /` - leaderboard for authenticated user

### 10.6 Schedule (`/api/v1/schedule`)

-   `GET /` - student/leader schedule

### 10.7 Courses (`/api/v1/courses`)

-   `GET /student` - student/leader enrolled courses
-   `GET /student/labs` - student/leader labs
-   `GET /all` - all courses (admin/super_admin)
-   `GET /:offeringId` - offering details (doctor/TA/admin/super_admin)
-   `GET /:courseId/grades` - student/leader grade breakdown
-   `POST /` - create course (admin/super_admin)
-   `PATCH /:code` - update course (admin/super_admin)
-   `DELETE /:code` - delete course (admin/super_admin)
-   `POST /lectures` - create lecture (admin/super_admin)
-   `PATCH /lectures/:lectureId` - update lecture (admin/super_admin)
-   `DELETE /lectures/:lectureId` - delete lecture (admin/super_admin)
-   `POST /tutorials-labs` - create tutorial/lab (admin/super_admin)
-   `PATCH /tutorials-labs/:tutorialLabId` - update tutorial/lab (admin/super_admin)
-   `DELETE /tutorials-labs/:tutorialLabId` - delete tutorial/lab (admin/super_admin)

### 10.8 Course offerings (`/api/v1/course-offerings`)

-   `GET /` - list offerings (admin/super_admin)
-   `POST /` - create offering (admin/super_admin)
-   `PUT /:offering_id` - update offering (admin/super_admin)
-   `DELETE /:offering_id` - delete offering (admin/super_admin)

### 10.9 Registration (`/api/v1/registration`)

-   `GET /available-offerings` - offerings for registration (authenticated)
-   `POST /register` - register courses (student/leader)
-   `POST /register-lab` - register replacement lab (student/leader)
-   `DELETE /unregister` - unregister session (student/leader)

### 10.10 Attendance (`/api/v1/attendance`)

-   `POST /sessions/start` - start attendance session (doctor/TA/admin)
-   `GET /sessions/active` - active sessions for instructor (doctor/TA/admin)
-   `GET /sessions` - all sessions grouped by date (doctor/TA/admin)
-   `GET /sessions/:sessionId/live-info` - live status/coords for session (authenticated)
-   `GET /sessions/my-active` - active session for logged-in student (student/leader)
-   `GET /sessions/:sessionId` - session details (authenticated)
-   `POST /scan` - scan QR and mark attendance (student/leader)
-   `POST /sessions/:sessionId/end` - end session (doctor/TA/admin)
-   `PUT /sessions/:sessionId/toggle` - manually toggle student attendance (doctor/TA/admin)
-   `PUT /records/update` - update attendance record post-session (doctor/TA/admin)
-   `GET /students` - students attendance summary for owned class (doctor/TA/admin)
-   `GET /grid` - attendance grid matrix (doctor/TA/admin)
-   `GET /stats/avg` - average attendance rate (doctor/TA/admin)
-   `GET /stats/lowest` - lowest attendance students (doctor/TA/admin)
-   `GET /stats/trend` - attendance trend (doctor/TA/admin)
-   `GET /admin/overall-rate` - admin analytics (admin/super_admin)
-   `GET /admin/lowest-courses` - admin analytics (admin/super_admin)
-   `GET /admin/trend` - admin analytics (admin/super_admin)
-   `GET /admin/dept-comparison` - admin analytics (admin/super_admin)
-   `GET /admin/distribution` - admin analytics (admin/super_admin)
-   `GET /admin/top-students` - admin analytics (admin/super_admin)
-   `GET /admin/students` - admin analytics table (admin/super_admin)
-   `GET /my-history` - student attendance history (student/leader)

### 10.11 Grades (`/api/v1/grades`)

-   `PUT /lecture/:lectureId/distribution` - set lecture grade distribution (doctor/admin/super_admin)
-   `GET /lecture/:lectureId/distribution` - get lecture grade distribution (doctor/admin/super_admin)
-   `PUT /lecture/:lectureId/student/:studentId` - update lecture grade (doctor/admin/super_admin)
-   `PUT /tutorial-lab/:tutorialLabId/student/:studentId` - update tutorial/lab grade (TA/admin/super_admin)
-   `GET /lecture/:lectureId` - lecture grades list (doctor/admin/super_admin)
-   `GET /tutorial-lab/:tutorialLabId` - tutorial/lab grades list (TA/admin/super_admin)
-   `GET /my/semester-gpa` - student/leader semester GPA
-   `GET /my/cgpa-trend` - student/leader CGPA trend
-   `GET /my/distribution` - student/leader grade distribution

### 10.12 Exams (`/api/v1/exams`)

-   `GET /all` - all exams for management (admin/super_admin)
-   `GET /active-courses` - active offerings list (admin/super_admin)
-   `GET /schedule` - student exam schedule (student)
-   `POST /set` - create exam (admin/super_admin)
-   `PUT /set/:exam_id` - update exam (admin/super_admin)
-   `DELETE /set/:exam_id` - delete exam (admin/super_admin)

### 10.13 Tasks (`/api/v1/tasks`)

-   `POST /` - create task (doctor/TA/admin/super_admin)
-   `GET /` - list tasks
-   `GET /my/available` - student/leader available tasks
-   `GET /:taskId` - task details
-   `PUT /:taskId` - update task (doctor/TA/admin/super_admin)
-   `DELETE /:taskId` - delete task (doctor/TA/admin/super_admin)
-   `POST /:taskId/submit` - submit task (student/leader)
-   `GET /:taskId/my-submission` - get own submission (student/leader)
-   `DELETE /:taskId/my-submission` - delete own submission before due date (student/leader)
-   `GET /:taskId/submissions` - list submissions (doctor/TA/admin/super_admin)
-   `PUT /:taskId/submissions/:submissionId/grade` - grade submission (doctor/TA/admin/super_admin)

### 10.14 Materials (`/api/v1/materials`)

-   `GET /` - list materials (authenticated)
-   `GET /:id/download` - signed URL download (authenticated)
-   `GET /:id/stream` - stream file (authenticated)
-   `POST /` - upload material with file (doctor/admin/super_admin)
-   `PUT /:id` - update material (doctor/admin/super_admin)
-   `DELETE /:id` - delete material (doctor/admin/super_admin)

### 10.15 Notifications (`/api/v1/notifications`)

-   `GET /` - list notifications
-   `GET /unread-count` - unread count
-   `PATCH /mark-all-read` - mark all read
-   `PATCH /:id/read` - mark single read
-   `DELETE /` - delete all notifications
-   `DELETE /:id` - delete one notification
-   `GET /preferences` - get preference flags
-   `PUT /preferences` - update preference flags
-   `POST /` - create notification (admin/super_admin)
-   `POST /bulk` - create bulk notifications (admin/super_admin)

### 10.16 Community (`/api/v1/community`)

-   Posts
    -   `POST /posts`
    -   `PATCH /posts/:id`
    -   `DELETE /posts/:id`
    -   `GET /feed`
    -   `GET /posts/user/:userId`
    -   `POST /posts/:id/like`
    -   `GET /posts/:id/likes`
    -   `POST /posts/:id/comment`
    -   `GET /posts/:id/comments`
-   Groups
    -   `POST /groups` (doctor/admin/super_admin/TA/leader)
    -   `GET /groups/suggested`
    -   `GET /groups/my`
    -   `POST /groups/:id/join`
    -   `PATCH /groups/:id` (admin/super_admin)
    -   `DELETE /groups/:id` (admin/super_admin)
-   Events
    -   `GET /events`
    -   `POST /events` (admin/super_admin)
    -   `PATCH /events/:id` (admin/super_admin)
    -   `DELETE /events/:id` (admin/super_admin)

### 10.17 Teacher (`/api/v1/teachers`)

-   `GET /` - list teachers (admin/super_admin)
-   `GET /schedule` - teacher schedule (doctor/teaching_assistant)

### 10.18 Departments (`/api/v1/departments`)

-   `GET /` - list departments (authenticated)
-   `GET /:id` - department detail (authenticated)
-   `POST /` - create department (admin/super_admin)
-   `PATCH /:id` - update department (admin/super_admin)
-   `DELETE /:id` - delete department (admin/super_admin)

### 10.19 System config (`/api/v1/config`)

-   `GET /announcements` - read announcements (authenticated)
-   `GET /calendar` - list calendar events (admin/super_admin)
-   `POST /calendar` - create calendar event (admin/super_admin)
-   `PATCH /calendar/:id` - update calendar event (admin/super_admin)
-   `DELETE /calendar/:id` - delete calendar event (admin/super_admin)
-   `POST /registration-open` - open registration period (admin/super_admin)
-   `POST /announcements` - create announcement (admin/super_admin)
-   `PATCH /announcements/:id` - update announcement (admin/super_admin)
-   `DELETE /announcements/:id` - delete announcement (admin/super_admin)

### 10.20 Admin dashboard (`/api/v1/admin`)

-   `GET /alerts`
-   `GET /activity`
-   `GET /stats/enrollment-trends`
-   `GET /stats/payment-aging`
-   `POST /reports/:reportType`

All above require `admin` or `super_admin`.

### 10.21 Doctor dashboard (`/api/v1/doctor`)

-   `GET /courses` - doctor courses with enrollment stats
-   `GET /courses/:courseCode/analytics` - analytics + low-grade alerts
-   `POST /tasks` - create task for course lectures
-   `GET /alerts` - doctor alerts

All above require `doctor` or `super_admin`.

---

## 11) Swagger documentation integration

-   Domain swagger files live in `src/swagger/*.swagger.js`
-   `src/config/swagger.js` merges:
    -   `base` OpenAPI metadata
    -   shared `components`
    -   per-module `paths` and extra schemas
-   Runtime docs served at `/docs`

If you add/edit endpoints, update both route/controller and matching swagger module.

---

## 12) Tests and validation status

Current `tests/` contains:

-   `postman_collection.json`
-   Excel test fixtures and generation script

There is no mature automated test suite wired to `npm test` yet (`npm test` is placeholder).

---

## 13) How an AI agent should work in this repo

When implementing changes:

1. Find existing domain route/controller first and extend it
2. Reuse middleware and utility helpers (notifications, queue, selectors)
3. Respect Prisma schema and existing migration strategy
4. Keep role checks explicit and consistent with current patterns
5. Update swagger module for changed/added endpoints
6. If DB schema changes, create Prisma migration and regenerate client
7. For feature notes and operational docs, update relevant `markdowns/*.md`

---

## 14) Quick runbook

Install:

```bash
npm install
```

DB migration:

```bash
npm run prisma:migrate
npm run prisma:generate
```

Run dev server:

```bash
npm run dev
```

Open docs:

```bash
http://localhost:3000/docs
```

---

## 15) Executive summary for another AI

If you are another AI reading this project:

-   Treat it as a role-driven academic ERP backend using Express + Prisma + PostgreSQL.
-   Main integration surfaces are REST (`/api/v1/*`), Swagger (`/docs`), and Socket.IO attendance/notifications.
-   Most logic sits in controllers with direct Prisma access.
-   Attendance, notifications, and imports have realtime/background components.
-   Preserve existing role semantics and route structure when extending features.

---

## 16) Database schema (Prisma) - detailed

Source of truth: `prisma/schema.prisma`

This section mirrors the current data design in a readable AI-friendly format.

### 16.1 Core relationship map

-   `users` is the central identity table linked to:

    -   `student_profiles` (1:1 optional)
    -   `notifications` (1:N)
    -   `notification_preferences` (1:1 optional)
    -   `lectures` (doctor as instructor)
    -   `tutorials_labs` (TA as assistant)
    -   `enrollments` (student enrollments)
    -   `attendance` (student records)
    -   `files` (uploaded-by)
    -   community entities (`community_posts`, `post_comments`, `post_likes`, `group_members`)
    -   `announcements` (author)
    -   `task_submissions`
    -   `academic_calendar` (created_by)

-   Academic structure:

    -   `departments` -> `courses` -> `course_offerings` -> (`lectures`, `tutorials_labs`, `exams`)
    -   `enrollments` connects students to `lectures` and optionally `tutorials_labs`

-   Assessment:

    -   `grade_distributions` is 1:1 with `lectures`
    -   `tasks` belong to lecture or tutorial/lab; `task_submissions` belong to both `tasks` and `users`

-   Content and storage:
    -   `files` stores metadata for uploaded files
    -   `course_materials` links pedagogical materials to lecture/tutorial and optional file record

### 16.2 Models and key fields

#### Identity & profile

-   `users`

    -   PK: `id (Uuid)`
    -   Unique: `email`
    -   Fields: `full_name`, `password_hash`, `role`, contact/profile fields, timestamps
    -   Indexes: `email`, `role`

-   `student_profiles`
    -   PK/FK: `user_id -> users.id`
    -   Unique: `student_id`
    -   Optional FKs: `department_id -> departments.department_id`, `faculty_advisor_id -> users.id`
    -   Fields: `year_level`, `cgpa`, `total_credits`

#### Departments & finance

-   `departments`

    -   PK: `department_id (Uuid, generated)`
    -   Unique: `name`
    -   Relations: `courses`, `student_profiles`, `financials`

-   `financials`
    -   PK: `id`
    -   Unique FK: `department_id -> departments.department_id`
    -   Fields: `credit_price (Decimal)`

#### Courses, offerings, schedule

-   `courses`

    -   PK: `code`
    -   FK: `department_id -> departments.department_id`
    -   Fields: `name`, `credits`

-   `course_prerequisites`

    -   Composite PK: `(course_code, prerequisite_code)`
    -   FKs: both columns reference `courses.code`

-   `course_offerings`

    -   PK: `offering_id`
    -   FK: `course_code -> courses.code`
    -   Fields: `semester (enum)`, `year`

-   `lectures`

    -   PK: `lecture_id`
    -   FKs: `offering_id -> course_offerings.offering_id`, `instructor_id -> users.id`
    -   Fields: capacity/enrollment counters, day/time/location, group

-   `tutorials_labs`
    -   PK: `tutorial_lab_id`
    -   FKs: `offering_id -> course_offerings.offering_id`, `ta_id -> users.id`
    -   Fields: `type`, capacity/enrollment counters, day/time/location, `group`

#### Enrollment, grades, exams

-   `enrollments`

    -   PK: `id`
    -   Unique: `(student_user_id, lecture_id)`
    -   FKs: `student_user_id -> users.id`, `lecture_id -> lectures.lecture_id`, optional `tutorial_lab_id -> tutorials_labs.tutorial_lab_id`
    -   Fields: `mid_score`, `work_score`, `final_score`, `grade`, `status (enum)`

-   `grade_distributions`

    -   PK: `id`
    -   Unique FK: `lecture_id -> lectures.lecture_id`
    -   Fields: `work_max`, `mid_max`, `final_max`

-   `exams`
    -   PK: `exam_id`
    -   FK: `offering_id -> course_offerings.offering_id`
    -   Fields: `exam_type`, `exam_date`, `day_of_week`, `start_time`, `end_time`, `location`

#### Attendance

-   `attendance`
    -   PK: `id`
    -   FKs: `student_user_id -> users.id`, optional `lecture_id -> lectures.lecture_id`, optional `tutorial_lab_id -> tutorials_labs.tutorial_lab_id`
    -   Fields: `session_date`, `status`

#### Tasks

-   `tasks`

    -   PK: `id`
    -   Optional FKs: `lecture_id -> lectures.lecture_id`, `tutorial_lab_id -> tutorials_labs.tutorial_lab_id`
    -   Fields: `title`, `description`, `due_date`, `created_at`

-   `task_submissions`
    -   PK: `id`
    -   FKs: `task_id -> tasks.id`, `student_id -> users.id`
    -   Fields: `submission_content`, `submitted_at`, `grade`

#### Notifications and system communication

-   `notifications`

    -   PK: `id`
    -   FK: `user_id -> users.id`
    -   Fields: `message`, `is_read`, `type (enum)`, `created_at`
    -   Indexes: `user_id`, `is_read`, `created_at`

-   `notification_preferences`

    -   PK/FK: `user_id -> users.id`
    -   Fields: opt-in booleans for grade/exam/community/announcement categories

-   `announcements`

    -   PK: `id`
    -   FK: `author_id -> users.id`
    -   Fields: `title`, `content`, `audience (enum)`, `publish_at`, `expire_at`

-   `academic_calendar`
    -   PK: `id`
    -   Optional FK: `created_by_user_id -> users.id`
    -   Fields: event name/type/date range, semester, academic year, timestamps
    -   Indexes: `event_date`, `event_type`, `semester`

#### Files and course materials

-   `files`

    -   PK: `file_id (Uuid)`
    -   Unique: `file_path`
    -   FK: `uploaded_by_user_id -> users.id`
    -   Fields: `file_name`, `media_type`, `size_bytes`, `created_at`

-   `course_materials`
    -   PK: `id`
    -   Optional FKs: `file_id -> files.file_id`, `lecture_id -> lectures.lecture_id`, `tutorial_lab_id -> tutorials_labs.tutorial_lab_id`
    -   Fields: `title`, `url`, `uploaded_at`

#### Community / social

-   `community_groups`

    -   PK: `id`
    -   Fields: `name`, `description`, `avatar_url`, `created_at`

-   `group_members`

    -   Composite PK: `(group_id, user_id)`
    -   FKs: `group_id -> community_groups.id`, `user_id -> users.id`
    -   Fields: `joined_at`
    -   Indexes: `group_id`, `user_id`

-   `community_posts`

    -   PK: `id`
    -   Optional FK: `group_id -> community_groups.id`
    -   FK: `author_id -> users.id`
    -   Fields: `content`, `image_url`, `is_pinned`, `created_at`
    -   Indexes: `author_id`, `group_id`, `created_at`

-   `post_comments`

    -   PK: `id`
    -   FKs: `post_id -> community_posts.id`, `author_id -> users.id`
    -   Fields: `content`, `created_at`
    -   Indexes: `post_id`, `author_id`, `created_at`

-   `post_likes`

    -   Composite PK: `(post_id, user_id)`
    -   FKs: `post_id -> community_posts.id`, `user_id -> users.id`
    -   Fields: `created_at`
    -   Indexes: `post_id`, `user_id`

-   `events`
    -   PK: `id`
    -   Fields: `title`, `event_date`, optional `time/location/img_url/link/description`
    -   Index: `event_date`

#### CMS-like tables

-   `news_articles`

    -   PK: `id`
    -   Fields: `title`, `content`, `publish_date`, `image_url`, `link`, `created_at`

-   `testimonials`
    -   PK: `id`
    -   Fields: `student_name`, `program`, `quote`, `image_url`, `is_featured`

### 16.3 Enums

-   `user_role` = `student | doctor | admin | teaching_assistant | super_admin | leader`
-   `semester_type` = `Spring | Fall | Summer | Winter`
-   `enrollment_status` = `enrolled | dropped | completed`
-   `notification_type` = `new_grade | exam_deadline | community_activity | campus_announcement | general`
-   `audience_type` = `All | Students | Faculty`

### 16.4 Important schema conventions in this repo

-   Table/model names are plural (`users`, `courses`, `notifications`, ...).
-   UUID is used heavily for user/entity identity in cross-domain references.
-   Several relationships are optional (`lecture_id` vs `tutorial_lab_id`) to support both lecture and lab flows.
-   Attendance realtime sessions are kept in memory during active operation; persisted attendance records are written to `attendance`.
