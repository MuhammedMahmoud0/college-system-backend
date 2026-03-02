import { Router } from "express";
import {
    authMiddleware,
    authorizationMiddleware,
} from "../middlewares/authMiddleware.js";
import { updateGrade, getGrade } from "../controllers/gradeController.js";

const router = Router();

router.use(authMiddleware);

/**
 * PUT /api/v1/grades/enrollment/:enrollmentId
 * Update grades (mid, work, final, letter grade) for a student enrollment.
 */
router.put(
    "/enrollment/:enrollmentId",
    authorizationMiddleware(
        "doctor",
        "teaching_assistant",
        "admin",
        "super_admin"
    ),
    updateGrade
);

/**
 * GET /api/v1/grades/enrollment/:enrollmentId
 * Get grade details for a specific enrollment.
 */
router.get(
    "/enrollment/:enrollmentId",
    authorizationMiddleware(
        "doctor",
        "teaching_assistant",
        "admin",
        "super_admin"
    ),
    getGrade
);

export default router;
