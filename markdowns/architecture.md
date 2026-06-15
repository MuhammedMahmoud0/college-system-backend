# College System Backend - Architecture Document

This document provides a comprehensive analysis of the backend codebase, structured to enable AI models to directly generate UML class diagrams, ER diagrams, sequence diagrams, and system architecture diagrams.

## 1. Project Overview
* **Project Name:** College System Backend
* **Purpose of the Backend:** Core RESTful API and WebSocket server for managing all college operations including student profiles, course registration, attendance tracking, grading, financials, community engagement, and system administration.
* **Main Business Domain:** Higher Education Management System
* **High-Level Description:** A modular monolith providing secure, scalable services for a university or college. It handles asynchronous bulk jobs (like importing users), real-time features (like dynamic QR-based attendance tracking), and robust caching for performance.
* **Core Features:** User management, Course management, Enrollment, Real-time Attendance, Grade distributions, Payment/Financials processing (PayPal, Paymob), Community posts, Leaderboards, Push Notifications, Scheduled jobs.
* **Major User Roles:** `student`, `doctor`, `admin`, `teaching_assistant`, `super_admin`, `leader`

## 2. Technology Stack

* **Node.js**: JavaScript Runtime environment.
* **TypeScript / JSDoc**: While codebase uses `.js`, it relies heavily on Prisma's generated typings and potentially JSDoc for validation.
* **Express.js (v5.2.1)**: Core web application framework for routing and middleware.
* **PostgreSQL (v8.16)**: Primary relational database.
* **Prisma ORM (v7.1.0)**: Database access, schema management, and migrations.
* **Redis (ioredis v5.10.0)**: Distributed caching and background job queuing.
* **BullMQ (v5.71.0)**: Asynchronous job queue handling (e.g., bulk user import via Excel).
* **Socket.IO (v4.8.3)**: Real-time WebSockets for live attendance tracking and instant notifications.
* **JWT (jsonwebtoken v9.0.3)**: Stateless authentication via access tokens.
* **Bcrypt (v6.0.0)**: Password hashing.
* **Supabase (supabase-js v2.93.2)**: External cloud storage for avatars and file attachments.
* **Firebase Admin (v13.9.0)**: Cloud Messaging (FCM) for pushing mobile/web notifications.
* **Zod (v4.4.3)**: Schema validation for incoming request payloads.
* **Multer (v2.0.2)**: Middleware for handling `multipart/form-data` (file uploads).
* **ExcelJS (v4.4.0)**: Reading/writing Excel spreadsheets for bulk data processing.
* **Swagger (swagger-jsdoc v6.2.8 / swagger-ui-express v5.0.1)**: API Documentation layer.
* **Payment SDKs**: `@paypal/checkout-server-sdk` and Paymob API for financial transactions.

## 3. Folder Structure

```text
src/
├── config/        # Connection setups (DB, Redis, Swagger, Payment Gateways)
├── controllers/   # Request handling, orchestrating logic and HTTP responses
├── middlewares/   # Express interceptors (auth, validation, cache, rate limits)
├── prisma/        # Custom Prisma selectors and schema configuration
├── routes/        # Express routers mapping URLs to controller functions
├── scripts/       # Utility/migration scripts (e.g., backfill general group)
├── services/      # Reusable business logic (Cache service, Job queues)
├── swagger/       # OpenAPI definitions and schemas
├── utils/         # Helper functions (Socket setup, FCM push, logger)
└── server.js      # Main application entry point
```
**Interaction Flow:** The `server.js` boots the Express app and Socket.IO. A request hits a router in `routes/`, which applies `middlewares/` (like `authMiddleware` or `validateMiddleware`). The request reaches the `controllers/`, which may invoke `services/` for complex logic or caching, and uses `Prisma Client` to access the database.

## 4. System Architecture
* **Architecture Style:** Layered Modular Monolith with Event-Driven capabilities.
* **Request Flow:** Client Request → Express Rate Limiter → Route → Middleware (Auth/RBAC/Zod) → Controller → Service Layer (Optional Cache Check) → Prisma ORM → PostgreSQL.
* **Response Flow:** Database → Prisma ORM → Controller (Formatting) → Middleware (Optional Caching) → Express Response.
* **Dependency Flow:** Controllers depend on Services and the Prisma Client. Middlewares depend on configuration and JWT utils.
* **Asynchronous/Event-Driven Flow:** Heavy tasks (Excel processing) are pushed to BullMQ (Redis). Real-time events (QR scan, Attendance toggle) bypass the standard HTTP flow, going via Socket.IO directly to controllers/managers modifying in-memory state and flushing to DB.

## 5. Database Architecture

