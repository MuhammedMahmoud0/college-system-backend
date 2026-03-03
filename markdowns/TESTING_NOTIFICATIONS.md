# Notification & New Endpoints Testing Workflow

A step-by-step guide to test every notification trigger and new endpoint. Run the steps in order — later steps depend on data created in earlier ones.

---

## Prerequisites

-   Server running: `npm run dev`
-   API base URL: `http://localhost:4000/api/v1`
-   Swagger UI: `http://localhost:4000/docs`
-   You need at least:
    -   1 **super_admin** account
    -   1 **doctor** account (instructor assigned to a lecture)
    -   1 **teaching_assistant** account (assigned to a tutorial/lab)
    -   2 **student** accounts

---

## Step 0 — Login & Collect Tokens

Login each test account and save the JWT tokens. You'll need them in the `Authorization: Bearer <token>` header for every request.

```http
POST /auth/login
Content-Type: application/json

{ "email": "admin@test.com", "password": "pass" }
```

> **Save**: `ADMIN_TOKEN`, `DOCTOR_TOKEN`, `TA_TOKEN`, `STUDENT_A_TOKEN`, `STUDENT_B_TOKEN`

---

## Step 1 — Setup: Connect a Socket.IO Client (Real-Time Listener)

Before firing notifications, open a Socket.IO listener so you can see events arrive in real time.

