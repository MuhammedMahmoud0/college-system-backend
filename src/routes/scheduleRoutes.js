import express from "express";
import { getStudentSchedule } from "../controllers/scheduleController.js";
import {
    authMiddleware,
    authorizationMiddleware,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Route to get student schedule
router.get(
    "/",
    authMiddleware,
    authorizationMiddleware("student", "leader"),
    getStudentSchedule
);

export default router;
