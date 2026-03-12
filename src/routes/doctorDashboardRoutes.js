import { Router } from "express";
import {
    authMiddleware,
    authorizationMiddleware,
} from "../middlewares/authMiddleware.js";
import {
    getDoctorCourses,
    getCourseAnalytics,
    createDoctorTask,
    getDoctorAlerts,
} from "../controllers/doctorDashboardController.js";

const router = Router();

// All endpoints require authentication + Doctor or Super Admin role
router.use(authMiddleware);
router.use(authorizationMiddleware("doctor", "super_admin"));

// ── Courses & Enrollment Stats ─────────────────────────────────────────────
/** GET /api/v1/doctor/courses — List all assigned courses with enrollment counts */
router.get("/courses", getDoctorCourses);

// ── Performance Analytics & Alerts ────────────────────────────────────────
/** GET /api/v1/doctor/courses/:courseCode/analytics — Grade breakdown + low-grade alerts */
router.get("/courses/:courseCode/analytics", getCourseAnalytics);

// ── Task Management ────────────────────────────────────────────────────────
/** POST /api/v1/doctor/tasks — Create task for all lectures of a course */
router.post("/tasks", createDoctorTask);

// ── Alerts ────────────────────────────────────────────────────────────────
/** GET /api/v1/doctor/alerts — Active tasks, expired tasks, ungraded submissions */
router.get("/alerts", getDoctorAlerts);

export default router;
