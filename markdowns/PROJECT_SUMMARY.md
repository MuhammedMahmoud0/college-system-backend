# College System Backend - Project Summary

## 📋 Overview

**College System Backend** is a comprehensive RESTful API for managing college operations, built with modern Node.js technologies. It handles student management, course registration, attendance tracking, exam scheduling, file uploads, community features, and more.

**Tech Stack:**

-   **Runtime**: Node.js (ES Modules)
-   **Framework**: Express.js v5
-   **Database**: PostgreSQL with Prisma ORM
-   **Authentication**: JWT (JSON Web Tokens)
-   **File Storage**: Supabase Storage
-   **Documentation**: Swagger/OpenAPI
-   **Logging**: Winston
-   **Password Hashing**: bcryptjs

---

## 🎯 Project Purpose

This system provides a backend API for:

-   **Students**: Manage profiles, view schedules, enroll in courses, participate in community, track attendance
-   **Teachers/Doctors**: Manage courses, upload materials, track student performance
-   **Admins**: Manage users, courses, departments, announcements, system configuration
-   **Teaching Assistants/Leaders**: Assist in course management and student support

---

## 🏗️ Architecture

### Project Structure

```
college-system-backend/
├── src/
│   ├── server.js                    # Application entry point
│   ├── config/
│   │   ├── connection.js            # Prisma client & database connection
│   │   └── swagger.js               # Swagger/OpenAPI configuration
│   ├── controllers/                 # Business logic for each feature
│   │   ├── authController.js        # Login, token management
│   │   ├── usersController.js       # User CRUD, bulk import via Excel
│   │   ├── studentProfileController.js # Student profile, avatar upload
│   │   ├── studentSettingsController.js # Password management
│   │   ├── courseController.js      # Course management
│   │   ├── scheduleController.js    # Schedule viewing (lectures/tutorials)
│   │   ├── materialsController.js   # File upload/download for course materials
│   │   ├── notificationController.js # User notifications system
│   │   ├── teacherController.js     # Teacher-specific features
│   │   ├── communityController.js   # Groups, posts, comments, likes
│   │   ├── registrationController.js # Course enrollment
│   │   ├── examController.js        # Exam scheduling and viewing
│   │   └── leaderboard/             # Student leaderboard/ranking
│   ├── routes/                      # Express route definitions
│   ├── middlewares/
│   │   ├── authMiddleware.js        # JWT verification & role-based authorization
│   │   └── uploadMiddleware.js      # Multer configuration for file uploads
│   ├── swagger/                     # Swagger documentation for each module
│   ├── utils/
│   │   ├── logger.js                # Winston logger configuration
│   │   └── supabase.js              # Supabase client for file storage
│   └── prisma/
│       └── selectors/               # Reusable Prisma select objects
├── prisma/
│   ├── schema.prisma                # Database schema (30+ tables)
│   ├── migrations/                  # Database migration history
│   └── seed.js                      # Development seed data
├── logs/                            # Application logs (error.log, combined.log)
├── .env                             # Environment variables (not in repo)
└── package.json                     # Dependencies & scripts
```

---

## 🔐 Authentication & Authorization

### Authentication Method

-   **JWT-based authentication** with Bearer tokens
-   Tokens issued on successful login via `POST /api/v1/auth/login`
-   Token contains: `userId`, `email`, `role`

### User Roles

1. **student** - Can view schedules, enroll in courses, manage profile, participate in community
2. **doctor** - Can manage courses, upload materials, view student performance
3. **teaching_assistant** - Assists doctors with course management
4. **leader** - Student leaders with extended privileges
5. **admin** - Full system access except super admin functions
6. **super_admin** - Complete system control, user management

### Middleware

-   **`authMiddleware`**: Verifies JWT token, attaches `req.user`
-   **`authorizationMiddleware(roles)`**: Restricts endpoints to specific roles

---

## 📊 Database Schema (Key Entities)

### Core Tables

**users**

-   Fields: `id` (UUID), `full_name`, `email`, `password_hash`, `role`, `avatar_url`, `phone`, `address`, `national_id`
-   Purpose: Central user table for all system users

**student_profiles**

-   Fields: `student_id`, `user_id`, `department_id`, `year_level`, `cgpa`, `total_credits`
-   Purpose: Additional student-specific data

**courses**

