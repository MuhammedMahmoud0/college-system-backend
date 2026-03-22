# College System Backend

A full-featured REST + WebSocket backend for a university management platform, built with Node.js (ES Modules), Express 5, Prisma 7, and PostgreSQL.

[![Node.js](https://img.shields.io/badge/Node.js-ES%20Modules-green)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5-blue)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-7-purple)](https://www.prisma.io)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow)](LICENSE)

---

## Features

| Domain                        | Highlights                                                            |
| ----------------------------- | --------------------------------------------------------------------- |
| **Auth**                      | JWT login/register, bcrypt password hashing, role-based access        |
| **Users**                     | CRUD for students, doctors, teaching assistants, admins               |
| **Student Profile**           | Academic profile, CGPA, year level, faculty advisor                   |
| **Courses & Offerings**       | Course catalogue, per-semester offerings, prerequisites               |
| **Enrollment / Registration** | Enroll/drop lectures and tutorial labs with capacity checks           |
| **Schedule**                  | Weekly timetable per student or instructor                            |
| **Attendance**                | Real-time WebSocket check-in with GPS coordinates, manual overrides   |
| **Grades**                    | Mid/work/final scores, grade distributions, transcript export (Excel) |
| **Exams**                     | Exam schedule, automated reminder notifications via background job    |
| **Tasks**                     | Assignments per lecture/lab with student submissions                  |
| **Materials**                 | File uploads to Supabase Storage per lecture/tutorial lab             |
| **Community**                 | Groups, posts, comments, likes                                        |
| **Notifications**             | Real-time push over Socket.IO, per-user preferences                   |
| **Leaderboard**               | Student ranking by CGPA / credits                                     |
| **Admin Dashboard**           | Aggregate stats, announcements, academic calendar, system config      |
| **Departments**               | Department management with financial (credit price) data              |
| **Swagger Docs**              | Interactive API documentation at `/docs`                              |

---

## Tech Stack

-   **Runtime:** Node.js (ES Modules)
-   **Framework:** Express 5
-   **ORM:** Prisma 7 (`@prisma/adapter-pg`)
-   **Database:** PostgreSQL
-   **Real-time:** Socket.IO 4
-   **Storage:** Supabase Storage (Multer)
-   **Auth:** JSON Web Tokens + bcryptjs
-   **Logging:** Winston
-   **Docs:** swagger-jsdoc + swagger-ui-express
-   **Reports:** ExcelJS

---

## Project Layout

```
src/
├── server.js                  # App entry point (Express + Socket.IO + jobs)
├── config/
│   ├── connection.js          # Prisma client & DB connection helpers
│   └── swagger.js             # Swagger spec configuration
├── controllers/               # Request handlers (one file per domain)
├── middlewares/
│   ├── authMiddleware.js      # JWT validation → req.user
│   └── uploadMiddleware.js    # Multer configuration
├── prisma/
│   └── selectors/             # Reusable Prisma select/include shapes
├── routes/                    # Express routers (one file per domain)
└── utils/
    ├── logger.js              # Winston logger
    ├── socketIO.js            # Socket.IO initialisation
    ├── notificationService.js # Notification helpers
    ├── examReminderJob.js     # Scheduled exam reminder background job
    └── supabase.js            # Supabase client
prisma/
├── schema.prisma              # Database schema
├── seed.js                    # Development seed script
└── migrations/                # Prisma migration history
tests/
├── api/                       # API (integration) tests
└── unit/                      # Unit tests
```

---

## Quick Setup (Local Development)

### 1. Clone & Install

```bash
git clone https://github.com/MuhammedMahmoud0/college-system-backend.git
cd college-system-backend
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Fill in the required values:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/yourdb?schema=public"
JWT_SECRET="a_strong_secret"
PORT=3000

# Supabase (required for file uploads)
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# PayPal (required for invoice payment)
PAYPAL_ENV="sandbox" # sandbox | live
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"

# Paymob (optional second payment gateway)
PAYMOB_API_KEY="your-paymob-api-key"
PAYMOB_INTEGRATION_ID="your-paymob-integration-id"
PAYMOB_IFRAME_ID="your-paymob-iframe-id"
# Optional, defaults to https://accept.paymobsolutions.com
PAYMOB_BASE_URL="https://accept.paymobsolutions.com"

# Async Excel imports (optional, recommended for large files)
# Configure either REDIS_URL OR REDIS_HOST/REDIS_PORT
# REDIS_URL="redis://:password@localhost:6379/0"
REDIS_HOST="localhost"
REDIS_PORT=6379
# REDIS_PASSWORD=""
REDIS_DB=0
EXCEL_IMPORT_ASYNC_THRESHOLD=200
USER_IMPORT_WORKER_CONCURRENCY=3
```

If Redis is not configured, Excel imports still work in synchronous mode.
If Redis is configured, imports above `EXCEL_IMPORT_ASYNC_THRESHOLD` are queued and can be tracked via:

`GET /api/v1/users/upload-excel/jobs/{jobId}`

**Getting Supabase credentials:**

1. Go to [Supabase Dashboard](https://app.supabase.com/) → your project → Settings → API.
2. Copy the **URL** and the **`service_role`** key (not the `anon` key).
3. Create a Storage bucket named `course-materials` (public or configure RLS).

### 3. Database Setup

Run migrations and generate the Prisma client:

```bash
npm run prisma:migrate   # npx prisma migrate dev
npm run prisma:generate  # npx prisma generate
```

### 4. Run the Server

```bash
npm run dev   # development (node --watch)
npm start     # production
```

The server starts at `http://localhost:3000` (or `$PORT`).  
Interactive API docs are available at `http://localhost:3000/docs`.

---

## Available Scripts

| Script                    | Description                                              |
| ------------------------- | -------------------------------------------------------- |
| `npm run dev`             | Start with `node --watch` (auto-restart on file changes) |
| `npm start`               | Start in production mode                                 |
| `npm run seed`            | Seed the development database                            |
| `npm run prisma:migrate`  | Run Prisma migrations                                    |
| `npm run prisma:generate` | Regenerate Prisma client                                 |
| `npm run db:studio`       | Open Prisma Studio (visual DB browser)                   |

---

## Seeding the Database (Development Only)

> **Warning:** The seed script calls `deleteMany()` on several tables. Only run it against a development database.

```bash
npm run seed
```

Default seeded password for all users: **`Passw0rd!`** — change this before any real deployment.

---

## API Overview

All endpoints are prefixed with `/api/v1`. Full interactive documentation (with request/response schemas) is available at `/docs`.

| Prefix              | Domain                                   |
| ------------------- | ---------------------------------------- |
| `/auth`             | Login, register                          |
| `/users`            | User CRUD                                |
| `/student`          | Student profile                          |
| `/leaderboard`      | Student rankings                         |
| `/schedule`         | Weekly timetables                        |
| `/courses`          | Course catalogue & prerequisites         |
| `/course-offerings` | Per-semester offerings                   |
| `/registration`     | Enroll / drop                            |
| `/attendance`       | Attendance records (WebSocket)           |
| `/grades`           | Scores, grade distributions, transcripts |
| `/exams`            | Exam schedule                            |
| `/tasks`            | Assignments & submissions                |
| `/materials`        | Course file uploads                      |
| `/teachers`         | Teacher / TA management                  |
| `/community`        | Groups, posts, comments, likes           |
| `/notifications`    | User notifications & preferences         |
| `/admin`            | Admin dashboard & stats                  |
| `/departments`      | Department & financial data              |
| `/config`           | System configuration                     |

---

## WebSocket (Socket.IO)

The HTTP server is wrapped with Socket.IO for real-time features:

-   **Attendance:** students check in live during a session; instructors see updates instantly.
-   **Notifications:** events are pushed to connected clients as they occur (new grade, exam reminder, etc.).

Connect to `ws://localhost:3000` using the Socket.IO client library.

---

## User Roles

| Role                 | Description                 |
| -------------------- | --------------------------- |
| `student`            | Enrolled student            |
| `doctor`             | Course instructor           |
| `teaching_assistant` | Tutorial/lab TA             |
| `admin`              | Departmental administrator  |
| `super_admin`        | Platform-wide administrator |
| `leader`             | Student union / club leader |

---

## Authentication

All protected routes require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

Obtain a token via `POST /api/v1/auth/login`. The `authMiddleware` validates the token and attaches the decoded user to `req.user`.

---

## Contributing

1.  Fork the repository and branch off `main`.
2.  Follow the existing MVC pattern (route → controller → Prisma).
3.  Reuse selectors in `src/prisma/selectors/` for consistent query shapes.
4.  Keep Swagger JSDoc comments up to date when adding or modifying endpoints.
5.  Add or update tests in `tests/` for any changed behaviour.
6.  If the Prisma schema changes, include a migration: `npm run prisma:migrate -- --name <describe_change>`.
7.  Open a PR with a clear description of what changed and why.

## Useful commands

-   Start dev server (watch):

```bash
npm run dev
```

-   Run seed (DESTRUCTIVE):

```bash
npm run seed
```

-   Prisma migrate & generate:

```bash
npx prisma migrate dev --name <migration-name>
npx prisma generate
```
