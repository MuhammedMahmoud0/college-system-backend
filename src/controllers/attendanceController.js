import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { error } from "console";
import {
    sendNotification,
    sendBulkNotification,
} from "../utils/notificationService.js";

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
        const {
            lecture_id,
            tutorial_lab_id,
            session_date,
            isLive = false,
            longitude,
            latitude,
        } = req.body;
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
        let sessionCourseName = null;
        if (lecture_id) {
            const lecture = await prisma.lectures.findUnique({
                where: { lecture_id: parseInt(lecture_id) },
                include: { course_offerings: { include: { courses: true } } },
            });

            if (!lecture) {
                return res.status(404).json({ error: "Lecture not found" });
            }

            if (lecture.instructor_id !== instructorId) {
                return res.status(403).json({
                    error: "You are not authorized to start attendance for this lecture",
                });
            }
            sessionCourseName = lecture.course_offerings?.courses?.name || null;
        }

        if (tutorial_lab_id) {
            const tutorial = await prisma.tutorials_labs.findUnique({
                where: { tutorial_lab_id: parseInt(tutorial_lab_id) },
                include: { course_offerings: { include: { courses: true } } },
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
            sessionCourseName =
                tutorial.course_offerings?.courses?.name || null;
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
            isLive,
            longitude: longitude ?? null,
            latitude: latitude ?? null,
            qrCode,
            qrExpiry,
            attendees: new Set(), // Set of user_ids who scanned
            enrolledStudents,
            createdAt: Date.now(),
        });

        // Notify enrolled students that the session has started
        const enrolledUserIds = enrolledStudents.map((s) => s.user_id);
        if (enrolledUserIds.length > 0) {
            const io = req.app.get("io");
            sendBulkNotification({
                userIds: enrolledUserIds,
                message: `Attendance session started for ${
                    sessionCourseName || "your course"
                }. Scan the QR code to mark your attendance.`,
                type: "general",
                io,
            }).catch((err) =>
                logger.error("Error sending session-start notifications:", err)
            );
        }

        logger.info(`Attendance session started: ${sessionId}`);

        res.status(201).json({
            message: "Attendance session started",
            sessionId,
            qrCode,
            qrExpiry,
            isLive,
            longitude: longitude ?? null,
            latitude: latitude ?? null,
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

        // Notify the student that they have been marked present
        const io = req.app.get("io");
        sendNotification({
            userId: studentId,
            message: "Your attendance has been marked successfully.",
            type: "general",
            io,
        }).catch((err) =>
            logger.error("Error sending attendance notification:", err)
        );

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
            is_live: session.isLive ?? false,
            longitude: session.longitude ?? null,
            latitude: session.latitude ?? null,
        }));

        // Bulk insert attendance records
        await prisma.attendance.createMany({
            data: attendanceRecords,
            skipDuplicates: true, // Skip if already exists
        });

        // Check for students with 3 absences and send warning notifications
        const io = req.app.get("io");
        const absentStudents = session.enrolledStudents.filter(
            (s) => !session.attendees.has(s.user_id)
        );
        for (const student of absentStudents) {
            const absenceCount = await prisma.attendance.count({
                where: {
                    student_user_id: student.user_id,
                    lecture_id: session.lectureId || undefined,
                    tutorial_lab_id: session.tutorialLabId || undefined,
                    status: "absent",
                },
            });
            if (absenceCount === 3) {
                sendNotification({
                    userId: student.user_id,
                    message:
                        "Warning: You have accumulated 3 absences. Further absences may affect your academic standing.",
                    type: "general",
                    io,
                }).catch((err) =>
                    logger.error("Error sending absence warning:", err)
                );
            }
        }

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

/**
 * Manually toggle student attendance during active session
 * PUT /api/v1/attendance/sessions/:sessionId/toggle
 */
