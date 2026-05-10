# Architecture Report & Payment Integration Guide

## 1. Project Overview

**What the backend does:**
This is a comprehensive backend system for managing a university/college's operations. It functions as an academic ERP handling user groups (Students, Doctors, TAs, Admins, Leaders), department mapping, course catalogs, real-time attendance, grading, exams, academic calendar scheduling, group communications, and course registration.

**Main technologies used:**

-   **Framework:** Node.js with Express 5 (using ES Modules)
-   **ORM:** Prisma 7 (`@prisma/client` and `@prisma/adapter-pg`)
-   **Real-time:** Socket.IO 4 (WebSockets)
-   **Background Jobs:** BullMQ + Redis (for Excel bulk imports)

**Database type:**

-   PostgreSQL

**Package manager and important dependencies:**

-   **npm** (Package manager)
-   `jsonwebtoken` & `bcryptjs` (Authentication & Security)
-   `multer` & `@supabase/supabase-js` (Memory storage and external file storage)
-   `winston` (Logging)
-   `swagger-jsdoc` & `swagger-ui-express` (API Documentation)
-   `exceljs` (Excel file parsing/generation)

---

## 2. Folder Structure

```text
src/
├── config/             # DB connection logic and Swagger configuration setups.
├── controllers/        # Request handlers wrapping business logic and DB calls.
├── middlewares/        # Express middlewares (Auth/JWT verification, Multer file upload).
├── routes/             # Express routers that map HTTP endpoints to controller functions.
├── prisma/             # Contains Prisma reusable 'select' shapes/queries.
├── swagger/            # Extensive modular Swagger/OpenAPI definition schemas per feature.
└── utils/              # Shared utilities (Socket.IO setups, Notification dispatcher, BullMQ, Logger, Supabase).
```

-   **`routes/`**: Receives incoming mapping and applies role-based middleware.
-   **`controllers/`**: Extracts parameters, calls Prisma DB operations, formats responses, and handles request-cycle errors.
-   **`middlewares/`**: Validates JWTs, intercepts and structures multipart/form-data.
-   **`utils/`**: Core infrastructure pieces (event dispatchers, queues, external APIs) that span multiple domains.

---

## 3. API Endpoints

_Note: Below is a compiled list of the most critical endpoints mapping the project's capabilities._

| Method | Endpoint                                   | Controller               | Description                           | Auth Required |
| ------ | ------------------------------------------ | ------------------------ | ------------------------------------- | ------------- |
| POST   | `/api/v1/auth/login`                       | authController           | Authenticate user and issue JWT       | No            |
| GET    | `/api/v1/auth/me`                          | authController           | Retrieve authenticated user profile   | Yes           |
| GET    | `/api/v1/users`                            | usersController          | List non-student users                | Yes (Admin)   |
| POST   | `/api/v1/users`                            | usersController          | Create staff/admin users              | Yes (Admin)   |
| POST   | `/api/v1/users/students`                   | usersController          | Create student user profile           | Yes (Admin)   |
| GET    | `/api/v1/student/profile`                  | studentProfileController | Get current student details           | Yes (Student) |
| GET    | `/api/v1/departments`                      | departmentController     | List departments & financial settings | Yes           |
| GET    | `/api/v1/courses/all`                      | courseController         | View full course catalog              | Yes (Admin)   |
| GET    | `/api/v1/registration/available-offerings` | registrationController   | View courses available for enrollment | Yes           |
| POST   | `/api/v1/registration/register`            | registrationController   | Enroll student in selected courses    | Yes (Student) |
| DELETE | `/api/v1/registration/unregister`          | registrationController   | Drop a registered course              | Yes (Student) |
| POST   | `/api/v1/attendance/sessions/start`        | attendanceController     | Open a live WS attendance session     | Yes (Staff)   |
| POST   | `/api/v1/attendance/scan`                  | attendanceController     | Student scans QR to mark presence     | Yes (Student) |
| PUT    | `/api/v1/grades/lecture/:id/student/:id`   | gradeController          | Assign/update grade for student       | Yes (Staff)   |
| GET    | `/api/v1/admin/stats/payment-aging`        | adminDashboardController | View payment aging stats              | Yes (Admin)   |
| POST   | `/api/v1/tasks/:id/submit`                 | taskController           | Student uploads assignment            | Yes (Student) |
| POST   | `/api/v1/materials`                        | materialsController      | Upload PDFs/files to Supabase         | Yes (Staff)   |
| POST   | `/api/v1/community/posts`                  | communityController      | Create a post in groups               | Yes           |

---

## 4. Authentication System

-   **Method:** JWT (JSON Web Tokens) with short-lived tokens and bcrypt for salted password hashing.
-   **Middleware used:**
    -   `authMiddleware`: Extracts the `Bearer` token from the `Authorization` header, verifies the signature using `JWT_SECRET`, and mounts `req.user`.
    -   `authorizationMiddleware(...roles)`: RBAC (Role-Based Access Control) which intercepts the verified `req.user.role` to ensure they are permitted (e.g., restricting endpoints to `student`, `admin`, `super_admin`, or `doctor`).
-   **Protected Routes:** Almost the entire application surface area under `/api/v1/*` is protected, minus the `POST /api/v1/auth/login` endpoint.

---

## 5. Database Schema

The schema uses PostgreSQL via Prisma. Key models related to identities and "orders" (enrollments/financials):

**`users`**

-   `id` (UUID, PK)
-   `full_name`
-   `email`
-   `password_hash`
-   `role` (enum: student, doctor, admin, etc.)
-   `created_at`, `updated_at`

**`student_profiles`** (1-to-1 with users)

