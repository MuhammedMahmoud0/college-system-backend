import express from "express";
import {
    getAlerts,
    getRecentActivity,
    getEnrollmentTrends,
    getPaymentAging,
    generateReport,
} from "../controllers/adminDashboardController.js";
import {
    authMiddleware,
    authorizationMiddleware,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// All admin dashboard endpoints require authentication + Admin or Super Admin role
router.use(authMiddleware);
router.use(authorizationMiddleware("admin", "super_admin"));

// ── Alerts ─────────────────────────────────────────────────────────────────
router.get("/alerts", getAlerts);

// ── Recent Activity ────────────────────────────────────────────────────────
router.get("/activity", getRecentActivity);

// ── Statistics ─────────────────────────────────────────────────────────────
router.get("/stats/enrollment-trends", getEnrollmentTrends);
router.get("/stats/payment-aging", getPaymentAging);

// ── Reports ────────────────────────────────────────────────────────────────
router.post("/reports/:reportType", generateReport);

export default router;
