import express from "express";
import {
    getAllTeachers,
    getTeacherSchedule,
} from "../controllers/teacherController.js";
import {
    authMiddleware,
    authorizationMiddleware,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Route to get all teachers - only accessible by super_admin and admin
router.get(
    "/",
    authMiddleware,
    authorizationMiddleware("super_admin", "admin"),
    getAllTeachers
);

// Route to get teacher schedule - only accessible by doctor and teaching_assistant
router.get(
    "/schedule",
    authMiddleware,
    authorizationMiddleware("doctor", "teaching_assistant"),
    getTeacherSchedule
);

export default router;
