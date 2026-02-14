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
            socket.user = decoded; // Attach user info to socket
            next();
        } catch (err) {
            return next(new Error("Authentication error: Invalid token"));
        }
    });

    io.on("connection", (socket) => {
        logger.info(`WebSocket client connected: ${socket.user.userId}`);

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

            logger.info(
                `User ${socket.user.userId} joined session ${sessionId}`
            );

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
                const studentId = socket.user.userId;

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
         * Leave session room
         */
        socket.on("leave-session", (sessionId) => {
            socket.leave(`session:${sessionId}`);
            logger.info(`User ${socket.user.userId} left session ${sessionId}`);
        });

        /**
         * Disconnect handler
         */
        socket.on("disconnect", () => {
            logger.info(`WebSocket client disconnected: ${socket.user.userId}`);
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
