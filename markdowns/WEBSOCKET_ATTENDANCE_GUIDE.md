# Live Attendance System - WebSocket Integration Guide

## 📋 Overview

The live attendance system uses **WebSockets (Socket.IO)** for real-time communication between:

-   **Frontend Web (Instructor/Doctor)**: Displays live QR code and student attendance status
-   **Mobile App (Students)**: Scans QR code to mark attendance
-   **Backend**: Manages sessions, generates QR codes, and broadcasts updates

---

## 🚀 Features

### ✅ Real-time QR Code Updates

-   QR code changes every **10 seconds** (configurable to 5 seconds)
-   Automatic broadcast to all connected clients
-   Prevents QR code reuse attacks

### ✅ Live Student Status Updates

-   Students instantly move from "Absent" to "Present" when they scan
-   Real-time counter updates (e.g., "25/30 Present")
-   No page refresh needed

### ✅ Multi-Session Support

-   Multiple instructors can run concurrent sessions
-   Each session has unique ID and isolated QR codes
-   Session-based rooms prevent cross-session interference

### ✅ Security

-   JWT authentication for WebSocket connections
-   Role-based authorization (students can only scan, instructors can monitor)
-   QR code expiry validation
-   Enrollment verification before marking attendance

---

## 🔌 WebSocket Events

### Client → Server Events

#### 1. **join-session**

Instructor joins a session to monitor attendance.

**Emit:**

```javascript
socket.emit("join-session", sessionId);
```

**Response:**

```javascript
socket.on("session-joined", (data) => {
    console.log(data);
    // {
    //   sessionId: "uuid",
    //   qrCode: "sessionId:timestamp:random",
    //   qrExpiry: 1707580810000,
    //   students: [ { user_id, full_name, email, student_id, status: "absent" } ],
    //   presentCount: 0,
    //   totalCount: 30
    // }
});
```

---

#### 2. **scan-qr**

Student scans QR code to mark attendance.

**Emit:**

```javascript
socket.emit("scan-qr", {
    qrCode: "550e8400-e29b-41d4-a716-446655440000:1707580800000:abc123",
});
```

**Success Response:**

```javascript
socket.on("scan-success", (data) => {
    console.log(data);
    // {
    //   message: "Attendance marked successfully",
    //   status: "present",
    //   sessionId: "uuid"
    // }
});
```

**Error Response:**

```javascript
socket.on("scan-error", (error) => {
    console.error(error);
    // { message: "QR code expired, please scan the current one" }
});
```

---

#### 3. **leave-session**

Client leaves the session room.

**Emit:**

```javascript
socket.emit("leave-session", sessionId);
```

---

### Server → Client Events

#### 1. **qr-code-updated**

Broadcast to all clients in session room every 10 seconds.

**Listen:**

```javascript
socket.on("qr-code-updated", (data) => {
    console.log(data);
    // {
    //   sessionId: "uuid",
    //   qrCode: "new-qr-code-token",
    //   qrExpiry: 1707580820000
    // }

    // Update QR code display
    updateQRCode(data.qrCode);
});
```

---

#### 2. **student-marked-present**

Broadcast when a student scans QR code successfully.

**Listen:**

```javascript
socket.on("student-marked-present", (data) => {
    console.log(data);
    // {
    //   student: {
    //     user_id: "uuid",
    //     full_name: "Ahmed Hassan",
    //     email: "ahmed@example.com",
    //     student_id: "2021001234",
    //     status: "present"
    //   },
    //   presentCount: 26,
    //   totalCount: 30
    // }

    // Move student from absent to present column
    moveStudentToPresent(data.student);
    updateCounter(data.presentCount, data.totalCount);
});
```

---

#### 3. **error**

Generic error event.

**Listen:**

```javascript
socket.on("error", (error) => {
    console.error(error);
    // { message: "Session not found" }
});
```

---

## 🔐 Authentication

### WebSocket Connection with JWT

**Client Side (JavaScript):**

```javascript
import { io } from "socket.io-client";

const token = localStorage.getItem("authToken"); // JWT token from login

const socket = io("http://localhost:3000", {
    auth: {
        token: token,
    },
});

socket.on("connect", () => {
    console.log("Connected to WebSocket server");
});

socket.on("connect_error", (error) => {
    console.error("Connection failed:", error.message);
    // "Authentication error: Invalid token"
});
```

**Flutter (Dart):**

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

String token = await storage.read(key: 'authToken');