* **`users`**
  * *Purpose:* Core account data for all roles.
  * *Attributes:* `id` (UUID, PK), `full_name`, `email`, `password_hash`, `role`, `avatar_url`.
  * *Relationships:* One-to-One with `student_profiles`, One-to-Many with `enrollments`, `attendance`, `notifications`.

* **`student_profiles`**
  * *Purpose:* Extended data specific to students.
  * *Attributes:* `user_id` (UUID, PK, FK), `student_id` (Unique), `year_level`, `cgpa`, `department_id` (FK).
  * *Relationships:* Belongs to `users`, Belongs to `departments`.

* **`departments`**
  * *Purpose:* Academic departments.
  * *Attributes:* `department_id` (UUID, PK), `name` (Unique).
  * *Relationships:* One-to-Many with `courses` and `student_profiles`.

* **`courses` & `course_offerings`**
  * *Purpose:* Catalog of courses and specific semester offerings.
  * *Attributes:* `code` (PK), `name`, `credits`, `offering_id` (PK), `semester`, `year`.
  * *Relationships:* Course has Many Offerings. Offerings have Many `lectures` and `tutorials_labs`.

* **`lectures` & `tutorials_labs`**
  * *Purpose:* Scheduled class sessions.
  * *Attributes:* `lecture_id` (PK), `instructor_id` (FK), `day_of_week`, `start_time`, `end_time`.
  * *Relationships:* Belongs to `course_offerings`, Belongs to `users` (Instructor).

* **`enrollments`**
  * *Purpose:* Linking students to classes and storing their grades.
  * *Attributes:* `id` (PK), `student_user_id` (FK), `lecture_id` (FK), `mid_score`, `final_score`, `grade`, `status`.

* **`invoices` & `payments`**
  * *Purpose:* Financial tracking for student tuition.
  * *Attributes:* `id` (PK), `student_user_id` (FK), `total_amount`, `status` (pending, paid), `gateway`.
  * *Relationships:* Invoice has Many Payments.

* **`attendance`**
  * *Purpose:* Log of student attendance per session.
  * *Attributes:* `id` (PK), `student_user_id` (FK), `lecture_id`, `session_date`, `status`.

* **`community_posts`**
  * *Purpose:* Social/Forum system.
  * *Attributes:* `id` (PK), `author_id` (FK), `content`, `group_id`.

## 6. API Architecture
The system contains nearly 200 endpoints. Below is an aggregated summary of the API Architecture:

* **Auth endpoints (`/api/v1/auth/*`)**
  * `POST /login`: Auth user. Body: `{email, password}`.
  * `POST /refresh`: Refresh JWT via cookie.
  * `POST /logout`: Revoke tokens.

* **User Management (`/api/v1/users/*`)**
  * `GET /me`: Get current profile. Auth: Yes.
  * `POST /`: Create staff/admin user. Auth: SuperAdmin.
  * `POST /students`: Create student user. Auth: Admin.
  * `POST /import/excel`: Upload users in bulk (multipart/form-data).

* **Academic Setup (`/api/v1/departments`, `/api/v1/courses`, `/api/v1/course-offerings`)**
  * Standard CRUD operations for departments, courses, and offerings. 
  * `GET /courses/:code/prerequisites`: Fetch requirements.

* **Schedules & Registration (`/api/v1/schedule`, `/api/v1/registration`)**
  * `GET /schedule`: Fetch timetable based on user role.
  * `POST /registration/enroll`: Enroll student in a lecture/tutorial.

* **Attendance (`/api/v1/attendance/*`)**
  * `POST /start`: Start a live session (generates rotating QR).
  * `POST /scan`: Fallback HTTP scan for QR code (though WebSockets preferred).
  * `GET /report`: Get attendance reports.

* **Grades & Tasks (`/api/v1/grades/*`, `/api/v1/tasks/*`)**
  * `PUT /grades/bulk`: Upload excel/json of grades.
  * `POST /tasks`: Create assignment.
  * `POST /tasks/:id/submit`: Submit assignment (Student).

* **Financials (`/api/v1/payments/*`, `/api/v1/financials/*`)**
  * `POST /payments/checkout/paypal`: Init PayPal intent.
  * `POST /payments/checkout/paymob`: Init Paymob iframe.
  * `POST /payments/webhook/paymob`: Server-to-Server webhook.

* **Community (`/api/v1/community/*`)**
  * `POST /posts`: Create forum post.
  * `POST /posts/:id/like`: Toggle like.

## 7. Authentication & Authorization
* **Flow:** User submits credentials to `/auth/login`. Server verifies hash using bcrypt. If successful, issues a short-lived `accessToken` (JWT) in JSON body, and a long-lived `refreshToken` in an HttpOnly, Secure cookie.
* **Refresh Flow:** Client hits `/auth/refresh` when token expires. Server validates refresh token against the `refresh_tokens` DB table, issuing a new `accessToken`.
* **Session Management:** Stateless JWT for access. Stateful refresh tokens (stored in DB to allow revocation/logout).
* **Roles:** Enforced by `authorizationMiddleware(...roles)`. Available roles: `student`, `doctor`, `admin`, `teaching_assistant`, `super_admin`, `leader`.

