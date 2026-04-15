# Redis Caching Implementation Guide

## Project Context

- **Tech Stack**: Node.js/Express, Prisma ORM, PostgreSQL
- **Existing Redis**: Already installed (`ioredis` v5.10.0) and configured for BullMQ job queue — **no application-level caching exists**
- **Goal**: Implement Redis caching to reduce database load and improve response times

---

## Cache Architecture

Use a **cache-aside pattern**:
1. Check Redis first
2. On miss → query PostgreSQL → write to Redis → return response
3. On mutations → delete affected cache keys explicitly

### Recommended File Structure
```
src/config/redis.js              # Shared ioredis client (separate from BullMQ)
src/services/cacheService.js     # Cache get/set/delete/invalidate helpers
src/middlewares/cacheMiddleware.js # Express middleware for GET response caching
```

---

## TIER 1 — HIGH PRIORITY (Immediate impact, highest ROI)

### 1. Departments — Reference/Lookup Data
| Detail | Value |
|--------|-------|
| **File** | `src/controllers/departmentController.js` |
| **Functions** | `getAllDepartments`, `getDepartmentById` |
| **Query** | `departments.findMany()` with `_count` of courses and student_profiles |
| **Why cache** | Nearly static — created/updated rarely but referenced on nearly every page (course creation, student profile, user management, financials, registration filtering) |
| **Cache Key** | `departments:list` / `departments:detail:{id}` |
| **TTL** | 30 minutes |
| **Invalidate on** | Department CREATE/UPDATE/DELETE |

---

### 2. Financials / Credit Prices — Reference/Configuration Data
| Detail | Value |
|--------|-------|
| **File** | `src/controllers/financialController.js` |
| **Functions** | `getAllFinancials`, `getFinancialById` |
| **Query** | `financials.findMany()` joined with departments |
| **Why cache** | Credit prices change very rarely (once per semester). Critical path in registration flow to compute tuition |
| **Cache Key** | `financials:list` / `financials:by-dept:{departmentId}` |
| **TTL** | 1 hour |
| **Invalidate on** | Financial UPDATE |

---

### 3. Leaderboard — Heavy Aggregation Query
| Detail | Value |
|--------|-------|
| **File** | `src/controllers/leaderboard/leaderboard.service.js` |
| **Function** | `buildLeaderboard` |
| **Queries** | GPA type: `student_profiles.findMany()` with cgpa, users, departments. Attendance type: 3 parallel queries (attendance groupBy totals, attendance groupBy presents, student_profiles). Activities type: 4 parallel queries (community_posts groupBy, post_likes groupBy, task_submissions groupBy, student_profiles) — then client-side joins |
| **Why cache** | Extremely expensive multi-table aggregation. Each leaderboard hit executes 3–4 full-table queries with client-side joins |
| **Cache Key** | `leaderboard:{type}:{department}:{level}:{limit}` |
| **TTL** | 5–15 minutes |
| **Invalidate on** | Grade updates, attendance saves, task submissions graded, community posts/likes changes |

---

### 4. Admin Dashboard Alerts — Multiple Full-Table Scans
| Detail | Value |
|--------|-------|
| **File** | `src/controllers/adminDashboardController.js` |
| **Function** | `getAlerts` |
| **Queries** | `lectures.findMany()` with enrolled students; `users.findMany()` for new faculty; `enrollments.findMany()` for invoice overdue snapshot; `lectures.findMany()` with enrollments for dropout rate |
| **Why cache** | Four full-table scans across lectures, users, enrollments per admin dashboard load |
| **Cache Key** | `admin:alerts` |
| **TTL** | 2–5 minutes |
| **Invalidate on** | Enrollment changes, lecture changes, user creation |

---

### 5. Admin Dashboard Activity Feed — Multi-Table Aggregation
| Detail | Value |
|--------|-------|
| **File** | `src/controllers/adminDashboardController.js` |
| **Function** | `getRecentActivity` |
| **Queries** | Four parallel `findMany()` on users, community_posts, announcements, task_submissions (each ordered by date DESC, take N) |
| **Why cache** | Multiple table scans with sorting on each admin dashboard load |
| **Cache Key** | `admin:activity:{limit}` |
| **TTL** | 1–2 minutes |
| **Invalidate on** | Any new user, post, announcement, or submission |

---

