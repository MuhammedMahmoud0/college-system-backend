import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { error } from "console";

// Store active attendance sessions
// Structure: { sessionId: { lectureId, tutorialId, qrCode, qrExpiry, attendees: Set, enrolledStudents: [] } }
const activeSessions = new Map();

// QR code refresh interval (in milliseconds)
const QR_REFRESH_INTERVAL = 1000000; // 10 seconds (you can change to 5000 for 5 seconds)

/**
 * Generate a secure QR code token
 */
function generateQRCode(sessionId) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(16).toString("hex");
    return `${sessionId}:${timestamp}:${random}`;
}

/**
 * Start a live attendance session for a lecture or tutorial
 * POST /api/v1/attendance/sessions/start
 */
export const startAttendanceSession = async (req, res) => {
    try {
        const { lecture_id, tutorial_lab_id, session_date } = req.body;
        const instructorId = req.user.userId;

        // Validate that at least one of lecture_id or tutorial_lab_id is provided
        if (!lecture_id && !tutorial_lab_id) {
            return res.status(400).json({
                error: "Either lecture_id or tutorial_lab_id is required",
            });
        }
        if (lecture_id && tutorial_lab_id) {
            return res.status(400).json({
                error: "Provide either lecture_id or tutorial_lab_id, not both",
            });
        }

        if (!session_date) {
            return res.status(400).json({
                error: "session_date is required (format: YYYY-MM-DD)",
            });
        }

        // Verify instructor is teaching this lecture/tutorial
        if (lecture_id) {
            const lecture = await prisma.lectures.findUnique({
                where: { lecture_id: parseInt(lecture_id) },
            });

            if (!lecture) {
                return res.status(404).json({ error: "Lecture not found" });
            }

            if (lecture.instructor_id !== instructorId) {
                return res.status(403).json({
                    error: "You are not authorized to start attendance for this lecture",
                });
            }
        }

        if (tutorial_lab_id) {
            const tutorial = await prisma.tutorials_labs.findUnique({
                where: { tutorial_lab_id: parseInt(tutorial_lab_id) },
            });

            if (!tutorial) {
                return res
                    .status(404)
                    .json({ error: "Tutorial/Lab not found" });
            }

            if (tutorial.ta_id !== instructorId) {
                return res.status(403).json({
                    error: "You are not authorized to start attendance for this tutorial",
                });
            }
        }

        // Get enrolled students
        const enrollments = await prisma.enrollments.findMany({
            where: lecture_id
                ? { lecture_id: parseInt(lecture_id) }
                : { tutorial_lab_id: parseInt(tutorial_lab_id) },
            include: {
                users: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        avatar_url: true,
                        student_profiles: {
                            select: {
                                student_id: true,
                            },
                        },
                    },
                },
            },
        });

        const enrolledStudents = enrollments.map((enrollment) => ({
            user_id: enrollment.users.id,
            full_name: enrollment.users.full_name,
            email: enrollment.users.email,
            avatar_url: enrollment.users.avatar_url,
            student_id: enrollment.users.student_profiles?.student_id,
            status: "absent", // Default to absent
        }));

        // Create session
        const sessionId = uuidv4();
        const qrCode = generateQRCode(sessionId);
        const qrExpiry = Date.now() + QR_REFRESH_INTERVAL;

        activeSessions.set(sessionId, {
            lectureId: lecture_id ? parseInt(lecture_id) : null,
            tutorialLabId: tutorial_lab_id ? parseInt(tutorial_lab_id) : null,
            sessionDate: session_date,
            qrCode,
            qrExpiry,
            attendees: new Set(), // Set of user_ids who scanned
            enrolledStudents,
            createdAt: Date.now(),
        });

        logger.info(`Attendance session started: ${sessionId}`);

        res.status(201).json({
            message: "Attendance session started",
            sessionId,
            qrCode,
            qrExpiry,
            enrolledStudents,
        });
    } catch (err) {
        logger.error("Error starting attendance session:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get current session details
 * GET /api/v1/attendance/sessions/:sessionId
 */
export const getSessionDetails = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = activeSessions.get(sessionId);
        if (!session) {
            return res
                .status(404)
                .json({ error: "Session not found or expired" });
        }

        // Update student statuses based on attendees
        const studentsWithStatus = session.enrolledStudents.map((student) => ({
            ...student,
            status: session.attendees.has(student.user_id)
                ? "present"
                : "absent",
        }));

        res.status(200).json({
            sessionId,
            lectureId: session.lectureId,
            tutorialLabId: session.tutorialLabId,
            sessionDate: session.sessionDate,
            qrCode: session.qrCode,
            qrExpiry: session.qrExpiry,
            students: studentsWithStatus,
            presentCount: session.attendees.size,
            totalCount: session.enrolledStudents.length,
        });
    } catch (err) {
        logger.error("Error getting session details:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Scan QR code (student attendance)
 * POST /api/v1/attendance/scan
 */
export const scanQRCode = async (req, res) => {
    try {
        const { qrCode } = req.body;
        const studentId = req.user.userId;

        if (!qrCode) {
            return res.status(400).json({ error: "QR code is required" });
        }

        // Parse QR code to get sessionId
        const [sessionId, timestamp] = qrCode.split(":");

        const session = activeSessions.get(sessionId);
        if (!session) {
            return res.status(404).json({
                error: "Invalid or expired attendance session",
            });
        }

        // Check if QR code matches current session QR
        if (session.qrCode !== qrCode) {
            return res.status(400).json({
                error: "QR code expired, please scan the current one",
            });
        }

        // Check if QR code is expired
        if (Date.now() > session.qrExpiry) {
            return res.status(400).json({
                error: "QR code expired, please scan the current one",
            });
        }

        // Check if student is enrolled
        const isEnrolled = session.enrolledStudents.some(
            (student) => student.user_id === studentId
        );

        if (!isEnrolled) {
            return res.status(403).json({
                error: "You are not enrolled in this lecture/tutorial",
            });
        }

        // Check if already marked present
        if (session.attendees.has(studentId)) {
            return res.status(200).json({
                message: "You are already marked present",
                status: "present",
            });
        }

        // Mark as present
        session.attendees.add(studentId);

        logger.info(
            `Student ${studentId} marked present in session ${sessionId}`
        );

        // This will be handled by WebSocket to notify all connected clients
        // For REST API, just return success
        res.status(200).json({
            message: "Attendance marked successfully",
            status: "present",
            sessionId,
        });
    } catch (err) {
        logger.error("Error scanning QR code:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * End attendance session and save to database
 * POST /api/v1/attendance/sessions/:sessionId/end
 */
export const endAttendanceSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const instructorId = req.user.userId;

        const session = activeSessions.get(sessionId);
        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        // Verify instructor authorization
        if (session.lectureId) {
            const lecture = await prisma.lectures.findUnique({
                where: { lecture_id: session.lectureId },
            });
            if (lecture.instructor_id !== instructorId) {
                return res.status(403).json({ error: "Unauthorized" });
            }
        }

        if (session.tutorialLabId) {
            const tutorial = await prisma.tutorials_labs.findUnique({
                where: { tutorial_lab_id: session.tutorialLabId },
            });
            if (tutorial.ta_id !== instructorId) {
                return res.status(403).json({ error: "Unauthorized" });
            }
        }

        // Save attendance records to database
        const attendanceRecords = session.enrolledStudents.map((student) => ({
            student_user_id: student.user_id,
            lecture_id: session.lectureId,
            tutorial_lab_id: session.tutorialLabId,
            session_date: new Date(session.sessionDate),
            status: session.attendees.has(student.user_id)
                ? "present"
                : "absent",
        }));

        // Bulk insert attendance records
        await prisma.attendance.createMany({
            data: attendanceRecords,
            skipDuplicates: true, // Skip if already exists
        });

        // Remove session from active sessions
        activeSessions.delete(sessionId);

        logger.info(`Attendance session ended and saved: ${sessionId}`);

        res.status(200).json({
            message: "Attendance session ended and saved",
            presentCount: session.attendees.size,
            totalCount: session.enrolledStudents.length,
        });
    } catch (err) {
        logger.error("Error ending attendance session:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get active sessions for instructor
 * GET /api/v1/attendance/sessions/active
 */
export const getActiveSessions = async (req, res) => {
    try {
        const instructorId = req.user.userId;

        const sessions = [];
        for (const [sessionId, session] of activeSessions.entries()) {
            // Check if instructor owns this session
            let isOwner = false;

            if (session.lectureId) {
                const lecture = await prisma.lectures.findUnique({
                    where: { lecture_id: session.lectureId },
                    include: {
                        course_offerings: {
                            include: {
                                courses: true,
                            },
                        },
                    },
                });
                if (lecture?.instructor_id === instructorId) {
                    isOwner = true;
                    sessions.push({
                        sessionId,
                        type: "lecture",
                        courseName: lecture.course_offerings.courses.name,
                        courseCode: lecture.course_offerings.courses.code,
                        presentCount: session.attendees.size,
                        totalCount: session.enrolledStudents.length,
                        createdAt: session.createdAt,
                    });
                }
            }

            if (session.tutorialLabId && !isOwner) {
                const tutorial = await prisma.tutorials_labs.findUnique({
                    where: { tutorial_lab_id: session.tutorialLabId },
                    include: {
                        course_offerings: {
                            include: {
                                courses: true,
                            },
                        },
                    },
                });
                if (tutorial?.ta_id === instructorId) {
                    sessions.push({
                        sessionId,
                        type: "tutorial",
                        courseName: tutorial.course_offerings.courses.name,
                        courseCode: tutorial.course_offerings.courses.code,
                        presentCount: session.attendees.size,
                        totalCount: session.enrolledStudents.length,
                        createdAt: session.createdAt,
                    });
                }
            }
        }

        res.status(200).json({ sessions });
    } catch (err) {
        logger.error("Error getting active sessions:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Export for WebSocket handler
export { activeSessions, generateQRCode, QR_REFRESH_INTERVAL };