## 8. Business Logic Layer
The business logic is heavily integrated into controllers, with dedicated services handling specialized operations.

* **`cacheService` / `cacheInvalidationService`**
  * *Purpose:* Redis caching abstraction. Methods to get, set, and intelligently invalidate cache tags (e.g., clearing all course caches when a course is updated).
  * *Dependencies:* Redis Client.
* **`userImportService`**
  * *Purpose:* Processes Excel sheets for bulk user creation.
  * *Dependencies:* Prisma, ExcelJS, Bcrypt.
* **`LeaderboardService`**
  * *Purpose:* Calculates student rankings based on CGPA and points.
* **`fcmService` / `notificationService`**
  * *Purpose:* Sends push notifications to mobile/web clients via Firebase and stores them in DB.

## 9. Repository/Data Access Layer
Prisma ORM acts as the exclusive Data Access Layer.
* *Queries:* Defined inline within controllers using Prisma Client (`prisma.users.findMany()`, `prisma.enrollments.update()`).
* *Selectors:* The `src/prisma/selectors/` folder contains pre-defined object shapes to standardize responses (e.g., `studentProfile.selectors.js` to avoid leaking password hashes).
* *Transactions:* Heavy use of `$transaction` for financial operations and enrollments to ensure ACID properties.

## 10. Real-Time Features
Implemented via **Socket.IO** (`src/utils/socketIO.js`).

* **Connection Flow:** Client connects with JWT in handshake auth. Decoded `userId` maps the socket connection.
* **Namespaces/Rooms:**
  * `notifications:<userId>`: Personal room for real-time alerts.
  * `session:<sessionId>`: Room for active attendance tracking.