### 6. Current Semester / Registration Period / Payment Period
| Detail | Value |
|--------|-------|
| **File** | `src/utils/periodHelpers.js` |
| **Functions** | `getCurrentSemester`, `getRegistrationPeriod`, `getPaymentPeriod` |
| **Queries** | `course_offerings.findFirst()` orderBy year DESC; `academic_calendar.findMany()` with complex WHERE/OR |
| **Why cache** | Called on nearly every student-facing request (registration, payment, course offerings, schedule). Current semester changes only once per term |
| **Cache Key** | `semester:current`, `period:registration:{semester}:{year}`, `period:payment:{semester}:{year}` |
| **TTL** | 10–30 min (semester), 5–10 min (periods) |
| **Invalidate on** | Academic calendar changes |

---

### 7. Available Course Offerings for Registration — Complex Filtered Query
| Detail | Value |
|--------|-------|
| **File** | `src/controllers/registrationController.js` |
| **Function** | `getAvailableOfferings` |
| **Queries** | 6+ DB queries: `course_offerings.findMany()` with lectures/tutorials/courses; `enrollments.findMany()` for completed; `enrollments.findMany()` for current; `course_prerequisites.findMany()` (entire table); `getCurrentSemester()`; `getRegistrationPeriod()` |
| **Why cache** | One of the most complex endpoints. Students may refresh repeatedly during registration period. This is the registration bottleneck |
| **Cache Key** | `registration:available:{userId}:{semester}:{year}` (students), `registration:available:staff:{semester}:{year}` (staff) |
| **TTL** | 2–5 min (students), 10 min (staff) |
| **Invalidate on** | Enrollment changes, course offering changes |

---

### 8. Course Offerings (All) — Read-Heavy Reference
| Detail | Value |
|--------|-------|
| **File** | `src/controllers/courseOfferingController.js` |
| **Function** | `getAllCourseOfferings` |
| **Query** | `course_offerings.findMany()` with includes of courses, _count of lectures/tutorials_labs/exams |
| **Why cache** | Admin reference data. Offering data changes only at semester boundaries |
| **Cache Key** | `course-offerings:all` |
| **TTL** | 15–30 minutes |
| **Invalidate on** | Course offering CREATE/UPDATE/DELETE |

---

### 9. All Courses — Reference Data
| Detail | Value |
|--------|-------|
| **File** | `src/controllers/courseController.js` |
| **Function** | `getAllCourses` |
| **Query** | `courses.findMany()` with departments and prerequisites (nested includes) |
| **Why cache** | Course catalog changes rarely. Complex nested includes with prerequisites join |
| **Cache Key** | `courses:all` |
| **TTL** | 30 minutes |
| **Invalidate on** | Course CRUD |

---

### 10. Doctor / TA Alerts — Computed Dashboard Data
| Detail | Value |
|--------|-------|
| **Files** | `src/controllers/doctorDashboardController.js`, `src/controllers/teachingAssistantDashboardController.js` |
| **Functions** | `getDoctorAlerts`, `getTeachingAssistantAlerts` |
| **Queries** | Multiple queries on lectures, enrollments, tasks, task_submissions, grade_distributions (5+ per call) |
| **Why cache** | Multiple sequential queries per dashboard load. Doctors/TAs view this frequently |
| **Cache Key** | `doctor:alerts:{doctorId}`, `ta:alerts:{taId}` |
| **TTL** | 1–2 minutes |
| **Invalidate on** | Task/submission changes, grade updates, enrollment changes |

---

## TIER 2 — MEDIUM PRIORITY (Significant benefit, moderate complexity)

### 2.1 Course Details by Offering ID
| Detail | Value |
|--------|-------|
| **File** | `src/controllers/courseController.js` |
| **Function** | `getCourseDetails` |
| **Query** | `course_offerings.findUnique()` with courses, lectures (with users), tutorials_labs (with users) |
| **Cache Key** | `course:detail:{offeringId}` |
| **TTL** | 15 minutes |
| **Invalidate on** | Lecture/tutorial CRUD |

---

### 2.2 Exam Schedule Per Student
| Detail | Value |
|--------|-------|
| **File** | `src/controllers/examController.js` |
| **Function** | `examSchedule` |
| **Query** | `enrollments.findMany()` with deep includes (lectures → course_offerings → courses + exams, users) |
| **Why cache** | Students check multiple times during exam week. Data only changes when exams are added/modified |
| **Cache Key** | `exam:schedule:{userId}` |
| **TTL** | 10 minutes |
| **Invalidate on** | Exam CREATE/UPDATE/DELETE |

---

### 2.3 All Exams — Admin Reference
| Detail | Value |
|--------|-------|
| **File** | `src/controllers/examController.js` |
| **Functions** | `getAllExams`, `getActiveCourses` |
| **Cache Key** | `exams:all`, `exams:active-courses` |
| **TTL** | 10–15 minutes |
| **Invalidate on** | Exam CRUD, offering CRUD |

