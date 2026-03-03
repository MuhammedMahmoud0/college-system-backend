import express from "express";
import * as notificationController from "../controllers/notificationController.js";
import {
    authMiddleware,
    authorizationMiddleware,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Apply authentication to all notification routes
router.use(authMiddleware);

// ── User routes ─────────────────────────────────────────────────────────────
// Listing & read-state management
router.get("/", notificationController.getNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.patch("/mark-all-read", notificationController.markAllAsRead);
router.patch("/:id/read", notificationController.markAsRead);

// Delete
router.delete("/", notificationController.deleteAllNotifications);
router.delete("/:id", notificationController.deleteNotification);

// Notification preferences (the settings panel from the UI)
router.get("/preferences", notificationController.getPreferences);
router.put("/preferences", notificationController.updatePreferences);

// ── Admin routes ─────────────────────────────────────────────────────────────
router.post(
    "/",
    authorizationMiddleware("admin", "super_admin"),
    notificationController.createNotification
);
router.post(
    "/bulk",
    authorizationMiddleware("admin", "super_admin"),
    notificationController.createBulkNotifications
);

export default router;