-   Fields: `code`, `name`, `credits`, `department_id`
-   Purpose: Course catalog

**course_offerings**

-   Fields: `offering_id`, `course_code`, `semester`
-   Purpose: Courses offered in specific semesters

**lectures**

-   Fields: `lecture_id`, `offering_id`, `instructor_user_id`, `day_of_week`, `start_time`, `end_time`, `location`

**tutorials_labs**

-   Fields: `tutorial_lab_id`, `offering_id`, `assistant_user_id`, `day_of_week`, `start_time`, `end_time`, `location`

**enrollments**

-   Fields: `student_user_id`, `lecture_id`, `tutorial_lab_id`, `mid_score`, `work_score`, `final_score`, `grade`, `status`
-   Purpose: Track student course registrations and grades

**course_materials**

-   Fields: `id`, `lecture_id`, `tutorial_lab_id`, `title`, `url`, `file_id`
-   Purpose: Store links to uploaded files or external resources

**files**

-   Fields: `file_id`, `file_name`, `file_path`, `size_bytes`, `uploaded_by_user_id`
-   Purpose: Metadata for files stored in Supabase Storage

**attendance**

-   Fields: `id`, `student_user_id`, `lecture_id`, `tutorial_lab_id`, `session_date`, `status`

**exams**

-   Fields: `exam_id`, `offering_id`, `exam_name`, `exam_type`, `exam_date`, `start_time`, `end_time`, `location`

**notifications**

-   Fields: `id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`

**community_groups**

-   Fields: `id`, `name`, `description`, `avatar_url`

**community_posts**

-   Fields: `id`, `group_id`, `author_id`, `content`, `image_url`, `is_pinned`, `created_at`

**post_comments** & **post_likes**

-   Purpose: Social features for community posts

### Total Tables: 30+

---

## 🚀 Implemented Features

### ✅ 1. Authentication & User Management

**Endpoints:**

-   `POST /api/v1/auth/login` - User login, returns JWT token
-   `GET /api/v1/users` - List all users (paginated, with filters)
-   `POST /api/v1/users` - Create single user with validation
-   `POST /api/v1/users/upload-excel` - Bulk import users from Excel file
-   `GET /api/v1/users/:id` - Get user by ID
-   `PUT /api/v1/users/:id` - Update user
-   `DELETE /api/v1/users/:id` - Delete user

**Features:**

-   Password hashing with bcrypt (salt rounds: 10)
-   Email uniqueness validation
-   Student ID uniqueness validation for student role
-   Automatic student profile creation for students
-   Excel parsing with ExcelJS for bulk imports
-   Error handling with detailed validation messages

---

### ✅ 2. Student Profile Management

**Endpoints:**

-   `GET /api/v1/student/profile` - Get current student's profile
-   `PUT /api/v1/student/profile` - Update profile with optional avatar upload

**Features:**

-   **Avatar Upload**:
    -   Multipart/form-data support via Multer
    -   Uploads to Supabase Storage (`avatars` bucket)
    -   Path: `{user_id}/avatar_{user_id}_{timestamp}.{ext}`
    -   Generates public preview URLs (not download links)
    -   Automatic deletion of old avatars when new one uploaded
-   **Updatable Fields**: `full_name`, `address`, `phone`, `national_id`, `avatar`
-   All fields are optional (partial updates supported)

---

### ✅ 3. Student Settings

**Endpoints:**

-   `PUT /api/v1/student-settings/password` - Update password

**Features:**

-   Current password verification
-   Password confirmation matching
-   Minimum 6 characters validation
-   bcrypt hashing for new password
-   Student-only access (role-based authorization)

---

### ✅ 4. Course Materials Management

**Endpoints:**

-   `POST /api/v1/materials` - Upload file or add link
-   `GET /api/v1/materials` - List materials with filters
-   `GET /api/v1/materials/:id` - Get material details
-   `GET /api/v1/materials/:id/download` - Get signed download URL (24h expiry)
-   `GET /api/v1/materials/:id/stream` - Stream file directly
-   `PUT /api/v1/materials/:id` - Update material
-   `DELETE /api/v1/materials/:id` - Delete material and associated file

**Features:**

-   **File Upload**:
    -   Uploads to Supabase Storage (`course-materials` bucket)
    -   Path: `materials/{lecture_id or tutorial_id}/{filename}_{timestamp}.{ext}`
    -   Stores metadata in `files` table
    -   Links to `course_materials` table
