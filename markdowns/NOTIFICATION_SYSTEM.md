# Notification System — Integration Guide

This document explains how to plug the notification system into any part of the backend and how the frontend connects to receive real-time events.

---

## Table of Contents

1. [How it Works](#how-it-works)
2. [Notification Types](#notification-types)
3. [Backend Integration — Sending Notifications from Any Controller](#backend-integration--sending-notifications-from-any-controller)
    - [Single user](#single-user)
    - [Multiple users (bulk)](#multiple-users-bulk)
    - [From a background job or script (no HTTP request)](#from-a-background-job-or-script-no-http-request)
4. [Real-World Integration Examples](#real-world-integration-examples)
    - [Grade posted](#grade-posted)
    - [Exam or task created](#exam-or-task-created)
    - [Community reply / mention](#community-reply--mention)
    - [Campus announcement published](#campus-announcement-published)
5. [Frontend Integration — Socket.IO](#frontend-integration--socketio)
6. [Preference Filtering — How it Works Automatically](#preference-filtering--how-it-works-automatically)

---

## How it Works

```
Any Controller
      │
      │  import { sendNotification } from "../utils/notificationService.js"
      │  await sendNotification({ userId, message, type, io })
      ▼
notificationService.js
  1. Check user's notification_preferences — skip if disabled
  2. INSERT into notifications table
  3. Emit "new-notification" to Socket.IO room  notifications:<userId>
  4. Emit "unread-count" to the same room
```

The `io` instance (Socket.IO server) is always available inside a controller via:

```js
const io = req.app.get("io");
```

---

## Notification Types

Pick the type that matches the business event. The type is automatically matched to the user's preference toggle — if the user turned it off, the notification is silently skipped.

| `type` value          | When to use it                                                         | Settings toggle               |
| --------------------- | ---------------------------------------------------------------------- | ----------------------------- |
| `new_grade`           | A grade (mid, work, final) was posted or updated                       | New Grades Posted             |
| `exam_deadline`       | An exam or task was created / deadline is approaching                  | Assignment & Exam Deadlines   |
| `community_activity`  | A reply or mention happened in community posts                         | Community Hub Activity        |
| `campus_announcement` | A campus-wide announcement or event was published                      | Campus Events & Announcements |
| `general`             | System messages that should always be delivered (bypasses preferences) | —                             |

---

## Backend Integration — Sending Notifications from Any Controller

### Single user

```js
import { sendNotification } from "../utils/notificationService.js";

// inside any async controller function:
const io = req.app.get("io");

await sendNotification({
    userId: "<target user UUID>",
    message: "Your notification message here",
    type: "new_grade", // one of the 5 types above
    io, // pass io for real-time delivery
});
```

`sendNotification` returns the created notification object, or `null` if the user had that type disabled in their preferences.

---

### Multiple users (bulk)

```js
import { sendBulkNotification } from "../utils/notificationService.js";

const io = req.app.get("io");

const sentCount = await sendBulkNotification({
    userIds: ["uuid-1", "uuid-2", "uuid-3"],
    message: "Your notification message here",
    type: "campus_announcement",
    io,
});
// sentCount = how many were actually delivered (after preference filtering)
```

---

### From a background job or script (no HTTP request)

When there is no `req` object (cron jobs, seed scripts, etc.) simply omit `io`. The notification is saved to the database and the user will see it the next time they load the app.

```js
import { sendNotification } from "../utils/notificationService.js";

await sendNotification({
    userId: student.user_id,
    message: "Reminder: your exam is tomorrow at 9:00 AM",
    type: "exam_deadline",
    // no io — DB-only, no real-time push
});
```

---

## Real-World Integration Examples

### Grade posted

File: `src/controllers/examController.js` (or wherever grades are updated)

```js
import { sendNotification } from "../utils/notificationService.js";

export const updateGrade = async (req, res) => {
    const { studentUserId, courseCode, gradeType, score } = req.body;

    // ... update DB ...

    const io = req.app.get("io");
    await sendNotification({
        userId: studentUserId,
        message: `Your ${gradeType} grade for ${courseCode} has been posted: ${score}`,
        type: "new_grade",
        io,
    });

    res.status(200).json({ message: "Grade updated" });
};
```

---

### Exam or task created

File: `src/controllers/examController.js` or `src/controllers/taskController.js`

```js
import { sendBulkNotification } from "../utils/notificationService.js";

export const createExam = async (req, res) => {
    // ... create exam in DB ...

    // Fetch all enrolled students for this offering
    const enrollments = await prisma.enrollments.findMany({
        where: { lecture: { offering_id: offeringId } },
        select: { student_user_id: true },
    });

    const io = req.app.get("io");
    await sendBulkNotification({
        userIds: enrollments.map((e) => e.student_user_id),
        message: `A new ${exam.exam_type} exam has been scheduled for ${courseCode} on ${exam.exam_date}`,
        type: "exam_deadline",
        io,
    });

    res.status(201).json({ message: "Exam created" });
};
```

---

### Community reply / mention

File: `src/controllers/communityController.js`

```js
import { sendNotification } from "../utils/notificationService.js";

export const addComment = async (req, res) => {
    const { postId, content } = req.body;
    const commenterId = req.user.id;

    // ... save comment ...

    // Notify the original post author (skip if they are the one commenting)
    const post = await prisma.community_posts.findUnique({
        where: { id: postId },
        select: { author_id: true },
    });

    if (post.author_id !== commenterId) {
        const io = req.app.get("io");
        await sendNotification({
            userId: post.author_id,
            message: "Someone replied to your post",
            type: "community_activity",
            io,
        });
    }

    res.status(201).json({ message: "Comment added" });
};
```

---

### Campus announcement published

File: `src/controllers/systemConfigController.js` or an announcements controller

```js
import { sendBulkNotification } from "../utils/notificationService.js";

export const publishAnnouncement = async (req, res) => {
    const { title, content, audience } = req.body;

    // ... save announcement ...

    // Build target user list based on audience
    const whereClause =
        audience === "Students"
            ? { role: "student" }
            : audience === "Faculty"
            ? { role: { in: ["doctor", "teaching_assistant"] } }
            : {}; // "All"

    const users = await prisma.users.findMany({
        where: whereClause,
        select: { id: true },
    });

    const io = req.app.get("io");
    await sendBulkNotification({
        userIds: users.map((u) => u.id),
        message: title,
        type: "campus_announcement",
        io,
    });

    res.status(201).json({ message: "Announcement published" });
};
```

---

## Frontend Integration — Socket.IO

### 1. Connect (once, after login)

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
    auth: { token: localStorage.getItem("jwt") },
});
```

The server automatically places the connected socket into the room `notifications:<userId>` — no extra `emit` needed from the client.

---

### 2. Receive new notifications

```js
socket.on("new-notification", (notification) => {
    // notification shape:
    // {
    //   id: 42,
    //   message: "Your mid-term grade for CS301 has been posted: 88",
    //   type: "new_grade",
    //   is_read: false,
    //   created_at: "2026-03-01T10:30:00.000Z"
    // }
    showToast(notification.message);
    addToNotificationList(notification);
});
```

---

### 3. Keep the unread badge in sync

This event fires when any of the following happens:

-   A new notification arrives
-   The user marks one or all as read
-   The user deletes notifications

```js
socket.on("unread-count", ({ unreadCount }) => {
    document.getElementById("notif-badge").textContent = unreadCount;
});
```

---

### 4. Mark as read on click (REST call)

When the user opens/clicks a notification, call the REST endpoint. The response will also trigger a fresh `unread-count` socket event automatically.

```js
async function markRead(notificationId) {
    await fetch(`/api/v1/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
    });
    // the server will emit "unread-count" via socket — no manual update needed
}
```

---

## Preference Filtering — How it Works Automatically

You **do not need to check preferences yourself**. `sendNotification()` handles it internally:

```
sendNotification({ type: "new_grade" })
        │
        ▼ look up TYPE_TO_PREFERENCE["new_grade"] → "new_grade"
        │
        ▼ query notification_preferences WHERE user_id = ?
        │
   ┌────┴────────────────────────────────────┐
   │ user has new_grade = false              │ new_grade = true (or no row yet)
   ▼                                         ▼
  return null — notification not sent       save to DB + emit socket event
```

Key rules:

-   `type: "general"` **always** bypasses preferences and is always delivered.
-   If the user has never saved their preferences, no row exists in `notification_preferences` → treated as **all defaults** (same as having everything enabled except `community_activity`).
-   `sendNotification` returning `null` means it was suppressed — it is safe to ignore the return value if you don't need to know.
