# College System Backend — Complete Architecture Specification
### Version: Second Pass (Implementation-Level Detail)
### Purpose: Machine-readable specification for generating UML, ERD, Sequence, Component, Deployment, DFD, and Use Case diagrams

---

## 1. Project Overview

### Purpose
A full-featured university/college management backend API providing every operational service required to run an academic institution digitally.

### Main Business Domain
Higher Education Management System (ERP-class academic backend)

### Core Features
1. Multi-role user management (CRUD, bulk Excel import, avatar upload)
2. Academic course catalog management (courses, prerequisites, offerings)
3. Section scheduling (lectures, tutorial labs)
4. Student course registration with business-rule enforcement (credit caps, prerequisites, registration windows)
5. Live QR-code attendance tracking (WebSocket-driven, rotating tokens)
6. Grading system (grade distributions, score entry, GPA/CGPA computation)
7. Assignment/task management with file submissions
8. Course materials management (Supabase file storage with signed URLs)
9. Financial system (invoice generation on enrollment, PayPal & Paymob payment processing, manual payment recording)
10. Push notification system (FCM for mobile + Socket.IO for in-browser)
11. Community forum (posts, comments, likes, groups, campus events)
12. Academic calendar & announcements management
13. Leaderboard (CGPA + activity-based ranking)
14. Admin, Doctor, and Teaching Assistant role-specific dashboards
15. Digital student ID card (QR/barcode data endpoint)
16. FAQ system
17. Background async Excel processing (BullMQ + Redis)
18. API documentation (Swagger/OpenAPI at `/docs`)
19. Structured logging (Winston, file + console)
20. Redis cache layer (cache-aside, pattern-based invalidation)

### Major User Roles
| Role | Key Capabilities |
|---|---|
| `student` | Self-register for courses, submit tasks, view grades, pay invoices, view schedule, scan QR attendance |
| `leader` | Same as student (extended role for student body leaders) |
| `doctor` | Manage course sections, grades, attendance sessions, materials, tasks, dashboard analytics |
| `teaching_assistant` | Manage tutorial labs, attendance, task grading |
| `admin` | User management, course setup, exam scheduling, department management, financial config, manual registrations |
| `super_admin` | All admin capabilities + system config (academic calendar, announcements, registration periods), reset any password |

---

## 2. High-Level Architecture

### Architectural Style
**Layered Modular Monolith with Event-Driven capabilities**

- All modules run in a single Node.js process
- Layers: Routes → Middlewares → Controllers → Services/Utils → Prisma ORM → PostgreSQL
- Event-driven channel: Socket.IO server running alongside HTTP on the same process/port
- Async job processing: BullMQ workers (runs in the same process but managed by a Worker thread)

### Major Modules and Responsibilities

| Module | Responsibility |
|---|---|
| Auth | JWT issuance, refresh token lifecycle, password management, account lockout |
| Users | User CRUD, role management, bulk Excel import, avatar upload to Supabase |
| Student Profile | Profile data, CGPA, year level, digital ID |
| Registration | Course enrollment with credit-cap, prerequisite, and period checks |
| Courses & Offerings | Course catalog, semester offerings, prerequisites graph |
| Lectures & Tutorials | Section scheduling, capacity tracking |
| Attendance | Live QR session management (in-memory Map), session persistence, attendance history |
| Grades | Score entry, grade distribution, CGPA recalculation |
| Tasks | Assignment creation, student submissions, grading |
| Materials | File upload/download via Supabase Storage |
| Payments | Invoice creation on enrollment, PayPal/Paymob checkout flows, webhook handling |
| Financials | Department credit pricing configuration |
| Notifications | In-app (DB + Socket.IO) + FCM push notifications |
| Community | Forum posts, comments, likes, groups, campus events |
| Leaderboard | CGPA/activity-based student ranking |
| Admin Dashboard | Aggregated analytics for administrative users |
| Doctor Dashboard | Course-specific analytics for instructors |
| TA Dashboard | Tutorial/lab analytics for teaching assistants |
| System Config | Academic calendar, announcements, registration period controls |
| Exams | Exam scheduling and student exam schedules |
| Schedule | Student/teacher weekly timetable |
| Teachers | Staff directory |
| Departments | Department CRUD |
| FAQ | Public FAQ data |
| Cache | Redis cache-aside layer with tag-based invalidation |
| Background Jobs | BullMQ queue for async Excel import |

### Dependency Relationships
```
Client
  └── Express HTTP Server (server.js)
        ├── Middleware Stack (Helmet, CORS, Cookie-Parser, Rate Limiter, JSON Parser)
        ├── Routes (24 route modules)
        │     └── Controllers (24 controller files)
        │           ├── Prisma ORM → PostgreSQL
        │           ├── CacheService → Redis (App Cache)
        │           ├── CacheInvalidationService → CacheService
        │           ├── NotificationService → Prisma + Socket.IO + FCM
        │           ├── FCMService → Firebase Admin SDK
        │           ├── PeriodHelpers → Prisma + CacheService
        │           ├── AcademicRules (pure functions)
        │           ├── Supabase SDK → Supabase Storage
        │           ├── PayPal Config → PayPal REST API
        │           └── Paymob Config → Paymob REST API
        └── Socket.IO Server (socketIO.js)
              └── AuthMiddleware (JWT on handshake)
                    └── AttendanceController (in-memory activeSessions Map)
                    └── NotificationService

BullMQ Worker (userImportQueue.js)
  ├── Redis (BullMQ connection)
  └── UserImportService → Prisma + ExcelJS + Bcrypt

ExamReminderJob (setInterval/setTimeout)
  └── Prisma + NotificationService
```

---

## 3. Folder Structure Analysis

### `src/server.js`
- **Purpose**: Application entry point and composition root
- **Responsibilities**: Loads dotenv, creates Express app + HTTP server, initializes Socket.IO, starts background jobs, mounts all middleware and route modules, registers global error handlers for `SIGTERM`, `uncaughtException`, `unhandledRejection`
- **Key constants**: Port from `process.env.PORT || 3000`

### `src/config/`
| File | Purpose |
|---|---|
| `connection.js` | Creates `PrismaClient` with `PrismaPg` adapter (native PostgreSQL driver). Exports `prisma`, `connectDB`, `disconnectDB`. |
| `redis.js` | Manages a single `ioredis` instance for application caching. Exports `getRedisClient`, `closeRedisClient`, `isRedisHealthy`. Uses `CACHE_REDIS_URL` or `CACHE_REDIS_HOST/PORT`. |
| `swagger.js` | Assembles the OpenAPI spec object from all swagger modules. Exports `swaggerSpec` and `swaggerUiHandler`. |
| `paymob.js` | Wraps Paymob REST API calls: `getPaymobAuthToken`, `registerPaymobOrder`, `createPaymobPaymentKey`, `getPaymobTransaction`, `inquirePaymobOrderTransaction`, `buildPaymobIframeUrl`. Uses `node-fetch` internally. |
| `paypal.js` | Wraps PayPal REST API: `getPayPalAccessToken` (client credentials), `paypalRequest` helper. Supports sandbox and live via `PAYPAL_ENV`. |

### `src/controllers/`
- 24 controller files, each exporting named async handler functions
- Controllers are thin orchestrators: validate input → call Prisma/Service → format response
- No business rules in controllers beyond input validation; business rules live in `utils/academicRules.js` and `utils/periodHelpers.js`

### `src/routes/`
- 24 route files, each creating an `express.Router()` and mounting middleware chains
- Routes define the middleware execution order explicitly (auth → authorization → validate → cache → controller)

### `src/middlewares/`
| File | Purpose |
|---|---|
| `authMiddleware.js` | JWT verification, `req.user` injection, RBAC factory |
| `rateLimitMiddleware.js` | `globalLimiter` (300/15min) and `loginLimiter` (10/15min) |
| `validateMiddleware.js` | Zod schema validation factory |
| `cacheMiddleware.js` | GET response caching via Redis (monkey-patches `res.json`) |
| `uploadMiddleware.js` | Multer instances: `upload` (50MB memory, any file), `uploadExcel` (5MB, xlsx only) |
| `paymentMiddleware.js` | `blockIfUnpaidInvoices` — returns 402 if student has pending invoices |

### `src/services/`
| File | Purpose |
|---|---|
| `cacheService.js` | Core cache operations: `getCache`, `setCache`, `delCache`, `invalidateByPattern` (SCAN-based), `cacheExists`, `tryAcquireLock`, `releaseLock`, `getCacheStats` |
| `cacheInvalidationService.js` | `CacheInvalidation` object with named methods per mutation event type |

### `src/utils/`
| File | Purpose |
|---|---|
| `socketIO.js` | Socket.IO server initialization, JWT auth middleware on handshake, all event handlers |
| `notificationService.js` | `sendNotification`, `sendBulkNotification`, `sendGlobalAnnouncement` |
| `fcmService.js` | Firebase Admin SDK init, `sendToTokens` (multicast, 500-chunk), `broadcastGlobal` |
| `userImportQueue.js` | BullMQ `Queue` + `Worker` setup on `user_excel_imports` queue |
| `userImportService.js` | `processExcelUsersBuffer`, `processExcelStudentsBuffer`, `countDataRowsFromExcelBuffer` |
| `examReminderJob.js` | `startExamReminderJob` + `sendExamReminders` (daily, aligned to midnight) |
| `periodHelpers.js` | `getRegistrationPeriod`, `getPaymentPeriod`, `getCurrentSemester`, `isRegistrationOpen`, `isPaymentOpen` |
| `academicRules.js` | Pure functions: `computeYearLevel`, `getMaxSemesterHours`, `isEligibleForGraduation`. Constants: `LEVEL_THRESHOLDS`, `GRADUATION_CREDITS=140`, `DEFAULT_MAX_SEMESTER_HOURS=18`, `HIGH_GPA_MAX_SEMESTER_HOURS=21`, `HIGH_GPA_THRESHOLD=3.3` |
| `authSchemas.js` | Zod schemas: `loginSchema`, `adminResetPasswordSchema`, `changePasswordSchema` |
| `logger.js` | Winston logger (EGY timezone timestamps, file + console transports) |
| `supabase.js` | Supabase client (service role key, no session persistence) |

### `src/prisma/selectors/`
| File | Purpose |
|---|---|
| `user.selectors.js` | `userPublicSelect` — Prisma select object omitting `password_hash` |
| `studentProfile.selectors.js` | `studentProfileSelect` — nested select for student profile data |

### `src/scripts/`
| File | Purpose |
|---|---|
| `backfillGeneralGroup.js` | One-time migration: ensures all existing users are members of the General community group |
| `createSuperAdmin.js` | CLI script to provision the first super_admin account |

### `src/swagger/`
- One `.swagger.js` file per domain module, each exporting `{ paths, schemas }` objects
- Assembled into a single spec in `config/swagger.js`

---

## 4. API Analysis

### Base URL: `/api/v1`

---
#### MODULE: Authentication (`/api/v1/auth`)

| Method | Route | Auth | Roles | Purpose |
|---|---|---|---|---|
| POST | `/auth/login` | No | — | Authenticate user, return JWT access token + refresh token cookie |
| POST | `/auth/refresh` | No (Cookie) | — | Issue new access token from refresh token cookie |
| POST | `/auth/logout` | Bearer | Any | Revoke refresh token, clear cookie |
| GET | `/auth/me` | Bearer | Any | Get current authenticated user's profile |
| POST | `/auth/admin/reset-password` | Bearer | admin, super_admin | Admin resets another user's password, sets `must_change_password=true` |
| POST | `/auth/change-password` | Bearer | Any | User changes their own password |

**Login Request Body:** `{ email: string, password: string }`
**Login Response:** `{ accessToken: string, requiresPasswordChange: boolean }`
**Refresh Token:** Reads `refreshToken` from HttpOnly cookie; returns `{ accessToken }`
**Logout:** Clears cookie; revokes DB token

---
#### MODULE: Users (`/api/v1`)

| Method | Route | Auth | Roles | Purpose |
|---|---|---|---|---|
| GET | `/users` | Bearer | admin, super_admin | List all users (paginated) |
| GET | `/users/students` | Bearer | admin, super_admin | List students (paginated, filterable) |
| GET | `/users/staff` | Bearer | admin, super_admin | List staff members (paginated) |
| GET | `/users/:id` | Bearer | admin, super_admin | Get single user by ID |
| POST | `/users` | Bearer | admin, super_admin | Create a single non-student user |
| POST | `/users/students` | Bearer | admin, super_admin | Create a single student account |
| PUT | `/users/:id` | Bearer | admin, super_admin | Update any user (including avatar upload) |
| PATCH | `/users/me` | Bearer | Any | Update own profile (phone, address, avatar) |
| DELETE | `/users/:id` | Bearer | admin, super_admin | Delete a user |
| POST | `/users/upload-excel` | Bearer | admin, super_admin | Bulk import non-student users from Excel file |
| POST | `/users/upload-excel/students` | Bearer | admin, super_admin | Bulk import students from Excel file |
| GET | `/users/upload-excel/jobs/:jobId` | Bearer | admin, super_admin | Poll status of async Excel import job |

---
#### MODULE: Student Profile (`/api/v1/student`)

| Method | Route | Auth | Roles | Purpose |
|---|---|---|---|---|
| GET | `/student/profile` | Bearer | student, leader | Get own full student profile |
| PUT | `/student/profile` | Bearer | student, leader | Update own profile (address, phone, avatar) |
| GET | `/student/digital-id/front` | Bearer | student, leader | Get digital student ID card front-face data |
| GET | `/student/digital-id/back` | Bearer | student, leader | Get digital student ID card back-face data (QR, barcode) |

---
#### MODULE: Departments (`/api/v1/departments`)

| Method | Route | Auth | Roles | Purpose |
|---|---|---|---|---|
| GET | `/departments` | Bearer | Any | List all departments |
| GET | `/departments/:id` | Bearer | Any | Get department by ID |
| POST | `/departments` | Bearer | admin, super_admin | Create department |
| PUT | `/departments/:id` | Bearer | admin, super_admin | Update department |
| DELETE | `/departments/:id` | Bearer | admin, super_admin | Delete department |