---

### 2.4 Doctor Courses Dashboard
| Detail | Value |
|--------|-------|
| **File** | `src/controllers/doctorDashboardController.js` |
| **Function** | `getDoctorCourses` |
| **Query** | `lectures.findMany()` where instructor_id = JWT, with course_offerings → courses, _count of enrollments |
| **Cache Key** | `doctor:courses:{doctorId}` |
| **TTL** | 5 minutes |
| **Invalidate on** | Lecture assignment changes, enrollment changes |

---

### 2.5 Student Schedule
| Detail | Value |
|--------|-------|
| **File** | `src/controllers/scheduleController.js` |
| **Function** | `getStudentSchedule` |
| **Query** | `enrollments.findMany()` with deep includes (lectures → course_offerings → courses + users, tutorials_labs → same) |
| **Cache Key** | `schedule:student:{userId}` |
| **TTL** | 5 minutes |
| **Invalidate on** | Enrollment changes |

---

### 2.6 Teacher Schedule
| Detail | Value |
|--------|-------|
| **File** | `src/controllers/teacherController.js` |
| **Function** | `getTeacherSchedule` |
| **Query** | `users.findUnique()` with lectures and tutorials_labs includes |
| **Cache Key** | `schedule:teacher:{teacherId}` |
| **TTL** | 15 minutes |
| **Invalidate on** | Lecture/tutorial assignment changes |

---

### 2.7 All Teachers — Reference Data
| Detail | Value |
|--------|-------|
| **File** | `src/controllers/teacherController.js` |
| **Function** | `getAllTeachers` |
| **Query** | `users.findMany()` where role in (doctor, teaching_assistant), with lectures and tutorials_labs includes |
| **Cache Key** | `teachers:all` |
| **TTL** | 30 minutes |
| **Invalidate on** | User role/assignment changes |

---

### 2.8 Academic Calendar
| Detail | Value |
|--------|-------|
| **File** | `src/controllers/systemConfigController.js` |
| **Function** | `getAcademicCalendar` |
| **Cache Key** | `calendar:{semester}:{academic_year}:{event_type}` |
| **TTL** | 30 minutes |
| **Invalidate on** | Calendar CRUD |

---

### 2.9 Announcements
| Detail | Value |
|--------|-------|
| **File** | `src/controllers/systemConfigController.js` |
| **Function** | `getAnnouncements` |
| **Query** | `announcements.findMany()` where expire_at > now, audience in allowed list |
| **Why cache** | Read on nearly every dashboard/homepage. Changes only when admins post |
| **Cache Key** | `announcements:{userRole}` |
| **TTL** | 5 minutes |
| **Invalidate on** | Announcement CREATE/UPDATE/DELETE |

---

### 2.10 Admin Enrollment Trends — Aggregation
| Detail | Value |
|--------|-------|
| **File** | `src/controllers/adminDashboardController.js` |
| **Function** | `getEnrollmentTrends` |
| **Query** | Raw SQL with JOIN across enrollments, lectures, course_offerings with GROUP BY |
| **Cache Key** | `admin:enrollment-trends:{fromYear}:{toYear}` |
| **TTL** | 10–30 minutes |

---

### 2.11 Admin Payment Aging — Aggregation
| Detail | Value |
|--------|-------|
| **File** | `src/controllers/adminDashboardController.js` |
| **Function** | `getPaymentAging` |
| **Query** | `getInvoiceOverdueSnapshot()` — full table scan of enrollments with nested invoice selects |
| **Cache Key** | `admin:payment-aging` |
| **TTL** | 5 minutes |

---

## TIER 3 — LOW PRIORITY (Lower ROI or more complex invalidation)