IO.Socket socket = IO.io('http://localhost:3000', <String, dynamic>{
  'auth': {'token': token},
  'transports': ['websocket'],
  'autoConnect': false,
});

socket.connect();

socket.onConnect((_) {
  print('Connected to WebSocket');
});

socket.onConnectError((error) {
  print('Connection error: $error');
});
```

---

## 📱 Frontend Implementation Examples

### Web (Instructor View)

```javascript
import { io } from "socket.io-client";
import QRCode from "qrcode";

const socket = io("http://localhost:3000", {
    auth: { token: localStorage.getItem("authToken") },
});

let currentSessionId = null;

// Start attendance session (REST API call first)
async function startSession(lectureId, sessionDate) {
    const response = await fetch(
        "http://localhost:3000/api/v1/attendance/sessions/start",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
            body: JSON.stringify({
                lecture_id: lectureId,
                session_date: sessionDate,
            }),
        }
    );

    const data = await response.json();
    currentSessionId = data.sessionId;

    // Join WebSocket room
    socket.emit("join-session", data.sessionId);

    // Display initial QR code
    displayQRCode(data.qrCode);
    displayStudents(data.enrolledStudents);
}

// Display QR code as image
async function displayQRCode(qrCodeToken) {
    const qrCodeImage = await QRCode.toDataURL(qrCodeToken);
    document.getElementById("qr-code-img").src = qrCodeImage;
}

// Listen for QR code updates
socket.on("qr-code-updated", (data) => {
    displayQRCode(data.qrCode);
    console.log("QR code refreshed");
});

// Listen for student attendance
socket.on("student-marked-present", (data) => {
    moveStudentToPresent(data.student);
    updateCounter(data.presentCount, data.totalCount);
});

function displayStudents(students) {
    const absentList = document.getElementById("absent-list");
    const presentList = document.getElementById("present-list");

    absentList.innerHTML = "";
    presentList.innerHTML = "";

    students.forEach((student) => {
        const studentCard = createStudentCard(student);
        if (student.status === "present") {
            presentList.appendChild(studentCard);
        } else {
            absentList.appendChild(studentCard);
        }
    });
}

function moveStudentToPresent(student) {
    const studentCard = document.querySelector(
        `[data-user-id="${student.user_id}"]`
    );
    if (studentCard) {
        document.getElementById("present-list").appendChild(studentCard);
    }
}

function updateCounter(present, total) {
    document.getElementById(
        "counter"
    ).textContent = `${present}/${total} Present`;
}

// End session
async function endSession() {
    await fetch(
        `http://localhost:3000/api/v1/attendance/sessions/${currentSessionId}/end`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
        }
    );

    socket.emit("leave-session", currentSessionId);
    alert("Attendance session ended and saved!");
}
```

---

### Mobile (Student - Flutter)

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:qr_code_scanner/qr_code_scanner.dart';

class AttendanceScanner extends StatefulWidget {
  @override
  _AttendanceScannerState createState() => _AttendanceScannerState();
}

class _AttendanceScannerState extends State<AttendanceScanner> {
  late IO.Socket socket;
  QRViewController? qrController;

  @override
  void initState() {
    super.initState();
    initSocket();
  }

  void initSocket() async {
    String? token = await storage.read(key: 'authToken');

    socket = IO.io('http://your-backend-url:3000', <String, dynamic>{
      'auth': {'token': token},
      'transports': ['websocket'],
    });

    socket.connect();

    // Listen for scan success
    socket.on('scan-success', (data) {
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          title: Text('Success'),
          content: Text(data['message']),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('OK'),
            ),
          ],
        ),
      );
    });

    // Listen for scan errors
    socket.on('scan-error', (error) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error['message'])),
      );
    });
  }

  void onQRScanned(Barcode barcode) {
    String? qrCode = barcode.code;
    if (qrCode != null) {
      // Send QR code via WebSocket
      socket.emit('scan-qr', {'qrCode': qrCode});
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Scan QR for Attendance')),
      body: QRView(
        key: GlobalKey(),
        onQRViewCreated: (QRViewController controller) {
          qrController = controller;
          controller.scannedDataStream.listen(onQRScanned);
        },
      ),
    );
  }

  @override
  void dispose() {
    socket.disconnect();
    qrController?.dispose();
    super.dispose();
  }
}
```

---

## 🛠️ REST API Endpoints (for session management)

### 1. Start Session

```http
POST /api/v1/attendance/sessions/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "lecture_id": 1,
  "session_date": "2026-02-10"
}
```

**Response:**

