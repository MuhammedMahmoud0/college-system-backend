import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";

/**
 * Maps notification_type enum values to preference column names
 */
const TYPE_TO_PREFERENCE = {
    new_grade: "new_grade",
    exam_deadline: "exam_deadline",
    community_activity: "community_activity",
    campus_announcement: "campus_announcement",
    general: null, // general notifications bypass preferences
};

/**
 * Sends a real-time notification to a user.
 * - Checks the user's notification preferences (skips if disabled).
 * - Persists the notification to the database.
 * - Emits via Socket.IO to the user's personal notification room.
 *
 * @param {object} options
 * @param {string} options.userId            - UUID of the target user
 * @param {string} options.message           - Notification message text
 * @param {string} options.type              - notification_type enum value
 * @param {import('socket.io').Server} [options.io] - Socket.IO server instance (optional for real-time)
 * @returns {Promise<object|null>}            - Created notification record, or null if suppressed
 */
export async function sendNotification({
    userId,
    message,
    type = "general",
    io = null,
}) {
    try {
        const preferenceKey = TYPE_TO_PREFERENCE[type];

        // Check preferences when a mapped preference key exists
        if (preferenceKey) {
            const prefs = await prisma.notification_preferences.findUnique({
                where: { user_id: userId },
                select: { [preferenceKey]: true },
            });

            // Preferences row may not exist yet (user never saved them) — treat as default true
            if (prefs && prefs[preferenceKey] === false) {
                logger.info(
                    `Notification suppressed for user ${userId}: preference '${preferenceKey}' is disabled`
                );
                return null;
            }
        }

        // Persist to database
        const notification = await prisma.notifications.create({
            data: {
                user_id: userId,
                message,
                type,
            },
            select: {
                id: true,
                message: true,
                type: true,
                is_read: true,
                created_at: true,
            },
        });

        // Emit real-time event if io is available
        if (io) {
            io.to(`notifications:${userId}`).emit(
                "new-notification",
                notification
            );

            // Also update unread count
            const unreadCount = await prisma.notifications.count({
                where: { user_id: userId, is_read: false },
            });
            io.to(`notifications:${userId}`).emit("unread-count", {
                unreadCount,
            });
        }

        logger.info(
            `Notification sent to user ${userId}: [${type}] ${message}`
        );
        return notification;
    } catch (err) {
        logger.error("Error sending notification:", err);
        return null;
    }
}

/**
 * Sends a notification to multiple users at once.
 *
 * @param {object} options
 * @param {string[]} options.userIds         - Array of user UUIDs
 * @param {string} options.message           - Notification message text
 * @param {string} options.type              - notification_type enum value
 * @param {import('socket.io').Server} [options.io] - Socket.IO server instance
 * @returns {Promise<number>}                - Count of notifications actually sent
 */
export async function sendBulkNotification({
    userIds,
    message,
    type = "general",
    io = null,
}) {
    let sentCount = 0;

    for (const userId of userIds) {
        const result = await sendNotification({ userId, message, type, io });
        if (result) sentCount++;
    }

    return sentCount;
}
