import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";
import {
    sendNotification,
    sendBulkNotification,
    sendGlobalAnnouncement,
} from "../utils/notificationService.js";

// ---------------------------------------------------------------------------
// GET /api/v1/notifications
// ---------------------------------------------------------------------------
export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [notifications, totalCount, unreadCount] = await Promise.all([
            prisma.notifications.findMany({
                where: { user_id: userId },
                skip,
                take: limit,
                orderBy: { created_at: "desc" },
                select: {
                    id: true,
                    message: true,
                    type: true,
                    is_read: true,
                    created_at: true,
                },
            }),
            prisma.notifications.count({ where: { user_id: userId } }),
            prisma.notifications.count({
                where: { user_id: userId, is_read: false },
            }),
        ]);

        res.status(200).json({
            notifications,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            },
            unreadCount,
        });
    } catch (err) {
        logger.error("Error fetching notifications:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ---------------------------------------------------------------------------
// GET /api/v1/notifications/unread-count
// ---------------------------------------------------------------------------
export const getUnreadCount = async (req, res) => {
    try {
        const unreadCount = await prisma.notifications.count({
            where: { user_id: req.user.id, is_read: false },
        });
        res.status(200).json({ unreadCount });
    } catch (err) {
        logger.error("Error fetching unread count:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ---------------------------------------------------------------------------
// PATCH /api/v1/notifications/:id/read
// ---------------------------------------------------------------------------
export const markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const id = parseInt(req.params.id);

        const notification = await prisma.notifications.findFirst({
            where: { id, user_id: userId },
        });

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        const updated = await prisma.notifications.update({
            where: { id },
            data: { is_read: true },
            select: {
                id: true,
                message: true,
                type: true,
                is_read: true,
                created_at: true,
            },
        });

        const io = req.app.get("io");
        if (io) {
            const unreadCount = await prisma.notifications.count({
                where: { user_id: userId, is_read: false },
            });
            io.to(`notifications:${userId}`).emit("unread-count", {
                unreadCount,
            });
        }

        res.status(200).json({
            message: "Notification marked as read",
            notification: updated,
        });
    } catch (err) {
        logger.error("Error marking notification as read:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ---------------------------------------------------------------------------
// PATCH /api/v1/notifications/mark-all-read
// ---------------------------------------------------------------------------
export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await prisma.notifications.updateMany({
            where: { user_id: userId, is_read: false },
            data: { is_read: true },
        });

        const io = req.app.get("io");
        if (io) {
            io.to(`notifications:${userId}`).emit("unread-count", {
                unreadCount: 0,
            });
        }

        res.status(200).json({
            message: "All notifications marked as read",
            updatedCount: result.count,
        });
    } catch (err) {
        logger.error("Error marking all notifications as read:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ---------------------------------------------------------------------------
// DELETE /api/v1/notifications/:id
// ---------------------------------------------------------------------------
export const deleteNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const id = parseInt(req.params.id);

        const notification = await prisma.notifications.findFirst({
            where: { id, user_id: userId },
        });

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        await prisma.notifications.delete({ where: { id } });

        res.status(200).json({ message: "Notification deleted successfully" });
    } catch (err) {
        logger.error("Error deleting notification:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ---------------------------------------------------------------------------
// DELETE /api/v1/notifications
// ---------------------------------------------------------------------------
export const deleteAllNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await prisma.notifications.deleteMany({
            where: { user_id: userId },
        });

        const io = req.app.get("io");
        if (io) {
            io.to(`notifications:${userId}`).emit("unread-count", {
                unreadCount: 0,
            });
        }

        res.status(200).json({
            message: "All notifications deleted successfully",
            deletedCount: result.count,
        });
    } catch (err) {
        logger.error("Error deleting all notifications:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ---------------------------------------------------------------------------
// GET /api/v1/notifications/preferences
// ---------------------------------------------------------------------------
export const getPreferences = async (req, res) => {
    try {
        const userId = req.user.id;

        const prefs = await prisma.notification_preferences.upsert({
            where: { user_id: userId },
            update: {},
            create: { user_id: userId },
        });

        res.status(200).json({
            preferences: {
                new_grade: prefs.new_grade,
                exam_deadline: prefs.exam_deadline,
                community_activity: prefs.community_activity,
                campus_announcement: prefs.campus_announcement,
            },
        });
    } catch (err) {
        logger.error("Error fetching notification preferences:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ---------------------------------------------------------------------------
// PUT /api/v1/notifications/preferences
// ---------------------------------------------------------------------------
export const updatePreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            new_grade,
            exam_deadline,
            community_activity,
            campus_announcement,
        } = req.body;

        const data = {};
        if (typeof new_grade === "boolean") data.new_grade = new_grade;
        if (typeof exam_deadline === "boolean")
            data.exam_deadline = exam_deadline;
        if (typeof community_activity === "boolean")
            data.community_activity = community_activity;
        if (typeof campus_announcement === "boolean")
            data.campus_announcement = campus_announcement;

        if (Object.keys(data).length === 0) {
            return res.status(400).json({
                error: "At least one preference field (new_grade, exam_deadline, community_activity, campus_announcement) must be provided as a boolean",
            });
        }

        const prefs = await prisma.notification_preferences.upsert({
            where: { user_id: userId },
            update: data,
            create: { user_id: userId, ...data },
        });

        res.status(200).json({
            message: "Notification preferences saved",
            preferences: {
                new_grade: prefs.new_grade,
                exam_deadline: prefs.exam_deadline,
                community_activity: prefs.community_activity,
                campus_announcement: prefs.campus_announcement,
            },
        });
    } catch (err) {
        logger.error("Error updating notification preferences:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ---------------------------------------------------------------------------
// POST /api/v1/notifications  (admin / super_admin)
// ---------------------------------------------------------------------------
export const createNotification = async (req, res) => {
    try {
        const { user_id, message, type } = req.body;

        if (!user_id || !message) {
            return res
                .status(400)
                .json({ error: "user_id and message are required" });
        }

        const validTypes = [
            "new_grade",
            "exam_deadline",
            "community_activity",
            "campus_announcement",
            "general",
        ];
        if (type && !validTypes.includes(type)) {
            return res
                .status(400)
                .json({
                    error: `type must be one of: ${validTypes.join(", ")}`,
                });
        }

        const io = req.app.get("io");
        const notification = await sendNotification({
            userId: user_id,
            message,
            type: type || "general",
            io,
        });

        if (!notification) {
            return res
                .status(200)
                .json({
                    message: "Notification suppressed due to user preferences",
                });
        }

        res.status(201).json({
            message: "Notification created successfully",
            notification,
        });
    } catch (err) {
        logger.error("Error creating notification:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ---------------------------------------------------------------------------
// POST /api/v1/notifications/bulk  (admin / super_admin)
// ---------------------------------------------------------------------------
export const createBulkNotifications = async (req, res) => {
    try {
        const { user_ids, message, type } = req.body;

        if (!Array.isArray(user_ids) || user_ids.length === 0) {
            return res
                .status(400)
                .json({ error: "user_ids must be a non-empty array" });
        }
        if (!message) {
            return res.status(400).json({ error: "message is required" });
        }

        const validTypes = [
            "new_grade",
            "exam_deadline",
            "community_activity",
            "campus_announcement",
            "general",
        ];
        if (type && !validTypes.includes(type)) {
            return res
                .status(400)
                .json({
                    error: `type must be one of: ${validTypes.join(", ")}`,
                });
        }

        const io = req.app.get("io");
        const sentCount = await sendBulkNotification({
            userIds: user_ids,
            message,
            type: type || "general",
            io,
        });

        res.status(201).json({
            message: "Notifications sent",
            sentCount,
            totalRequested: user_ids.length,
        });
    } catch (err) {
        logger.error("Error creating bulk notifications:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ---------------------------------------------------------------------------
// POST /api/v1/notifications/register-device
// ---------------------------------------------------------------------------
export const registerDevice = async (req, res) => {
    try {
        const { fcmToken, platform } = req.body;
        // req.user might be undefined if not logged in (optionalAuthMiddleware)
        const userId = req.user ? req.user.id : null;

        if (!fcmToken) {
            return res.status(400).json({ error: "fcmToken is required" });
        }

        const deviceToken = await prisma.device_tokens.upsert({
            where: { token: fcmToken },
            update: {
                user_id: userId,
                platform: platform || null,
                is_active: true,
                updated_at: new Date()
            },
            create: {
                token: fcmToken,
                user_id: userId,
                platform: platform || null,
                is_active: true
            }
        });

        res.status(200).json({
            message: "Device registered successfully",
            device: {
                id: deviceToken.id,
                linked_to_user: !!userId,
                is_active: deviceToken.is_active
            }
        });
    } catch (err) {
        logger.error("Error registering device token:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ---------------------------------------------------------------------------
// POST /api/v1/notifications/global-broadcast
// ---------------------------------------------------------------------------
export const createGlobalBroadcast = async (req, res) => {
    try {
        const { message, type, persistent_user_ids } = req.body;

        if (!message) {
            return res.status(400).json({ error: "message is required" });
        }

        const result = await sendGlobalAnnouncement({
            message,
            type: type || "campus_announcement",
            persistentUserIds: Array.isArray(persistent_user_ids) ? persistent_user_ids : []
        });

        res.status(200).json({
            message: "Global announcement dispatched",
            fcmResult: result
        });
    } catch (err) {
        logger.error("Error broadcasting global announcement:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