-   `user_id` (UUID, FK)
-   `student_id` (Unique string code)
-   `department_id` (FK)
-   `total_credits`, `cgpa`, `year_level`

**`departments`**

-   `department_id` (UUID, PK)
-   `name` (Unique)

**`financials`** (Maps to Departments to denote credit cost)

-   `id` (PK)
-   `department_id` (FK to departments)
-   `credit_price` (Decimal - The cost per credit hour for courses in this department)

**`courses`**

-   `code` (PK)
-   `name`
-   `credits` (Integer)
-   `department_id` (FK)

**`course_offerings`** & **`lectures`**

-   Links courses to particular semesters/times and instructors.

**`enrollments`** (Acts as the "Order Item" in an academic system)

-   `id` (PK)
-   `student_user_id` (FK)
-   `lecture_id` (FK)
-   `status` (enum: enrolled, dropped, completed)
-   `mid_score`, `final_score`, `grade`

---

## 6. Business Logic Flow

In this MVC-lite system, business logic is generally housed inside the Controllers. Let's trace a significant flow: **Course Registration** (which mimics adding products to a cart and buying).

**Student Course Registration Flow (`POST /api/v1/registration/register`)**:

1. **Route (`routes/registrationRoutes.js`)**: Matches endpoint, passes through `authMiddleware` verifying JWT, passes through `authorizationMiddleware` proving the user is a `student`.
2. **Controller (`controllers/registrationController.js`)**: Extract array of `lecture_id`s from body.
3. **Validation**: The controller verifies if the registry is active via `systemConfigController` state. It ensures the specified lectures have available `capacity`. Prerequisites are checked (`course_prerequisites` table).
4. **Database (Prisma)**: A database transaction (`prisma.$transaction`) is opened to securely lock capacity.
5. **Mutation**:
    - `lectures` row has `enrolled_count` incremented.
    - An `enrollments` row is securely created linking the `student_user_id` with `lecture_id`.
6. **Response**: A formatted JSON map is returned.

---

## 7. Existing Order / Cart System

_Instead of e-commerce Carts/Orders, this system uses an **Enrollment/Financial Registration** model._

-   **Cart Model = Registration Basket**: Students select `course_offerings` (lectures and tutorial labs) during an open "registration period".
-   **Order Model = `enrollments` Table**: An `enrollment` record serves as both academic registration and the basis for financial tuition invoices.
-   **Pricing Logic (How total price is calculated)**:
    -   Each `course` has a defined number of `credits`.
    -   The course belongs to a `department`.
    -   The `department` links to a `financials` record holding `credit_price` (e.g., $100 per credit).
    -   **Tuition formula**: `sum(enrolled_course.credits * enrolled_course.department.financials.credit_price)`

Currently, there looks to be an administrative reporting hook (`adminDashboardRoutes.js` -> `/stats/payment-aging`), implying tracking of financial liabilities is largely manual or deferred to an external platform right now.

---

## 8. Environment Variables

-   `DATABASE_URL` : Target PostgreSQL connection string.
-   `JWT_SECRET` : Signature string for auth minting.
-   `PORT` : API Port (Default 3000).
-   `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` : S3-like blob storage details.
-   `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` : Connection to BullMQ.
-   `EXCEL_IMPORT_ASYNC_THRESHOLD`: Fallback configurations for large imports.

---

## 9. External Services

-   **Database File Storage**: Integration with **Supabase Storage** for hosting assignment attachments, profile avatars, and course PDFs.
-   **Message Queues**: **BullMQ** wrapped around **Redis** for processing large asynchronous tasks (bulk-registering users via Excel uploads).
-   **WebSockets**: In-memory **Socket.IO** server used as a real-time event bus (Push notifications directly to client, Live GPS/QR attendance handshakes).

---

## 10. Payment Integration Points

Currently, the architecture has no integrated payment gateway (e.g., Stripe, PayPal, Paymob). Bringing a payment module into this backend is structurally straightforward.

**Recommended Integration Architecture:**

**1. Database Changes:**
You will need to introduce an Invoice/Payment state to track liabilities accurately without breaking the existing enrollment model.

```prisma
model invoices {
  id               Int       @id @default(autoincrement())
  student_user_id  String    @db.Uuid
  semester         String
  total_amount     Decimal   @db.Decimal
  status           String    @default("pending") // pending, paid, overdue
  stripe_session   String?   // maps to Gateway Session ID
  payment_date     DateTime?
  created_at       DateTime  @default(now())
}
```

**2. Where to integrate generic billing?**

-   **During Course Registration (`registrationController.js`)**:
    When a student completes `registerCourses`, calculate the total tuition.
    After `prisma.enrollments.createMany`, append a step to upsert an `invoices` row capturing the financial obligation for that specific semester.

**3. New Payment Controllers (`controllers/paymentController.js`):**

-   **`POST /api/v1/payments/checkout`**:
    1. Calculate the outstanding balance from `invoices` for the requesting student.
    2. Instantiate a Stripe API / Payment Gateway session.
    3. Return the `checkout_url` to the front end.
-   **`POST /api/v1/payments/webhook`**:
    1. Act as the asynchronous receiver for Gateway success events.
    2. Verify the webhook signature.
    3. Update `invoices.status = 'paid'`.
    4. Optionally trigger the existing `notificationService.js` to emit a live Socket.IO "Payment Successful" real-time push to the student.

**4. Middleware gating:**
If the university policy mandates payment before allowing students to view `course_materials` or take `exams`, create a new `requiresPaymentMiddleware.js` checking if the student's `invoices` for the current semester have `status == 'paid'`. Apply it to sensitive academic routes.
