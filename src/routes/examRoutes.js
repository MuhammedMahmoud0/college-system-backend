import express from "express";
import {
  getAllExams,
  getActiveCourses,
  examSchedule,
  examSet,
  updateExamSet,
  deleteExam,
} from "../controllers/examController.js";
import {
  authMiddleware,
  authorizationMiddleware,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/v1/exams/all
 * @desc    Get all created exams for admins to view, modify, or delete
 * @access  Private - Admin and Super Admin only
 */
router.get(
  "/all",
  authMiddleware,
  authorizationMiddleware("admin", "super_admin"),
  getAllExams,
);

/**
 * @route   GET /api/v1/exams/active-courses
 * @desc    Get all active course offerings for dropdown selection
 * @access  Private - Admin and Super Admin only
 */
router.get(
  "/active-courses",
  authMiddleware,
  authorizationMiddleware("admin", "super_admin"),
  getActiveCourses,
);

/**
 * @route   GET /api/v1/exams/schedule
 * @desc    Get exam schedule for a student based on their registered courses
 * @access  Private - Student only
 */
router.get(
  "/schedule",
  authMiddleware,
  authorizationMiddleware("student"),
  examSchedule,
);

/**
 * @route   POST /api/v1/exams/set
 * @desc    Create a new exam for a course offering
 * @access  Private - Admin and Super Admin only
 */
router.post(
  "/set",
  authMiddleware,
  authorizationMiddleware("admin", "super_admin"),
  examSet,
);

/**
 * @route   PUT /api/v1/exams/set/:exam_id
 * @desc    Update an existing exam
 * @access  Private - Admin and Super Admin only
 */
router.put(
  "/set/:exam_id",
  authMiddleware,
  authorizationMiddleware("admin", "super_admin"),
  updateExamSet,
);

/**
 * @route   DELETE /api/v1/exams/set/:exam_id
 * @desc    Delete an exam
 * @access  Private - Admin and Super Admin only
 */
router.delete(
  "/set/:exam_id",
  authMiddleware,
  authorizationMiddleware("admin", "super_admin"),
  deleteExam,
);

export default router;