-   **Link Storage**: External resource URLs (YouTube, Google Drive, etc.)
-   **Title Customization**: Custom titles for both files and links
-   **Validation**: Checks lecture/tutorial existence before upload
-   **Download Options**:
    -   Signed URL (24h expiry) for direct downloads
    -   Streaming proxy for in-browser viewing
-   **Authorization**: Only doctors/admins can create/update/delete
-   **Proper Deletion**: Removes file from storage, then database (correct FK order)

---

### ✅ 5. Schedule Management

**Endpoints:**

-   `GET /api/v1/schedule/weekly` - Get weekly schedule for current user
-   `GET /api/v1/schedule/:date` - Get schedule for specific date

**Features:**

-   Role-aware schedules (students see enrolled courses, teachers see teaching courses)
-   Groups by day of week
-   Returns lecture and tutorial details with location, time, course info
-   Supports date filtering

---

### ✅ 6. Notifications System

**Endpoints:**

-   `GET /api/v1/notifications` - Get user notifications (paginated)
-   `GET /api/v1/notifications/unread/count` - Count unread notifications
-   `PUT /api/v1/notifications/:id/read` - Mark single notification as read
-   `PUT /api/v1/notifications/mark-all-read` - Mark all as read
-   `DELETE /api/v1/notifications/:id` - Delete single notification
-   `DELETE /api/v1/notifications` - Delete all notifications
-   `POST /api/v1/notifications` - Create notification (admin only)
-   `POST /api/v1/notifications/bulk` - Create bulk notifications (admin only)

**Features:**

-   Pagination support
-   Filtering by read/unread status
-   Notification types: `info`, `warning`, `success`, `error`, `announcement`
-   Bulk creation for announcements to multiple users
-   Unread count tracking

---

### ✅ 7. Leaderboard System

**Endpoints:**

-   `GET /api/v1/leaderboard` - Get top students by CGPA
-   `GET /api/v1/leaderboard/department/:departmentId` - Leaderboard by department

**Features:**

-   Ranks students by CGPA
-   Shows rank, student name, department, CGPA, total credits
-   Filterable by department
-   Pagination support

---

### ✅ 8. Teacher Features

**Endpoints:**

-   `GET /api/v1/teacher/courses` - Get courses taught by teacher
-   `GET /api/v1/teacher/courses/:courseCode/students` - Get enrolled students

**Features:**

-   Lists lectures taught by teacher
-   Shows enrolled students with grades
-   Includes student contact info and academic details

---

### ✅ 9. Community Features

**Endpoints:**

-   Groups, Posts, Comments, Likes management
-   (Detailed implementation in `communityController.js`)

---

### ✅ 10. Course & Registration

**Endpoints:**

-   Course browsing, filtering
-   Student enrollment
-   (Detailed implementation in `courseController.js`, `registrationController.js`)

---

### ✅ 11. Exam Scheduling

**Endpoints:**

-   Exam viewing and management
-   (Detailed implementation in `examController.js`)

---

## 🔧 Key Technical Implementations

### 1. File Upload System (Supabase Storage)

**Configured Buckets:**

-   `course-materials` - Course files (PDFs, videos, etc.)
-   `avatars` - User profile pictures (public bucket)

**Upload Flow:**

1. Multer middleware captures multipart form data
2. File buffer uploaded to Supabase Storage
3. Metadata saved to `files` table
4. Reference created in `course_materials` or `users.avatar_url`
5. Public/signed URL returned to client

**Key Configuration:**

-   Service role key for bypassing DB RLS
-   Proper RLS policies needed for storage buckets
-   Content-Type preservation for correct MIME types
-   Automatic old file cleanup on updates

### 2. Authentication Middleware

**JWT Verification:**

```javascript
authMiddleware → verifies token → attaches req.user
authorizationMiddleware(roles) → checks req.user.role
```

**Token Payload:**

```json
{
    "userId": "uuid",
    "email": "user@example.com",
    "role": "student"
}
```

### 3. Prisma Selectors (Code Reusability)

**Location**: `src/prisma/selectors/`

-   `user.selectors.js` - Defines reusable field selections for users
-   `studentProfile.selectors.js` - Student profile field selections

**Benefit**: Consistent data shaping across controllers

### 4. Logging System

**Winston Logger** (`src/utils/logger.js`):

