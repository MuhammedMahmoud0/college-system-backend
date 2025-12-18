import { config } from "dotenv";
import express from "express";
import { connectDB, disconnectDB } from "./config/connection.js";
import authRoutes from "./routes/authRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import studentProfileRoutes from "./routes/studentProfileRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import materialsRoutes from "./routes/materialsRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import logger from "./utils/logger.js";
import { swaggerSpec, swaggerUiHandler } from "./config/swagger.js";

config();
connectDB();

const app = express();
const port = process.env.PORT || 3000;

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

// mount materials routes
app.use("/api/v1/materials", materialsRoutes);

// mount teacher routes
app.use("/api/v1/teachers", teacherRoutes);

// Swagger API documentation route
app.use("/docs", swaggerUiHandler.serve, swaggerUiHandler.setup(swaggerSpec));

// Start the server
let server = app.listen(port, () => {
  logger.info(`Server is running at http://localhost:${port}`);
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
