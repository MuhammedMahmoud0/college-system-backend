import { Router } from "express";
import {
    authMiddleware,
    authorizationMiddleware,
} from "../middlewares/authMiddleware.js";
import {
    updateGradeByLecture,
    updateGradeByTutorialLab,
    getGradesByLecture,
    getGradesByTutorialLab,
} from "../controllers/gradeController.js";

const router = Router();

router.use(authMiddleware);

/**
 * PUT /api/v1/grades/lecture/:lectureId/student/:studentId
 * Update a specific student's grades within a lecture.
 * Accessible by the lecture's instructor (doctor), admin, or super_admin.
 */
router.put(
    "/lecture/:lectureId/student/:studentId",
    authorizationMiddleware("doctor", "admin", "super_admin"),
    updateGradeByLecture
);

/**
 * PUT /api/v1/grades/tutorial-lab/:tutorialLabId/student/:studentId
 * Update a specific student's grades within a tutorial/lab.
 * Accessible by the tutorial/lab's TA, admin, or super_admin.
 */
router.put(
    "/tutorial-lab/:tutorialLabId/student/:studentId",
    authorizationMiddleware("teaching_assistant", "admin", "super_admin"),
    updateGradeByTutorialLab
);

/**
 * GET /api/v1/grades/lecture/:lectureId
 * List all students' grades for a specific lecture.
 * Accessible by the lecture's instructor (doctor), admin, or super_admin.
 */
router.get(
    "/lecture/:lectureId",
    authorizationMiddleware("doctor", "admin", "super_admin"),
    getGradesByLecture
);

/**
 * GET /api/v1/grades/tutorial-lab/:tutorialLabId
 * List all students' grades for a specific tutorial/lab.
 * Accessible by the tutorial/lab's TA, admin, or super_admin.
 */
router.get(
    "/tutorial-lab/:tutorialLabId",
    authorizationMiddleware("teaching_assistant", "admin", "super_admin"),
    getGradesByTutorialLab
);

export default router;
