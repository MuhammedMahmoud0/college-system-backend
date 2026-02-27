import express from "express";
import * as courseController from "../controllers/courseController.js";
import {
    authMiddleware,
    authorizationMiddleware,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get(
    "/student",
    authMiddleware,
    authorizationMiddleware("student", "leader"),
    courseController.getStudentCourses
);
router.get(
    "/student/labs",
    authMiddleware,
    authorizationMiddleware("student", "leader"),
    courseController.getStudentLabs
);
router.get(
    "/all",
    authMiddleware,
    authorizationMiddleware("admin", "super_admin"),
    courseController.getAllCourses
);
router.get(
    "/:offeringId",
    authMiddleware,
    authorizationMiddleware(
        "doctor",
        "teaching_assistant",
        "admin",
        "super_admin"
    ),
    courseController.getCourseDetails
);
router.get(
    "/:courseId/grades",
    authMiddleware,
    authorizationMiddleware("student", "leader"),
    courseController.getGradeBreakdown
);

router.post(
    "/",
    authMiddleware,
    authorizationMiddleware("admin", "super_admin"),
    courseController.createCourse
);
router.post(
    "/lectures",
    authMiddleware,
    authorizationMiddleware("admin", "super_admin"),
    courseController.createLecture
);
router.patch(
    "/lectures/:lectureId",
    authMiddleware,
    authorizationMiddleware("admin", "super_admin"),
    courseController.updateLecture
);
router.delete(
    "/lectures/:lectureId",
    authMiddleware,
    authorizationMiddleware("admin", "super_admin"),
    courseController.deleteLecture
);
router.post(
    "/tutorials-labs",
    authMiddleware,
    authorizationMiddleware("admin", "super_admin"),
    courseController.createTutorialLab
);
router.patch(
    "/tutorials-labs/:tutorialLabId",
    authMiddleware,
    authorizationMiddleware("admin", "super_admin"),
    courseController.updateTutorialLab
);
router.delete(
    "/tutorials-labs/:tutorialLabId",
    authMiddleware,
    authorizationMiddleware("admin", "super_admin"),
    courseController.deleteTutorialLab
);
router.patch(
    "/:code",
    authMiddleware,
    authorizationMiddleware("admin", "super_admin"),
    courseController.updateCourse
);
router.delete(
    "/:code",
    authMiddleware,
    authorizationMiddleware("admin", "super_admin"),
    courseController.deleteCourse
);

export default router;
