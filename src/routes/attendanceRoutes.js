import express from "express";
import {
    startAttendanceSession,
    getSessionDetails,
    scanQRCode,
    endAttendanceSession,
    getActiveSessions,
    toggleStudentAttendance,
    updateAttendanceRecord,
    getStudentsAttendance,
} from "../controllers/attendanceController.js";
import {
    authMiddleware,
    authorizationMiddleware,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Start attendance session - Only doctors and teaching assistants
router.post(
    "/sessions/start",
    authMiddleware,
    authorizationMiddleware("doctor", "teaching_assistant", "admin"),
    startAttendanceSession
);

// Get active sessions for instructor - MUST come before /sessions/:sessionId
router.get(
    "/sessions/active",
    authMiddleware,
    authorizationMiddleware("doctor", "teaching_assistant", "admin"),
    getActiveSessions
);

// Get session details
router.get("/sessions/:sessionId", authMiddleware, getSessionDetails);

// Scan QR code (student attendance) - Only students
router.post(
    "/scan",
    authMiddleware,
    authorizationMiddleware("student", "leader"),
    scanQRCode
);

// End attendance session - Only doctors and teaching assistants
router.post(
    "/sessions/:sessionId/end",
    authMiddleware,
    authorizationMiddleware("doctor", "teaching_assistant", "admin"),
    endAttendanceSession
);

// Manually toggle student attendance during active session - Only doctors and teaching assistants
router.put(
    "/sessions/:sessionId/toggle",
    authMiddleware,
    authorizationMiddleware("doctor", "teaching_assistant", "admin"),
    toggleStudentAttendance
);

// Update attendance record (even after session ended) - Only doctors and teaching assistants
router.put(
    "/records/update",
    authMiddleware,
    authorizationMiddleware("doctor", "teaching_assistant", "admin"),
    updateAttendanceRecord
);

// Get all students with attendance summary for a lecture/tutorial owned by the instructor
router.get(
    "/students",
    authMiddleware,
    authorizationMiddleware("doctor", "teaching_assistant", "admin"),
    getStudentsAttendance
);

export default router;