| # | Data | File | Function | Cache Key | TTL | Notes |
|---|------|------|----------|-----------|-----|-------|
| 3.1 | Student Profile | studentProfileController.js | getStudentProfile | `student:profile:{userId}` | 5 min | Per-user cache, benefit scales with users |
| 3.2 | Grade Distribution | gradeController.js | getGradeDistribution | `grade:distribution:{lectureId}` | 10 min | Simple 2-query pattern |
| 3.3 | Grades by Lecture/Tutorial | gradeController.js | getGradesByLecture, getGradesByTutorialLab | `grades:lecture:{id}`, `grades:tutorial:{id}` | 1–2 min | Short TTL due to active grading sessions |
| 3.4 | Community Feed | communityController.js | getCommunityFeed | `community:feed:{userId}:{page}:{limit}` | 30s–1 min | Highly dynamic, high cardinality keys |
| 3.5 | Materials by Lecture/Tutorial | materialsController.js | getMaterials | `materials:lecture:{id}`, `materials:tutorial:{id}` | 15 min | Materials change infrequently |
| 3.6 | Digital Student ID | studentProfileController.js | getDigitalStudentIdFront, getDigitalStudentIdBack | `student:id-card:front:{userId}`, `student:id-card:back:{userId}` | 1 hour | Static card data |
| 3.7 | Suggested Groups | communityController.js | getSuggestedGroups | `community:suggested-groups:{userId}` | 10 min | — |
| 3.8 | Upcoming Events | communityController.js | getUpcomingEvents | `events:upcoming` | 30 min | Events change rarely |
| 3.9 | My Grade Distribution | gradeController.js | getMyGradeDistribution | `grades:my-distribution:{userId}` | 5 min | Per-user aggregation |
| 3.10 | Notification Unread Count | notificationController.js | getUnreadCount | `notifications:unread:{userId}` | 30s | Very high frequency, very short TTL |
| 3.11 | User Management Lists | usersController.js | getStudentsForManagement, getStaffForManagement, getLeaders | `users:management:students:{page}:{limit}`, etc. | 2–5 min | High cardinality (page-based keys) |
| 3.12 | Grade Breakdown | courseController.js | getGradeBreakdown | `grades:breakdown:{userId}:{courseId}` | 5 min | Per-student, per-course |
| 3.13 | Student's Courses and Labs | courseController.js | getStudentCourses, getStudentLabs | `courses:student:{userId}`, `labs:student:{userId}` | 5 min | Per-user dashboard data |
| 3.14 | Admin Reports | adminDashboardController.js | generateReport | `admin:report:{reportType}:{params}` | 10 min | Large payloads — consider compression |

---

## Cache Invalidation Strategy

| Trigger Event | Invalidate These Keys |
|---------------|----------------------|
| Course CRUD | `courses:all`, `course:detail:{offeringId}`, `course-offerings:all` |
| Enrollment change | `registration:available:*`, `schedule:student:*`, `courses:student:*`, `admin:alerts`, `admin:enrollment-trends:*` |
| Grade update | `grades:*`, `leaderboard:gpa:*`, `doctor:alerts:*`, `ta:alerts:*`, `grades:my-distribution:*` |
| Attendance save | `leaderboard:attendance:*`, `admin:alerts` |
| Department CRUD | `departments:*`, `financials:list`, `teachers:all` |
| Financial update | `financials:*` |
| Announcement CRUD | `announcements:*` |
| Calendar CRUD | `calendar:*`, `period:*` |
| Exam CRUD | `exams:*`, `exam:schedule:*` |
| Lecture/tutorial CRUD | `course:detail:*`, `schedule:teacher:*`, `doctor:courses:*`, `materials:*` |
| Community post/like/comment | `community:feed:*`, `leaderboard:activities:*` |
| Task/submission change | `leaderboard:activities:*`, `doctor:alerts:*`, `ta:alerts:*` |

---

## Cache TTL Strategy Summary

| Data Volatility | TTL Range | Examples |
|----------------|-----------|----------|
| Static / Reference | 30 min – 24 hours | Departments, Financials, FAQ, Events, Teachers |
| Slow-changing | 10–30 minutes | Courses, Course Offerings, Exams, Calendar, Announcements |
| Dashboard / Computed | 1–5 minutes | Admin Alerts, Doctor Alerts, TA Alerts, Payment Aging |
| User-specific dynamic | 2–5 minutes | Student Schedule, Grade Breakdown, Registration Offerings |
| Highly dynamic | 30 sec – 1 min | Leaderboard, Community Feed, Unread Notification Count |

---

## Recommended Implementation Pattern

```javascript
// src/services/cacheService.js
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCache(key) {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

export async function setCache(key, data, ttlSeconds = 300) {
  await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
}

export async function invalidateCache(pattern) {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) await redis.del(keys);
}
```

**Controller usage example:**
```javascript
// In departmentController.js
import { getCache, setCache, invalidateCache } from '../services/cacheService.js';

export async function getAllDepartments(req, res) {
  const cacheKey = 'departments:list';
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  const departments = await prisma.departments.findMany({ ... });
  await setCache(cacheKey, departments, 1800); // 30 min
  res.json(departments);
}

// In create/update/delete handlers:
await invalidateCache('departments:*');
```
