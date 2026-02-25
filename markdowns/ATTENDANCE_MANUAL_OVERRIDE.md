# Attendance Manual Override Features

## 🎯 Overview

Two new features have been added to the attendance system:

1. **Manual Toggle During Active Session** - Instructor can manually mark students present/absent while the session is running
2. **Manual Update After Session Ended** - Instructor can update attendance records even after the session has been saved to the database

---

## ✅ Feature 1: Manual Toggle During Active Session

### Purpose

Allows instructors to manually override attendance during a live session. Useful for:

-   Correcting mistakes (student scanned QR but wasn't actually present)
-   Manually marking students present (QR code scan failed, phone issues, etc.)
-   Moving students between Present and Absent columns in real-time

### REST API Endpoint

```http
PUT /api/v1/attendance/sessions/:sessionId/toggle
Authorization: Bearer <instructor-token>
Content-Type: application/json

{
  "student_user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200 OK):**

```json
{
    "message": "Attendance toggled successfully",
    "student": {
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "full_name": "Ahmed Hassan",
        "email": "ahmed@example.com",
        "student_id": "2021001234",
        "status": "present" // or "absent"
    },
    "presentCount": 26,
    "totalCount": 30
}
```

### WebSocket Event

**Client → Server:**

```javascript
socket.emit("toggle-attendance", {
    sessionId: "550e8400-e29b-41d4-a716-446655440000",
    student_user_id: "123e4567-e89b-12d3-a456-426614174000",
});
```

**Server → Client (Success):**

```javascript
socket.on("toggle-success", (data) => {
    console.log(data);
    // {
    //   message: "Attendance toggled successfully",
    //   student: { user_id, full_name, email, student_id, status },
    //   presentCount: 26,
    //   totalCount: 30
    // }
});
```

**Server → All Clients in Session (Broadcast):**

```javascript
socket.on("attendance-toggled", (data) => {
    // Same structure as toggle-success
    // This updates ALL connected instructors monitoring the session
    moveStudent(data.student);
    updateCounter(data.presentCount, data.totalCount);
});
```

**Server → Client (Error):**

```javascript
socket.on("toggle-error", (error) => {
    console.error(error.message);
    // "Session not found or already ended"
    // "Student not enrolled in this lecture/tutorial"
    // "Unauthorized"
});
```

### Frontend Implementation (Web)

```javascript
// Toggle student attendance
function toggleStudentAttendance(sessionId, studentUserId) {
    // Option 1: REST API
    fetch(
        `http://localhost:3000/api/v1/attendance/sessions/${sessionId}/toggle`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                student_user_id: studentUserId,
            }),
        }
    )
        .then((res) => res.json())
        .then((data) => {
            moveStudent(data.student);
            updateCounter(data.presentCount, data.totalCount);
        });

    // Option 2: WebSocket (Real-time broadcast to all)
    socket.emit("toggle-attendance", {
        sessionId: sessionId,
        student_user_id: studentUserId,
    });
}

// Listen for broadcasts from other instructors
socket.on("attendance-toggled", (data) => {
    moveStudent(data.student);
    updateCounter(data.presentCount, data.totalCount);
});

// Add click handler to student cards
function createStudentCard(student) {
    const card = document.createElement("div");
    card.className = "student-card";
    card.dataset.userId = student.user_id;

    card.innerHTML = `
    <div class="student-info">
      <div class="student-name">${student.full_name}</div>
      <div class="student-id">${student.student_id}</div>
    </div>
    <button class="toggle-btn" onclick="toggleStudentAttendance('${sessionId}', '${student.user_id}')">
      Toggle
    </button>
  `;

    return card;
}

function moveStudent(student) {
    const card = document.querySelector(`[data-user-id="${student.user_id}"]`);
    if (!card) return;

    if (student.status === "present") {
        document.getElementById("present-list").appendChild(card);
    } else {
        document.getElementById("absent-list").appendChild(card);
    }
}
```

### Authorization

-   Only **doctors**, **teaching assistants**, and **admins** can toggle attendance
-   Only the instructor teaching the specific lecture/tutorial can toggle attendance for that session

### Behavior

-   **Toggle**: If student is present → becomes absent; if absent → becomes present
-   **Real-time**: All connected clients monitoring the session see the update instantly
-   **Session must be active**: Cannot toggle after session has ended (use Feature 2 instead)

---

## ✅ Feature 2: Manual Update After Session Ended

### Purpose

Allows instructors to update attendance records in the database even after the session has ended. Useful for:

-   Students with valid excuses (medical, emergency, etc.)
-   Administrative corrections
-   Late submissions of excuse documentation
-   Fixing data entry errors

### REST API Endpoint

```http
PUT /api/v1/attendance/records/update
Authorization: Bearer <instructor-token>
Content-Type: application/json

