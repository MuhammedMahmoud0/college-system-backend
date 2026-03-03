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

// All system config endpoints require authentication + Admin / Super Admin role
router.use(authMiddleware);
router.use(authorizationMiddleware("admin", "super_admin"));

// ── Academic Calendar ──────────────────────────────────────────────────────
router.get("/calendar", getAcademicCalendar);
router.post("/calendar", createAcademicCalendarEvent);
router.patch("/calendar/:id", updateAcademicCalendarEvent);
router.delete("/calendar/:id", deleteAcademicCalendarEvent);

// ── Registration ───────────────────────────────────────────────────────────
router.post("/registration-open", openRegistration);

// ── Announcements ──────────────────────────────────────────────────────────
router.post("/announcements", createAnnouncement);
router.get("/announcements", getAnnouncements);
router.patch("/announcements/:id", updateAnnouncement);
router.delete("/announcements/:id", deleteAnnouncement);

export default router;