-   Logs to console (development)
-   Logs to files (production):
    -   `logs/error.log` - Error level only
    -   `logs/combined.log` - All levels
-   Timestamp and JSON formatting
-   Error tracking for debugging

### 5. Swagger Documentation

**Auto-generated API docs** at: `http://localhost:3000/docs`

**Documented Modules:**

-   Authentication
-   Users
-   Student Profile
-   Student Settings
-   Materials
-   Notifications
-   Schedule
-   Teacher
-   Leaderboard
-   Community
-   Courses
-   Exams
-   Registration

**Schema Documentation:**

-   Request/Response schemas
-   Validation rules
-   Error response examples
-   Authentication requirements

---

## 🔌 API Base Path

All endpoints prefixed with: `/api/v1`

Example: `http://localhost:3000/api/v1/auth/login`

---

## 📝 Environment Variables

**Required Variables:**

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/college_db?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"

# Server
PORT=3000

# Supabase (for file storage)
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

**Validation:**

-   Server validates Supabase env vars on startup
-   Logs warnings if missing (without exposing secrets)

---

## 🛠️ Development Setup

### 1. Clone & Install

```bash
git clone https://github.com/MuhammedMahmoud0/college-system-backend.git
cd college-system-backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Database Setup

```bash
# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# (Optional) Seed development data
npm run seed
```

### 4. Supabase Setup

**Create Buckets:**

1. Go to Supabase Dashboard → Storage
2. Create `course-materials` bucket (private or public with RLS)
3. Create `avatars` bucket (public recommended)

**Configure RLS Policies:**

-   See `SUPABASE_SETUP.md` and `FIX_STORAGE_RLS.md` for detailed steps

### 5. Run Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

**Server starts on:** `http://localhost:3000`  
**Swagger docs:** `http://localhost:3000/docs`

---

## 📦 NPM Scripts

```bash
npm run dev              # Start with auto-reload (--watch)
npm start                # Start production server
npm run seed             # Seed development data (destructive!)
npm run prisma:migrate   # Run Prisma migrations
npm run prisma:generate  # Generate Prisma client
npm run db:studio        # Open Prisma Studio (database GUI)
```

---

## 🧪 Development Tools

-   **Prisma Studio**: `npm run db:studio` - Visual database browser at `http://localhost:5555`
-   **Swagger UI**: Browse API docs and test endpoints at `/docs`
-   **Winston Logs**: Check `logs/` folder for error tracking

---

## 🔒 Security Implementations

1. **Password Security**:

    - bcrypt hashing with salt rounds 10
    - No plaintext passwords stored
    - Password strength validation (min 6 characters)

2. **JWT Security**:

    - Signed tokens with secret key
    - Token expiration (configurable)
    - Role-based access control

3. **Input Validation**:

    - Email uniqueness checks
    - Student ID uniqueness for students
    - Required field validation
    - Type checking and sanitization

4. **File Upload Security**:

    - MIME type validation
    - File size limits (via Multer)
    - Secure storage paths (UUID-based)
    - RLS policies on storage buckets

5. **Error Handling**:
    - No sensitive data in error messages
    - Generic error responses to clients
    - Detailed logging server-side only

---

## 📈 Scalability Considerations

1. **Database**:

    - Prisma connection pooling
    - Indexed columns for common queries (email, student_id, dates)
    - Pagination on list endpoints

2. **File Storage**:

    - Offloaded to Supabase (CDN-backed)
    - Signed URLs with expiration
    - Old file cleanup to prevent bloat

3. **Caching** (Future):

    - Redis for session management
    - Cache frequently accessed data (schedules, courses)

4. **Rate Limiting** (Future):
    - Prevent abuse on public endpoints
    - Per-user rate limits

---

## 🐛 Known Issues & Solutions

### Issue 1: Supabase Storage RLS Errors

**Error**: "new row violates row-level security policy"  
**Solution**: Configure storage RLS policies in Supabase dashboard  
**Guide**: See `FIX_STORAGE_RLS.md`

### Issue 2: Foreign Key Constraint on Material Delete

**Error**: "violates foreign key constraint"  
**Solution**: Delete `course_materials` record before `files` record  
**Status**: ✅ Fixed in `materialsController.js`

### Issue 3: Avatar URLs Download Instead of Preview