{
  "student_user_id": "550e8400-e29b-41d4-a716-446655440000",
  "lecture_id": 1,
  "session_date": "2026-02-25",
  "status": "present"
}
```

**Or for tutorials:**

```json
{
    "student_user_id": "550e8400-e29b-41d4-a716-446655440000",
    "tutorial_lab_id": 1,
    "session_date": "2026-02-25",
    "status": "present"
}
```

**Response (200 OK):**

```json
{
    "message": "Attendance record updated successfully",
    "record": {
        "id": 123,
        "student_user_id": "550e8400-e29b-41d4-a716-446655440000",
        "lecture_id": 1,
        "tutorial_lab_id": null,
        "session_date": "2026-02-25",
        "status": "present"
    }
}
```

### Frontend Implementation (Web)

```javascript
async function updateAttendanceRecord(
    studentUserId,
    lectureId,
    sessionDate,
    status
) {
    try {
        const response = await fetch(
            "http://localhost:3000/api/v1/attendance/records/update",
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    student_user_id: studentUserId,
                    lecture_id: lectureId,
                    session_date: sessionDate,
                    status: status, // "present" or "absent"
                }),
            }
        );

        const data = await response.json();

        if (response.ok) {
            alert("Attendance record updated successfully!");
            // Refresh attendance records display
            loadAttendanceRecords();
        } else {
            alert("Error: " + data.error);
        }
    } catch (error) {
        console.error("Error updating attendance:", error);
        alert("Failed to update attendance");
    }
}

// Example: Admin panel for updating past attendance
function createAttendanceEditForm() {
    return `
    <form id="edit-attendance-form">
      <h3>Update Attendance Record</h3>
      
      <label>Student ID:</label>
      <input type="text" id="student-user-id" placeholder="UUID" required>
      
      <label>Lecture ID:</label>
      <input type="number" id="lecture-id" placeholder="1" required>
      
      <label>Session Date:</label>
      <input type="date" id="session-date" required>
      
      <label>Status:</label>
      <select id="status" required>
        <option value="present">Present</option>
        <option value="absent">Absent</option>
      </select>
      
      <button type="submit">Update Attendance</button>
    </form>
  `;
}

document
    .getElementById("edit-attendance-form")
    .addEventListener("submit", (e) => {
        e.preventDefault();

        const studentUserId = document.getElementById("student-user-id").value;
        const lectureId = document.getElementById("lecture-id").value;
        const sessionDate = document.getElementById("session-date").value;
        const status = document.getElementById("status").value;

        updateAttendanceRecord(studentUserId, lectureId, sessionDate, status);
    });