---
#### MODULE: Courses (`/api/v1/courses`)

| Method | Route | Auth | Roles | Purpose |
|---|---|---|---|---|
| GET | `/courses` | Bearer | Any | List all courses (cached) |
| GET | `/courses/:code` | Bearer | Any | Get course details with offerings |
| POST | `/courses` | Bearer | admin, super_admin | Create course |
| PUT | `/courses/:code` | Bearer | admin, super_admin | Update course |
| DELETE | `/courses/:code` | Bearer | admin, super_admin | Delete course |
| GET | `/courses/:code/prerequisites` | Bearer | Any | Get course prerequisite graph |
| POST | `/courses/:code/prerequisites` | Bearer | admin, super_admin | Add prerequisite |
| DELETE | `/courses/:code/prerequisites/:prereqCode` | Bearer | admin, super_admin | Remove prerequisite |

---
#### MODULE: Course Offerings (`/api/v1/course-offerings`)

| Method | Route | Auth | Roles | Purpose |
|---|---|---|---|---|
| GET | `/course-offerings` | Bearer | Any | List offerings (filter by semester/year) |
| GET | `/course-offerings/:id` | Bearer | Any | Get offering with lectures/labs |
| POST | `/course-offerings` | Bearer | admin, super_admin | Create offering |
| PUT | `/course-offerings/:id` | Bearer | admin, super_admin | Update offering |
| DELETE | `/course-offerings/:id` | Bearer | admin, super_admin | Delete offering |
| POST | `/course-offerings/:id/lectures` | Bearer | admin, super_admin | Add lecture section |
| PUT | `/course-offerings/:id/lectures/:lectureId` | Bearer | admin, super_admin | Update lecture |
| DELETE | `/course-offerings/:id/lectures/:lectureId` | Bearer | admin, super_admin | Delete lecture |
| POST | `/course-offerings/:id/tutorials` | Bearer | admin, super_admin | Add tutorial/lab section |
| PUT | `/course-offerings/:id/tutorials/:tutorialId` | Bearer | admin, super_admin | Update tutorial |
| DELETE | `/course-offerings/:id/tutorials/:tutorialId` | Bearer | admin, super_admin | Delete tutorial |

---
#### MODULE: Registration (`/api/v1/registration`)

| Method | Route | Auth | Roles | Purpose |
|---|---|---|---|---|
| GET | `/registration/available-offerings` | Bearer | student, leader | List available course offerings for enrollment |
| POST | `/registration/enroll` | Bearer | student, leader | Enroll in a lecture (and optionally a tutorial) |
| DELETE | `/registration/drop` | Bearer | student, leader | Drop an enrollment |
| GET | `/registration/my-enrollments` | Bearer | student, leader | List student's own enrollments |
| POST | `/registration/manual-course-registration/students/:studentId/register` | Bearer | admin, super_admin | Admin registers a specific student for a course |
| GET | `/registration/manual-course-registration/students/:studentId/enrollments` | Bearer | admin, super_admin | Get enrollments for specific student |
| PATCH | `/registration/manual-course-registration/students/:studentId/register-lab` | Bearer | admin, super_admin | Admin updates student's lab assignment |
| DELETE | `/registration/manual-course-registration/students/:studentId/unregister` | Bearer | admin, super_admin | Admin removes a student enrollment |
| GET | `/registration/manual-course-registration/students/:studentId/schedule` | Bearer | admin, super_admin | Get schedule for a specific student |

---
#### MODULE: Attendance (`/api/v1/attendance`)

| Method | Route | Auth | Roles | Purpose |
|---|---|---|---|---|
| POST | `/attendance/sessions/start` | Bearer | doctor, teaching_assistant, admin | Start live attendance session (creates in-memory session) |
| GET | `/attendance/sessions/active` | Bearer | doctor, teaching_assistant, admin | List instructor's active sessions |
| GET | `/attendance/sessions` | Bearer | doctor, teaching_assistant, admin | Get all attendance sessions for a lecture/tutorial |
| GET | `/attendance/sessions/:sessionId` | Bearer | Any | Get session details |
| GET | `/attendance/sessions/:sessionId/live-info` | Bearer | Any | Get geo-location and live status of session |
| GET | `/attendance/sessions/my-active` | Bearer | student, leader | Get the student's currently active session |
| POST | `/attendance/sessions/:sessionId/end` | Bearer | doctor, teaching_assistant, admin | End session and persist attendance records to DB |
| POST | `/attendance/scan` | Bearer | student, leader | HTTP fallback: scan QR code to mark attendance |
| PUT | `/attendance/sessions/:sessionId/toggle` | Bearer | doctor, teaching_assistant, admin | Manually toggle student attendance during active session |
| PUT | `/attendance/records/update` | Bearer | doctor, teaching_assistant, admin | Update a persisted attendance record |
| GET | `/attendance/students` | Bearer | doctor, teaching_assistant, admin | Attendance summary per student for a lecture |
| GET | `/attendance/grid` | Bearer | doctor, teaching_assistant, admin | Attendance grid: students × session dates |
| GET | `/attendance/stats/avg` | Bearer | doctor, teaching_assistant, admin | Average attendance rate |
| GET | `/attendance/stats/lowest` | Bearer | doctor, teaching_assistant, admin | Students with lowest attendance |
| GET | `/attendance/stats/trend` | Bearer | doctor, teaching_assistant, admin | Attendance trend by week |
| GET | `/attendance/my-history` | Bearer | student, leader | Student's own attendance history |
| GET | `/attendance/admin/overall-rate` | Bearer | admin, super_admin | System-wide overall attendance rate |
| GET | `/attendance/admin/lowest-courses` | Bearer | admin, super_admin | Courses with lowest attendance |
| GET | `/attendance/admin/trend` | Bearer | admin, super_admin | System-wide attendance trend |
| GET | `/attendance/admin/dept-comparison` | Bearer | admin, super_admin | Attendance by department |
| GET | `/attendance/admin/distribution` | Bearer | admin, super_admin | Attendance distribution breakdown |
| GET | `/attendance/admin/top-students` | Bearer | admin, super_admin | Top students by attendance |
| GET | `/attendance/admin/students` | Bearer | admin, super_admin | All students attendance table |

---
#### MODULE: Grades (`/api/v1/grades`)

| Method | Route | Auth | Roles | Purpose |
|---|---|---|---|---|
| POST | `/grades/distribution` | Bearer | doctor, admin | Set grade distribution (work/mid/final max scores) for a lecture |
| GET | `/grades/distribution` | Bearer | Any | Get grade distribution for a lecture |
| PUT | `/grades/student` | Bearer | doctor, teaching_assistant, admin | Update a single student's scores |
| PUT | `/grades/bulk` | Bearer | doctor, admin, super_admin | Bulk update grades for all enrolled students |
| GET | `/grades/lecture` | Bearer | Any | Get grades for all students in a lecture |
| GET | `/grades/my` | Bearer | student, leader | Get own grades for all enrolled courses |
| GET | `/grades/my/semester-gpa` | Bearer | student, leader | Get GPA for a specific semester |
| GET | `/grades/my/cgpa-trend` | Bearer | student, leader | CGPA trend across semesters |
| GET | `/grades/my/distribution` | Bearer | student, leader | Own grade distribution chart data |

---
#### MODULE: Tasks (`/api/v1/tasks`)

| Method | Route | Auth | Roles | Purpose |
|---|---|---|---|---|
| POST | `/tasks` | Bearer | doctor, teaching_assistant, admin, super_admin | Create assignment |
| GET | `/tasks` | Bearer | Any | List tasks for a lecture or tutorial |
| GET | `/tasks/my/available` | Bearer | student, leader | List tasks open for submission |
| GET | `/tasks/:taskId` | Bearer | Any | Get task details |
| PUT | `/tasks/:taskId` | Bearer | Staff roles | Update task |
| DELETE | `/tasks/:taskId` | Bearer | Staff roles | Delete task |
| POST | `/tasks/:taskId/submit` | Bearer | student, leader | Submit task (with optional file) |
| GET | `/tasks/:taskId/my-submission` | Bearer | student, leader | View own submission |
| DELETE | `/tasks/:taskId/my-submission` | Bearer | student, leader | Delete own submission (before due date) |
| GET | `/tasks/:taskId/submissions` | Bearer | Staff roles | View all submissions |
| PUT | `/tasks/:taskId/submissions/:submissionId/grade` | Bearer | Staff roles | Grade a submission |

---
#### MODULE: Materials (`/api/v1/materials`)

| Method | Route | Auth | Roles | Purpose |
|---|---|---|---|---|
| GET | `/materials` | Bearer | Any | List materials for a lecture or tutorial |
| GET | `/materials/:id/download` | Bearer | Any | Get signed download URL from Supabase |
| GET | `/materials/:id/stream` | Bearer | Any | Stream file directly |
| POST | `/materials` | Bearer | doctor, admin, super_admin | Upload material (multipart, via Supabase) |
| PUT | `/materials/:id` | Bearer | doctor, admin, super_admin | Update material metadata |
| DELETE | `/materials/:id` | Bearer | doctor, admin, super_admin | Delete material (and Supabase file) |

---
#### MODULE: Exams (`/api/v1/exams`)

| Method | Route | Auth | Roles | Purpose |
|---|---|---|---|---|
| GET | `/exams` | Bearer | Any | List all exams |
| GET | `/exams/active-courses` | Bearer | admin, super_admin | Get active course offerings |
| GET | `/exams/schedule` | Bearer | student | Get student's exam schedule |
| POST | `/exams/set` | Bearer | admin, super_admin | Create exam entry |
| PUT | `/exams/set/:exam_id` | Bearer | admin, super_admin | Update exam |
| DELETE | `/exams/set/:exam_id` | Bearer | admin, super_admin | Delete exam |

---
#### MODULE: Schedule (`/api/v1/schedule`)

| Method | Route | Auth | Roles | Purpose |
|---|---|---|---|---|
| GET | `/schedule` | Bearer | student, leader | Get student weekly timetable |
| GET | `/teachers/schedule` | Bearer | doctor, teaching_assistant | Get teacher weekly timetable |

---
#### MODULE: Notifications (`/api/v1/notifications`)

| Method | Route | Auth | Roles | Purpose |
|---|---|---|---|---|
| POST | `/notifications/register-device` | Optional Bearer | Any | Register FCM device token |
| GET | `/notifications` | Bearer | Any | Get user's notifications (paginated) |
| GET | `/notifications/unread-count` | Bearer | Any | Get unread notification count |
| PATCH | `/notifications/mark-all-read` | Bearer | Any | Mark all notifications as read |
| PATCH | `/notifications/:id/read` | Bearer | Any | Mark single notification as read |
| DELETE | `/notifications` | Bearer | Any | Delete all notifications |
| DELETE | `/notifications/:id` | Bearer | Any | Delete single notification |
| GET | `/notifications/preferences` | Bearer | Any | Get notification preferences |
| PUT | `/notifications/preferences` | Bearer | Any | Update notification preferences |
| POST | `/notifications` | Bearer | admin, super_admin | Create notification for specific user |
| POST | `/notifications/bulk` | Bearer | admin, super_admin | Send notification to multiple users |
| POST | `/notifications/global-broadcast` | Bearer | admin, super_admin | Global FCM broadcast to all devices |

---
#### MODULE: Community (`/api/v1/community`)

| Method | Route | Auth | Roles | Purpose |
|---|---|---|---|---|
| POST | `/community/posts` | Bearer | Any | Create post (optionally in a group) |
| PATCH | `/community/posts/:id` | Bearer | Any (own post) | Update post |
| DELETE | `/community/posts/:id` | Bearer | Any (own post) or admin | Delete post |
| GET | `/community/feed` | Bearer | Any | Get paginated community feed |
| GET | `/community/posts/user/:userId` | Bearer | Any | Get posts by user |
| POST | `/community/posts/:id/like` | Bearer | Any | Toggle post like |
| GET | `/community/posts/:id/likes` | Bearer | Any | Get post likers |
| POST | `/community/posts/:id/comment` | Bearer | Any | Add comment |
| GET | `/community/posts/:id/comments` | Bearer | Any | Get comments |
| POST | `/community/groups` | Bearer | doctor, admin, super_admin, teaching_assistant, leader | Create group |
| GET | `/community/groups/suggested` | Bearer | Any | Get suggested groups |
| GET | `/community/groups/my` | Bearer | Any | Get user's groups |
| GET | `/community/groups/:id/posts` | Bearer | Any | Get group posts |
| POST | `/community/groups/:id/join` | Bearer | Any | Join group |
| PATCH | `/community/groups/:id` | Bearer | admin, super_admin | Update group |
| DELETE | `/community/groups/:id` | Bearer | admin, super_admin | Delete group |
| GET | `/community/events` | Bearer | Any | Get campus events |
| POST | `/community/events` | Bearer | admin, super_admin | Create campus event |
| PATCH | `/community/events/:id` | Bearer | admin, super_admin | Update event |
| DELETE | `/community/events/:id` | Bearer | admin, super_admin | Delete event |

---
#### MODULE: Payments (`/api/v1/payments`)

| Method | Route | Auth | Roles | Purpose |
|---|---|---|---|---|
| GET | `/payments/invoices/me` | Bearer | student, leader | Get own invoices |
| GET | `/payments/me` | Bearer | student, leader | Get own payment history |
| GET | `/payments/admin/cards` | Bearer | admin, super_admin | Admin payment summary cards |
| GET | `/payments/admin/student-payments` | Bearer | admin, super_admin | Admin student payment table |
| POST | `/payments/manual` | Bearer | admin, super_admin | Record manual payment for a student |
| POST | `/payments/invoices/paypal-order` | Bearer | student, leader | Create PayPal order for pending invoices |
| POST | `/payments/invoices/capture` | Bearer | student, leader | Capture PayPal order and mark invoices paid |
| POST | `/payments/invoices/paymob-order` | Bearer | student, leader | Create Paymob order, return iframe URL |
| POST | `/payments/invoices/paymob-webhook` | None | — | Paymob server-side webhook (HMAC verified internally) |
| POST | `/payments/invoices/paymob-verify` | Bearer | student, leader | Verify Paymob payment status by transaction ID |