export const toggleStudentAttendance = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { student_user_id } = req.body;
        const instructorId = req.user.userId;

        if (!student_user_id) {
            return res.status(400).json({
                error: "student_user_id is required",
            });
        }

        const session = activeSessions.get(sessionId);
        if (!session) {
            return res.status(404).json({
                error: "Session not found or already ended",
            });
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

        // Check if student is enrolled
        const studentInfo = session.enrolledStudents.find(
            (student) => student.user_id === student_user_id
        );

        if (!studentInfo) {
            return res.status(404).json({
                error: "Student not enrolled in this lecture/tutorial",
            });
        }

        // Toggle attendance
        let newStatus;
        if (session.attendees.has(student_user_id)) {
            session.attendees.delete(student_user_id);
            newStatus = "absent";
            logger.info(
                `Student ${student_user_id} manually marked absent in session ${sessionId}`
            );
        } else {
            session.attendees.add(student_user_id);
            newStatus = "present";
            logger.info(
                `Student ${student_user_id} manually marked present in session ${sessionId}`
            );
        }

        res.status(200).json({
            message: "Attendance toggled successfully",
            student: {
                ...studentInfo,
                status: newStatus,
            },
            presentCount: session.attendees.size,
            totalCount: session.enrolledStudents.length,
        });
    } catch (err) {
        logger.error("Error toggling attendance:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Manually update attendance record (even after session ended)
 * PUT /api/v1/attendance/records/update
 */
export const updateAttendanceRecord = async (req, res) => {
    try {
        const {
            student_user_id,
            lecture_id,
            tutorial_lab_id,
            session_date,
            status,
        } = req.body;
        const instructorId = req.user.userId;

        // Validate required fields
        if (!student_user_id || !session_date || !status) {
            return res.status(400).json({
                error: "student_user_id, session_date, and status are required",
            });
        }

        if (!lecture_id && !tutorial_lab_id) {
            return res.status(400).json({
                error: "Either lecture_id or tutorial_lab_id is required",
            });
        }

        // Validate status
        if (!["present", "absent"].includes(status)) {
            return res.status(400).json({
                error: 'Status must be either "present" or "absent"',
            });
        }

        // Verify instructor authorization
        if (lecture_id) {
            const lecture = await prisma.lectures.findUnique({
                where: { lecture_id: parseInt(lecture_id) },
            });

            if (!lecture) {
                return res.status(404).json({ error: "Lecture not found" });
            }

            if (lecture.instructor_id !== instructorId) {
                return res.status(403).json({
                    error: "You are not authorized to update attendance for this lecture",
                });
            }
        }

        if (tutorial_lab_id) {
            const tutorial = await prisma.tutorials_labs.findUnique({
                where: { tutorial_lab_id: parseInt(tutorial_lab_id) },
            });

            if (!tutorial) {
                return res.status(404).json({
                    error: "Tutorial/Lab not found",
                });
            }

            if (tutorial.ta_id !== instructorId) {
                return res.status(403).json({
                    error: "You are not authorized to update attendance for this tutorial",
                });
            }
        }

        // Check if student is enrolled
        const enrollment = await prisma.enrollments.findFirst({
            where: {
                student_user_id: student_user_id,
                ...(lecture_id
                    ? { lecture_id: parseInt(lecture_id) }
                    : { tutorial_lab_id: parseInt(tutorial_lab_id) }),
            },
        });

        if (!enrollment) {
            return res.status(404).json({
                error: "Student not enrolled in this lecture/tutorial",
            });
        }

        // Upsert attendance record
        const attendanceRecord = await prisma.attendance.upsert({
            where: {
                // Composite unique key
                id: 0, // Dummy value, will use create/update based on unique constraint
            },
            update: {
                status: status,
            },
            create: {
                student_user_id: student_user_id,
                lecture_id: lecture_id ? parseInt(lecture_id) : null,
                tutorial_lab_id: tutorial_lab_id
                    ? parseInt(tutorial_lab_id)
                    : null,
                session_date: new Date(session_date),
                status: status,
            },
        });

        // Since upsert with composite key is tricky, use a simpler approach
        const existingRecord = await prisma.attendance.findFirst({
            where: {
                student_user_id: student_user_id,
                lecture_id: lecture_id ? parseInt(lecture_id) : null,
                tutorial_lab_id: tutorial_lab_id
                    ? parseInt(tutorial_lab_id)
                    : null,
                session_date: new Date(session_date),
            },
        });

        let updatedRecord;
        if (existingRecord) {
            // Update existing record
            updatedRecord = await prisma.attendance.update({
                where: { id: existingRecord.id },
                data: { status: status },
            });
        } else {
            // Create new record
            updatedRecord = await prisma.attendance.create({
                data: {
                    student_user_id: student_user_id,
                    lecture_id: lecture_id ? parseInt(lecture_id) : null,
                    tutorial_lab_id: tutorial_lab_id
                        ? parseInt(tutorial_lab_id)
                        : null,
                    session_date: new Date(session_date),
                    status: status,
                },
            });
        }

        logger.info(
            `Attendance record updated: Student ${student_user_id} marked ${status} for ${session_date}`
        );

        res.status(200).json({
            message: "Attendance record updated successfully",
            record: updatedRecord,
        });
    } catch (err) {
        logger.error("Error updating attendance record:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get all students assigned to the doctor's lecture/tutorial with their attendance summary
 * GET /api/v1/attendance/students?lecture_id=&tutorial_lab_id=&session_date=
 *
 * - lecture_id OR tutorial_lab_id required
 * - session_date optional: if provided, returns per-session status for that date
 *   otherwise returns overall attendance summary (total sessions, present count, absent count)
 */
export const getStudentsAttendance = async (req, res) => {
    try {
        const { lecture_id, tutorial_lab_id, session_date } = req.query;
        const instructorId = req.user.userId;

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

        // Verify the instructor owns this lecture/tutorial
        if (lecture_id) {
            const lecture = await prisma.lectures.findUnique({
                where: { lecture_id: parseInt(lecture_id) },
            });
            if (!lecture) {
                return res.status(404).json({ error: "Lecture not found" });
            }
            if (lecture.instructor_id !== instructorId) {
                return res.status(403).json({
                    error: "You are not authorized to view students for this lecture",
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
                    error: "You are not authorized to view students for this tutorial",
                });
            }
        }

        // Build the where clause for attendance lookup
        const attendanceWhere = lecture_id
            ? { lecture_id: parseInt(lecture_id) }
            : { tutorial_lab_id: parseInt(tutorial_lab_id) };

        if (session_date) {
            attendanceWhere.session_date = new Date(session_date);
        }

        // Fetch enrolled students
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
                            select: { student_id: true },
                        },
                    },
                },
            },
        });

        // Fetch all attendance records for this lecture/tutorial
        const attendanceRecords = await prisma.attendance.findMany({
            where: attendanceWhere,
            orderBy: { session_date: "asc" },
        });

        // Build a lookup: { studentId -> [record, ...] }
        const recordsByStudent = {};
        for (const record of attendanceRecords) {
            if (!recordsByStudent[record.student_user_id]) {
                recordsByStudent[record.student_user_id] = [];
            }
            recordsByStudent[record.student_user_id].push(record);
        }

        // Build the response
        const students = enrollments.map((enrollment) => {
            const user = enrollment.users;
            const records = recordsByStudent[user.id] || [];

            const presentCount = records.filter(
                (r) => r.status === "present"
            ).length;
            const absentCount = records.filter(
                (r) => r.status === "absent"
            ).length;
            const totalSessions = records.length;
            const attendancePercentage =
                totalSessions > 0
                    ? Math.round((presentCount / totalSessions) * 100)
                    : null;

            const studentData = {
                student_user_id: user.id,
                student_id: user.student_profiles?.student_id ?? null,
                full_name: user.full_name,
                email: user.email,
                avatar_url: user.avatar_url ?? null,
                total_sessions: totalSessions,
                present_count: presentCount,
                absent_count: absentCount,
                attendance_percentage: attendancePercentage,
            };

            // If a specific date was requested, include the status for that session
            if (session_date) {
                const dateRecord = records.find(
                    (r) =>
                        new Date(r.session_date).toISOString().split("T")[0] ===
                        session_date
                );
                studentData.session_status = dateRecord
                    ? dateRecord.status
                    : "not_recorded";
            }

            return studentData;
        });

        res.status(200).json({
            total_students: students.length,
            lecture_id: lecture_id ? parseInt(lecture_id) : null,
            tutorial_lab_id: tutorial_lab_id ? parseInt(tutorial_lab_id) : null,
            session_date: session_date ?? null,
            students,
        });
    } catch (err) {
        logger.error("Error fetching students attendance:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get all attendance sessions with their date and all students for each session
 * GET /api/v1/attendance/sessions?lecture_id=&tutorial_lab_id=
 */
export const getAllAttendanceSessions = async (req, res) => {
    try {
        const { lecture_id, tutorial_lab_id } = req.query;
        const instructorId = req.user.userId;

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

        // Verify the instructor owns this lecture/tutorial
        if (lecture_id) {
            const lecture = await prisma.lectures.findUnique({
                where: { lecture_id: parseInt(lecture_id) },
            });
            if (!lecture) {
                return res.status(404).json({ error: "Lecture not found" });
            }
            if (lecture.instructor_id !== instructorId) {
                return res.status(403).json({
                    error: "You are not authorized to view sessions for this lecture",
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
                    error: "You are not authorized to view sessions for this tutorial",
                });
            }
        }

        // Fetch all attendance records for this lecture/tutorial, including student info
        const records = await prisma.attendance.findMany({
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
                            select: { student_id: true },
                        },
                    },
                },
            },
            orderBy: { session_date: "asc" },
        });

        // Group records by session_date
        const sessionsMap = new Map();
        for (const record of records) {
            const dateKey = new Date(record.session_date)
                .toISOString()
                .split("T")[0];

            if (!sessionsMap.has(dateKey)) {
                sessionsMap.set(dateKey, {
                    session_date: dateKey,
                    lecture_id: record.lecture_id,
                    tutorial_lab_id: record.tutorial_lab_id,
                    is_live: record.is_live,
                    longitude: record.longitude,
                    latitude: record.latitude,
                    students: [],
                });
            }

            sessionsMap.get(dateKey).students.push({
                student_user_id: record.users.id,
                student_id: record.users.student_profiles?.student_id ?? null,
                full_name: record.users.full_name,
                email: record.users.email,
                avatar_url: record.users.avatar_url ?? null,
                status: record.status,
            });
        }

        const sessions = Array.from(sessionsMap.values());

        res.status(200).json({
            total_sessions: sessions.length,
            lecture_id: lecture_id ? parseInt(lecture_id) : null,
            tutorial_lab_id: tutorial_lab_id ? parseInt(tutorial_lab_id) : null,
            sessions,
        });
    } catch (err) {
        logger.error("Error fetching all attendance sessions:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get attendance history for the logged-in student
 * GET /api/v1/attendance/my-history
 *
 * Returns all sessions grouped by date. Each date contains one entry per
 * session (lecture or lab/tutorial) the student has an attendance record for.
 */
export const getMyAttendanceHistory = async (req, res) => {
    try {
        const studentId = req.user.userId;

        const records = await prisma.attendance.findMany({
            where: { student_user_id: studentId },
            include: {
                lectures: {
                    select: {
                        lecture_id: true,
                        day_of_week: true,
                        start_time: true,
                        end_time: true,
                        location: true,
                        group: true,
                        course_offerings: {
                            select: {
                                courses: {
                                    select: { name: true, code: true },
                                },
                            },
                        },
                    },
                },
                tutorials_labs: {
                    select: {
                        tutorial_lab_id: true,
                        type: true,
                        day_of_week: true,
                        start_time: true,
                        end_time: true,
                        location: true,
                        group: true,
                        course_offerings: {
                            select: {
                                courses: {
                                    select: { name: true, code: true },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { session_date: "asc" },
        });

        // Group by date
        const datesMap = new Map();
        for (const record of records) {
            const dateKey = new Date(record.session_date)
                .toISOString()
                .split("T")[0];

            if (!datesMap.has(dateKey)) {
                datesMap.set(dateKey, { date: dateKey, sessions: [] });
            }

            const sessionType = record.lecture_id ? "lecture" : "tutorial_lab";
            const source = record.lectures || record.tutorials_labs;
            const course = source?.course_offerings?.courses ?? null;

            datesMap.get(dateKey).sessions.push({
                attendance_id: record.id,
                session_type: sessionType,
                ...(record.lecture_id
                    ? { lecture_id: record.lecture_id }
                    : { tutorial_lab_id: record.tutorial_lab_id }),
                course_name: course?.name ?? null,
                course_code: course?.code ?? null,
                group: source?.group ?? null,
                ...(sessionType === "tutorial_lab" && {
                    tutorial_type: record.tutorials_labs?.type ?? null,
                }),
                location: source?.location ?? null,
                day_of_week: source?.day_of_week ?? null,
                start_time: source?.start_time ?? null,
                end_time: source?.end_time ?? null,
                status: record.status,
                is_live: record.is_live,
                longitude: record.longitude,
                latitude: record.latitude,
            });
        }

        const history = Array.from(datesMap.values());

        const presentCount = records.filter(
            (r) => r.status === "present"
        ).length;
        const absentCount = records.filter((r) => r.status === "absent").length;
        const total = records.length;

        res.status(200).json({
            total_sessions: total,
            present_count: presentCount,
            absent_count: absentCount,
            attendance_percentage:
                total > 0 ? Math.round((presentCount / total) * 100) : null,
            history,
        });
    } catch (err) {
        logger.error("Error fetching student attendance history:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get the attendance grid for a lecture or tutorial
 * Returns all enrolled students (rows) × all session dates (columns)
 * Each cell contains { attendance_id, status } or null if not recorded
 * GET /api/v1/attendance/grid?lecture_id=&tutorial_lab_id=
 */
export const getAttendanceGrid = async (req, res) => {
    try {
        const { lecture_id, tutorial_lab_id } = req.query;
        const instructorId = req.user.userId;

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

        // Verify the instructor owns this lecture/tutorial
        if (lecture_id) {
            const lecture = await prisma.lectures.findUnique({
                where: { lecture_id: parseInt(lecture_id) },
            });
            if (!lecture) {
                return res.status(404).json({ error: "Lecture not found" });
            }
            if (lecture.instructor_id !== instructorId) {
                return res.status(403).json({
                    error: "You are not authorized to view this lecture's attendance",
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
                    error: "You are not authorized to view this tutorial's attendance",
                });
            }
        }

        // Fetch all enrolled students
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
                            select: { student_id: true },
                        },
                    },
                },
            },
        });

        // Fetch all attendance records for this lecture/tutorial
        const records = await prisma.attendance.findMany({
            where: lecture_id
                ? { lecture_id: parseInt(lecture_id) }
                : { tutorial_lab_id: parseInt(tutorial_lab_id) },
            orderBy: { session_date: "asc" },
        });

        // Collect all unique session dates in order
        const datesSet = new Set();
        for (const record of records) {
            datesSet.add(
                new Date(record.session_date).toISOString().split("T")[0]
            );
        }
        const dates = Array.from(datesSet).sort();

        // Build lookup: "studentId:date" -> { attendance_id, status }
        const cellMap = {};
        for (const record of records) {
            const dateKey = new Date(record.session_date)
                .toISOString()
                .split("T")[0];
            cellMap[`${record.student_user_id}:${dateKey}`] = {
                attendance_id: record.id,
                status: record.status,
            };
        }

        // Build student rows
        const students = enrollments.map((enrollment) => {
            const user = enrollment.users;
            const attendance = {};

            for (const date of dates) {
                const key = `${user.id}:${date}`;
                attendance[date] = cellMap[key] ?? null;
            }

            const presentCount = records.filter(
                (r) => r.student_user_id === user.id && r.status === "present"
            ).length;
            const absentCount = records.filter(
                (r) => r.student_user_id === user.id && r.status === "absent"
            ).length;
            const totalSessions = presentCount + absentCount;

            return {
                student_user_id: user.id,
                student_id: user.student_profiles?.student_id ?? null,
                full_name: user.full_name,
                email: user.email,
                avatar_url: user.avatar_url ?? null,
                present_count: presentCount,
                absent_count: absentCount,
                attendance_percentage:
                    totalSessions > 0
                        ? Math.round((presentCount / totalSessions) * 100)
                        : null,
                attendance,
            };
        });

        res.status(200).json({
            lecture_id: lecture_id ? parseInt(lecture_id) : null,
            tutorial_lab_id: tutorial_lab_id ? parseInt(tutorial_lab_id) : null,
            total_students: students.length,
            total_sessions: dates.length,
            dates,
            students,
        });
    } catch (err) {
        logger.error("Error fetching attendance grid:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Shared helper: verify instructor access and return all attendance records
 * for a given lecture or tutorial. Returns null and sends response on failure.
 */
async function resolveAttendanceRecords(req, res) {
    const { lecture_id, tutorial_lab_id } = req.query;
    const instructorId = req.user.userId;

    if (!lecture_id && !tutorial_lab_id) {
        res.status(400).json({
            error: "Either lecture_id or tutorial_lab_id is required",
        });
        return null;
    }
    if (lecture_id && tutorial_lab_id) {
        res.status(400).json({
            error: "Provide either lecture_id or tutorial_lab_id, not both",
        });
        return null;
    }

    if (lecture_id) {
        const lecture = await prisma.lectures.findUnique({
            where: { lecture_id: parseInt(lecture_id) },
        });
        if (!lecture) {
            res.status(404).json({ error: "Lecture not found" });
            return null;
        }
        if (lecture.instructor_id !== instructorId) {
            res.status(403).json({
                error: "You are not authorized to view this lecture's attendance",
            });
            return null;
        }
    }

    if (tutorial_lab_id) {
        const tutorial = await prisma.tutorials_labs.findUnique({
            where: { tutorial_lab_id: parseInt(tutorial_lab_id) },
        });
        if (!tutorial) {
            res.status(404).json({ error: "Tutorial/Lab not found" });
            return null;
        }
        if (tutorial.ta_id !== instructorId) {
            res.status(403).json({
                error: "You are not authorized to view this tutorial's attendance",
            });
            return null;
        }
    }

    const whereClause = lecture_id
        ? { lecture_id: parseInt(lecture_id) }
        : { tutorial_lab_id: parseInt(tutorial_lab_id) };

    const [enrollments, records] = await Promise.all([
        prisma.enrollments.findMany({
            where: whereClause,
            include: {
                users: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        avatar_url: true,
                        student_profiles: { select: { student_id: true } },
                    },
                },
            },
        }),
        prisma.attendance.findMany({
            where: whereClause,
            orderBy: { session_date: "asc" },
        }),
    ]);

    return {
        lecture_id: lecture_id ? parseInt(lecture_id) : null,
        tutorial_lab_id: tutorial_lab_id ? parseInt(tutorial_lab_id) : null,
        enrollments,
        records,
    };
}

/**
 * Get avg attendance rate for a lecture / tutorial
 * GET /api/v1/attendance/stats/avg?lecture_id=&tutorial_lab_id=
 */
export const getAvgAttendanceRate = async (req, res) => {
    try {
        const data = await resolveAttendanceRecords(req, res);
        if (!data) return;

        const { lecture_id, tutorial_lab_id, enrollments, records } = data;

        // Collect unique session dates
        const dates = [
            ...new Set(
                records.map(
                    (r) => new Date(r.session_date).toISOString().split("T")[0]
                )
            ),
        ];
        const totalSessions = dates.length;

        if (totalSessions === 0) {
            return res.status(200).json({
                lecture_id,
                tutorial_lab_id,
                total_students: enrollments.length,
                total_sessions: 0,
                avg_attendance_rate: null,
            });
        }

        // Per-student rate, then average
        const studentRates = enrollments.map((e) => {
            const studentRecords = records.filter(
                (r) => r.student_user_id === e.users.id
            );
            const present = studentRecords.filter(
                (r) => r.status === "present"
            ).length;
            const total = studentRecords.length;
            return total > 0 ? (present / total) * 100 : 0;
        });

        const avg =
            studentRates.length > 0
                ? Math.round(
                      studentRates.reduce((a, b) => a + b, 0) /
                          studentRates.length
                  )
                : null;

        res.status(200).json({
            lecture_id,
            tutorial_lab_id,
            total_students: enrollments.length,
            total_sessions: totalSessions,
            avg_attendance_rate: avg,
        });
    } catch (err) {
        logger.error("Error fetching avg attendance rate:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get lowest N students by attendance rate for a lecture / tutorial
 * GET /api/v1/attendance/stats/lowest?lecture_id=&tutorial_lab_id=&limit=3
 */
export const getLowestAttendance = async (req, res) => {
    try {
        const limit = Math.max(1, parseInt(req.query.limit) || 3);

        const data = await resolveAttendanceRecords(req, res);
        if (!data) return;

        const { lecture_id, tutorial_lab_id, enrollments, records } = data;

        const students = enrollments
            .map((e) => {
                const user = e.users;
                const studentRecords = records.filter(
                    (r) => r.student_user_id === user.id
                );
                const present = studentRecords.filter(
                    (r) => r.status === "present"
                ).length;
                const total = studentRecords.length;
                return {
                    student_user_id: user.id,
                    student_id: user.student_profiles?.student_id ?? null,
                    full_name: user.full_name,
                    email: user.email,
                    avatar_url: user.avatar_url ?? null,
                    present_count: present,
                    absent_count: total - present,
                    total_sessions: total,
                    attendance_percentage:
                        total > 0 ? Math.round((present / total) * 100) : null,
                };
            })
            .filter((s) => s.total_sessions > 0) // exclude students with no records
            .sort(
                (a, b) =>
                    (a.attendance_percentage ?? 0) -
                    (b.attendance_percentage ?? 0)
            )
            .slice(0, limit);

        res.status(200).json({
            lecture_id,
            tutorial_lab_id,
            limit,
            students,
        });
    } catch (err) {
        logger.error("Error fetching lowest attendance:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get attendance trend grouped by relative week (Week 1, Week 2, …)
 * The first week is anchored to the earliest session date.
 * GET /api/v1/attendance/stats/trend?lecture_id=&tutorial_lab_id=
 */
export const getAttendanceTrend = async (req, res) => {
    try {
        const data = await resolveAttendanceRecords(req, res);
        if (!data) return;

        const { lecture_id, tutorial_lab_id, records } = data;

        if (records.length === 0) {
            return res.status(200).json({
                lecture_id,
                tutorial_lab_id,
                total_weeks: 0,
                weeks: [],
            });
        }

        // Anchor: earliest session date (ms)
        const firstDate = new Date(records[0].session_date).getTime();
        const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

        // Group records by week number
        const weeksMap = new Map();
        for (const record of records) {
            const recordDate = new Date(record.session_date).getTime();
            const weekNum =
                Math.floor((recordDate - firstDate) / MS_PER_WEEK) + 1;

            if (!weeksMap.has(weekNum)) {
                weeksMap.set(weekNum, {
                    week: weekNum,
                    present_count: 0,
                    absent_count: 0,
                    total_count: 0,
                    session_dates: new Set(),
                });
            }

            const w = weeksMap.get(weekNum);
            w.total_count++;
            w.session_dates.add(
                new Date(record.session_date).toISOString().split("T")[0]
            );
            if (record.status === "present") w.present_count++;
            else w.absent_count++;
        }

        const weeks = Array.from(weeksMap.values())
            .sort((a, b) => a.week - b.week)
            .map((w) => ({
                week: w.week,
                session_dates: Array.from(w.session_dates).sort(),
                present_count: w.present_count,
                absent_count: w.absent_count,
                total_count: w.total_count,
                attendance_rate:
                    w.total_count > 0
                        ? Math.round((w.present_count / w.total_count) * 100)
                        : null,
            }));

        res.status(200).json({
            lecture_id,
            tutorial_lab_id,
            total_weeks: weeks.length,
            weeks,
        });
    } catch (err) {
        logger.error("Error fetching attendance trend:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Export for WebSocket handler
export { activeSessions, generateQRCode, QR_REFRESH_INTERVAL };
