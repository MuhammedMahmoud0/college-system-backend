import express from "express";
import * as courseOfferingController from "../controllers/courseOfferingController.js";
import {
  authMiddleware,
  authorizationMiddleware,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/v1/course-offerings
 * @desc    Get all course offerings
 * @access  Private - Admin and Super Admin only
 */
router.get(
  "/",
  authMiddleware,
  authorizationMiddleware("admin", "super_admin"),
  courseOfferingController.getAllCourseOfferings,
);

/**
 * @route   POST /api/v1/course-offerings
 * @desc    Create a new course offering
 * @access  Private - Admin and Super Admin only
 */
router.post(
  "/",
  authMiddleware,
  authorizationMiddleware("admin", "super_admin"),
  courseOfferingController.createCourseOffering,
);

/**
 * @route   PUT /api/v1/course-offerings/:offering_id
 * @desc    Update a course offering
 * @access  Private - Admin and Super Admin only
 */
router.put(
  "/:offering_id",
  authMiddleware,
  authorizationMiddleware("admin", "super_admin"),
  courseOfferingController.updateCourseOffering,
);

/**
 * @route   DELETE /api/v1/course-offerings/:offering_id
 * @desc    Delete a course offering
 * @access  Private - Admin and Super Admin only
 */
router.delete(
  "/:offering_id",
  authMiddleware,
  authorizationMiddleware("admin", "super_admin"),
  courseOfferingController.deleteCourseOffering,
);

export default router;
