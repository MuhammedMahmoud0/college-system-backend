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
  setGradeDistribution,
  getGradeDistribution,
  getTutorialLabGradeDistribution,
  getMySemesterGpa,
  getMyCgpaTrend,
  getMyGradeDistribution,
} from "../controllers/gradeController.js";

const router = Router();

router.use(authMiddleware);

/**
 * PUT /api/v1/grades/lecture/:lectureId/distribution
 * Set (upsert) grade distribution for a lecture.
 * Accessible by the lecture's instructor (doctor), admin, or super_admin.
 */
router.put(
  "/lecture/:lectureId/distribution",
  authorizationMiddleware("doctor", "admin", "super_admin"),
  setGradeDistribution,
);

/**
 * GET /api/v1/grades/lecture/:lectureId/distribution
 * Get the grade distribution for a lecture.
 * Accessible by the lecture's instructor (doctor), admin, or super_admin.
 */
router.get(
  "/lecture/:lectureId/distribution",
  authorizationMiddleware("doctor", "admin", "super_admin"),
  getGradeDistribution,
);

/**
 * GET /api/v1/grades/tutorial-lab/:tutorialLabId/distribution
 * Get linked lecture distribution(s) for a tutorial/lab.
 * Accessible by the tutorial/lab's TA, admin, or super_admin.
 */
router.get(
  "/tutorial-lab/:tutorialLabId/distribution",
  authorizationMiddleware("teaching_assistant", "admin", "super_admin"),
  getTutorialLabGradeDistribution,
);

/**
 * PUT /api/v1/grades/lecture/:lectureId/student/:studentId
 * Update a specific student's grades within a lecture.
 * Accessible by the lecture's instructor (doctor), admin, or super_admin.
 */
router.put(
  "/lecture/:lectureId/student/:studentId",
  authorizationMiddleware("doctor", "admin", "super_admin"),
  updateGradeByLecture,
);

/**
 * PUT /api/v1/grades/tutorial-lab/:tutorialLabId/student/:studentId
 * Update a specific student's grades within a tutorial/lab.
 * Accessible by doctor, the tutorial/lab's TA, admin, or super_admin.
 */
router.put(
  "/tutorial-lab/:tutorialLabId/student/:studentId",
  authorizationMiddleware(
    "doctor",
    "teaching_assistant",
    "admin",
    "super_admin",
  ),
  updateGradeByTutorialLab,
);

/**
 * GET /api/v1/grades/lecture/:lectureId
 * List all students' grades for a specific lecture.
 * Accessible by the lecture's instructor (doctor), admin, or super_admin.
 */
router.get(
  "/lecture/:lectureId",
  authorizationMiddleware("doctor", "admin", "super_admin"),
  getGradesByLecture,
);

/**
 * GET /api/v1/grades/tutorial-lab/:tutorialLabId
 * List all students' grades for a specific tutorial/lab.
 * Accessible by the tutorial/lab's TA, admin, or super_admin.
 */
router.get(
  "/tutorial-lab/:tutorialLabId",
  authorizationMiddleware("teaching_assistant", "admin", "super_admin"),
  getGradesByTutorialLab,
);

/**
 * GET /api/v1/grades/my/semester-gpa?year=&semester=
 * Returns the GPA for the logged-in student for a specific year-semester.
 * Admin / super_admin can pass ?studentId= to query any student.
 */
router.get(
  "/my/semester-gpa",
  authorizationMiddleware("student", "leader"),
  getMySemesterGpa,
);

/**
 * GET /api/v1/grades/my/cgpa-trend
 * Returns the CGPA trend across all semesters for the logged-in student.
 */
router.get(
  "/my/cgpa-trend",
  authorizationMiddleware("student", "leader"),
  getMyCgpaTrend,
);

/**
 * GET /api/v1/grades/my/distribution
 * Returns grade distribution for the authenticated student.
 */
router.get(
  "/my/distribution",
  authorizationMiddleware("student", "leader"),
  getMyGradeDistribution,
);

export default router;
