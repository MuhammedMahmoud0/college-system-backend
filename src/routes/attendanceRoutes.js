import express from "express";
import {
    startAttendanceSession,
    getSessionDetails,
    getSessionLiveInfo,
    scanQRCode,
    endAttendanceSession,
    getActiveSessions,
    toggleStudentAttendance,
    updateAttendanceRecord,
    getStudentsAttendance,
    getAllAttendanceSessions,
    getMyAttendanceHistory,
    getMyActiveSession,
    getAttendanceGrid,
    getAvgAttendanceRate,
    getLowestAttendance,
    getAttendanceTrend,
    getAdminOverallRate,
    getAdminLowestCourses,
    getAdminAttendanceTrend,
    getAdminDeptComparison,
    getAdminAttendanceDistribution,
    getAdminTopStudents,
    getAdminStudentsTable,
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

// Get all attendance sessions with students grouped by date - MUST come before /sessions/:sessionId
router.get(
    "/sessions",
    authMiddleware,
    authorizationMiddleware("doctor", "teaching_assistant", "admin"),
    getAllAttendanceSessions
);

// Get live-info (is_live, latitude, longitude) for an active session - MUST come before /sessions/:sessionId
router.get(
    "/sessions/:sessionId/live-info",
    authMiddleware,
    getSessionLiveInfo
);

// Get active session for the logged-in student - MUST come before /sessions/:sessionId
router.get(
    "/sessions/my-active",
    authMiddleware,
    authorizationMiddleware("student", "leader"),
    getMyActiveSession
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

// Get attendance grid: all students × all session dates
router.get(
    "/grid",
    authMiddleware,
    authorizationMiddleware("doctor", "teaching_assistant", "admin"),
    getAttendanceGrid
);

// Average attendance rate for a lecture/tutorial
router.get(
    "/stats/avg",
    authMiddleware,
    authorizationMiddleware("doctor", "teaching_assistant", "admin"),
    getAvgAttendanceRate
);

// Lowest N students by attendance rate
router.get(
    "/stats/lowest",
    authMiddleware,
    authorizationMiddleware("doctor", "teaching_assistant", "admin"),
    getLowestAttendance
);

// Attendance trend grouped by week
router.get(
    "/stats/trend",
    authMiddleware,
    authorizationMiddleware("doctor", "teaching_assistant", "admin"),
    getAttendanceTrend
);

// ─── Admin Attendance Analytics (admin only) ──────────────────────────────
router.get(
    "/admin/overall-rate",
    authMiddleware,
    authorizationMiddleware("admin", "super_admin"),
    getAdminOverallRate
);
router.get(
    "/admin/lowest-courses",
    authMiddleware,
    authorizationMiddleware("admin", "super_admin"),
    getAdminLowestCourses
);
router.get(
    "/admin/trend",
    authMiddleware,
    authorizationMiddleware("admin", "super_admin"),
    getAdminAttendanceTrend
);
router.get(
    "/admin/dept-comparison",
    authMiddleware,
    authorizationMiddleware("admin", "super_admin"),
    getAdminDeptComparison
);
router.get(
    "/admin/distribution",
    authMiddleware,
    authorizationMiddleware("admin", "super_admin"),
    getAdminAttendanceDistribution
);
router.get(
    "/admin/top-students",
    authMiddleware,
    authorizationMiddleware("admin", "super_admin"),
    getAdminTopStudents
);
router.get(
    "/admin/students",
    authMiddleware,
    authorizationMiddleware("admin", "super_admin"),
    getAdminStudentsTable
);

// Get attendance history for the logged-in student
router.get(
    "/my-history",
    authMiddleware,
    authorizationMiddleware("student", "leader"),
    getMyAttendanceHistory
);

export default router;