**Issue**: URLs trigger file download  
**Solution**: Make `avatars` bucket public in Supabase  
**Guide**: See `AVATAR_PREVIEW_SETUP.md`

---

## 🚧 Future Enhancements (Roadmap)

-   [ ] Real-time notifications (WebSockets/Socket.io)
-   [ ] Email notifications for important events
-   [ ] Advanced search and filtering
-   [ ] Performance analytics dashboard
-   [ ] Mobile app integration (React Native)
-   [ ] Attendance QR code scanning
-   [ ] Grade calculation automation
-   [ ] Report generation (PDF transcripts)
-   [ ] Multi-language support
-   [ ] Rate limiting and API throttling
-   [ ] Redis caching layer
-   [ ] Automated testing suite (Jest/Mocha)

---

## 👥 User Roles & Capabilities Summary

| Feature                   | Student | Doctor  | TA      | Leader | Admin | Super Admin |
| ------------------------- | ------- | ------- | ------- | ------ | ----- | ----------- |
| View Schedule             | ✅      | ✅      | ✅      | ✅     | ✅    | ✅          |
| Enroll in Courses         | ✅      | ❌      | ❌      | ❌     | ❌    | ❌          |
| Upload Course Materials   | ❌      | ✅      | ✅      | ❌     | ✅    | ✅          |
| View Course Materials     | ✅      | ✅      | ✅      | ✅     | ✅    | ✅          |
| Manage Own Profile        | ✅      | ✅      | ✅      | ✅     | ✅    | ✅          |
| Update Password           | ✅      | ✅      | ✅      | ✅     | ✅    | ✅          |
| View Leaderboard          | ✅      | ✅      | ✅      | ✅     | ✅    | ✅          |
| Community Posts/Comments  | ✅      | ✅      | ✅      | ✅     | ✅    | ✅          |
| Create Users              | ❌      | ❌      | ❌      | ❌     | ✅    | ✅          |
| Bulk Import Users (Excel) | ❌      | ❌      | ❌      | ❌     | ✅    | ✅          |
| Send Notifications        | ❌      | ❌      | ❌      | ❌     | ✅    | ✅          |
| Manage Courses            | ❌      | Limited | Limited | ❌     | ✅    | ✅          |
| System Configuration      | ❌      | ❌      | ❌      | ❌     | ✅    | ✅          |

---

## 📚 Documentation Files

-   **README.md** - Quick start guide
-   **PROJECT_SUMMARY.md** - This file (comprehensive overview)
-   **SUPABASE_SETUP.md** - Supabase configuration guide
-   **FIX_STORAGE_RLS.md** - Storage RLS troubleshooting
-   **AVATAR_PREVIEW_SETUP.md** - Avatar upload configuration
-   **Swagger Docs** - Interactive API documentation at `/docs`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Guidelines:**

-   Follow existing code style (ES modules, async/await)
-   Add Swagger documentation for new endpoints
-   Update Prisma schema if adding database changes
-   Include migrations with schema changes
-   Test thoroughly before submitting

---

## 📄 License

ISC License - See LICENSE file

---

## 📞 Support

For issues or questions:

-   GitHub Issues: https://github.com/MuhammedMahmoud0/college-system-backend/issues
-   Repository: https://github.com/MuhammedMahmoud0/college-system-backend

---

## 🎓 Summary for AI/Developers

**What is this project?**  
A production-ready backend API for college management systems with authentication, file storage, course management, community features, and comprehensive documentation.

**What's implemented?**  
Authentication, user management, student profiles with avatars, course materials upload/download, schedules, notifications, leaderboard, teacher features, community posts, and Swagger docs.

**What technology?**  
Node.js + Express + Prisma (PostgreSQL) + JWT + Supabase Storage + Swagger.

**How to run?**

1. `npm install`
2. Setup `.env` (database, JWT secret, Supabase)
3. `npx prisma migrate dev`
4. `npm run dev`
5. Access API at `http://localhost:3000` and docs at `/docs`

**Key patterns:**

-   MVC architecture (routes → controllers → Prisma)
-   JWT middleware for auth
-   Role-based authorization
-   Multer + Supabase for file uploads
-   Winston for logging
-   Reusable Prisma selectors

**Current state:**  
Fully functional with 13+ feature modules, 30+ database tables, comprehensive API documentation, and production-ready security practices.

---

_Last Updated: February 10, 2026_