```json
{
  "message": "Attendance session started",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "qrCode": "550e8400-e29b-41d4-a716-446655440000:1707580800000:abc123",
  "qrExpiry": 1707580810000,
  "enrolledStudents": [...]
}
```

---

### 2. Get Session Details

```http
GET /api/v1/attendance/sessions/:sessionId
Authorization: Bearer <token>
```

---

### 3. End Session

```http
POST /api/v1/attendance/sessions/:sessionId/end
Authorization: Bearer <token>
```

**Response:**

```json
{
    "message": "Attendance session ended and saved",
    "presentCount": 25,
    "totalCount": 30
}
```

---

### 4. Scan QR Code (REST alternative to WebSocket)

```http
POST /api/v1/attendance/scan
Authorization: Bearer <token>
Content-Type: application/json

{
  "qrCode": "550e8400-e29b-41d4-a716-446655440000:1707580800000:abc123"
}
```

---

## ⚙️ Configuration

### Change QR Code Refresh Interval

Edit `/src/controllers/attendanceController.js`:

```javascript
// Change from 10 seconds to 5 seconds
const QR_REFRESH_INTERVAL = 5000; // 5 seconds
```

### CORS Configuration

Edit `/src/utils/socketIO.js`:

```javascript
const io = new Server(httpServer, {
    cors: {
        origin: "https://your-frontend-domain.com", // Specific domain
        methods: ["GET", "POST"],
        credentials: true,
    },
});
```

---

## 🧪 Testing

### Test WebSocket Connection (Browser Console)

```javascript
const socket = io("http://localhost:3000", {
    auth: { token: "your-jwt-token-here" },
});

socket.on("connect", () => {
    console.log("Connected!");
    socket.emit("join-session", "your-session-id");
});

socket.on("session-joined", (data) => {
    console.log("Session joined:", data);
});

socket.on("qr-code-updated", (data) => {
    console.log("New QR code:", data.qrCode);
});
```

---

## 🔍 Troubleshooting

### Issue 1: WebSocket Connection Fails

**Error**: "Authentication error: No token provided"

**Solution**: Ensure you're passing the JWT token in the `auth` object:

```javascript
socket = io(url, {
    auth: { token: yourJWTToken },
});
```

---

### Issue 2: QR Code Not Updating

**Problem**: QR code stays the same for more than 10 seconds

**Solution**: Check that the QR refresh interval is running:

-   Look for "QR code refreshed for session..." in server logs
-   Verify Socket.IO connection is active

---

### Issue 3: Student Not Moving to Present Column

**Problem**: Student scans QR but doesn't appear in present list

**Solution**:

1. Check that frontend is listening to `student-marked-present` event
2. Verify student is enrolled in the lecture/tutorial
3. Check browser console for WebSocket errors

---

## 📊 Flow Diagram

```
┌─────────────────┐                    ┌─────────────────┐
│  Instructor Web │                    │  Student Mobile │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         │ 1. POST /sessions/start              │
         ├──────────────────────────────────────►
         │                                      │
         │ 2. sessionId + initial QR            │
         ◄──────────────────────────────────────┤
         │                                      │
         │ 3. join-session (WebSocket)          │
         ├──────────────────────────────────────►
         │                                      │
         │ 4. session-joined (students list)    │
         ◄──────────────────────────────────────┤
         │                                      │
         │                                      │ 5. Scans QR code
         │                                      │
         │                                      │ 6. scan-qr (WebSocket)
         │                                      ├───────────────►
         │                                      │
         │                                      │ 7. scan-success
         │                                      ◄───────────────┤
         │                                      │
         │ 8. student-marked-present (broadcast)│
         ◄──────────────────────────────────────┤
         │                                      │
         │ Display student in Present column    │
         │                                      │
         │                                      │
    Every 10 seconds:                          │
         │                                      │
         │ 9. qr-code-updated (broadcast)       │
         ◄──────────────────────────────────────┤
         │                                      │
         │ Update QR code display               │
         │                                      │
```

---

## 🎯 Summary

-   **WebSocket URL**: `ws://localhost:3000` (or your server URL)
-   **Authentication**: JWT token in `socket.handshake.auth.token`
-   **QR Refresh**: Every 10 seconds (configurable)
-   **Events**: `join-session`, `scan-qr`, `leave-session`, `qr-code-updated`, `student-marked-present`
-   **Rooms**: Each session has its own room (`session:{sessionId}`)
-   **Security**: JWT auth, enrollment verification, QR expiry validation

---

_Last Updated: February 10, 2026_