* **Events:**
  * `join-session` (Emitter: Instructor, Purpose: Start monitoring QR attendance).
  * `scan-qr` (Emitter: Student, Purpose: Mark present via dynamic QR payload. Validates timestamp and session).
  * `toggle-attendance` (Emitter: Instructor, Purpose: Manually override a student's attendance).
  * `qr-code-updated` (Emitter: Server, Purpose: Pushes new QR string every 10 seconds to instructor screens to prevent cheating).
  * `student-marked-present` (Emitter: Server to `session` room, Purpose: Update instructor UI).

## 11. Middleware Pipeline
* **`rateLimitMiddleware.js`**: Limits requests per IP (using `express-rate-limit`).
* **`authMiddleware.js`**: Parses Bearer Token, verifies JWT signature, attaches `req.user`. Includes `optionalAuthMiddleware` and role-based `authorizationMiddleware`.
* **`validateMiddleware.js`**: Takes a Zod schema, validates `req.body`, `req.query`, or `req.params`. Rejects with 400 if invalid.
* **`cacheMiddleware.js`**: Checks Redis for GET requests. Returns cached JSON if hit; otherwise patches `res.json` to store the response before sending.
* **`uploadMiddleware.js`**: Multer configuration for memory storage or disk storage, handling avatars/files.
* **`paymentMiddleware.js`**: Validates webhook signatures originating from Paymob/PayPal.

## 12. External Integrations
1. **Supabase (Storage)**: Stores uploaded avatars and course materials. Uses Supabase JS SDK.
2. **Firebase Admin (FCM)**: Push notifications payload delivery to Android/iOS/Web clients.
3. **PayPal Checkout Server SDK**: Processing tuition payments.
4. **Paymob API**: Local/Regional payment gateway integration (Credit cards, mobile wallets) via iFrames and Webhooks.
5. **Redis**: In-memory data structure store used for caching and message broker (BullMQ).

## 13. Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret key for signing tokens | Yes |
| `FRONTEND_URL` | Configures CORS origins | Yes |
| `PORT` | Node.js express server port | No |
| `SUPABASE_URL` & `_KEY` | Supabase auth/storage integration | Yes |
| `FIREBASE_SERVICE_ACCOUNT_KEY`| FCM authentication JSON | Yes |
| `REDIS_HOST`, `_PORT` | BullMQ queue connection | Yes |
| `CACHE_REDIS_URL` | Application caching layer | Yes |
| `CACHE_ENABLED` | Kill switch for Redis caching | No |
| `PAYPAL_CLIENT_ID` & `_SECRET` | PayPal payment processing | Yes |
| `PAYMOB_API_KEY`, etc. | Paymob payment processing | Yes |

## 14. Dependency Graph
* **Express App (`server.js`)** depends on **Routers** (e.g. `authRoutes.js`).
* **Routers** depend on **Middlewares** (`authMiddleware`, `validateSchema`) and **Controllers** (`authController.js`).
* **Controllers** depend on **Prisma ORM**, **Zod Schemas** (from `utils/authSchemas.js`), and **Services** (`notificationService`, `cacheInvalidationService`).
* **Background Jobs** (`userImportQueue.js`) depend on **BullMQ** and **Redis**.
* **Circular Dependencies avoided** by placing shared instances (Prisma, Logger, Redis Clients) in the `config/` folder.

## 15. Diagram Generation Data

### A. UML Class Diagram Data
* **Classes:** `User`, `StudentProfile`, `Department`, `Course`, `CourseOffering`, `Lecture`, `TutorialLab`, `Enrollment`, `Attendance`, `Invoice`, `Payment`.
* **Properties:**
  * *User*: id, name, email, password_hash, role.
  * *StudentProfile*: student_id, year_level, cgpa.
  * *Course*: code, name, credits.
  * *Enrollment*: id, mid_score, final_score, grade, status.
* **Relationships:**
  * `User` (1) -- (0..1) `StudentProfile` (Composition)
  * `Department` (1) -- (*) `StudentProfile` (Aggregation)
  * `Department` (1) -- (*) `Course` (Aggregation)
  * `Course` (1) -- (*) `CourseOffering` (Composition)
  * `CourseOffering` (1) -- (*) `Lecture` (Composition)
  * `User[Instructor]` (1) -- (*) `Lecture` (Dependency)
  * `StudentProfile` (*) -- (*) `Lecture` (Resolved by Association Class `Enrollment`)

### B. Sequence Diagram Data
**Login Flow:**
1. Client -> `AuthController`: POST `/login` (email, password)
2. `AuthController` -> `Prisma`: Find user by email
3. `Prisma` --> `AuthController`: Return user hash
4. `AuthController` -> `Bcrypt`: Compare hashes
5. `AuthController` -> `JWT`: Sign access token & refresh token
6. `AuthController` -> `Prisma`: Save refresh token in DB
7. `AuthController` --> Client: Return Access Token (JSON) + Refresh Token (Cookie)

**Live Attendance Flow:**
1. Instructor Client -> `Socket.IO`: Emit `join-session(sessionId)`
2. `Socket.IO` -> `Server`: Adds instructor to `session:xyz` room. Generates initial QR code.
3. `Server` --> Instructor Client: Return `session-joined` with QR string.
4. `Server` -> `Socket.IO`: SetInterval (10s) -> emit `qr-code-updated` to room.
5. Student Client -> `Socket.IO`: Emit `scan-qr(qrCodeStr)`
6. `Server`: Validates string, timestamp, and enrollment. Updates RAM state.
7. `Server` -> `Socket.IO`: Emit `student-marked-present` to `session:xyz` room.
8. Instructor Client UI updates instantly.

### C. ER Diagram Data
* **Entities:** `users`, `student_profiles`, `courses`, `enrollments`, `lectures`, `invoices`, `attendance`.
* **Relationships & Cardinalities:**
  * `users` ||--o| `student_profiles` (1:1)
  * `users` ||--o{ `enrollments` (1:N)
  * `users` ||--o{ `invoices` (1:N)
  * `courses` ||--o{ `course_offerings` (1:N)
  * `course_offerings` ||--|{ `lectures` (1:N)
  * `lectures` ||--o{ `enrollments` (1:N)
  * `enrollments` ||--o| `invoices` (1:1)
* **Foreign Keys:**
  * `student_profiles.user_id` -> `users.id`
  * `student_profiles.department_id` -> `departments.department_id`
  * `enrollments.student_user_id` -> `users.id`
  * `enrollments.lecture_id` -> `lectures.lecture_id`

### D. System Architecture Diagram Data
* **Actors:** Mobile App, Web Frontend (React/Vue).
* **Load/Gateway Layer:** Express Global Middleware (Helmet, CORS, Rate Limit).
* **Backend Components:** Express HTTP API, BullMQ Job Workers, Socket.IO Real-time Server.
* **Databases:** PostgreSQL (Persistent Storage).
* **Caches:** Redis 1 (App Caching), Redis 2 (BullMQ State).
* **External Services:** Supabase Storage (HTTPS), Firebase FCM (HTTPS), PayPal/Paymob Gateways (HTTPS).
* **Communication Methods:** REST (HTTP/JSON), WebSockets (WSS), Webhooks (Incoming from Payments).

## 16. Architectural Observations
* **Strengths:** 
  * Highly organized layered structure.
  * Excellent use of Redis for both caching (cache-aside pattern) and background processing (BullMQ) keeps the main thread unblocked.
  * WebSockets are cleverly utilized for live attendance, reducing database write-pressure during a class session.
* **Architectural Bottlenecks:** 
  * The monolithic nature of the app means that high loads in bulk Excel imports could theoretically starve CPU resources from the HTTP server if Node concurrency isn't managed carefully.
  * The `activeSessions` for attendance are kept in Node memory (`Map`). If the server scales horizontally (multiple instances), WebSockets will require a Redis Adapter, and in-memory session state must be migrated to Redis to allow shared session validation.
* **Security Considerations:**
  * Uses Helmet, Rate Limiting, and Bcrypt.
  * Webhook validation for payment gateways prevents spoofed payment successes.
  * Prisma protects against SQL injection.


---

# Part II: Architecture Implementation Details (Second Pass)

## 1. Controllers

*   **AuthController** (`src/controllers/authController.js`)
    *   **Methods**: `login`, `logout`, `refreshToken`, `getMe`
    *   **Dependencies**: `jwt`, `bcrypt`, `prisma`
    *   **Routes**: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
*   **UsersController** (`src/controllers/usersController.js`)
    *   **Methods**: `createUser`, `createStudent`, `updateUser`, `updateOwnProfile`, `deleteUser`, `getManagementStaff`, `getManagementStudents`, `uploadExcelUsers`, `uploadExcelStudents`, `getImportJobStatus`
    *   **Dependencies**: `bcrypt`, `prisma`, `supabase`, `userImportQueue`
*   **StudentProfileController** (`src/controllers/studentProfileController.js`)
    *   **Methods**: `getStudentProfile`, `getStudentProfileDetails`, `getDigitalStudentIdFront`, `getDigitalStudentIdBack`
    *   **Dependencies**: `prisma`
*   **LeaderboardController** (`src/controllers/leaderboard/leaderboard.controller.js`)
    *   **Methods**: `getLeaderboard`, `getStudentRank`
    *   **Dependencies**: `LeaderboardService`
*   **AttendanceController** (`src/controllers/attendanceController.js`)
    *   **Methods**: `startAttendanceSession`, `endAttendanceSession`, `getActiveSessionStatus`, `generateQRCode`, `markAttendanceScan`, `getAttendanceReport`, `getStudentAttendanceHistory`, `getAttendanceSummary`
    *   **Dependencies**: `prisma`, `crypto`, `socket.io`
*   **PaymentController** (`src/controllers/paymentController.js`)
    *   **Methods**: `createPaypalOrder`, `capturePaypalOrder`, `createPaymobOrder`, `handlePaymobWebhook`, `getPaymentHistory`, `getInvoiceDetails`, `manualMarkInvoicePaid`
    *   **Dependencies**: `prisma`, `paypal`, `paymob`
*   **CourseController** (`src/controllers/courseController.js`)
    *   **Methods**: `createCourse`, `updateCourse`, `deleteCourse`, `getCourseDetails`, `getAllCourses`
    *   **Dependencies**: `prisma`, `cacheInvalidationService`
*   **RegistrationController** (`src/controllers/registrationController.js`)
    *   **Methods**: `enrollInCourse`, `dropCourse`, `getRegistrationStatus`, `getAvailableOfferings`
    *   **Dependencies**: `prisma`, `periodHelpers`
*   **TaskController** (`src/controllers/taskController.js`)
    *   **Methods**: `createTask`, `submitTask`, `gradeTask`, `getLectureTasks`, `getStudentTaskSubmissions`
    *   **Dependencies**: `prisma`, `supabase`
*   **GradeController** (`src/controllers/gradeController.js`)
    *   **Methods**: `setGradeDistribution`, `updateStudentGrade`, `bulkUpdateGrades`, `getCourseGrades`
    *   **Dependencies**: `prisma`
*   **NotificationController** (`src/controllers/notificationController.js`)
    *   **Methods**: `getUserNotifications`, `markAsRead`, `markAllAsRead`, `updatePreferences`
    *   **Dependencies**: `prisma`
*   **CommunityController** (`src/controllers/communityController.js`)
    *   **Methods**: `createPost`, `getPosts`, `likePost`, `commentOnPost`, `getGroups`, `joinGroup`
    *   **Dependencies**: `prisma`, `supabase`
*   *(Other mapped controllers follow the same CRUD/Prisma pattern for their respective domains: `CourseOffering`, `Department`, `AdminDashboard`, `DoctorDashboard`, `Exam`, `Financial`, `Materials`, `Schedule`, `Settings`, `SystemConfig`, `Teacher`, `TeachingAssistantDashboard`, `FAQ`)*

## 2. Services

*   **CacheService** (`src/services/cacheService.js`)
    *   **Public Methods**: `getCached`, `setCached`, `getCacheStats`, `invalidate`
    *   **Dependencies**: `ioredis`, `logger`
    *   **Responsibility**: Cache-aside implementation and stats tracking for high-frequency endpoints.
*   **CacheInvalidationService** (`src/services/cacheInvalidationService.js`)
    *   **Public Methods**: `invalidateCourseCaches`, `invalidateStudentCaches`, `invalidateAll`
    *   **Dependencies**: `CacheService`
    *   **Responsibility**: Tag-based logic to clear redis data when Prisma updates entities.
*   **UserImportService** (`src/services/utils/userImportService.js`)
    *   **Public Methods**: `processExcelUsersBuffer`, `processExcelStudentsBuffer`, `countDataRowsFromExcelBuffer`
    *   **Dependencies**: `exceljs`, `bcrypt`, `prisma`
    *   **Responsibility**: Reads buffers, applies business rules, hashes passwords in parallel, and batch inserts using `createMany`.
*   **LeaderboardService** (`src/controllers/leaderboard/leaderboard.service.js`)
    *   **Public Methods**: `calculateLeaderboard`, `getUserRank`
    *   **Dependencies**: `prisma`
    *   **Responsibility**: Computes ranking math using CGPA, credit hours, and caches the result.

## 3. Repositories / Database Access

*   **Name**: `PrismaClient` (Exported as `prisma` from `src/config/connection.js`)
*   **Tables accessed**: All tables via Prisma auto-generated methods.
*   **Methods used**: `findUnique`, `findMany`, `create`, `createMany`, `update`, `delete`, `count`, `$transaction`
*   **Relationships used**: Extensive use of `include` (e.g. `include: { student_profiles: true, departments: true }`) for eager loading joins.

## 4. Prisma Models

*   **users**: `id` (String UUID PK), `full_name` (String), `email` (String Unique), `password_hash` (String), `role` (user_role enum), `avatar_url` (String?), `phone` (String?), `national_id` (String?), `address` (String?). Relationships: `student_profiles`, `enrollments`, `refresh_tokens`, `device_tokens`, `notifications`.
*   **student_profiles**: `user_id` (String PK FK), `student_id` (String Unique), `year_level` (Int?), `cgpa` (Float?), `department_id` (String? FK).
*   **departments**: `department_id` (String PK), `name` (String Unique).
*   **courses**: `code` (String PK), `name` (String), `credits` (Int), `department_id` (String FK).
*   **course_offerings**: `offering_id` (Int PK), `course_code` (String FK), `year` (Int), `semester` (semester_type enum).
*   **course_prerequisites**: `course_code` (String FK), `prerequisite_code` (String FK). PK: `[course_code, prerequisite_code]`.
*   **lectures**: `lecture_id` (Int PK), `offering_id` (Int FK), `instructor_id` (String FK), `day_of_week` (String), `start_time` (DateTime), `end_time` (DateTime), `capacity` (Int).
*   **tutorials_labs**: `tutorial_lab_id` (Int PK), `offering_id` (Int FK), `ta_id` (String FK), `type` (String), `group` (String).
*   **enrollments**: `id` (Int PK), `student_user_id` (String FK), `lecture_id` (Int FK), `tutorial_lab_id` (Int? FK), `mid_score` (Float?), `final_score` (Float?), `grade` (String?), `status` (enrollment_status enum). Unique constraint: `[student_user_id, lecture_id]`.
*   **grade_distributions**: `id` (Int PK), `lecture_id` (Int FK Unique), `work_max` (Float), `mid_max` (Float), `final_max` (Float).
*   **tasks**: `id` (Int PK), `lecture_id` (Int? FK), `tutorial_lab_id` (Int? FK), `title` (String), `due_date` (DateTime?).
*   **task_submissions**: `id` (Int PK), `task_id` (Int FK), `student_id` (String FK), `submission_content` (String?), `grade` (Float?).
*   **attendance**: `id` (Int PK), `student_user_id` (String FK), `lecture_id` (Int? FK), `tutorial_lab_id` (Int? FK), `session_date` (DateTime), `status` (String).
*   **invoices**: `id` (Int PK), `student_user_id` (String FK), `enrollment_id` (Int? FK Unique), `total_amount` (Decimal), `status` (payment_status enum).
*   **payments**: `id` (Int PK), `invoice_id` (Int FK), `gateway` (payment_gateway enum), `transaction_id` (String), `amount` (Decimal).
*   **community_groups**, **group_members**, **community_posts**, **post_comments**, **post_likes**: Standard forum-style relational models.
*   **refresh_tokens**: `id` (String PK), `token` (String Unique), `user_id` (String FK), `expires_at` (DateTime).
*   **device_tokens**: `id` (String PK), `token` (String Unique), `user_id` (String? FK).
*   **notifications**, **notification_preferences**, **academic_calendar**, **announcements**, **news_articles**, **testimonials**.

## 5. Route Mapping (Sample Core Execution)

*   `POST /api/v1/auth/login` → `authController.login`
*   `POST /api/v1/users/students` → `authMiddleware`, `authorizationMiddleware('admin')`, `validateMiddleware(CreateStudentSchema)`, `usersController.createStudent`
*   `POST /api/v1/registration/enroll` → `authMiddleware`, `authorizationMiddleware('student')`, `registrationController.enrollInCourse`
*   `POST /api/v1/attendance/start` → `authMiddleware`, `attendanceController.startAttendanceSession`
*   `POST /api/v1/payments/checkout/paymob` → `authMiddleware`, `paymentController.createPaymobOrder`
*   `POST /api/v1/payments/webhook/paymob` → `paymentMiddleware(hmac validation)`, `paymentController.handlePaymobWebhook`

## 6. Middleware Pipeline

*   **`rateLimitMiddleware`**: Rate limits (e.g. 100 reqs/15min) via `express-rate-limit`. Input: IP. Output: Response 429 OR `next()`. Global.
*   **`authMiddleware`**: Decodes Bearer JWT. Input: `req.headers.authorization`. Output: Attaches `req.user` OR returns 401. Used on almost all non-public routes.
*   **`authorizationMiddleware`**: Factory function `(...roles)`. Input: `req.user.role`. Output: 403 Access Denied OR `next()`. Used on protected routes (Admin, Doctor).
*   **`validateMiddleware`**: Input: `req.body`, `ZodSchema`. Output: 400 Bad Request (Validation details) OR `next()`.
*   **`cacheMiddleware`**: Input: `req.originalUrl`. Output: Cached JSON intercept OR wraps `res.json` to store output. Used on `GET /courses`, `GET /leaderboard`.
*   **`paymentMiddleware`**: Input: `req.body` and Paymob HMAC headers. Output: 401 Unauthorized OR `next()`. Used only by `/payments/webhook`.

## 7. Socket.IO Architecture

*   **Namespaces**: Default (`/`).
*   **Rooms**: `notifications:<userId>`, `session:<sessionId>`
*   **Event: `join-session`**
    *   **Sender**: Instructor Client
    *   **Receiver**: Server
    *   **Payload**: `sessionId` (String)
    *   **Purpose**: Subscribe instructor to real-time QR/Attendance updates. Returns initial QR.
*   **Event: `scan-qr`**
    *   **Sender**: Student Client
    *   **Receiver**: Server
    *   **Payload**: `{ qrCode: "sessionId:timestamp:hash" }`
    *   **Purpose**: Process student attendance request using dynamic rotating QR.
*   **Event: `toggle-attendance`**
    *   **Sender**: Instructor Client
    *   **Receiver**: Server
    *   **Payload**: `{ sessionId, student_user_id }`
    *   **Purpose**: Instructor manually marks a student present/absent.
*   **Event: `qr-code-updated`**
    *   **Sender**: Server (Interval Timer)
    *   **Receiver**: Room `session:<sessionId>`
    *   **Payload**: `{ sessionId, qrCode, qrExpiry }`
    *   **Purpose**: Pushes a new cryptographically signed QR code to the instructor's screen every 10 seconds.
*   **Event: `student-marked-present`**
    *   **Sender**: Server
    *   **Receiver**: Room `session:<sessionId>`
    *   **Payload**: `{ student: {...}, presentCount, totalCount }`
    *   **Purpose**: Live UI update for the instructor when a student scans successfully.

## 8. Background Jobs

*   **BullMQ Queues**
    *   **Name**: `user_excel_imports`
    *   **Trigger**: `userImportQueue.enqueueUserImportJob()` from `POST /users/import/excel`
    *   **Worker**: Runs in the node background via `userImportQueue.js`.
    *   **Processors**: `processExcelUsersBuffer` (Staff) and `processExcelStudentsBuffer` (Students).
    *   **Payload**: `{ importType, fileBufferBase64, requestedBy }`
*   **Scheduled Tasks (Cron / Timers)**
    *   **Name**: `QR_REFRESH_INTERVAL` (Socket.IO). Runs every 10 seconds, iterating `activeSessions.entries()` to issue new QR codes.
    *   **Name**: `startExamReminderJob` (utils/examReminderJob.js). Triggers push notifications to students approaching exam dates.

## 9. Zod Schemas / DTOs

*   **LoginSchema**: `{ email: string.email, password: string }`. Used on `POST /auth/login`.
*   **ChangePasswordSchema**: `{ currentPassword, newPassword }`.
*   **CreateStudentSchema**: `{ name, email, national_id, student_id, department_id: string.uuid }`.
*   **StartAttendanceSessionSchema**: `{ lecture_id?: int, tutorial_lab_id?: int, session_date: string.date }`.
*   **GradeDistributionSchema**: `{ work_max: number, mid_max: number, final_max: number }`.

## 10. Class Diagram Data (PlantUML syntax basis)

```plantuml
class User {
  id: String
  email: String
  role: user_role
}
class StudentProfile {
  student_id: String
  cgpa: Float
}
class Department {
  name: String
}
class Course {
  code: String
  credits: Int
}
class Lecture {
  day_of_week: String
  capacity: Int
}
class Enrollment {
  grade: String
  status: enrollment_status
}

User "1" *-- "0..1" StudentProfile
Department "1" o-- "*" Course
Course "1" *-- "*" CourseOffering
CourseOffering "1" *-- "*" Lecture
User "1 (Instructor)" -- "*" Lecture : teaches >
StudentProfile "*" -- "*" Lecture
(StudentProfile, Lecture) .. Enrollment
```

## 11. Component Diagram Data

*   **Frontend**: Client Application (React/Vue).
*   **API Gateway**: Express App (handles CORS, Helmet, Rate Limiting).
*   **Core Components**: AuthController, CourseController, PaymentController, etc.
*   **Service Components**: CacheService, BullMQ Worker (UserImport), Firebase FCM Service.
*   **Datastore**: PostgreSQL (Primary Data).
*   **Cache/Queue Store**: Redis.
*   **Communication Links**:
    *   Frontend <--> API Gateway (HTTP/REST + WSS)
    *   API Gateway <--> Core Controllers (Direct Call)
    *   Controllers <--> Service Components (Direct Call)
    *   Controllers <--> PostgreSQL (TCP/IP via Prisma)
    *   Controllers/Services <--> Redis (TCP/IP)
    *   PaymentController <--> PayPal/Paymob APIs (HTTPS Outbound & Inbound Webhook)

## 12. Deployment Diagram Data

*   **Node `app` Container / Process**: Runs `server.js` containing Express HTTP, Socket.IO Server, and BullMQ Worker threads.
*   **PostgreSQL Instance**: Relational data node.
*   **Redis Instance**: Shared memory node (used for `ioredis` cache and `BullMQ`).
*   **Channels**:
    *   Internet (HTTPS) -> Node App: 443 -> 3000 mapping.
    *   Internet (WSS) -> Node App: Realtime WebSocket upgrades.
    *   Node App (Prisma Client) -> PostgreSQL: port 5432.
    *   Node App -> Redis: port 6379.
    *   Node App -> Supabase/Firebase: External HTTPS calls.

## 13. Sequence Diagram Data (Concrete Flows)

**1. Login Flow**
1. Client POSTs `{email, password}` to `AuthController.login`.
2. Controller calls `prisma.users.findUnique(email)`. DB returns row.
3. Controller calls `bcrypt.compare(password, password_hash)`.
4. Controller calls `jwt.sign` to create `accessToken` and `refreshToken`.
5. Controller calls `prisma.refresh_tokens.create` storing hashed token signature.
6. Express Response sends JSON (accessToken) and `Set-Cookie` (refreshToken).

**2. Attendance Session Start Flow**
1. Instructor POSTs `{lecture_id, session_date}` to `AttendanceController.startAttendanceSession`.
2. Controller validates Instructor ID via `prisma.lectures.findUnique`.
3. Controller retrieves enrolled students via `prisma.enrollments.findMany`.
4. Controller creates in-memory map entry `activeSessions.set(sessionId, { qrCode, attendees: Set() })`.
5. Controller returns HTTP 201 with `sessionId` and initial `qrCode` token.
6. Instructor Client connects WebSocket -> emits `join-session(sessionId)`.

**3. QR Scan Flow (WebSockets)**
1. Student Socket emits `scan-qr({ qrCode: "sessionXYZ:123456:hash" })`.
2. Socket Handler retrieves `activeSessions.get("sessionXYZ")`.
3. Handler validates token string matches in-memory `qrCode` and timestamp is < `qrExpiry`.
4. Handler checks if Student's UUID is in `session.enrolledStudents`.
5. Handler adds Student UUID to `session.attendees` `Set()`.
6. Handler emits `scan-success` back to Student.
7. Handler broadcasts `student-marked-present` to Socket Room `session:sessionXYZ` (updating Instructor screen).
8. (Note: State remains in RAM until Instructor ends session, at which point Controller writes `prisma.attendance.createMany`).

**4. Payment Flow (Paymob Webhook)**
1. Paymob servers POST to `/payments/webhook/paymob` upon transaction resolution.
2. Express Router invokes `paymentMiddleware` which parses request, sorts keys, and compares generated HMAC-SHA512 against `req.query.hmac`.
3. If valid, passes to `PaymentController.handlePaymobWebhook`.
4. Controller checks `obj.success === true` and finds corresponding `invoice_id` mapped to `obj.order_id`.
5. Controller executes `$transaction`: updates `invoices` to `paid` and creates `payments` record.