---
#### MODULE: Financials (`/api/v1/financials`)

| Method | Route | Auth | Roles | Purpose |
|---|---|---|---|---|
| GET | `/financials` | Bearer | Any | List all department financial configurations |
| GET | `/financials/:id` | Bearer | Any | Get single financial record |
| POST | `/financials` | Bearer | admin, super_admin | Create financial record for a department |
| PATCH | `/financials/:id` | Bearer | admin, super_admin | Update credit price |
| DELETE | `/financials/:id` | Bearer | admin, super_admin | Delete financial record |

---
#### MODULE: Leaderboard (`/api/v1/leaderboard`)

| Method | Route | Auth | Roles | Purpose |
|---|---|---|---|---|
| GET | `/leaderboard` | Bearer | Any | Get student leaderboard (cached) |

---
#### MODULE: Admin Dashboard (`/api/v1/admin`)

Provides aggregated KPIs, trend data, and management views for administrators. All routes require `admin` or `super_admin`.

Key endpoints include:
- `GET /admin/stats` — Overall system statistics
- `GET /admin/alerts` — Pending action items
- `GET /admin/enrollment-trends` — Enrollment over time
- `GET /admin/payment-aging` — Outstanding invoice aging report
- `GET /admin/activity` — System activity log

---
#### MODULE: Doctor Dashboard (`/api/v1/doctor`)

Provides course/section-specific analytics for doctors. Requires `doctor` role.

Key endpoints include:
- `GET /doctor/my-courses` — Doctor's assigned courses
- `GET /doctor/alerts` — Pending grading tasks, low attendance alerts
- `GET /doctor/grade-distribution` — Grade spread for sections

---
#### MODULE: Teaching Assistant Dashboard (`/api/v1/teaching-assistant`)

Similar to Doctor Dashboard, scoped to tutorials/labs. Requires `teaching_assistant` role.

---
#### MODULE: System Config (`/api/v1/config`)

| Method | Route | Auth | Roles | Purpose |
|---|---|---|---|---|
| GET | `/config/announcements` | Bearer | Any | Get campus announcements |
| GET | `/config/calendar` | Bearer | super_admin | Get academic calendar |
| POST | `/config/calendar` | Bearer | super_admin | Create calendar event |
| PATCH | `/config/calendar/:id` | Bearer | super_admin | Update calendar event |
| DELETE | `/config/calendar/:id` | Bearer | super_admin | Delete calendar event |
| POST | `/config/registration-open` | Bearer | super_admin | Open/configure registration period |
| POST | `/config/announcements` | Bearer | super_admin | Create announcement |
| PATCH | `/config/announcements/:id` | Bearer | super_admin | Update announcement |
| DELETE | `/config/announcements/:id` | Bearer | super_admin | Delete announcement |

---
#### MODULE: Settings (`/api/v1/settings`)

| Method | Route | Auth | Roles | Purpose |
|---|---|---|---|---|
| PUT | `/settings/password` | Bearer | Any | Change own password (from settings UI) |

---
#### MODULE: Teachers (`/api/v1/teachers`)

| Method | Route | Auth | Roles | Purpose |
|---|---|---|---|---|
| GET | `/teachers` | Bearer | super_admin, admin | Get all doctors and TAs |
| GET | `/teachers/schedule` | Bearer | doctor, teaching_assistant | Get own teaching schedule |

---
#### MODULE: FAQ (`/api/v1/faq`)

| Method | Route | Auth | Roles | Purpose |
|---|---|---|---|---|
| GET | `/faq` | None | — | Public FAQ data |

---
#### MODULE: Utility

| Method | Route | Auth | Roles | Purpose |
|---|---|---|---|---|
| GET | `/` | None | — | Health check (status, uptime, timestamp) |
| GET | `/api/v1/cache/stats` | None | — | Dev-only: Redis cache statistics |
| GET/POST | `/docs` | None | — | Swagger UI and OpenAPI spec |

---

## 5. Authentication & Authorization

### JWT Strategy
- **Access Token**: Signed with `process.env.JWT_SECRET` via `jsonwebtoken`
- **Algorithm**: HS256 (default)
- **Access Token Expiry**: Short-lived (exact value defined in `authController.js` as `ACCESS_TOKEN_EXPIRY` constant — *inferred as ~15 minutes or 1 hour based on typical usage patterns*)
- **Payload**: `{ userId: String (UUID), role: user_role }`
- **Transport**: `Authorization: Bearer <token>` header

### Refresh Token Strategy
- **Storage**: Persisted in `refresh_tokens` table in PostgreSQL
- **Transport**: HttpOnly cookie named `refreshToken`
- **Cookie settings**: `httpOnly: true`, `secure: process.env.NODE_ENV === "production"`, `sameSite: "lax"`, `path: "/api/v1/auth"`
- **Rotation**: On each refresh, old token is revoked (`revoked: true`) and new token is created in a `$transaction`
- **Revocation on logout**: `updateMany` sets `revoked: true` for the cookie token
- **Revocation on password change**: All tokens for the user are revoked with `updateMany`
- **Revocation on admin password reset**: All tokens for target user are revoked in `$transaction`
- **Token tracking**: Stores `ip_address`, `user_agent`, `expires_at`, `created_at` per token

### Account Lockout
- Failed login attempts tracked in `users.failed_login_attempts`
- `locked_until` field used for time-based lockout
- Reset to 0 on successful login or admin password reset

### Force Password Change
- `must_change_password` field on `users` table
- Set to `true` by `adminResetPassword`
- Set to `false` by `changePassword`
- `loginSchema` response includes `requiresPasswordChange` flag

### Login Flow (Step-by-Step)
1. Client POSTs `{ email, password }` to `POST /api/v1/auth/login`
2. `loginLimiter` middleware checks rate limit (10 attempts/15min per IP)
3. `validate(loginSchema)` middleware validates body with Zod
4. `authController.login` executes:
   a. `prisma.users.findUnique({ where: { email } })` — fetch user
   b. If not found → 401 "Invalid credentials"
   c. Check `locked_until` — if locked → 401 with lockout message
   d. `bcrypt.compare(password, user.password_hash)` — verify password
   e. If invalid → increment `failed_login_attempts`, potentially set `locked_until`, return 401
   f. Reset `failed_login_attempts = 0`, `locked_until = null` on success
   g. `jwt.sign({ userId, role }, JWT_SECRET, { expiresIn })` — create access token
   h. Generate raw refresh token string (UUID or random)
   i. `prisma.refresh_tokens.create(...)` — store hashed/raw refresh token
   j. `res.cookie("refreshToken", rawToken, { httpOnly, secure, sameSite, path })` — set cookie
   k. Return `{ accessToken, requiresPasswordChange }` as JSON

### Refresh Token Flow
1. Client POSTs to `POST /api/v1/auth/refresh` (no body; reads cookie)
2. `authController.refreshToken` executes:
   a. Read `req.cookies.refreshToken`
   b. If no cookie → 401
   c. `prisma.refresh_tokens.findUnique({ where: { token } })` including user
   d. If not found, revoked, or expired → 401
   e. `prisma.$transaction([revoke old, create new])` — token rotation
   f. Set new cookie
   g. `jwt.sign(...)` — new access token
   h. Return `{ accessToken }`

### Role-Based Authorization
- `authorizationMiddleware(...allowedRoles)` factory returns middleware
- Checks `req.user.role` against `allowedRoles` array
- Returns 403 "Access denied" if not in list
- Roles from enum: `student`, `leader`, `doctor`, `teaching_assistant`, `admin`, `super_admin`

### Socket.IO Authentication
- JWT provided in `socket.handshake.auth.token`
- `io.use(middleware)` verifies token before connection
- Sets `socket.user = { userId, role }`
- Refuses connection if token is missing or invalid

---

## 6. Database Architecture

### Database System
PostgreSQL, accessed via Prisma ORM with `PrismaPg` native driver adapter.

---

### Entity: `users`
**Purpose**: Central identity record for all system users.
**Primary Key**: `id` UUID (auto-generated via `gen_random_uuid()`)
**Unique Constraints**: `email`
**Indexes**: `email`, `role`

| Field | Type | Nullable | Default | Purpose |
|---|---|---|---|---|
| id | String (UUID) | No | gen_random_uuid() | Primary identifier |
| full_name | String | No | — | Display name |
| email | String | No | — | Login email (unique) |
| password_hash | String | No | — | Bcrypt hash (cost 12) |
| role | user_role (enum) | No | — | Access control role |
| avatar_url | String | Yes | null | URL to avatar (Supabase) |
| phone | String | Yes | null | Contact number |
| national_id | String | Yes | null | Government ID (used as initial student password) |
| address | String | Yes | null | Home address |
| created_at | DateTime | Yes | now() | Account creation time |
| updated_at | DateTime | Yes | now() | Last update time |
| failed_login_attempts | Int | No | 0 | Lockout counter |
| locked_until | DateTime | Yes | null | Lockout expiry |
| must_change_password | Boolean | No | false | Force password change on next login |

**Relationships**:
- `users` 1:1 → `student_profiles` (student has one profile)
- `users` 1:N → `enrollments`
- `users` 1:N → `attendance`
- `users` 1:N → `notifications`
- `users` 1:N → `refresh_tokens`
- `users` 1:N → `device_tokens`
- `users` 1:N → `community_posts`
- `users` 1:N → `post_comments`
- `users` 1:N → `invoices`
- `users` 1:N → `student_payments`
- `users` 1:N → `files`
- `users` 1:N → `lectures` (as instructor)
- `users` 1:N → `tutorials_labs` (as TA)
- `users` 1:N → `group_members`
- `users` 1:N → `announcements` (as author)
- `users` 1:N → `academic_calendar` (as creator)
- `users` 1:N → `task_submissions`
- `users` 1:N → `post_likes`
- `users` 1:1 → `notification_preferences`
- `users` 1:N → `student_profiles` (as faculty_advisor)

---

### Entity: `student_profiles`
**Purpose**: Extended academic data for students.
**Primary Key**: `user_id` (UUID, FK → users.id)
**Unique Constraints**: `student_id`
**Indexes**: `student_id`, `department_id`, `faculty_advisor_id`

| Field | Type | Nullable | Default | Purpose |
|---|---|---|---|---|
| user_id | String (UUID) | No | — | FK to users.id |
| student_id | String | No | — | Academic student ID (e.g., AC-123456) |
| year_level | Int | Yes | 1 | Academic year level (1–4, computed from credits) |
| cgpa | Float | Yes | null | Cumulative GPA |
| department_id | String (UUID) | Yes | null | FK to departments.department_id |
| total_credits | Int | Yes | null | Total completed credit hours |
| faculty_advisor_id | String (UUID) | Yes | null | FK to users.id (advisor doctor) |

**Relationships**:
- `student_profiles` N:1 → `users` (the student)
- `student_profiles` N:1 → `departments`
- `student_profiles` N:1 → `users` (faculty_advisor)

---

### Entity: `refresh_tokens`
**Purpose**: Persistent refresh token storage for stateful logout and rotation.
**Primary Key**: `id` UUID
**Unique Constraints**: `token`
**Indexes**: `user_id`, `token`

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| id | String (UUID) | No | PK |
| token | String | No | Raw or hashed token value |
| user_id | String (UUID) | No | FK to users.id |
| expires_at | DateTime | No | Expiry timestamp |
| revoked | Boolean | No (default false) | Whether token has been used or invalidated |
| created_at | DateTime | No | Issuance time |
| ip_address | String | Yes | Client IP at issuance |
| user_agent | String | Yes | Client UA at issuance |

---

### Entity: `device_tokens`
**Purpose**: FCM push notification device tokens per user.
**Primary Key**: `id` UUID
**Unique Constraints**: `token`
**Indexes**: `user_id`, `token`

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| id | String (UUID) | No | PK |
| token | String | No | FCM device token |
| user_id | String (UUID) | Yes | FK to users.id (null for anonymous) |
| platform | String | Yes | Device platform (ios, android, web) |
| is_active | Boolean | No (default true) | Active status (deactivated on delivery failure) |
| created_at | DateTime | No | Registration time |
| updated_at | DateTime | No | Last update (updatedAt trigger) |

---

### Entity: `departments`
**Purpose**: Academic department catalog.
**Primary Key**: `department_id` UUID (gen_random_uuid())
**Unique Constraints**: `name`

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| department_id | String (UUID) | No | PK |
| name | String | No | Department name (unique) |

**Relationships**:
- `departments` 1:N → `courses`
- `departments` 1:N → `student_profiles`
- `departments` 1:1 → `financials`

---

### Entity: `courses`
**Purpose**: Master course catalog.
**Primary Key**: `code` String (course code, e.g., "CS101")
**Indexes**: `department_id`

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| code | String | No | PK, course code |
| name | String | No | Course full name |
| credits | Int | No | Credit hour value |
| department_id | String (UUID) | No | FK to departments.department_id |

**Relationships**:
- `courses` N:1 → `departments`
- `courses` 1:N → `course_offerings`
- `courses` M:N → `courses` (self, via `course_prerequisites`)

---

### Entity: `course_prerequisites`
**Purpose**: Prerequisite graph edges between courses.
**Primary Key**: Composite `[course_code, prerequisite_code]`

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| course_code | String | No | FK to courses.code (the course) |
| prerequisite_code | String | No | FK to courses.code (the prerequisite) |

---

