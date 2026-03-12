import { config } from "dotenv";
import express from "express";
import { createServer } from "http";
import { connectDB, disconnectDB } from "./config/connection.js";
import authRoutes from "./routes/authRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import studentProfileRoutes from "./routes/studentProfileRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import materialsRoutes from "./routes/materialsRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import courseOfferingRoutes from "./routes/courseOfferingRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import studentSettingsRoutes from "./routes/studentSettingsRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import systemConfigRoutes from "./routes/systemConfigRoutes.js";
import gradeRoutes from "./routes/gradeRoutes.js";
import adminDashboardRoutes from "./routes/adminDashboardRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import doctorDashboardRoutes from "./routes/doctorDashboardRoutes.js";
import logger from "./utils/logger.js";
import { swaggerSpec, swaggerUiHandler } from "./config/swagger.js";
import { initializeSocketIO } from "./utils/socketIO.js";
import { startExamReminderJob } from "./utils/examReminderJob.js";

config();
connectDB();

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3000;

// Initialize Socket.IO
const io = initializeSocketIO(httpServer);

// Make io accessible in routes (optional)
app.set("io", io);

// Start exam reminder background job
startExamReminderJob(io);

// Middleware to parse JSON bodies
app.use(express.json());

// Convert BigInt values to strings to prevent JSON serialization errors
BigInt.prototype.toJSON = function () {
    return this.toString();
};

// Sample route
app.get("/", (req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// mount auth routes
app.use("/api/v1/auth", authRoutes);

// mount user routes
app.use("/api/v1", usersRoutes);

// mount student profile routes
app.use("/api/v1/student", studentProfileRoutes);

// mount leaderboard routes
app.use("/api/v1/leaderboard", leaderboardRoutes);

// mount schedule routes
app.use("/api/v1/schedule", scheduleRoutes);

// mount community routes
app.use("/api/v1/community", communityRoutes);

// mount course routes
app.use("/api/v1/courses", courseRoutes);

// mount course offering routes
app.use("/api/v1/course-offerings", courseOfferingRoutes);

// mount materials routes
app.use("/api/v1/materials", materialsRoutes);

// mount teacher routes
app.use("/api/v1/teachers", teacherRoutes);

// mount notification routes
app.use("/api/v1/notifications", notificationRoutes);

// mount exam routes
app.use("/api/v1/exams", examRoutes);

// mount registration routes
app.use("/api/v1/registration", registrationRoutes);

// mount student settings routes
app.use("/api/v1/student-settings", studentSettingsRoutes);

// mount attendance routes (WebSocket-enabled)
app.use("/api/v1/attendance", attendanceRoutes);

// mount system configuration routes
app.use("/api/v1/config", systemConfigRoutes);

// mount grade routes
app.use("/api/v1/grades", gradeRoutes);

// mount task routes
app.use("/api/v1/tasks", taskRoutes);

// mount admin dashboard routes
app.use("/api/v1/admin", adminDashboardRoutes);

// mount doctor dashboard routes
app.use("/api/v1/doctor", doctorDashboardRoutes);

// mount department routes
app.use("/api/v1/departments", departmentRoutes);

// Swagger API documentation route
app.use("/docs", swaggerUiHandler.serve, swaggerUiHandler.setup(swaggerSpec));

// Start the server
let server = httpServer.listen(port, () => {
    logger.info(`Server is running at http://localhost:${port}`);
    logger.info(`API documentation available at http://localhost:${port}/docs`);
    logger.info(`WebSocket server is ready on ws://localhost:${port}`);
});

// Handle unhandled promise rejections (e.g., database connection errors)
process.on("unhandledRejection", (err) => {
    logger.error("Unhandled Rejection:", err);
    server.close(async () => {
        await disconnectDB();
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on("uncaughtException", async (err) => {
    logger.error("Uncaught Exception:", err);
    await disconnectDB();
    process.exit(1);
});

// Graceful shutdown on SIGTERM
process.on("SIGTERM", async () => {
    logger.info("SIGTERM received. Shutting down gracefully...");
    server.close(async () => {
        await disconnectDB();
        process.exit(0);
    });
});
