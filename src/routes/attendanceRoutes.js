import express from "express";
import {
    startAttendanceSession,
    getSessionDetails,
    scanQRCode,
    endAttendanceSession,
    getActiveSessions,
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

export default router;