### Entity: `course_offerings`
**Purpose**: A specific semester offering of a course.
**Primary Key**: `offering_id` Int (autoincrement)
**Indexes**: `course_code`, `[semester, course_code]`, `[semester, year]`

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| offering_id | Int | No | PK |
| course_code | String | No | FK to courses.code |
| year | Int | No | Academic year |
| semester | semester_type (enum) | No | Spring / Fall / Summer / Winter |

**Relationships**:
- `course_offerings` N:1 → `courses`
- `course_offerings` 1:N → `lectures`
- `course_offerings` 1:N → `tutorials_labs`
- `course_offerings` 1:N → `exams`

---

### Entity: `lectures`
**Purpose**: A lecture section under a course offering.
**Primary Key**: `lecture_id` Int (autoincrement)
**Indexes**: `instructor_id`, `offering_id`

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| lecture_id | Int | No | PK |
| offering_id | Int | No | FK to course_offerings |
| instructor_id | String (UUID) | No | FK to users.id (doctor) |
| capacity | Int | No | Max students |
| day_of_week | String | No | e.g., "Monday" |
| start_time | DateTime (Time) | No | Section start time |
| end_time | DateTime (Time) | No | Section end time |
| location | String | Yes | Room/building |
| group | String | Yes | Group label |
| enrolled_count | Int | No (default 0) | Current enrollment count |

**Relationships**:
- `lectures` N:1 → `course_offerings`
- `lectures` N:1 → `users` (instructor)
- `lectures` 1:N → `enrollments`
- `lectures` 1:N → `attendance`
- `lectures` 1:N → `course_materials`
- `lectures` 1:N → `tasks`
- `lectures` 1:1 → `grade_distributions`

---

### Entity: `tutorials_labs`
**Purpose**: A tutorial or lab section under a course offering.
**Primary Key**: `tutorial_lab_id` Int (autoincrement)
**Indexes**: `offering_id`, `ta_id`

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| tutorial_lab_id | Int | No | PK |
| offering_id | Int | No | FK to course_offerings |
| ta_id | String (UUID) | No | FK to users.id (teaching_assistant) |
| type | String | No | "tutorial" or "lab" |
| capacity | Int | No | Max students |
| day_of_week | String | No | Day name |
| start_time | DateTime (Time) | No | Section start time |
| end_time | DateTime (Time) | No | Section end time |
| location | String | Yes | Room/building |
| group | String | No | Group label |
| enrolled_count | Int | No (default 0) | Current enrollment count |

**Relationships**:
- `tutorials_labs` N:1 → `course_offerings`
- `tutorials_labs` N:1 → `users` (TA)
- `tutorials_labs` 1:N → `enrollments`
- `tutorials_labs` 1:N → `attendance`
- `tutorials_labs` 1:N → `course_materials`
- `tutorials_labs` 1:N → `tasks`

---

### Entity: `enrollments`
**Purpose**: Links a student to a lecture (and optionally a tutorial), stores grades.
**Primary Key**: `id` Int (autoincrement)
**Unique Constraints**: `[student_user_id, lecture_id]`
**Indexes**: `[lecture_id, status]`, `[student_user_id, status]`, `[tutorial_lab_id, status]`

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| id | Int | No | PK |
| student_user_id | String (UUID) | No | FK to users.id |
| lecture_id | Int | No | FK to lectures.lecture_id |
| tutorial_lab_id | Int | Yes | FK to tutorials_labs.tutorial_lab_id |
| mid_score | Float | Yes | Midterm score |
| work_score | Float | Yes | Coursework/assignments score |
| final_score | Float | Yes | Final exam score |
| grade | String | Yes | Letter grade (A, B+, etc.) |
| status | enrollment_status (enum) | No (default enrolled) | enrolled / dropped / completed |

**Relationships**:
- `enrollments` N:1 → `users`
- `enrollments` N:1 → `lectures`
- `enrollments` N:1 → `tutorials_labs` (optional)
- `enrollments` 1:1 → `invoices`

---

### Entity: `grade_distributions`
**Purpose**: Defines max scores for grade components per lecture.
**Primary Key**: `id` Int
**Unique Constraints**: `lecture_id`

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| id | Int | No | PK |
| lecture_id | Int | No | FK to lectures (unique) |
| work_max | Float | No | Max coursework score |
| mid_max | Float | No | Max midterm score |
| final_max | Float | No | Max final exam score |

---

### Entity: `attendance`
**Purpose**: Persisted attendance records per student per session.
**Primary Key**: `id` Int (autoincrement)
**Note**: Check constraints exist (Prisma annotation)

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| id | Int | No | PK |
| student_user_id | String (UUID) | No | FK to users.id |
| lecture_id | Int | Yes | FK to lectures (XOR with tutorial_lab_id) |
| tutorial_lab_id | Int | Yes | FK to tutorials_labs (XOR with lecture_id) |
| session_date | DateTime (Date) | No | Session date |
| status | String | No | "present" or "absent" |

---

### Entity: `exams`
**Purpose**: Exam schedule entries.
**Primary Key**: `exam_id` Int (autoincrement)
**Indexes**: `[exam_date, start_time]`, `offering_id`

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| exam_id | Int | No | PK |
| offering_id | Int | No | FK to course_offerings |
| exam_type | String | No | e.g., "midterm", "final" |
| exam_date | DateTime (Date) | No | Exam date |
| day_of_week | String | No | Day name |
| start_time | DateTime (Time) | No | Start time |
| end_time | DateTime (Time) | No | End time |
| location | String | Yes | Exam hall |

---

### Entity: `tasks`
**Purpose**: Assignments/tasks created by instructors.
**Primary Key**: `id` Int (autoincrement)
**Indexes**: `[lecture_id, due_date, created_at]`, `[tutorial_lab_id, due_date, created_at]`
**Note**: Check constraints exist (at least one of lecture_id or tutorial_lab_id)

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| id | Int | No | PK |
| lecture_id | Int | Yes | FK to lectures |
| tutorial_lab_id | Int | Yes | FK to tutorials_labs |
| title | String | No | Task title |
| description | String | Yes | Task description |
| due_date | DateTime | Yes | Submission deadline |
| created_at | DateTime | Yes | Creation timestamp |

---

### Entity: `task_submissions`
**Purpose**: Student submissions for tasks.
**Primary Key**: `id` Int (autoincrement)
**Indexes**: `[task_id, student_id]`, `[task_id, submitted_at]`

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| id | Int | No | PK |
| task_id | Int | No | FK to tasks.id |
| student_id | String (UUID) | No | FK to users.id |
| submission_content | String | Yes | Text content or file URL |
| submitted_at | DateTime | Yes | Submission timestamp |
| grade | Float | Yes | Score given by instructor |

---

### Entity: `course_materials`
**Purpose**: Learning materials (files or URLs) linked to lectures/tutorials.
**Primary Key**: `id` Int (autoincrement)
**Indexes**: `[lecture_id, uploaded_at]`, `[tutorial_lab_id, uploaded_at]`
**Note**: Check constraints exist

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| id | Int | No | PK |
| lecture_id | Int | Yes | FK to lectures |
| tutorial_lab_id | Int | Yes | FK to tutorials_labs |
| title | String | No | Material title |
| url | String | Yes | External URL |
| file_id | String (UUID) | Yes | FK to files.file_id |
| uploaded_at | DateTime | Yes | Upload timestamp |

---

### Entity: `files`
**Purpose**: Metadata for files uploaded to Supabase Storage.
**Primary Key**: `file_id` UUID (gen_random_uuid())
**Unique Constraints**: `file_path`

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| file_id | String (UUID) | No | PK |
| file_name | String | No | Original filename |
| file_path | String | No | Supabase storage path (unique) |
| media_type | String | Yes | MIME type |
| size_bytes | BigInt | Yes | File size |
| uploaded_by_user_id | String (UUID) | No | FK to users.id |
| created_at | DateTime | Yes | Upload time |

---

### Entity: `invoices`
**Purpose**: Billing records created when a student enrolls in a course.
**Primary Key**: `id` Int (autoincrement)
**Unique Constraints**: `enrollment_id`
**Indexes**: `student_user_id`, `[semester, year]`, `status`, `paypal_order_id`

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| id | Int | No | PK |
| student_user_id | String (UUID) | No | FK to users.id |
| enrollment_id | Int | Yes | FK to enrollments.id (unique) |
| course_code | String | No | Course identifier |
| semester | semester_type | No | Billing semester |
| year | Int | No | Billing year |
| credit_hours | Int | No | Credit hours for billing |
| credit_price | Decimal | No | Price per credit at time of enrollment |
| total_amount | Decimal | No | credit_hours × credit_price |
| status | payment_status (enum) | No (default pending) | pending / paid / failed / refunded |
| paypal_order_id | String | Yes | PayPal order reference |
| payment_date | DateTime | Yes | When paid |
| created_at | DateTime | Yes | Invoice creation time |
| updated_at | DateTime | Yes | Last update |

**Relationships**:
- `invoices` N:1 → `users`
- `invoices` 1:1 → `enrollments`
- `invoices` 1:N → `payments`

---

### Entity: `payments`
**Purpose**: Individual payment transaction records.
**Primary Key**: `id` Int (autoincrement)
**Unique Constraints**: `[gateway, transaction_id]`
**Indexes**: `invoice_id`, `status`

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| id | Int | No | PK |
| invoice_id | Int | No | FK to invoices.id |
| gateway | payment_gateway (enum) | No | paypal / paymob / manual |
| transaction_id | String | No | Gateway transaction reference |
| amount | Decimal | No | Amount paid |
| status | payment_status (enum) | No | Transaction status |
| created_at | DateTime | Yes | Transaction time |

---

### Entity: `student_payments`
**Purpose**: Aggregate payment summary per student per semester (denormalized for reporting).
**Primary Key**: `id` Int (autoincrement)
**Unique Constraints**: `[student_user_id, semester, year]`, `[gateway, transaction_id]`
**Indexes**: `student_user_id`, `[semester, year]`, `paid_at`

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| id | Int | No | PK |
| student_user_id | String (UUID) | No | FK to users.id |
| semester | semester_type | No | Semester |
| year | Int | No | Year |
| total_amount | Decimal | No | Total paid amount |
| invoice_count | Int | No | Number of invoices covered |
| gateway | payment_gateway | No | Payment method used |
| transaction_id | String | No | Gateway reference |
| paid_at | DateTime | No | Payment timestamp |
| created_at | DateTime | Yes | Record creation |

---

### Entity: `financials`
**Purpose**: Credit hour pricing per department.
**Primary Key**: `id` Int (autoincrement)
**Unique Constraints**: `department_id`

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| id | Int | No | PK |
| department_id | String (UUID) | No | FK to departments (unique) |
| credit_price | Decimal | No | Price per credit hour |

---

### Entity: `notifications`
**Purpose**: In-app notification records per user.
**Primary Key**: `id` Int (autoincrement)
**Indexes**: `user_id`, `is_read`, `created_at`, `[user_id, created_at]`, `[user_id, is_read]`

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| id | Int | No | PK |
| user_id | String (UUID) | No | FK to users.id |
| message | String | No | Notification text |
| is_read | Boolean | No (default false) | Read state |
| created_at | DateTime | Yes | Creation time |
| type | notification_type (enum) | No (default general) | new_grade / exam_deadline / community_activity / campus_announcement / general |

---

### Entity: `notification_preferences`
**Purpose**: Per-user notification preference toggles.
**Primary Key**: `user_id` (UUID, FK)

| Field | Type | Default | Purpose |
|---|---|---|---|
| user_id | String (UUID) | — | PK, FK to users.id |
| new_grade | Boolean | true | Receive grade notifications |
| exam_deadline | Boolean | true | Receive exam reminders |
| community_activity | Boolean | false | Receive community notifications |
| campus_announcement | Boolean | true | Receive announcements |

---

### Entity: `community_groups`
**Purpose**: Named communities within the platform.
**Primary Key**: `id` Int (autoincrement)

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| id | Int | No | PK |
| name | String | No | Group name |
| description | String | Yes | Group description |
| avatar_url | String | Yes | Group avatar |
| created_at | DateTime | Yes | Creation time |

---

### Entity: `group_members`
**Purpose**: M:N join table for users and community groups.
**Primary Key**: Composite `[group_id, user_id]`
**Indexes**: `user_id`, `group_id`, `[user_id, joined_at]`

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| group_id | Int | No | FK to community_groups.id |
| user_id | String (UUID) | No | FK to users.id |
| joined_at | DateTime | Yes | Join timestamp |

---

### Entity: `community_posts`
**Purpose**: Social forum posts.
**Primary Key**: `id` Int (autoincrement)
**Indexes**: `author_id`, `group_id`, `created_at`, `[author_id, created_at]`, `[group_id, created_at]`

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| id | Int | No | PK |
| author_id | String (UUID) | No | FK to users.id |
| content | String | No | Post text |
| image_url | String | Yes | Attached image |
| is_pinned | Boolean | Yes (default false) | Pinned post flag |
| created_at | DateTime | Yes | Creation time |
| group_id | Int | Yes | FK to community_groups (null = global feed) |

---

### Entity: `post_comments`
**Purpose**: Comments on community posts.
**Primary Key**: `id` Int (autoincrement)
**Indexes**: `post_id`, `author_id`, `created_at`, `[post_id, created_at]`

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| id | Int | No | PK |
| post_id | Int | No | FK to community_posts.id |
| author_id | String (UUID) | No | FK to users.id |
| content | String | No | Comment text |
| created_at | DateTime | Yes | Creation time |

---

### Entity: `post_likes`
**Purpose**: M:N like relationships between users and posts.
**Primary Key**: Composite `[post_id, user_id]`
**Indexes**: `user_id`, `post_id`

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| post_id | Int | No | FK to community_posts.id |
| user_id | String (UUID) | No | FK to users.id |
| created_at | DateTime | Yes | Like timestamp |

---

