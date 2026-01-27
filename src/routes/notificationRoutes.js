import express from "express";
import * as notificationController from "../controllers/notificationController.js";
import {
    authMiddleware,
    authorizationMiddleware,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Apply authentication to all notification routes
router.use(authMiddleware);

// User routes - get own notifications
router.get("/", notificationController.getNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.patch("/:id/read", notificationController.markAsRead);
router.patch("/mark-all-read", notificationController.markAllAsRead);
router.delete("/:id", notificationController.deleteNotification);
router.delete("/", notificationController.deleteAllNotifications);

// Admin routes - create notifications for users
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
