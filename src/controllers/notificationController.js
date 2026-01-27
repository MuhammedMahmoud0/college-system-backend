import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";

// GET /api/notifications - Get all notifications for the authenticated user
export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const notifications = await prisma.notifications.findMany({
            where: {
                user_id: userId,
            },
            skip,
            take: limit,
            orderBy: {
                created_at: "desc",
            },
            select: {
                id: true,
                message: true,
                type: true,
                is_read: true,
                created_at: true,
            },
        });

        const totalCount = await prisma.notifications.count({
            where: { user_id: userId },
        });

        const unreadCount = await prisma.notifications.count({
            where: {
                user_id: userId,
                is_read: false,
            },
        });

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

// GET /api/notifications/unread - Get unread notifications count
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const unreadCount = await prisma.notifications.count({
            where: {
                user_id: userId,
                is_read: false,
            },
        });

        res.status(200).json({ unreadCount });
    } catch (err) {
        logger.error("Error fetching unread count:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// PATCH /api/notifications/:id/read - Mark a notification as read
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await prisma.notifications.findFirst({
            where: {
                id: parseInt(id),
                user_id: userId,
            },
        });

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        const updatedNotification = await prisma.notifications.update({
            where: { id: parseInt(id) },
            data: { is_read: true },
        });

        res.status(200).json({
            message: "Notification marked as read",
            notification: updatedNotification,
        });
    } catch (err) {
        logger.error("Error marking notification as read:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// PATCH /api/notifications/mark-all-read - Mark all notifications as read
export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await prisma.notifications.updateMany({
            where: {
                user_id: userId,
                is_read: false,
            },
            data: {
                is_read: true,
            },
        });

        res.status(200).json({
            message: "All notifications marked as read",
            updatedCount: result.count,
        });
    } catch (err) {
        logger.error("Error marking all notifications as read:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// DELETE /api/notifications/:id - Delete a notification
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await prisma.notifications.findFirst({
            where: {
                id: parseInt(id),
                user_id: userId,
            },
        });

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        await prisma.notifications.delete({
            where: { id: parseInt(id) },
        });

        res.status(200).json({ message: "Notification deleted successfully" });
    } catch (err) {
        logger.error("Error deleting notification:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// DELETE /api/notifications - Delete all notifications for the user
export const deleteAllNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await prisma.notifications.deleteMany({
            where: {
                user_id: userId,
            },
        });

        res.status(200).json({
            message: "All notifications deleted successfully",
            deletedCount: result.count,
        });
    } catch (err) {
        logger.error("Error deleting all notifications:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// POST /api/notifications - Create a notification (admin/system use)
export const createNotification = async (req, res) => {
    try {
        const { user_id, message, type } = req.body;

        if (!user_id || !message) {
            return res
                .status(400)
                .json({ error: "user_id and message are required" });
        }

        const notification = await prisma.notifications.create({
            data: {
                user_id,
                message,
                type: type || null,
            },
        });

        res.status(201).json({
            message: "Notification created successfully",
            notification,
        });
    } catch (err) {
        logger.error("Error creating notification:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// POST /api/notifications/bulk - Create notifications for multiple users (admin/system use)
export const createBulkNotifications = async (req, res) => {
    try {
        const { user_ids, message, type } = req.body;

        if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
            return res.status(400).json({
                error: "user_ids must be a non-empty array",
            });
        }

        if (!message) {
            return res.status(400).json({ error: "message is required" });
        }

        const notifications = user_ids.map((user_id) => ({
            user_id,
            message,
            type: type || null,
        }));

        const result = await prisma.notifications.createMany({
            data: notifications,
        });

        res.status(201).json({
            message: "Notifications created successfully",
            createdCount: result.count,
        });
    } catch (err) {
        logger.error("Error creating bulk notifications:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};