### Entity: `announcements`
**Purpose**: Campus-wide announcements with audience targeting.
**Primary Key**: `id` Int (autoincrement)
**Indexes**: `[audience, publish_at]`

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| id | Int | No | PK |
| author_id | String (UUID) | No | FK to users.id |
| title | String | No | Announcement title |
| content | String | No | Announcement body |
| audience | audience_type (enum) | No (default All) | All / Students / Faculty |
| publish_at | DateTime | Yes (default now()) | Scheduled publish time |
| expire_at | DateTime | Yes | Expiry time |

---

### Entity: `academic_calendar`
**Purpose**: Academic year event catalog (registration windows, exam weeks, holidays, etc.).
**Primary Key**: `id` Int (autoincrement)
**Indexes**: `event_date`, `event_type`, `semester`, `[event_type, academic_year, event_date]`, `[event_type, semester, event_date]`

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| id | Int | No | PK |
| event_name | String | No | Event display name |
| event_type | academic_calendar_event_type (enum) | No | semester_start / registration_start / payment_start / exam_week / etc. |
| event_date | DateTime (Date) | No | Start date |
| end_date | DateTime (Date) | Yes | End date |
| description | String | Yes | Event description |
| semester | String | Yes | e.g., "Fall" |
| academic_year | String | Yes | e.g., "2025-2026" |
| created_at | DateTime | Yes | Creation time |
| updated_at | DateTime | Yes | Last update |
| created_by_user_id | String (UUID) | Yes | FK to users.id |

---

### Entity: `news_articles`
**Purpose**: Campus news articles (read-only public).
**Primary Key**: `id` Int (autoincrement)

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| id | Int | No | PK |
| title | String | No | Article title |
| content | String | Yes | Full text |
| publish_date | DateTime (Date) | No | Publication date |
| image_url | String | Yes | Featured image |
| link | String | Yes | External link |
| created_at | DateTime | Yes | Creation time |

---

### Entity: `testimonials`
**Purpose**: Student testimonials for marketing/display.
**Primary Key**: `id` Int (autoincrement)

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| id | Int | No | PK |
| student_name | String | No | Student's name |
| program | String | No | Program studied |
| quote | String | No | Testimonial text |
| image_url | String | Yes | Photo |
| is_featured | Boolean | Yes (default false) | Show on homepage |

---

### Entity: `events`
**Purpose**: Campus physical events (concerts, seminars, fairs).
**Primary Key**: `id` Int (autoincrement)
**Indexes**: `event_date`

| Field | Type | Nullable | Purpose |
|---|---|---|---|
| id | Int | No | PK |
| title | String | No | Event title |
| event_date | String | No | Date string |
| time | String | Yes | Time string |
| location | String | Yes | Venue |
| img_url | String | Yes | Event image |
| link | String | Yes | Registration link |
| description | String | Yes | Event details |

---

### Database Enums
| Enum | Values |
|---|---|
| `user_role` | student, doctor, admin, teaching_assistant, super_admin, leader |
| `semester_type` | Spring, Fall, Summer, Winter |
| `enrollment_status` | enrolled, dropped, completed |
| `notification_type` | new_grade, exam_deadline, community_activity, campus_announcement, general |
| `payment_status` | pending, paid, failed, refunded |
| `payment_gateway` | paypal, paymob, manual |
| `audience_type` | All, Students, Faculty |
| `academic_calendar_event_type` | semester_start, semester_end, registration_start, registration_end, payment_start, payment_end, registration_deadline, exam_week, midterm, final_exam, holiday, orientation, other |

---

## 7. Business Logic Layer

### `authController` (Login/Auth Logic)
- **Responsibility**: All authentication operations
- **Input**: `{ email, password }`, `cookie.refreshToken`, `{ userId, newPassword }`, `{ currentPassword, newPassword }`
- **Output**: JWT access token, refresh cookie, user data
- **Dependencies**: `prisma`, `bcrypt`, `jsonwebtoken`, `logger`
- **DB Interactions**: `users` (read/write), `refresh_tokens` (create/update)
- **Key Logic**:
  - Account lockout: after N failed attempts, sets `locked_until`
  - Token rotation: old refresh token revoked atomically with new token creation
  - Password change: all refresh tokens revoked, must_change_password cleared

### `registrationController` (Enrollment Logic)
- **Responsibility**: Course enrollment with comprehensive rule enforcement
- **Input**: `{ lecture_id, tutorial_lab_id }`, student identity
- **Output**: Enrollment record, invoice, success/error message
- **Dependencies**: `prisma`, `periodHelpers`, `academicRules`, `cacheService`, `CacheInvalidation`, `notificationService`
- **Key Business Rules**:
  1. Check registration period is open (`isRegistrationOpen`)
  2. Check student hasn't exceeded max semester credit hours (`getMaxSemesterHours`, GPA-based)
  3. Check prerequisites are met (all prerequisite courses completed with `status=completed`)
  4. Check lecture capacity (`capacity > enrolled_count`)
  5. Check time conflicts with existing enrollments
  6. Atomically create enrollment + invoice + increment `enrolled_count` in `$transaction`
  7. Drop logic: marks enrollment as `dropped`, decrements `enrolled_count`, marks invoice as `refunded`

### `attendanceController` (Session Management)
- **Responsibility**: Live attendance session lifecycle
- **Input**: `{ lecture_id | tutorial_lab_id, session_date, isLive, latitude, longitude }`
- **Output**: Session ID, QR code, enrolled students list
- **In-Memory State**: `activeSessions: Map<sessionId, { lectureId, tutorialLabId, sessionDate, isLive, longitude, latitude, qrCode, qrExpiry, attendees: Set<userId>, enrolledStudents: [], createdAt }>`
- **Dependencies**: `prisma`, `uuid`, `crypto`, `notificationService`
- **Key Logic**:
  - QR code = `sessionId:timestamp:crypto.randomBytes(16).toString('hex')`
  - QR rotates every `QR_REFRESH_INTERVAL` ms (set to 1,000,000ms in code — *likely a config oversight, as comment says 10 seconds*)
  - On session end: `prisma.attendance.createMany(...)` for all attendees, `deleteMany` for session, persist absent students too
  - Sends bulk notification to enrolled students on session start

### `paymentController` (Financial Transactions)
- **Responsibility**: Multi-gateway payment processing
- **Input**: Payment intent requests, webhook callbacks
- **Output**: Payment URLs, capture confirmations, invoice status updates
- **Dependencies**: `prisma`, `paypal.js`, `paymob.js`, `periodHelpers`
- **Key Logic (PayPal)**:
  1. Collect all pending invoices for student/semester
  2. Call PayPal REST API to create order (`/v2/checkout/orders`)
  3. Store `paypal_order_id` on invoices
  4. On capture: call PayPal capture API, create `payments` record, mark invoices paid, create `student_payments` aggregate record (all in `$transaction`)
- **Key Logic (Paymob)**:
  1. Get Paymob auth token via API key
  2. Register Paymob order
  3. Create payment key
  4. Return iframe URL to client
  5. Webhook: verify HMAC-SHA512 of sorted keys, mark invoices paid in `$transaction`

### `notificationService` (Notification Dispatch)
- **Responsibility**: Unified notification dispatch (DB + Socket + FCM)
- **Input**: `{ userId, message, type, io }` or `{ userIds, ... }` for bulk
- **Output**: Persisted notification record, Socket.IO emit, FCM push
- **Preference Filtering**: Checks `notification_preferences` table before sending — skips if preference disabled for that type
- **Socket.IO**: Emits to `notifications:<userId>` room for `new-notification` and `unread-count` events
- **FCM**: Calls `sendToTokens` for all active device tokens for the user
- **Dead Token Cleanup**: On global broadcast, deactivates failed FCM tokens in DB

### `periodHelpers` (Academic Calendar Logic)
- **Responsibility**: Determine if registration/payment windows are open
- **Dependencies**: `prisma`, `cacheService`
- **Logic**: Queries `academic_calendar` table for events matching `registration_start`/`registration_end` (or `payment_start`/`payment_end`) for the given semester/year, applies precedence rules, returns `{ isOpen, startDate, endDate, nextOpenDate }`
- **Cache TTL**: 10 minutes for period lookups, 30 minutes for current semester

### `academicRules` (Pure Business Rules)
- `computeYearLevel(totalCredits)`: Returns 1–4 based on credit thresholds
- `getMaxSemesterHours(cgpa)`: Returns 18 (default) or 21 (if CGPA > 3.3)
- `isEligibleForGraduation(totalCredits)`: Returns true if credits >= 140

---

## 8. Repository/Data Access Layer

All data access is performed directly via the `prisma` singleton exported from `src/config/connection.js`. There is no separate repository layer; controllers call `prisma.*` methods directly.

### Access Patterns

**users table**:
- `findUnique({ where: { email } })` — login lookup
- `findUnique({ where: { id } })` — profile fetch
- `findMany({ where, select, orderBy, skip, take })` — paginated management lists
- `create({ data })` — user creation
- `createMany({ data, skipDuplicates: true })` — bulk import
- `update({ where, data })` — profile/password update
- `delete({ where })` — user deletion

**enrollments table**:
- `findMany({ where, include: { users, lectures, tutorials_labs } })` — enrollment lists
- `create({ data })` — enroll student
- `update({ where: { id }, data: { status: 'dropped' } })` — drop course
- Uses `$transaction` with enrollment + invoice creation + `enrolled_count` increment

**invoices table**:
- `findMany({ where: { student_user_id, status: { in: ['pending', 'failed'] } } })` — unpaid invoices
- `update({ where, data: { status: 'paid', payment_date } })` — mark paid

**notifications table**:
- `create({ data: { user_id, message, type } })` — create notification
- `createMany({ data })` — bulk create
- `findMany({ where: { user_id }, orderBy: { created_at: 'desc' } })` — paginated notifications
- `updateMany({ where: { user_id }, data: { is_read: true } })` — mark all read

**attendance table**:
- `createMany({ data: attendanceRows, skipDuplicates: true })` — persist session end
- `upsert(...)` — update single record

**refresh_tokens table**:
- `findUnique({ where: { token }, include: { users: true } })` — refresh lookup
- `updateMany({ where: { user_id }, data: { revoked: true } })` — revoke all on logout/password change

**Prisma Selectors** (from `src/prisma/selectors/`):
- `userPublicSelect`: Excludes `password_hash`, `failed_login_attempts`, `locked_until`, `must_change_password`
- `studentProfileSelect`: Nested select including department data

---

## 9. Middleware Analysis

### Execution Order (typical authenticated GET request)
```
1. Helmet (security headers)
2. CORS (origin validation)
3. Cookie-Parser (parse cookies)
4. globalLimiter (300 req/15min per IP)
5. express.json() (body parsing)
6. [Route match]
7. authMiddleware (JWT verification → req.user)
8. authorizationMiddleware (role check → 403 or next)
9. [optional] validate(schema) (Zod validation → 422 or next)
10. [optional] cacheMiddleware (Redis check → cache hit or next)
11. Controller handler
```

### `authMiddleware`
- **Purpose**: JWT access token verification
- **Input**: `Authorization: Bearer <token>` header
- **Output**: Attaches `req.user = { userId, role, id }` (id is alias for userId)
- **Error**: 401 "Authentication required" (no token), 401 "Token expired", 401 "Invalid token"
- **Optional variant** (`optionalAuthMiddleware`): Swallows errors, still attaches `req.user` if valid, continues without user if invalid

### `authorizationMiddleware(...allowedRoles)`
- **Purpose**: Role-based access control factory
- **Input**: `req.user.role`
- **Output**: 403 "Access denied" or `next()`
- **Pattern**: Used after `authMiddleware`, always

### `globalLimiter`
- **Config**: 300 requests / 15 minutes / IP
- **Response on limit**: 429 with JSON `{ message: "Too many requests..." }`

