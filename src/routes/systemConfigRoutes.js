import express from "express";
import {
    setAcademicCalendar,
    createAnnouncement,
    getAnnouncements,
    updateAnnouncement,
    deleteAnnouncement,
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
router.post("/calendar", setAcademicCalendar);

// ── Announcements ──────────────────────────────────────────────────────────
router.post("/announcements", createAnnouncement);
router.get("/announcements", getAnnouncements);
router.patch("/announcements/:id", updateAnnouncement);
router.delete("/announcements/:id", deleteAnnouncement);

export default router;
