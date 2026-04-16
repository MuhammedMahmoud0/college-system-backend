import express from "express";
import {
    getAcademicCalendar,
    createAcademicCalendarEvent,
    updateAcademicCalendarEvent,
    deleteAcademicCalendarEvent,
    createAnnouncement,
    getAnnouncements,
    updateAnnouncement,
    deleteAnnouncement,
    openRegistration,
} from "../controllers/systemConfigController.js";
import {
    authMiddleware,
    authorizationMiddleware,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// ── Announcements (read) — accessible by any authenticated user ────────────
router.get("/announcements", getAnnouncements);

// ── Below: Admin / Super Admin only ────────────────────────────────────────
router.use(authorizationMiddleware("super_admin"));

// ── Academic Calendar ──────────────────────────────────────────────────────
router.get("/calendar", getAcademicCalendar);
router.post("/calendar", createAcademicCalendarEvent);
router.patch("/calendar/:id", updateAcademicCalendarEvent);
router.delete("/calendar/:id", deleteAcademicCalendarEvent);

// ── Registration ───────────────────────────────────────────────────────────
router.post("/registration-open", openRegistration);

// ── Announcements (write) ──────────────────────────────────────────────────
router.post("/announcements", createAnnouncement);
router.patch("/announcements/:id", updateAnnouncement);
router.delete("/announcements/:id", deleteAnnouncement);

export default router;