### `loginLimiter`
- **Config**: 10 failed attempts / 15 minutes / IP
- **skipSuccessfulRequests**: true (successful logins don't count)
- **Applied on**: `POST /api/v1/auth/login` only

### `validate(schema)`
- **Purpose**: Zod schema validation factory
- **Input**: Request body
- **Output**: 422 with `{ message: "Validation failed", errors: fieldErrors }` or replaces `req.body` with parsed data and calls `next()`

### `cacheMiddleware({ key, ttl })`
- **Purpose**: Redis GET response caching
- **Input**: `req.originalUrl`, cache key pattern (supports `{userId}` placeholder)
- **Logic**: Check Redis → return cached JSON on hit; monkey-patch `res.json` to cache response on miss; only caches 2xx responses
- **Fail-open**: Cache errors don't break the request

### `uploadMiddleware`
- **`upload`**: General Multer, memory storage, 50MB limit, accepts any file type
- **`uploadExcel`**: Excel-specific Multer, memory storage, 5MB limit, validates MIME type

### `blockIfUnpaidInvoices` (paymentMiddleware)
- **Purpose**: Payment gate — blocks students with pending invoices from certain actions
- **Input**: `req.user` (student/leader roles only)
- **Output**: 402 with `{ error, pendingInvoices, totalDue }` or `next()`

---

## 10. Socket.IO Architecture

### Initialization
- **File**: `src/utils/socketIO.js`
- **Attached to**: HTTP server via `new Server(httpServer, { cors: { origin: '*', methods: ['GET', 'POST'] } })`
- **io instance**: Stored in Express app: `app.set('io', io)` — accessible in controllers via `req.app.get('io')`
- **Namespace**: Default (`/`)

### Authentication
- **Method**: `io.use((socket, next) => ...)` — authenticates before connection accepted
- **Token source**: `socket.handshake.auth.token`
- **On success**: `socket.user = { userId, role }`
- **On failure**: Emits connection error

### Connection Lifecycle
1. Client sends connection request with `auth.token`
2. Server middleware verifies JWT → sets `socket.user`
3. `io.on('connection', ...)` fires
4. Server auto-joins client to `notifications:<userId>` room
5. Client may emit `join-session` to also join `session:<sessionId>`
6. Client disconnects → `disconnect` event logged

### Room Strategy
| Room | Purpose | Who Joins |
|---|---|---|
| `notifications:<userId>` | Personal notification delivery | Every authenticated user on connect |
| `session:<sessionId>` | Live attendance monitoring | Instructors manually via `join-session` |

### Event Catalog

#### Client → Server Events
| Event | Sender | Payload | Server Action |
|---|---|---|---|
| `join-session` | Instructor | `sessionId: String` | Join `session:<sessionId>` room; emit `session-joined` with current state |
| `scan-qr` | Student | `{ qrCode: String }` | Validate QR token, verify enrollment, add to attendees Set, emit `scan-success` to student + broadcast `student-marked-present` to session room |
| `toggle-attendance` | Instructor | `{ sessionId, student_user_id }` | Verify instructor authority, toggle student in attendees Set, emit `toggle-success` to instructor + broadcast `attendance-toggled` to session room |
| `leave-session` | Instructor | `sessionId: String` | Leave the session room |
| `disconnect` | Any | — | Log disconnection |

#### Server → Client Events
| Event | Room/Target | Payload | Trigger |
|---|---|---|---|
| `session-joined` | socket (unicast) | `{ sessionId, qrCode, qrExpiry, students, presentCount, totalCount }` | Response to `join-session` |
| `scan-success` | socket (unicast) | `{ message, status, sessionId }` | Student successfully marks attendance |
| `scan-error` | socket (unicast) | `{ message }` | QR validation failure |
| `toggle-success` | socket (unicast) | `{ message, student, presentCount, totalCount }` | Attendance toggled |
| `toggle-error` | socket (unicast) | `{ message }` | Toggle failure |
| `qr-code-updated` | `session:<id>` (room) | `{ sessionId, qrCode, qrExpiry }` | Automatic QR rotation via `setInterval` |
| `student-marked-present` | `session:<id>` (room) | `{ student: {...}, presentCount, totalCount }` | Student scans successfully |
| `attendance-toggled` | `session:<id>` (room) | `{ student: {...}, presentCount, totalCount }` | Instructor toggles attendance |
| `new-notification` | `notifications:<userId>` | `{ id, message, type, is_read, created_at }` | `sendNotification()` called from any controller |
| `unread-count` | `notifications:<userId>` | `{ unreadCount }` | Emitted alongside `new-notification` |
| `error` | socket (unicast) | `{ message }` | Session not found or other errors |

### QR Code Rotation
- **Mechanism**: `setInterval` in `socketIO.js`, fires every `QR_REFRESH_INTERVAL` ms
- **Action**: Iterates `activeSessions` Map, generates new QR token per session, broadcasts `qr-code-updated` to session room
- **Token format**: `sessionId:timestamp:16-byte-hex`

---

## 11. Caching Layer

### Cache Provider
- Redis via `ioredis` client
- **Connection**: `CACHE_REDIS_URL` or `CACHE_REDIS_HOST/PORT/DB/USERNAME/PASSWORD`
- **Kill-switch**: `CACHE_ENABLED=false` disables all caching without code changes

### Cache Operations
| Function | TTL | Purpose |
|---|---|---|
| `getCache(key)` | — | Fetch from Redis, returns parsed JSON or null |
| `setCache(key, data, ttlSeconds)` | Default 300s | Store JSON in Redis with TTL |
| `delCache(key)` | — | Delete single key |
| `invalidateByPattern(pattern)` | — | SCAN + DEL for glob pattern |
| `tryAcquireLock(key, ttl)` | Default 10s | SET NX for stampede prevention |
| `releaseLock(key)` | — | DEL lock key |
| `getCacheStats()` | — | Returns { hits, misses, hitRate } |

### Cache Key Patterns
| Pattern | TTL | Invalidated By |
|---|---|---|
| `v1:departments:*` | varies | `onDepartmentChange` |
| `v1:financials:*` | varies | `onDepartmentChange`, `onFinancialChange` |
| `v1:teachers:*` | varies | `onDepartmentChange`, `onUserChange` |
| `v1:registration:available:*` | varies | `onEnrollmentChange`, `onOfferingChange` |
| `v1:schedule:student:*` | varies | `onEnrollmentChange` |
| `v1:courses:student:*` | varies | `onEnrollmentChange` |
| `v1:admin:alerts` | varies | `onEnrollmentChange`, `onAttendanceChange`, `onLectureChange`, `onUserChange` |
| `v1:admin:enrollment-trends:*` | varies | `onEnrollmentChange` |
| `v1:admin:payment-aging` | varies | `onEnrollmentChange` |
| `v1:doctor:alerts:*` | varies | `onEnrollmentChange`, `onGradeChange`, `onTaskSubmissionChange` |
| `v1:ta:alerts:*` | varies | `onEnrollmentChange`, `onGradeChange`, `onTaskSubmissionChange` |
| `v1:grades:*` | varies | `onGradeChange` |
| `v1:leaderboard:gpa:*` | varies | `onGradeChange` |
| `v1:leaderboard:activities:*` | varies | `onGradeChange`, `onCommunityChange`, `onTaskSubmissionChange` |
| `v1:leaderboard:attendance:*` | varies | `onAttendanceChange` |
| `v1:courses:*` | varies | `onOfferingChange` |
| `v1:course:detail:*` | varies | `onOfferingChange`, `onLectureChange` |
| `v1:course-offerings:*` | varies | `onOfferingChange` |
| `v1:semester:*` | 30min | `onOfferingChange` |
| `v1:period:*` | 10min | `onOfferingChange`, `onCalendarChange` |
| `v1:exams:*` | varies | `onExamChange` |
| `v1:exam:schedule:*` | varies | `onExamChange` |
| `v1:announcements:*` | varies | `onAnnouncementChange` |
| `v1:admin:activity:*` | varies | `onAnnouncementChange` |
| `v1:calendar:*` | varies | `onCalendarChange` |
| `v1:community:feed:*` | varies | `onCommunityChange` |
| `v1:materials:*` | varies | `onLectureChange` |
| `v1:schedule:teacher:*` | varies | `onLectureChange` |
| `v1:doctor:courses:*` | varies | `onLectureChange` |

---

## 12. Background Jobs

### BullMQ Queue: `user_excel_imports`
- **File**: `src/utils/userImportQueue.js`
- **Queue Provider**: BullMQ + ioredis (separate connection from app cache Redis)
- **Redis Connection**: `REDIS_URL` or `REDIS_HOST/PORT/DB`
- **Worker Concurrency**: `USER_IMPORT_WORKER_CONCURRENCY` env (default 3)
- **Trigger**: `POST /users/upload-excel` or `POST /users/upload-excel/students` when row count exceeds `EXCEL_IMPORT_ASYNC_THRESHOLD` (default 200)
- **Job Payload**: `{ importType: "users"|"students", fileBufferBase64: string, requestedBy: string|null }`
- **Processor**: `processImportJob(job)` → calls either `processExcelUsersBuffer` or `processExcelStudentsBuffer`
- **Progress Tracking**: `job.updateProgress(percent)` called during processing
- **Job Options**: `attempts: 1`, `removeOnComplete: { count: 100 }`, `removeOnFail: { count: 100 }`
- **Retry Strategy**: No retry (attempts: 1); on failure, job stays in failed state for 100 entries
- **Graceful Degradation**: If Redis is unavailable, queue disables itself and falls back to synchronous processing

### Exam Reminder Job (Scheduled Timer)
- **File**: `src/utils/examReminderJob.js`
- **Trigger**: `startExamReminderJob(io)` called from `server.js` at startup
- **Schedule**: Aligned to next midnight via `setTimeout`, then `setInterval` every 24 hours
- **Logic**: Queries `exams` table for exams with `exam_date` between tomorrowStart and tomorrowEnd; queries enrolled students for each exam's offering; sends `exam_deadline` notification to each
- **DB Access**: `prisma.exams.findMany(...)` + `prisma.enrollments.findMany(...)` per exam
- **Output**: In-app notification + Socket.IO emit + FCM push per student

### QR Code Rotation (setInterval)
- **File**: `src/utils/socketIO.js`
- **Trigger**: `setInterval` started on Socket.IO initialization
- **Interval**: Every `QR_REFRESH_INTERVAL` ms
- **Logic**: For each entry in `activeSessions`, generates new QR token, broadcasts to session room

---

## 13. External Integrations

### 1. Supabase Storage
- **Purpose**: Cloud file storage for avatars, course materials
- **Authentication**: Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`) — bypasses RLS
- **SDK**: `@supabase/supabase-js` v2
- **Bucket**: Configured via environment
- **Operations**:
  - `supabase.storage.from(bucket).upload(path, buffer)` — upload file
  - `supabase.storage.from(bucket).createSignedUrl(path, seconds)` — generate download URL
  - `supabase.storage.from(bucket).remove([path])` — delete file
- **Files used**: `src/utils/supabase.js`, `src/controllers/materialsController.js`, `src/controllers/usersController.js`

### 2. Firebase Cloud Messaging (FCM)
- **Purpose**: Push notifications to iOS, Android, and Web clients
- **Authentication**: Service Account JSON via `FIREBASE_SERVICE_ACCOUNT_KEY` env (stringified JSON)
- **SDK**: `firebase-admin` v13
- **Operations**:
  - `admin.messaging().sendEachForMulticast({ tokens, notification, data })` — multicast (up to 500 tokens per call)
  - Chunked broadcast via `broadcastGlobal` for system-wide announcements
- **Error Handling**: Invalid/unregistered tokens detected via error codes, deactivated in `device_tokens` table
- **Graceful Init**: If `FIREBASE_SERVICE_ACCOUNT_KEY` not set, FCM silently bypassed
- **Files used**: `src/utils/fcmService.js`, `src/utils/notificationService.js`

### 3. PayPal REST API
- **Purpose**: International tuition payment processing (USD)
- **Authentication**: Client Credentials OAuth2 (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`)
- **Environment**: Sandbox or Live via `PAYPAL_ENV`
- **Base URL**: `https://api-m.sandbox.paypal.com` (sandbox) or `https://api-m.paypal.com` (live)
- **Endpoints used**:
  - `POST /v1/oauth2/token` — get access token
  - `POST /v2/checkout/orders` — create order
  - `POST /v2/checkout/orders/:id/capture` — capture payment
- **Files used**: `src/config/paypal.js`, `src/controllers/paymentController.js`

### 4. Paymob Payment Gateway
- **Purpose**: Regional tuition payment processing (EGP, Egypt-focused)
- **Authentication**: API Key (`PAYMOB_API_KEY`), then session token per transaction
- **Base URL**: `https://accept.paymobsolutions.com` (or `PAYMOB_BASE_URL`)
- **Endpoints used**:
  - `POST /api/auth/tokens` — get auth token
  - `POST /api/ecommerce/orders` — register order
  - `POST /api/acceptance/payment_keys` — create payment key
  - `GET /api/acceptance/transactions/:id` — get transaction status
  - `POST /api/ecommerce/orders/transaction_inquiry` — inquire order
  - `GET /api/acceptance/iframes/:iframeId?payment_token=...` — hosted iframe URL
- **Webhook**: `POST /payments/invoices/paymob-webhook` — HMAC-SHA512 verification of sorted query params
- **Files used**: `src/config/paymob.js`, `src/controllers/paymentController.js`

### 5. Redis (ioredis)
- **Purpose (1)**: Application-level caching (cache-aside pattern)
  - Connection: `CACHE_REDIS_URL` or `CACHE_REDIS_HOST/PORT`
  - Managed by: `src/config/redis.js`
- **Purpose (2)**: BullMQ job queue state management
  - Connection: `REDIS_URL` or `REDIS_HOST/PORT`
  - Managed by: `src/utils/userImportQueue.js`
- **Note**: Two separate Redis connections can point to different Redis instances

---

## 14. Error Handling Architecture

### Per-Controller Error Handling
- Each controller wraps its logic in `try/catch`
- `catch` block calls `logger.error(err)` and returns `500 { message: "Internal server error" }`

### Validation Errors
- Zod `validate` middleware: 422 `{ message: "Validation failed", errors: flattenedFieldErrors }`
- Manual validation: 400/422 with `{ error/message: "..." }`

### Business Rule Errors
- Standard HTTP status codes: 400 (bad request), 403 (forbidden), 404 (not found), 409 (conflict), 402 (payment required)
- Response format: `{ error: "..." }` or `{ message: "..." }` (inconsistent across controllers)

### Process-Level Error Handling (server.js)
```
process.on('unhandledRejection') → logger.error + server.close + disconnectDB + closeRedisClient + process.exit(1)
process.on('uncaughtException')  → logger.error + disconnectDB + closeRedisClient + process.exit(1)
process.on('SIGTERM')            → graceful shutdown: server.close + disconnectDB + closeRedisClient + process.exit(0)
```

### Response Format (observed patterns)
| Scenario | Status | Body |
|---|---|---|
| Success | 200/201 | `{ data } or { message, ...data }` |
| Validation error | 422 | `{ message: "Validation failed", errors: {} }` |
| Auth required | 401 | `{ message: "Authentication required" }` |
| Access denied | 403 | `{ message: "Access denied" }` |
| Not found | 404 | `{ message: "..." }` or `{ error: "..." }` |
| Conflict | 409 | `{ error: "..." }` |
| Rate limit | 429 | `{ message: "Too many requests..." }` |
| Payment required | 402 | `{ error, pendingInvoices, totalDue }` |
| Server error | 500 | `{ message: "Internal server error" }` or `{ error: "..." }` |

---

## 15. Security Architecture

