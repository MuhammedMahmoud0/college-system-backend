import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";
import { sendBulkNotification } from "../utils/notificationService.js";

const ACADEMIC_CALENDAR_EVENT_TYPES = [
    "semester_start",
    "semester_end",
    "registration_start",
    "registration_end",
    "payment_start",
    "payment_end",
    "registration_deadline",
    "exam_week",
    "midterm",
    "final_exam",
    "holiday",
    "orientation",
    "other",
];

const isValidAcademicCalendarEventType = (value) =>
    ACADEMIC_CALENDAR_EVENT_TYPES.includes(value);

// Helper: format a Date object to "HH:mm"
const formatHHmm = (date) => {
    const d = new Date(date);
    const hours = String(d.getUTCHours()).padStart(2, "0");
    const minutes = String(d.getUTCMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
};

// Helper: format announcement output
const formatAnnouncement = (announcement) => ({
    id: announcement.id,
    author_id: announcement.author_id,
    title: announcement.title,
    content: announcement.content,
    audience: announcement.audience,
    publish_at: announcement.publish_at
        ? formatHHmm(announcement.publish_at)
        : null,
    expire_at: announcement.expire_at ?? null,
});

// Helper: parse date dynamically handling YYYY-MM-DD explicitly or computing Cairo time
const parseCairoDate = (dateStr) => {
    // If it's a date-only string like "2026-5-31", parse as UTC midnight
    const dateOnlyMatch = /^\s*(\d{4})-(\d{1,2})-(\d{1,2})\s*$/.exec(dateStr);
    if (dateOnlyMatch) {
        const [, year, month, day] = dateOnlyMatch;
        return new Date(Date.UTC(year, parseInt(month) - 1, day));
    }

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return d;

    // If it has a time/timezone, project it to an Africa/Cairo day
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Africa/Cairo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
    const parts = formatter.formatToParts(d);
    const month = parts.find((p) => p.type === "month").value;
    const day = parts.find((p) => p.type === "day").value;
    const year = parts.find((p) => p.type === "year").value;

    return new Date(Date.UTC(year, parseInt(month) - 1, day));
};

// ─────────────────────────────────────────────
// 1. Academic Calendar (Database-backed)
// ─────────────────────────────────────────────

/**
 * GET /api/v1/config/calendar
 * Retrieve all academic calendar events.
 */
export const getAcademicCalendar = async (req, res) => {
    try {
        const { semester, academic_year, event_type } = req.query;

        if (event_type && !isValidAcademicCalendarEventType(event_type)) {
            return res.status(400).json({
                error: `Invalid event_type. Allowed values: ${ACADEMIC_CALENDAR_EVENT_TYPES.join(
                    ", ",
                )}`,
            });
        }

        const where = {};
        if (semester) where.semester = semester;
        if (academic_year) where.academic_year = academic_year;
        if (event_type) where.event_type = event_type;

        const events = await prisma.academic_calendar.findMany({
            where,
            orderBy: { event_date: "asc" },
            include: {
                users: {
                    select: {
                        id: true,
                        full_name: true,
                    },
                },
            },
        });

        return res.status(200).json({
            message: "Academic calendar retrieved successfully.",
            data: events,
        });
    } catch (err) {
        logger.error("Error fetching academic calendar:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
};

/**
 * POST /api/v1/config/calendar
 * Create a new academic calendar event.
 */
export const createAcademicCalendarEvent = async (req, res) => {
    try {
        const created_by_user_id = req.user.id;
        const {
            event_name,
            event_type,
            event_date,
            end_date,
            description,
            semester,
            academic_year,
        } = req.body;

        if (!event_name || !event_type || !event_date) {
            return res.status(400).json({
                error: "event_name, event_type, and event_date are required.",
            });
        }

        if (!isValidAcademicCalendarEventType(event_type)) {
            return res.status(400).json({
                error: `Invalid event_type. Allowed values: ${ACADEMIC_CALENDAR_EVENT_TYPES.join(
                    ", ",
                )}`,
            });
        }

        // Validate date format
        const parsedEventDate = parseCairoDate(event_date);
        if (isNaN(parsedEventDate.getTime())) {
            return res
                .status(400)
                .json({ error: "Invalid event_date format." });
        }

        let parsedEndDate = null;
        if (end_date) {
            parsedEndDate = parseCairoDate(end_date);
            if (isNaN(parsedEndDate.getTime())) {
                return res
                    .status(400)
                    .json({ error: "Invalid end_date format." });
            }
        }

        // ── Deduplication: overwrite existing event with same event_type + semester ──
        const eventData = {
            event_name,
            event_type,
            event_date: parsedEventDate,
            end_date: parsedEndDate,
            description: description || null,
            semester: semester || null,
            academic_year: academic_year || null,
            created_by_user_id,
        };

        const includeUser = {
            users: {
                select: {
                    id: true,
                    full_name: true,
                },
            },
        };

        if (semester && academic_year) {
            const existing = await prisma.academic_calendar.findFirst({
                where: { event_type, semester, academic_year },
            });

            if (existing) {
                const updated = await prisma.academic_calendar.update({
                    where: { id: existing.id },
                    data: eventData,
                    include: includeUser,
                });

                return res.status(200).json({
                    message:
                        "Existing calendar event with the same type, semester, and academic year was overwritten.",
                    data: updated,
                    overwritten: true,
                });
            }
        }

        const event = await prisma.academic_calendar.create({
            data: eventData,
            include: includeUser,
        });

        return res.status(201).json({
            message: "Academic calendar event created successfully.",
            data: event,
        });
    } catch (err) {
        logger.error("Error creating academic calendar event:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
};

/**
 * PATCH /api/v1/config/calendar/:id
 * Update an existing academic calendar event.
 */
export const updateAcademicCalendarEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            event_name,
            event_type,
            event_date,
            end_date,
            description,
            semester,
            academic_year,
        } = req.body;

        const updateData = {};

        if (event_name) updateData.event_name = event_name;

        if (event_type !== undefined) {
            if (!isValidAcademicCalendarEventType(event_type)) {
                return res.status(400).json({
                    error: `Invalid event_type. Allowed values: ${ACADEMIC_CALENDAR_EVENT_TYPES.join(
                        ", ",
                    )}`,
                });
            }

            updateData.event_type = event_type;
        }

        if (event_date) {
            const parsedEventDate = parseCairoDate(event_date);
            if (isNaN(parsedEventDate.getTime())) {
                return res
                    .status(400)
                    .json({ error: "Invalid event_date format." });
            }
            updateData.event_date = parsedEventDate;
        }

        if (end_date !== undefined) {
            if (end_date === null) {
                updateData.end_date = null;
            } else {
                const parsedEndDate = parseCairoDate(end_date);
                if (isNaN(parsedEndDate.getTime())) {
                    return res
                        .status(400)
                        .json({ error: "Invalid end_date format." });
                }
                updateData.end_date = parsedEndDate;
            }
        }

        if (description !== undefined) updateData.description = description;
        if (semester !== undefined) updateData.semester = semester;
        if (academic_year !== undefined)
            updateData.academic_year = academic_year;

        if (Object.keys(updateData).length === 0) {
            return res
                .status(400)
                .json({ error: "No updatable fields provided." });
        }

        const existing = await prisma.academic_calendar.findUnique({
            where: { id: parseInt(id) },
        });

        if (!existing) {
            return res.status(404).json({ error: "Calendar event not found." });
        }

        const updated = await prisma.academic_calendar.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                users: {
                    select: {
                        id: true,
                        full_name: true,
                    },
                },
            },
        });

        return res.status(200).json({
            message: "Academic calendar event updated successfully.",
            data: updated,
        });
    } catch (err) {
        logger.error("Error updating academic calendar event:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
};

/**
 * DELETE /api/v1/config/calendar/:id
 * Delete an academic calendar event.
 */
export const deleteAcademicCalendarEvent = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.academic_calendar.findUnique({
            where: { id: parseInt(id) },
        });

        if (!existing) {
            return res.status(404).json({ error: "Calendar event not found." });
        }

        await prisma.academic_calendar.delete({ where: { id: parseInt(id) } });

        return res.status(200).json({
            message: "Academic calendar event deleted successfully.",
        });
    } catch (err) {
        logger.error("Error deleting academic calendar event:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
};

// ─────────────────────────────────────────────
// 2. Announcements CRUD
// ─────────────────────────────────────────────

/**
 * POST /api/v1/config/announcements
 * Create a new announcement.
 */
export const createAnnouncement = async (req, res) => {
    try {
        const author_id = req.user.id;
        const { title, content, audience, expire_at } = req.body;

        if (!title || !content) {
            return res
                .status(400)
                .json({ error: "title and content are required." });
        }

        // Validate audience enum if provided
        const validAudiences = ["All", "Students", "Faculty"];
        if (audience && !validAudiences.includes(audience)) {
            return res.status(400).json({
                error: `audience must be one of: ${validAudiences.join(", ")}.`,
            });
        }

        const now = new Date();

        // Default expire_at: 2 weeks from now
        let expireDate;
        if (expire_at) {
            expireDate = new Date(expire_at);
            if (isNaN(expireDate.getTime())) {
                return res
                    .status(400)
                    .json({ error: "Invalid expire_at date format." });
            }
        } else {
            expireDate = new Date(now);
            expireDate.setDate(expireDate.getDate() + 14);
        }

        const announcement = await prisma.announcements.create({
            data: {
                author_id,
                title,
                content,
                audience: audience ?? "All",
                publish_at: now,
                expire_at: expireDate,
            },
        });

        // Notify users based on announcement audience (fire-and-forget)
        const io = req.app.get("io");
        const effectiveAudience = announcement.audience ?? "All";

        // Faculty  = admin, super_admin, doctor, teaching_assistant
        // Students = student, leader
        // All      = every role
        const audienceRoles =
            effectiveAudience === "Students"
                ? ["student", "leader"]
                : effectiveAudience === "Faculty"
                  ? ["admin", "super_admin", "doctor", "teaching_assistant"]
                  : null; // null = All

        const whereClause = audienceRoles
            ? { role: { in: audienceRoles } }
            : {};
        const recipients = await prisma.users.findMany({
            where: whereClause,
            select: { id: true },
        });

        const recipientIds = recipients.map((u) => u.id);
        if (recipientIds.length > 0) {
            sendBulkNotification({
                userIds: recipientIds,
                message: `[Announcement] ${title}: ${content}`,
                type: "campus_announcement",
                io,
            }).catch((err) =>
                logger.error("Error sending announcement notifications:", err),
            );
        }

        return res.status(201).json({
            message: "Announcement created successfully.",
            data: formatAnnouncement(announcement),
        });
    } catch (err) {
        logger.error("Error creating announcement:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
};

/**
 * POST /api/v1/config/registration-open
 * Notify all students that registration has opened.
 */
export const openRegistration = async (req, res) => {
    try {
        const io = req.app.get("io");

        const students = await prisma.users.findMany({
            where: { role: "student" },
            select: { id: true },
        });

        const studentIds = students.map((s) => s.id);

        if (studentIds.length > 0) {
            sendBulkNotification({
                userIds: studentIds,
                message:
                    "Course registration is now open! Head to the registration portal to enroll in your courses.",
                type: "campus_announcement",
                io,
            }).catch((err) =>
                logger.error(
                    "Error sending registration-open notifications:",
                    err,
                ),
            );
        }

        return res.status(200).json({
            message: `Registration-open notification sent to ${studentIds.length} students.`,
        });
    } catch (err) {
        logger.error("Error sending registration-open notification:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
};

// Maps each user role to the announcement audiences they are allowed to see
const ROLE_AUDIENCE_MAP = {
    admin: ["All", "Faculty"],
    super_admin: ["All", "Faculty"],
    doctor: ["All", "Faculty"],
    teaching_assistant: ["All", "Faculty"],
    student: ["All", "Students"],
    leader: ["All", "Students"],
};

/**
 * GET /api/v1/config/announcements
 * Retrieve active announcements visible to the authenticated user's role.
 */
export const getAnnouncements = async (req, res) => {
    try {
        const now = new Date();
        const userRole = req.user.role;

        // Determine which audiences this role may see
        const allowedAudiences = ROLE_AUDIENCE_MAP[userRole] ?? ["All"];

        const announcements = await prisma.announcements.findMany({
            where: {
                expire_at: { gt: now },
                audience: { in: allowedAudiences },
            },
            orderBy: { publish_at: "desc" },
        });

        return res.status(200).json({
            count: announcements.length,
            data: announcements.map(formatAnnouncement),
        });
    } catch (err) {
        logger.error("Error fetching announcements:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
};

/**
 * PATCH /api/v1/config/announcements/:id
 * Update specific fields of an announcement.
 */
export const updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, audience, expire_at } = req.body;

        // Validate audience enum if provided
        const validAudiences = ["All", "Students", "Faculty"];
        if (audience && !validAudiences.includes(audience)) {
            return res.status(400).json({
                error: `audience must be one of: ${validAudiences.join(", ")}.`,
            });
        }

        // Build update payload with only provided fields
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (audience !== undefined) updateData.audience = audience;
        if (expire_at !== undefined) {
            const expireDate = new Date(expire_at);
            if (isNaN(expireDate.getTime())) {
                return res
                    .status(400)
                    .json({ error: "Invalid expire_at date format." });
            }
            updateData.expire_at = expireDate;
        }

        if (Object.keys(updateData).length === 0) {
            return res
                .status(400)
                .json({ error: "No updatable fields provided." });
        }

        const existing = await prisma.announcements.findUnique({
            where: { id: parseInt(id) },
        });

        if (!existing) {
            return res.status(404).json({ error: "Announcement not found." });
        }

        const updated = await prisma.announcements.update({
            where: { id: parseInt(id) },
            data: updateData,
        });

        return res.status(200).json({
            message: "Announcement updated successfully.",
            data: formatAnnouncement(updated),
        });
    } catch (err) {
        logger.error("Error updating announcement:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
};

/**
 * DELETE /api/v1/config/announcements/:id
 * Permanently remove an announcement.
 */
export const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.announcements.findUnique({
            where: { id: parseInt(id) },
        });

        if (!existing) {
            return res.status(404).json({ error: "Announcement not found." });
        }

        await prisma.announcements.delete({ where: { id: parseInt(id) } });

        return res
            .status(200)
            .json({ message: "Announcement deleted successfully." });
    } catch (err) {
        logger.error("Error deleting announcement:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
};