```

### Authorization

-   Only **doctors**, **teaching assistants**, and **admins** can update records
-   Only the instructor teaching the specific lecture/tutorial can update records for that course

### Behavior

-   **Works anytime**: Session doesn't need to be active
-   **Upsert logic**: If record exists → updates it; if doesn't exist → creates new record
-   **Database persistence**: Changes are saved permanently to the database
-   **No WebSocket broadcast**: This is a backend-only operation (session is already ended)

---

## 📊 Comparison: Feature 1 vs Feature 2

| Aspect               | Manual Toggle (Active Session) | Manual Update (After Ended) |
| -------------------- | ------------------------------ | --------------------------- |
| **When to use**      | During live session            | After session ended         |
| **Endpoint**         | `PUT /sessions/:id/toggle`     | `PUT /records/update`       |
| **WebSocket**        | ✅ Yes (real-time broadcast)   | ❌ No (REST only)           |
| **Database**         | ❌ Not saved yet (in-memory)   | ✅ Saved immediately        |
| **Use case**         | Real-time corrections          | Late excuses, admin fixes   |
| **Session required** | ✅ Must be active              | ❌ Works even if ended      |

---

## 🔒 Security & Validation

### Both Features:

-   ✅ JWT authentication required
-   ✅ Role-based authorization (doctor/TA/admin only)
-   ✅ Instructor must be teaching the specific lecture/tutorial
-   ✅ Student must be enrolled in the course
-   ✅ Input validation (student_user_id, lecture_id, status, etc.)

### Error Responses:

**400 Bad Request:**

```json
{
    "error": "student_user_id is required"
}
```

**403 Forbidden:**

```json
{
    "error": "You are not authorized to update attendance for this lecture"
}
```

**404 Not Found:**

```json
{
    "error": "Student not enrolled in this lecture/tutorial"
}
```

---

## 🧪 Testing

### Test Manual Toggle (During Session)

1. Start a session:

```bash
curl -X POST http://localhost:3000/api/v1/attendance/sessions/start \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"lecture_id": 1, "session_date": "2026-02-25"}'
```

2. Toggle student attendance:

```bash
curl -X PUT http://localhost:3000/api/v1/attendance/sessions/{sessionId}/toggle \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"student_user_id": "550e8400-e29b-41d4-a716-446655440000"}'
```

### Test Manual Update (After Session)

1. Update attendance record:

```bash
curl -X PUT http://localhost:3000/api/v1/attendance/records/update \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "student_user_id": "550e8400-e29b-41d4-a716-446655440000",
    "lecture_id": 1,
    "session_date": "2026-02-25",
    "status": "present"
  }'
```

---

## 📱 Mobile Integration (Flutter)

### Manual Toggle (WebSocket)

```dart
void toggleAttendance(String sessionId, String studentUserId) {
  socket.emit('toggle-attendance', {
    'sessionId': sessionId,
    'student_user_id': studentUserId
  });
}

// Listen for successful toggle
socket.on('toggle-success', (data) {
  setState(() {
    // Update UI with new status
    updateStudentStatus(data['student']);
  });
});

// Listen for broadcasts from other instructors
socket.on('attendance-toggled', (data) {
  setState(() {
    updateStudentStatus(data['student']);
  });
});
```

### Manual Update (REST API)

```dart
Future<void> updateAttendanceRecord({
  required String studentUserId,
  required int lectureId,
  required String sessionDate,
  required String status,
}) async {
  final token = await storage.read(key: 'authToken');

  final response = await http.put(
    Uri.parse('http://your-server:3000/api/v1/attendance/records/update'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
    body: jsonEncode({
      'student_user_id': studentUserId,
      'lecture_id': lectureId,
      'session_date': sessionDate,
      'status': status,
    }),
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    print('Attendance updated: ${data['message']}');
    // Show success message
  } else {
    final error = jsonDecode(response.body);
    print('Error: ${error['error']}');
    // Show error message
  }
}
```

---

## 🎨 UI/UX Recommendations

### For Active Sessions:

1. **Toggle Button on Each Student Card**

    - Click to toggle between Present/Absent
    - Visual feedback (green for present, red for absent)
    - Smooth animation when moving between columns

2. **Confirmation Modal** (Optional)
    - "Are you sure you want to mark Ahmed Hassan as absent?"
    - Prevents accidental clicks

### For Past Attendance:

1. **Dedicated Admin Panel**

    - Search by student name/ID
    - Filter by date range
    - Bulk edit capabilities

2. **Audit Log**

    - Show who made changes and when
    - Display reason for change (if collected separately)

3. **Color Coding**
    - 🟢 Present
    - 🔴 Absent
    - 🟡 Modified after session

---

## ✅ Summary

**New Endpoints:**

1. `PUT /api/v1/attendance/sessions/:sessionId/toggle` - Toggle during active session
2. `PUT /api/v1/attendance/records/update` - Update after session ended

**New WebSocket Events:**

-   `toggle-attendance` (client → server)
-   `toggle-success` (server → client)
-   `attendance-toggled` (server → all clients, broadcast)
-   `toggle-error` (server → client)

**Use Cases Covered:**
✅ Real-time attendance corrections during live session  
✅ Manual marking for students with QR code issues  
✅ Late excuse submissions  
✅ Administrative corrections  
✅ Multi-instructor collaboration (broadcasts to all)

---

_Last Updated: February 25, 2026_