| Security Layer | Implementation |
|---|---|
| Security Headers | `helmet()` — sets CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc. |
| CORS | `cors({ origin: process.env.FRONTEND_URL, credentials: true })` — restricted to configured frontend |
| Rate Limiting | Global: 300/15min per IP; Login: 10/15min per IP (successful requests not counted) |
| Authentication | JWT (HS256, short-lived access + HttpOnly cookie refresh) |
| Authorization | Role-based via `authorizationMiddleware(...roles)` factory |
| Password Hashing | bcrypt with cost factor 12 |
| Account Lockout | Tracks `failed_login_attempts`, sets `locked_until` timestamp |
| Cookie Security | `httpOnly: true`, `secure: true` (production), `sameSite: 'lax'`, scoped to `/api/v1/auth` |
| SQL Injection | Prisma ORM with parameterized queries (no raw SQL in controllers) |
| Input Validation | Zod schemas on critical endpoints |
| File Upload | Multer with MIME type filter for Excel; file stored in memory, never on disk |
| Payment Webhook Auth | HMAC-SHA512 verification of Paymob webhook payload |
| Refresh Token Rotation | Each use rotates token; old token revoked in atomic `$transaction` |
| Token Revocation | DB-backed revocation list; all tokens revocable on password change/logout |
| Force Password Change | `must_change_password` flag; first-login students use national_id as temp password |
| Supabase | Service Role key for backend operations (bypasses RLS — kept server-side only) |
| BigInt Serialization | Global `BigInt.prototype.toJSON` patch to prevent JSON crashes |

---

## 16. Application Lifecycle

### Startup Sequence
```
1. dotenv config() — load .env file
2. connectDB() — Prisma $connect() to PostgreSQL; exit(1) on failure
3. Express app created, HTTP server created
4. initializeSocketIO(httpServer) — attach Socket.IO, set up auth middleware + event handlers; set io on app
5. startExamReminderJob(io) — schedule daily exam reminder (setTimeout aligned to midnight)
6. initializeUserImportQueue() — attempt Redis connection; create BullMQ Queue + Worker; fail-open if Redis unavailable
7. app.use(helmet()) — security headers
8. app.use(cors({...})) — CORS
9. app.use(cookieParser()) — cookie parsing
10. app.use(globalLimiter) — rate limiting
11. app.use(express.json()) — JSON body parsing
12. BigInt.toJSON patch
13. Route mounting (24 route modules)
14. Swagger UI mounting at /docs
15. httpServer.listen(port) — begin accepting connections
16. Process signal handlers registered (SIGTERM, uncaughtException, unhandledRejection)
```

### Shutdown Sequence
```
SIGTERM signal received
  → server.close() (stop accepting new connections)
  → disconnectDB() (Prisma $disconnect)
  → closeRedisClient() (ioredis quit)
  → process.exit(0)
```

---

## 17. Dependency Graph

```
server.js
├── authRoutes → authController
│     ├── prisma (users, refresh_tokens)
│     ├── bcrypt
│     ├── jsonwebtoken
│     └── logger
│
├── usersRoutes → usersController
│     ├── prisma (users, student_profiles, departments)
│     ├── bcrypt
│     ├── supabase
│     ├── userImportQueue (enqueueUserImportJob, getUserImportJobStatus, isUserImportQueueEnabled)
│     ├── userImportService (processExcelUsersBuffer, processExcelStudentsBuffer, countDataRowsFromExcelBuffer)
│     │     ├── prisma
│     │     ├── exceljs
│     │     └── bcrypt
│     ├── CacheInvalidation (onUserChange)
│     └── logger
│
├── registrationRoutes → registrationController
│     ├── prisma (enrollments, users, lectures, tutorials_labs, course_offerings, invoices)
│     ├── periodHelpers → prisma + cacheService
│     ├── academicRules (pure)
│     ├── cacheService (getCache, setCache, invalidateByPattern)
│     ├── CacheInvalidation (onEnrollmentChange)
│     ├── notificationService → prisma + io + fcmService
│     └── logger
│
├── attendanceRoutes → attendanceController
│     ├── prisma (lectures, tutorials_labs, enrollments, attendance)
│     ├── activeSessions (in-memory Map)
│     ├── uuid
│     ├── crypto
│     ├── notificationService
│     └── logger
│
├── paymentRoutes → paymentController
│     ├── prisma (invoices, payments, student_payments, enrollments)
│     ├── paypal (config/paypal.js → PayPal REST API)
│     ├── paymob (config/paymob.js → Paymob REST API)
│     ├── periodHelpers
│     └── logger
│
├── gradeRoutes → gradeController
│     ├── prisma (enrollments, grade_distributions, student_profiles)
│     └── CacheInvalidation (onGradeChange)
│
├── notificationRoutes → notificationController
│     ├── prisma (notifications, notification_preferences, device_tokens)
│     ├── notificationService
│     └── io (via req.app.get('io'))
│
├── communityRoutes → communityController
│     ├── prisma (community_posts, post_comments, post_likes, community_groups, group_members, events)
│     ├── supabase
│     └── CacheInvalidation (onCommunityChange)
│
├── taskRoutes → taskController
│     ├── prisma (tasks, task_submissions)
│     ├── supabase
│     ├── notificationService
│     └── CacheInvalidation (onTaskSubmissionChange)
│
├── socketIO.js
│     ├── jwt
│     ├── activeSessions (from attendanceController)
│     └── logger
│
├── userImportQueue.js
│     ├── ioredis
│     ├── bullmq (Queue, Worker)
│     └── userImportService
│
└── examReminderJob.js
      ├── prisma
      └── notificationService
```

---

## 18. Sequence Flow Specifications

### 18.1 User Login
```
Client                    loginLimiter       validate()      authController          prisma                 JWT
  │                           │                 │                 │                    │                   │
  │── POST /auth/login ────>  │                 │                 │                    │                   │
  │                           │ Rate check       │                 │                    │                   │
  │ <── 429 (if exceeded) ──  │                 │                 │                    │                   │
  │                           │── pass ────>    │                 │                    │                   │
  │                           │                 │ Zod validate     │                    │                   │
  │ <── 422 (if invalid) ─────────────────────  │                 │                    │                   │
  │                           │                 │── pass ────>    │                    │                   │
  │                           │                 │                 │── findUnique(email) →                  │
  │                           │                 │                 │                    │── row ──>          │
  │                           │                 │                 │ Check locked_until │                   │
  │ <── 401 (if locked) ──────────────────────────────────────────│                    │                   │
  │                           │                 │                 │ bcrypt.compare()   │                   │
  │ <── 401 (if invalid pw) ──────────────────────────────────────│ update failures    │                   │
  │                           │                 │                 │ reset failures      │                   │
  │                           │                 │                 │── update(reset) ──>│                   │
  │                           │                 │                 │── jwt.sign() ──────────────────────── >│
  │                           │                 │                 │                    │── create token ─> │
  │                           │                 │                 │── refresh_tokens.create ──>            │
  │ <── 200 {accessToken} + Set-Cookie ─────────────────────────  │                    │                   │
```

### 18.2 Refresh Token
```
Client                        authController         prisma              JWT
  │                               │                    │                  │
  │── POST /auth/refresh ──────>  │                    │                  │
  │   (Cookie: refreshToken)      │                    │                  │
  │                               │── findUnique(token, include: users) →│
  │                               │                    │── row ──────>    │
  │                               │ Check revoked/expired                  │
  │ <── 401 ──────────────────── │                                        │
  │                               │── $transaction([revoke, create]) ─── >│
  │                               │── jwt.sign({userId, role}) ──────────>│
  │                               │                    │   accessToken <── │
  │ <── 200 {accessToken} + new cookie ──────────────── │                  │
```

### 18.3 Authenticated API Request (Cached GET)
```
Client         authMiddleware   cacheMiddleware    Controller      Redis         prisma
  │               │                 │                 │              │             │
  │── GET ──────> │                 │                 │              │             │
  │               │ verify JWT      │                 │              │             │
  │ <── 401 ────  │                 │                 │              │             │
  │               │── req.user ──>  │                 │              │             │
  │               │                 │── getCache(key) → Redis ──────>│             │
  │               │                 │                 │ <── hit ─────│             │
  │ <── 200 (cached) ──────────────────────────────── │              │             │
  │               │                 │                 │ <── miss ────│             │
  │               │                 │── next() ──────>│              │             │
  │               │                 │                 │── findMany() ────────────> │
  │               │                 │                 │ <── rows ─────────────── │ │
  │               │                 │ setCache(key) <─ │              │             │
  │ <── 200 (fresh) ───────────────────────────────── │              │             │
```

### 18.4 Enrollment Flow
```
Client         authMiddleware   registrationController    periodHelpers    prisma          notificationService
  │               │                     │                     │              │                   │
  │── POST /registration/enroll ──────> │                     │              │                   │
  │               │── req.user ──────>  │                     │              │                   │
  │               │                     │── isRegistrationOpen() ──────────> │                   │
  │               │                     │ <── { isOpen: false } ──────────── │                   │
  │ <── 403 (window closed) ────────── │                     │              │                   │
  │               │                     │── check prerequisite enrollments ─> │                  │
  │               │                     │── check credit cap (academicRules)   │                  │
  │               │                     │── check capacity                      │                  │
  │               │                     │── check time conflict                 │                  │
  │               │                     │── $transaction:                        │                  │
  │               │                     │     enrollments.create ──────────────> │                  │
  │               │                     │     invoices.create ─────────────────> │                  │
  │               │                     │     lectures.update(enrolled_count++) ─> │                │
  │               │                     │── CacheInvalidation.onEnrollmentChange   │                │
  │               │                     │── sendNotification(enrolled) ──────────────────────────> │
  │ <── 201 { enrollment, invoice } ─── │                     │              │                   │
```

### 18.5 Attendance Session Start
```
Client (Instructor)    authController    attendanceController    prisma      Socket.IO    notificationService
  │                        │                    │                  │             │              │
  │── POST /sessions/start ──────────────────> │                  │             │              │
  │                        │                    │── verify instructor owns lecture ──>           │
  │                        │                    │── enrollments.findMany() ──────>              │
  │                        │                    │ sessionId = uuidv4()                          │
  │                        │                    │ qrCode = generateQRCode(sessionId)            │
  │                        │                    │ activeSessions.set(sessionId, {...})           │
  │                        │                    │── sendBulkNotification(enrolledUserIds) ─────> │
  │ <── 201 {sessionId, qrCode, qrExpiry, enrolledStudents} ─── │             │              │
  │                        │                    │                  │             │              │
  │── WS connect ──────────────────────────────────────────────────────────────>│              │
  │── emit join-session(sessionId) ─────────────────────────────────────────── >│              │
  │ <── session-joined {qrCode, students} ──────────────────────────────────── │              │
```

### 18.6 QR Scan (WebSocket)
```
Student Socket     socketIO.js         activeSessions (RAM)      prisma (deferred)
  │                   │                        │                      │
  │── scan-qr({qrCode}) ──────────────────── > │                      │
  │                   │── get(sessionId) ────> │                      │
  │                   │ <── session ────────── │                      │
  │                   │ validate qrCode matches session.qrCode        │
  │ <── scan-error ─  │ validate timestamp < qrExpiry                 │
  │                   │ check studentId in enrolledStudents           │
  │                   │ check not already in attendees Set            │
  │                   │── session.attendees.add(studentId) ──────────>│
  │ <── scan-success  │                        │                      │
  │                   │── broadcast to session room ─────────────────>│ (deferred to session end)
```

### 18.7 Notification Flow
```
Trigger (controller)    notificationService    prisma        Socket.IO          FCMService         Firebase
  │                           │                  │              │                   │                │
  │── sendNotification({})─>  │                  │              │                   │                │
  │                           │── checkPreferences ──────────>  │                  │                │
  │                           │ <── preferences ──────────────  │                  │                │
  │                           │ [if preference enabled]          │                  │                │
  │                           │── notifications.create ────────> │                  │                │
  │                           │ <── notification ──────────────  │                  │                │
  │                           │── io.to(notifications:userId).emit('new-notification') ────>        │
  │                           │── io.to(notifications:userId).emit('unread-count') ───────>         │
  │                           │── device_tokens.findMany(active) ───────────────────────────────>   │
  │                           │── sendToTokens(tokens, payload) ─────────────────>│                │
  │                           │                  │              │                   │── multicast ──>│
```

### 18.8 Payment Flow (PayPal)
```
Student          paymentController         prisma           PayPal REST API
  │                    │                     │                    │
  │── POST /invoices/paypal-order ─────────> │                    │
  │                    │── validate payAll=true                    │
  │                    │── invoices.findMany(pending/failed) ────> │
  │                    │ check payment period open (periodHelpers) │
  │                    │── paypalRequest(POST /v2/checkout/orders) ────────────> │
  │                    │ <── { id: orderId } ─────────────────────────────────── │
  │                    │── invoices.updateMany({ paypal_order_id: orderId }) ──> │
  │ <── 201 { orderId } ─ │                     │                    │
  │                    │                     │                    │
  │── POST /invoices/capture {orderId} ────> │                    │
  │                    │── paypalRequest(POST /v2/.../capture) ─────────────────>│
  │                    │ <── captureData ────────────────────────────────────────│
  │                    │── $transaction:                             │
  │                    │    invoices.updateMany(paid) ─────────────> │
  │                    │    payments.create ────────────────────────> │
  │                    │    student_payments.create ────────────────> │
  │ <── 200 { success } ─ │                     │                    │
```

---

## 19. Deployment Architecture

### Current Architecture (Development/Production)

```
Internet
   │
   ▼
┌─────────────────────────────────────────┐
│         Reverse Proxy (Nginx/Caddy)     │  (Assumption based on standard Node.js deployment)
│   HTTPS :443 → HTTP :3000               │
│   WSS   :443 → WS  :3000               │
└─────────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────────┐
│         Node.js Process                 │
│  ┌─────────────────────────────────┐   │
│  │     Express HTTP Server          │   │
│  │     Socket.IO Server             │   │
│  │     BullMQ Worker                │   │
│  │     Exam Reminder Timer          │   │
│  └─────────────────────────────────┘   │
│  Port: 3000                             │
└─────────────────────────────────────────┘
   │          │          │          │
   ▼          ▼          ▼          ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌──────────────┐
│ PG   │ │Redis │ │Redis │ │ Supabase     │
│ 5432 │ │(BQ)  │ │(App) │ │ (Storage)    │
└──────┘ └──────┘ └──────┘ └──────────────┘
                              │
                              ▼ (external APIs)
                    ┌────────────────────┐
                    │ Firebase FCM       │
                    │ PayPal API         │
                    │ Paymob API         │
                    └────────────────────┘
```