**Using a browser console or a tool like [socket.io-client REPL](https://socket.io/docs/v4/client-api/):**

```js
const socket = io("http://localhost:4000", {
    auth: { token: "Bearer <STUDENT_A_TOKEN>" },
});

socket.on("connect", () => console.log("Connected:", socket.id));

// These are the two events to watch:
socket.on("new-notification", (data) => console.log("NEW NOTIFICATION:", data));
socket.on("unread-count", (data) => console.log("UNREAD COUNT:", data));
```

> Repeat this in a second tab/session with `STUDENT_B_TOKEN` if you want to observe bulk notifications.

---

## Step 2 — Notification Preferences

### 2a. Get current preferences (student)

```http
GET /notifications/preferences
Authorization: Bearer <STUDENT_A_TOKEN>
```

Expected: auto-created defaults `new_grade: true`, `exam_deadline: true`, `community_activity: false`, `campus_announcement: true`.

### 2b. Update a preference

```http
PUT /notifications/preferences
Authorization: Bearer <STUDENT_A_TOKEN>
Content-Type: application/json

{
  "community_activity": true
}
```

> **Why**: `community_activity` defaults to `false` — enable it so you can receive community notifications in Steps 8–9.

---

## Step 3 — Registration (Hook 1)

> **Prerequisite**: Know a valid `lecture_id` and `lab_id` (tutorial_lab_id). Find them via `GET /registration/available-offerings` with `STUDENT_A_TOKEN`.

### 3a. Register for a course (lecture + lab)

```http
POST /registration/register
Authorization: Bearer <STUDENT_A_TOKEN>
Content-Type: application/json

{
  "selectedLectureIds": [<LECTURE_ID>],
  "selectedLabIds": [<LAB_ID>]
}
```

**Expected notification** (Socket.IO `new-notification` event on Student A):

```json
{
    "message": "You have successfully registered for: <Course Name>.",
    "type": "general"
}
```

### 3b. Unregister from the course

```http
DELETE /registration/unregister
Authorization: Bearer <STUDENT_A_TOKEN>
Content-Type: application/json

{ "lectureId": <LECTURE_ID> }
```

**Expected notification**: `"You have been unregistered from <Course Name>."`

### 3c. Re-register, then register a lab separately

```http
POST /registration/register
...same as 3a...
```

Then unregister the lab only:

```http
DELETE /registration/unregister
Authorization: Bearer <STUDENT_A_TOKEN>
Content-Type: application/json

{ "tutorialLabId": <LAB_ID> }
```

Then re-add the lab:

```http
POST /registration/register-lab
Authorization: Bearer <STUDENT_A_TOKEN>
Content-Type: application/json

{ "lectureId": <LECTURE_ID>, "labId": <LAB_ID> }
```

**Expected notification**: `"You have been registered for lab <Group> in <Course Name>."`

---

## Step 4 — Exam Created → Students Notified (Hook 4)

> **Prerequisite**: Know a valid `offering_id`. Find it via `GET /course-offerings`.

```http
POST /exams/set
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "offering_id": <OFFERING_ID>,
  "exam_type": "midterm",
  "exam_date": "2026-04-15",
  "day_of_week": "Wednesday",
  "start_time": "10:00",
  "end_time": "12:00",
  "location": "Hall A"
}
```

**Expected notification** on all enrolled students:

```
"A midterm exam has been scheduled for <Course Name> on 4/15/2026."
type: "exam_deadline"
```

> Save the returned `exam_id` — needed for the reminder job test.

---

## Step 5 — Registration Open Announcement (Hook 3)

```http
POST /config/registration-open
Authorization: Bearer <ADMIN_TOKEN>
```

**Expected**: All students receive a `campus_announcement` notification:

```
"Course registration is now open! Head to the registration portal to enroll in your courses."
```

**Verify via REST** (check unread count increased):

```http
GET /notifications/unread-count
Authorization: Bearer <STUDENT_A_TOKEN>
```

---

## Step 6 — Announcement with Audience (Hook 3b)

```http
POST /config/announcements
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "title": "Campus Closure",
  "content": "The campus will be closed on Friday.",
  "audience": "Students"
}
```

**Expected**: All students (not faculty) receive:

```
"[Announcement] Campus Closure: The campus will be closed on Friday."
type: "campus_announcement"
```

---

## Step 7 — Attendance Session (Hooks 2, 11, 12)

### 7a. Start session (doctor/TA)

> **Prerequisite**: Student A must be enrolled in `LECTURE_ID` (from Step 3).

```http
POST /attendance/sessions/start
Authorization: Bearer <DOCTOR_TOKEN>
Content-Type: application/json

{
  "lecture_id": <LECTURE_ID>,
  "session_date": "2026-03-03"
}
```

**Expected notification** on Student A (and all enrolled students):

```
"Attendance session started for <Course Name>. Scan the QR code to mark your attendance."
type: "general"
```

> Save `sessionId` and `qrCode` from the response.

### 7b. Student scans QR (mark present)

```http
POST /attendance/scan
Authorization: Bearer <STUDENT_A_TOKEN>
Content-Type: application/json

{ "qrCode": "<QR_CODE_FROM_7a>" }
```

**Expected notification** on Student A:

```
"Your attendance has been marked successfully."
type: "general"
```

### 7c. End session (saves to DB + absence check)

```http
POST /attendance/sessions/<SESSION_ID>/end
Authorization: Bearer <DOCTOR_TOKEN>
```

**If any student was absent**: no notification (first absence).  
**To trigger the 3-absences warning**: repeat Steps 7a → 7c **three times** without Student B ever scanning. On the third `end`, Student B receives:

```
"Warning: You have accumulated 3 absences. Further absences may affect your academic standing."
type: "general"
```

---

## Step 8 — Grade Update (Hook 6 + Hook 7)

> **Prerequisite**: Know the `enrollmentId` from Student A's enrollment. Find it via `GET /courses/<offeringId>/grades` or from the registration response.

### 8a. Update grade

```http
PUT /grades/enrollment/<ENROLLMENT_ID>
Authorization: Bearer <DOCTOR_TOKEN>
Content-Type: application/json

{
  "mid_score": 18.5,
  "work_score": 9.0,
  "final_score": 55.0,
  "grade": "A"
}
```

**Expected notification** on Student A:

```
"Your grade for <Course Name> has been updated."
type: "new_grade"
```

**If Student A is now in the top 3 by CGPA**, an additional notification fires:

```
"Congratulations! You've entered the top 3 students on the leaderboard!"
type: "general"
```

### 8b. Verify preference filtering

Set `new_grade: false` for Student A:

```http
PUT /notifications/preferences
Authorization: Bearer <STUDENT_A_TOKEN>
Content-Type: application/json

{ "new_grade": false }
```

Update the grade again — **no notification should arrive** this time.

Restore preference: `{ "new_grade": true }`.

---

## Step 9 — Tasks (Hook 8)

### 9a. Create a task (doctor/TA)

```http
POST /tasks
Authorization: Bearer <DOCTOR_TOKEN>
Content-Type: application/json

{
  "title": "Assignment 1: Sorting Algorithms",
  "description": "Implement merge sort in Python.",
  "due_date": "2026-03-20T23:59:00.000Z",
  "lecture_id": <LECTURE_ID>
}
```

**Expected notification** on all enrolled students:

```
"New task posted for <Course Name>: 'Assignment 1: Sorting Algorithms'. Due: 3/20/2026."
type: "exam_deadline"
```

> Save returned `task.id` as `TASK_ID`.

### 9b. List tasks

```http
GET /tasks?lecture_id=<LECTURE_ID>
Authorization: Bearer <STUDENT_A_TOKEN>
```

### 9c. Student submits the task

```http
POST /tasks/<TASK_ID>/submit
Authorization: Bearer <STUDENT_A_TOKEN>
Content-Type: application/json

{ "submission_content": "def merge_sort(arr): ..." }
```

### 9d. Staff views all submissions

```http
GET /tasks/<TASK_ID>/submissions
Authorization: Bearer <DOCTOR_TOKEN>
```

> Save returned `submission.id` as `SUBMISSION_ID`.

### 9e. Grade the submission

```http
PUT /tasks/<TASK_ID>/submissions/<SUBMISSION_ID>/grade
Authorization: Bearer <DOCTOR_TOKEN>
Content-Type: application/json

{ "grade": 92.5 }
```

### 9f. Student views own submission

```http
GET /tasks/<TASK_ID>/my-submission
Authorization: Bearer <STUDENT_A_TOKEN>
```

Expected: submission with `grade: 92.5`.

### 9g. Update and delete task

```http
PUT /tasks/<TASK_ID>
Authorization: Bearer <DOCTOR_TOKEN>
Content-Type: application/json

{ "title": "Assignment 1 (Extended)", "due_date": "2026-03-25T23:59:00.000Z" }
```

```http
DELETE /tasks/<TASK_ID>
Authorization: Bearer <DOCTOR_TOKEN>
```

---

## Step 10 — Community Notifications (Hooks 9, 10)

> **Prerequisite**: First, join a group so posts have a `group_id`.

### 10a. Join a group

```http
POST /community/groups/<GROUP_ID>/join
Authorization: Bearer <STUDENT_A_TOKEN>
```

```http
POST /community/groups/<GROUP_ID>/join
Authorization: Bearer <STUDENT_B_TOKEN>
```

### 10b. Create a group post (Student A posts → Student B notified)

```http
POST /community/posts
Authorization: Bearer <STUDENT_A_TOKEN>
Content-Type: application/json

{
  "content": "Hey everyone, check out this resource for the midterm!",
  "group_id": <GROUP_ID>
}
```

**Expected notification** on Student B (and all group members except author):

```
"<Student A Name> posted in <Group Name>: 'Hey everyone, check out this resource...'"
type: "community_activity"
```

> **If Student B still has `community_activity: false`** from Step 2, they won't receive it. Ensure it's enabled.

> Save `post.id` as `POST_ID`.

### 10c. Like the post (Student B likes → Student A notified)

```http
POST /community/posts/<POST_ID>/like
Authorization: Bearer <STUDENT_B_TOKEN>
```

**Expected notification** on Student A:

```
"<Student B Name> liked your post."
type: "community_activity"
```

Liking again (toggle off) should produce no notification.

### 10d. Comment on the post (Student B comments → Student A notified)

```http
POST /community/posts/<POST_ID>/comment
Authorization: Bearer <STUDENT_B_TOKEN>
Content-Type: application/json

{ "content": "Thanks, this is really helpful!" }
```

**Expected notification** on Student A:

```
"<Student B Name> commented on your post: 'Thanks, this is really helpful!'"
type: "community_activity"
```

---

## Step 11 — Read & Manage Notifications

### 11a. Fetch all notifications

```http
GET /notifications
Authorization: Bearer <STUDENT_A_TOKEN>
```

### 11b. Mark one as read

```http
PATCH /notifications/<NOTIFICATION_ID>/read
Authorization: Bearer <STUDENT_A_TOKEN>
```

**Expected Socket.IO event**: `unread-count` with updated count.

### 11c. Mark all as read

```http
PATCH /notifications/mark-all-read
Authorization: Bearer <STUDENT_A_TOKEN>
```

### 11d. Check unread count is 0

```http
GET /notifications/unread-count
Authorization: Bearer <STUDENT_A_TOKEN>
```

Expected: `{ "unreadCount": 0 }`

### 11e. Delete a notification

```http
DELETE /notifications/<NOTIFICATION_ID>
Authorization: Bearer <STUDENT_A_TOKEN>
```

### 11f. Delete all notifications

```http
DELETE /notifications
Authorization: Bearer <STUDENT_A_TOKEN>
```

---

## Step 12 — Exam Reminder Job (Hook 5)

The job runs automatically at midnight and checks for exams scheduled for the next day. To test it without waiting:

### Option A — Trigger manually via code

In a temp script or `node --eval`:

```js
import { sendExamReminders } from "./src/utils/examReminderJob.js";
await sendExamReminders(null); // no io = DB-only, no socket emit
```

### Option B — Insert a test exam for tomorrow, then wait for the next midnight run

```http
POST /exams/set
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "offering_id": <OFFERING_ID>,
  "exam_type": "quiz",
  "exam_date": "<TOMORROW_DATE>",
  "day_of_week": "Tuesday",
  "start_time": "09:00",
  "end_time": "10:00"
}
```

At midnight the server will fire `exam_deadline` notifications to enrolled students.

---

## Quick Checklist

| Hook | Trigger Endpoint                                  | Notification Type     | Who Gets It                       |
| ---- | ------------------------------------------------- | --------------------- | --------------------------------- |
| 1    | `POST /registration/register`                     | `general`             | The student                       |
| 1    | `DELETE /registration/unregister`                 | `general`             | The student                       |
| 1    | `POST /registration/register-lab`                 | `general`             | The student                       |
| 2    | `POST /attendance/sessions/start`                 | `general`             | All enrolled students             |
| 3    | `POST /config/registration-open`                  | `campus_announcement` | All students                      |
| 3b   | `POST /config/announcements`                      | `campus_announcement` | Audience (All/Students/Faculty)   |
| 4    | `POST /exams/set`                                 | `exam_deadline`       | All enrolled students             |
| 5    | Midnight cron                                     | `exam_deadline`       | Enrolled students (exam tomorrow) |
| 6    | `PUT /grades/enrollment/:id`                      | `new_grade`           | The student                       |
| 7    | `PUT /grades/enrollment/:id` (if CGPA top-3)      | `general`             | The student                       |
| 8    | `POST /tasks`                                     | `exam_deadline`       | All enrolled students             |
| 9    | `POST /community/posts` (with group_id)           | `community_activity`  | Group members                     |
| 10   | `POST /community/posts/:id/like`                  | `community_activity`  | Post author                       |
| 10   | `POST /community/posts/:id/comment`               | `community_activity`  | Post author                       |
| 11   | `POST /attendance/scan`                           | `general`             | The student                       |
| 12   | `POST /attendance/sessions/:id/end` (3rd absence) | `general`             | The absent student                |
