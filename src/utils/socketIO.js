import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";
import {
    activeSessions,
    generateQRCode,
    QR_REFRESH_INTERVAL,
} from "../controllers/attendanceController.js";

/**
 * Initialize Socket.IO server
 */
export function initializeSocketIO(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: "*", // Configure this based on your frontend URL in production
            methods: ["GET", "POST"],
        },
    });

    // WebSocket authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error("Authentication error: No token provided"));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = {
                userId: decoded.userId,
                role: decoded.role,
            };
            next();
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return next(new Error("Token expired. Reconnect required."));
            }
            return next(new Error("Invalid token"));
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.user.userId;
        logger.info(`WebSocket client connected: ${userId}`);

        /**
         * Auto-join the user's personal notification room on connect.
         * Room name: notifications:<userId>
         * The client receives:
         *   - "new-notification"  when a new notification is created for them
         *   - "unread-count"      whenever the unread count changes
         */
        socket.join(`notifications:${userId}`);
        logger.info(`User ${userId} joined personal notification room`);

        /**
         * Instructor joins an attendance session room
         * This allows them to monitor real-time updates
         */
        socket.on("join-session", async (sessionId) => {
            const session = activeSessions.get(sessionId);

            if (!session) {
                socket.emit("error", { message: "Session not found" });
                return;
            }

            // Join the session room
            socket.join(`session:${sessionId}`);

            logger.info(`User ${userId} joined session ${sessionId}`);

            // Send current session state
            const studentsWithStatus = session.enrolledStudents.map(
                (student) => ({
                    ...student,
                    status: session.attendees.has(student.user_id)
                        ? "present"
                        : "absent",
                })
            );

            socket.emit("session-joined", {
                sessionId,
                qrCode: session.qrCode,
                qrExpiry: session.qrExpiry,
                students: studentsWithStatus,
                presentCount: session.attendees.size,
                totalCount: session.enrolledStudents.length,
            });
        });

        /**
         * Student scans QR code (real-time version)
         */
        socket.on("scan-qr", async ({ qrCode }) => {
            try {
                if (!qrCode) {
                    socket.emit("scan-error", {
                        message: "QR code is required",
                    });
                    return;
                }

                // Parse QR code
                const [sessionId, timestamp] = qrCode.split(":");

                const session = activeSessions.get(sessionId);
                if (!session) {
                    socket.emit("scan-error", {
                        message: "Invalid or expired attendance session",
                    });
                    return;
                }

                // Verify QR code
                if (session.qrCode !== qrCode) {
                    socket.emit("scan-error", {
                        message: "QR code expired, please scan the current one",
                    });
                    return;
                }

                if (Date.now() > session.qrExpiry) {
                    socket.emit("scan-error", {
                        message: "QR code expired, please scan the current one",
                    });
                    return;
                }

                // Check enrollment
                const studentId = userId;
                const studentInfo = session.enrolledStudents.find(
                    (student) => student.user_id === studentId
                );

                if (!studentInfo) {
                    socket.emit("scan-error", {
                        message:
                            "You are not enrolled in this lecture/tutorial",
                    });
                    return;
                }

                // Check if already present
                if (session.attendees.has(studentId)) {
                    socket.emit("scan-success", {
                        message: "You are already marked present",
                        status: "present",
                    });
                    return;
                }

                // Mark as present
                session.attendees.add(studentId);

                logger.info(
                    `Student ${studentId} marked present in session ${sessionId} (WebSocket)`
                );

                // Notify student
                socket.emit("scan-success", {
                    message: "Attendance marked successfully",
                    status: "present",
                    sessionId,
                });

                // Broadcast to all clients in the session room (instructors monitoring)
                io.to(`session:${sessionId}`).emit("student-marked-present", {
                    student: {
                        ...studentInfo,
                        status: "present",
                    },
                    presentCount: session.attendees.size,
                    totalCount: session.enrolledStudents.length,
                });
            } catch (err) {
                logger.error("WebSocket scan-qr error:", err);
                socket.emit("scan-error", { message: "Internal server error" });
            }
        });

        /**
         * Instructor manually toggles student attendance (WebSocket version)
         */
        socket.on(
            "toggle-attendance",
            async ({ sessionId, student_user_id }) => {
                try {
                    const instructorId = userId;

                    if (!sessionId || !student_user_id) {
                        socket.emit("toggle-error", {
                            message:
                                "sessionId and student_user_id are required",
                        });
                        return;
                    }

                    const session = activeSessions.get(sessionId);
                    if (!session) {
                        socket.emit("toggle-error", {
                            message: "Session not found or already ended",
                        });
                        return;
                    }

                    // Verify instructor authorization
                    const { prisma } = await import("../config/connection.js");

                    if (session.lectureId) {
                        const lecture = await prisma.lectures.findUnique({
                            where: { lecture_id: session.lectureId },
                        });
                        if (lecture.instructor_user_id !== instructorId) {
                            socket.emit("toggle-error", {
                                message: "Unauthorized",
                            });
                            return;
                        }
                    }

                    if (session.tutorialLabId) {
                        const tutorial = await prisma.tutorials_labs.findUnique(
                            {
                                where: {
                                    tutorial_lab_id: session.tutorialLabId,
                                },
                            }
                        );
                        if (tutorial.assistant_user_id !== instructorId) {
                            socket.emit("toggle-error", {
                                message: "Unauthorized",
                            });
                            return;
                        }
                    }

                    // Check if student is enrolled
                    const studentInfo = session.enrolledStudents.find(
                        (student) => student.user_id === student_user_id
                    );

                    if (!studentInfo) {
                        socket.emit("toggle-error", {
                            message:
                                "Student not enrolled in this lecture/tutorial",
                        });
                        return;
                    }

                    // Toggle attendance
                    let newStatus;
                    if (session.attendees.has(student_user_id)) {
                        session.attendees.delete(student_user_id);
                        newStatus = "absent";
                        logger.info(
                            `Student ${student_user_id} manually marked absent by instructor in session ${sessionId}`
                        );
                    } else {
                        session.attendees.add(student_user_id);
                        newStatus = "present";
                        logger.info(
                            `Student ${student_user_id} manually marked present by instructor in session ${sessionId}`
                        );
                    }

                    // Notify the instructor who made the change
                    socket.emit("toggle-success", {
                        message: "Attendance toggled successfully",
                        student: {
                            ...studentInfo,
                            status: newStatus,
                        },
                        presentCount: session.attendees.size,
                        totalCount: session.enrolledStudents.length,
                    });

                    // Broadcast to all clients in the session room
                    io.to(`session:${sessionId}`).emit("attendance-toggled", {
                        student: {
                            ...studentInfo,
                            status: newStatus,
                        },
                        presentCount: session.attendees.size,
                        totalCount: session.enrolledStudents.length,
                    });
                } catch (err) {
                    logger.error("WebSocket toggle-attendance error:", err);
                    socket.emit("toggle-error", {
                        message: "Internal server error",
                    });
                }
            }
        );

        /**
         * Leave session room
         */
        socket.on("leave-session", (sessionId) => {
            socket.leave(`session:${sessionId}`);
            logger.info(`User ${userId} left session ${sessionId}`);
        });

        /**
         * Disconnect handler
         */
        socket.on("disconnect", () => {
            logger.info(`WebSocket client disconnected: ${userId}`);
        });
    });

    // QR Code Auto-Refresh Timer
    // Every QR_REFRESH_INTERVAL, generate new QR codes for all active sessions
    setInterval(() => {
        for (const [sessionId, session] of activeSessions.entries()) {
            const newQRCode = generateQRCode(sessionId);
            const newExpiry = Date.now() + QR_REFRESH_INTERVAL;

            session.qrCode = newQRCode;
            session.qrExpiry = newExpiry;

            // Broadcast new QR code to all clients monitoring this session
            io.to(`session:${sessionId}`).emit("qr-code-updated", {
                sessionId,
                qrCode: newQRCode,
                qrExpiry: newExpiry,
            });

            logger.info(`QR code refreshed for session ${sessionId}`);
        }
    }, QR_REFRESH_INTERVAL);

    logger.info("Socket.IO initialized");

    return io;
}