### Components
| Component | Technology | Port | Notes |
|---|---|---|---|
| Backend Server | Node.js v25+, Express v5 | 3000 | Single process |
| WebSocket | Socket.IO v4 | 3000 (shared) | Upgrade on same port |
| Database | PostgreSQL | 5432 | Via Prisma + PrismaPg native driver |
| App Cache | Redis | 6379 (configurable) | Separate from BullMQ connection |
| Job Queue | Redis (BullMQ) | 6379 (configurable) | Can be same or different Redis |
| File Storage | Supabase Storage | HTTPS/443 | External |
| Push Notifications | Firebase FCM | HTTPS/443 | External |
| Payment (PayPal) | PayPal API | HTTPS/443 | External |
| Payment (Paymob) | Paymob API | HTTPS/443 | External |
| API Docs | Swagger UI | 3000 | Served at /docs |
| Logs | Winston | — | File: logs/error.log, logs/combined.log |

---

## 20. DIAGRAM GENERATION DATA

### ACTORS
| Actor | Description |
|---|---|
| Student | Enrolled student; registers for courses, submits tasks, pays invoices, views grades |
| Leader | Student body leader; same privileges as Student |
| Doctor | Faculty instructor; manages lectures, grades, attendance, materials |
| Teaching Assistant (TA) | Manages tutorials/labs, attendance, task grading |
| Admin | Administrative staff; manages users, courses, departments, exams |
| Super Admin | Top-level admin; manages system config, calendar, registration periods |
| System (Scheduler) | Exam reminder job running in background |
| Paymob Server | External webhook sender for payment confirmations |

---

### SYSTEM COMPONENTS
| Component | Type | Technology |
|---|---|---|
| Express HTTP API | Backend | Node.js + Express v5 |
| Socket.IO Server | Real-time | Socket.IO v4 |
| BullMQ Worker | Background | BullMQ + ioredis |
| Exam Reminder Job | Scheduler | Node.js setInterval |
| Prisma ORM | Data Access | Prisma v7 + @prisma/adapter-pg |
| PostgreSQL | Database | PostgreSQL |
| Redis (Cache) | Cache Store | Redis + ioredis |
| Redis (Queue) | Message Broker | Redis + BullMQ |
| Supabase Client | Storage Client | @supabase/supabase-js |
| Firebase Admin SDK | Push Notification | firebase-admin |
| PayPal Client | Payment | fetch + PayPal REST API |
| Paymob Client | Payment | fetch + Paymob REST API |
| Winston Logger | Logging | winston |

---

### CONTROLLERS
| Controller | File | Route Prefix |
|---|---|---|
| AuthController | authController.js | /api/v1/auth |
| UsersController | usersController.js | /api/v1 |
| StudentProfileController | studentProfileController.js | /api/v1/student |
| LeaderboardController | leaderboard.controller.js | /api/v1/leaderboard |
| ScheduleController | scheduleController.js | /api/v1/schedule |
| MaterialsController | materialsController.js | /api/v1/materials |
| CommunityController | communityController.js | /api/v1/community |
| CourseController | courseController.js | /api/v1/courses |
| CourseOfferingController | courseOfferingController.js | /api/v1/course-offerings |
| TeacherController | teacherController.js | /api/v1/teachers |
| NotificationController | notificationController.js | /api/v1/notifications |
| ExamController | examController.js | /api/v1/exams |
| RegistrationController | registrationController.js | /api/v1/registration |
| SettingsController | settingsController.js | /api/v1/settings |
| AttendanceController | attendanceController.js | /api/v1/attendance |
| SystemConfigController | systemConfigController.js | /api/v1/config |
| GradeController | gradeController.js | /api/v1/grades |
| AdminDashboardController | adminDashboardController.js | /api/v1/admin |
| TaskController | taskController.js | /api/v1/tasks |
| DepartmentController | departmentController.js | /api/v1/departments |
| DoctorDashboardController | doctorDashboardController.js | /api/v1/doctor |
| TADashboardController | teachingAssistantDashboardController.js | /api/v1/teaching-assistant |
| FinancialController | financialController.js | /api/v1/financials |
| PaymentController | paymentController.js | /api/v1/payments |
| FAQController | faqController.js | /api/v1/faq |

---

### SERVICES
| Service | File | Consumed By |
|---|---|---|
| CacheService | services/cacheService.js | Controllers, periodHelpers, leaderboardService |
| CacheInvalidationService | services/cacheInvalidationService.js | Most mutation controllers |
| NotificationService | utils/notificationService.js | attendanceController, registrationController, gradeController, systemConfigController, notificationController |
| FCMService | utils/fcmService.js | notificationService |
| UserImportService | utils/userImportService.js | usersController, userImportQueue |
| UserImportQueue | utils/userImportQueue.js | usersController |
| PeriodHelpers | utils/periodHelpers.js | registrationController, paymentController, gradeController |
| AcademicRules | utils/academicRules.js | registrationController, studentProfileController |
| LeaderboardService | leaderboard/leaderboard.service.js | leaderboard.controller.js |
| SupabaseClient | utils/supabase.js | materialsController, usersController, taskController, communityController |
| PayPalConfig | config/paypal.js | paymentController |
| PaymobConfig | config/paymob.js | paymentController |
| Logger | utils/logger.js | All modules |
| ExamReminderJob | utils/examReminderJob.js | server.js |
| SocketIO | utils/socketIO.js | server.js |

---

### DATABASE ENTITIES (23 total)
users, student_profiles, refresh_tokens, device_tokens, departments, courses, course_prerequisites, course_offerings, lectures, tutorials_labs, enrollments, grade_distributions, attendance, exams, tasks, task_submissions, course_materials, files, invoices, payments, student_payments, financials, notifications, notification_preferences, community_groups, group_members, community_posts, post_comments, post_likes, announcements, academic_calendar, news_articles, testimonials, events

---

### ENTITY RELATIONSHIPS (ERD Data)
| From | Cardinality | To | Join Column |
|---|---|---|---|
| users | 1:1 | student_profiles | users.id = student_profiles.user_id |
| users | 1:N | refresh_tokens | users.id = refresh_tokens.user_id |
| users | 1:N | device_tokens | users.id = device_tokens.user_id |
| users | 1:N | notifications | users.id = notifications.user_id |
| users | 1:1 | notification_preferences | users.id = notification_preferences.user_id |
| users | 1:N | enrollments | users.id = enrollments.student_user_id |
| users | 1:N | invoices | users.id = invoices.student_user_id |
| users | 1:N | student_payments | users.id = student_payments.student_user_id |
| users | 1:N | lectures | users.id = lectures.instructor_id |
| users | 1:N | tutorials_labs | users.id = tutorials_labs.ta_id |
| users | 1:N | community_posts | users.id = community_posts.author_id |
| users | 1:N | post_comments | users.id = post_comments.author_id |
| users | M:N | post_likes | via post_likes [post_id, user_id] |
| users | M:N | community_groups | via group_members [group_id, user_id] |
| users | 1:N | files | users.id = files.uploaded_by_user_id |
| users | 1:N | task_submissions | users.id = task_submissions.student_id |
| users | 1:N | announcements | users.id = announcements.author_id |
| users | 1:N | academic_calendar | users.id = academic_calendar.created_by_user_id |
| users | 1:N | student_profiles (advisor) | users.id = student_profiles.faculty_advisor_id |
| departments | 1:N | courses | departments.department_id = courses.department_id |
| departments | 1:N | student_profiles | departments.department_id = student_profiles.department_id |
| departments | 1:1 | financials | departments.department_id = financials.department_id |
| courses | M:N | courses | via course_prerequisites [course_code, prerequisite_code] |
| courses | 1:N | course_offerings | courses.code = course_offerings.course_code |
| course_offerings | 1:N | lectures | course_offerings.offering_id = lectures.offering_id |
| course_offerings | 1:N | tutorials_labs | course_offerings.offering_id = tutorials_labs.offering_id |
| course_offerings | 1:N | exams | course_offerings.offering_id = exams.offering_id |
| lectures | 1:N | enrollments | lectures.lecture_id = enrollments.lecture_id |
| lectures | 1:N | attendance | lectures.lecture_id = attendance.lecture_id |
| lectures | 1:N | course_materials | lectures.lecture_id = course_materials.lecture_id |
| lectures | 1:N | tasks | lectures.lecture_id = tasks.lecture_id |
| lectures | 1:1 | grade_distributions | lectures.lecture_id = grade_distributions.lecture_id |
| tutorials_labs | 1:N | enrollments | tutorials_labs.tutorial_lab_id = enrollments.tutorial_lab_id |
| tutorials_labs | 1:N | attendance | tutorials_labs.tutorial_lab_id = attendance.tutorial_lab_id |
| tutorials_labs | 1:N | course_materials | tutorials_labs.tutorial_lab_id = course_materials.tutorial_lab_id |
| tutorials_labs | 1:N | tasks | tutorials_labs.tutorial_lab_id = tasks.tutorial_lab_id |
| enrollments | 1:1 | invoices | enrollments.id = invoices.enrollment_id |
| invoices | 1:N | payments | invoices.id = payments.invoice_id |
| tasks | 1:N | task_submissions | tasks.id = task_submissions.task_id |
| course_materials | N:1 | files | course_materials.file_id = files.file_id |
| community_posts | 1:N | post_comments | community_posts.id = post_comments.post_id |
| community_posts | M:N | users | via post_likes |
| community_groups | 1:N | community_posts | community_groups.id = community_posts.group_id |
| community_groups | M:N | users | via group_members |

---

### USE CASE CATALOGUE
| Use Case | Actor |
|---|---|
| Login | All Users |
| Logout | All Users |
| Refresh Token | All Users |
| Change Password | All Users |
| Update Own Profile | All Users |
| Register Device for Push Notifications | All Users |
| View Notifications | All Users |
| Mark Notification as Read | All Users |
| Update Notification Preferences | All Users |
| View FAQ | Anonymous |
| View Community Feed | All Users |
| Create Post | All Users |
| Like / Unlike Post | All Users |
| Comment on Post | All Users |
| Join Community Group | All Users |
| View Schedule | Student, Leader |
| View Available Offerings | Student, Leader |
| Enroll in Course | Student, Leader |
| Drop Course | Student, Leader |
| View Own Enrollments | Student, Leader |
| View Own Grades | Student, Leader |
| View Own Attendance History | Student, Leader |
| Scan QR Code (Attendance) | Student, Leader |
| View Own Invoices | Student, Leader |
| Pay Invoices via PayPal | Student, Leader |
| Pay Invoices via Paymob | Student, Leader |
| View Student Profile | Student, Leader |
| View Digital Student ID | Student, Leader |
| View Exam Schedule | Student |
| View Tasks | Doctor, TA, Student, Leader |
| Submit Task | Student, Leader |
| Start Attendance Session | Doctor, TA |
| End Attendance Session | Doctor, TA |
| Toggle Student Attendance | Doctor, TA |
| View Attendance Reports | Doctor, TA |
| Set Grade Distribution | Doctor |
| Enter Student Grades | Doctor, TA |
| Bulk Grade Upload | Doctor |
| Create Task | Doctor, TA |
| Upload Course Materials | Doctor |
| View Teacher Schedule | Doctor, TA |
| View Doctor Dashboard | Doctor |
| View TA Dashboard | TA |
| Create User | Admin, Super Admin |
| Create Student | Admin, Super Admin |
| Bulk Import Users from Excel | Admin, Super Admin |
| Update User | Admin, Super Admin |
| Delete User | Admin, Super Admin |
| Reset User Password | Admin, Super Admin |
| Create Department | Admin, Super Admin |
| Create Course | Admin, Super Admin |
| Create Course Offering | Admin, Super Admin |
| Create Lecture Section | Admin, Super Admin |
| Schedule Exam | Admin, Super Admin |
| Configure Department Pricing | Admin, Super Admin |
| Manual Registration Override | Admin, Super Admin |
| Record Manual Payment | Admin, Super Admin |
| View Admin Dashboard | Admin, Super Admin |
| Send Global Notification | Admin, Super Admin |
| Open Registration Period | Super Admin |
| Manage Academic Calendar | Super Admin |
| Create Announcement | Super Admin |
| Send Exam Reminders | System (automated) |
| Refresh QR Codes | System (automated) |
| Process Excel Import Job | System (BullMQ worker) |
| Receive Paymob Webhook | Paymob Server |

---

### COMMUNICATION FLOWS
| Flow | Method | From | To |
|---|---|---|---|
| HTTP REST Requests | HTTPS | Client | Express API |
| WebSocket Connection | WSS | Client | Socket.IO |
| Attendance Live Updates | WebSocket | Socket.IO | Client |
| Notification Real-time | WebSocket | Socket.IO | Client (notification room) |
| Database Queries | TCP (Prisma) | Node.js | PostgreSQL |
| App Cache Get/Set | TCP (ioredis) | Node.js | Redis (Cache) |
| Job Queue | TCP (BullMQ) | Node.js | Redis (Queue) |
| File Upload | HTTPS | Node.js | Supabase Storage |
| File Download URL | HTTPS | Node.js | Supabase Storage |
| FCM Push | HTTPS | Node.js (Firebase Admin) | Firebase FCM |
| PayPal Order Create | HTTPS | Node.js | PayPal REST API |
| PayPal Capture | HTTPS | Node.js | PayPal REST API |
| Paymob Auth | HTTPS | Node.js | Paymob API |
| Paymob Webhook (inbound) | HTTPS | Paymob Server | Node.js |
| API Documentation | HTTPS | Client | Swagger UI (Node.js serves) |
| Log Writes | File I/O | Node.js | logs/error.log, logs/combined.log |
