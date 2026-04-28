import express from "express";
import {
  getUsers,
  addUsers,
  updateUser,
  deleteUser,
  addStudent,
  addExcelUsers,
  addExcelStudents,
  getExcelImportJobStatus,
  getStudentsForManagement,
  getStaffForManagement,
  getLeaders,
  getAdminsForManagement,
  setStudentRole,
  getStudentProfileByStudentId,
  getStudentGradesHistoryByStudentId,
  getDoctorProfileByUserId,
  getDoctorCoursesByUserId,
  getTeachingAssistantProfileByUserId,
  getTeachingAssistantCoursesByUserId,
  createAdminForManagement,
  getOwnProfile,
  updateOwnProfile,
} from "../controllers/usersController.js";
import {
  authMiddleware,
  authorizationMiddleware,
} from "../middlewares/authMiddleware.js";
import { upload, uploadExcel } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get(
  "/users/management/students",
  authMiddleware,
  authorizationMiddleware("super_admin", "admin"),
  getStudentsForManagement,
);
router.get(
  "/users/management/staff",
  authMiddleware,
  authorizationMiddleware("super_admin", "admin"),
  getStaffForManagement,
);
router.get(
  "/users/management/leaders",
  authMiddleware,
  authorizationMiddleware("super_admin", "admin"),
  getLeaders,
);
router.get(
  "/users/management/admins",
  authMiddleware,
  authorizationMiddleware("super_admin"),
  getAdminsForManagement,
);
router.patch(
  "/users/students/:id/role",
  authMiddleware,
  authorizationMiddleware("super_admin", "admin"),
  setStudentRole,
);
router.get(
  "/users/management/students/:studentId/profile",
  authMiddleware,
  authorizationMiddleware("super_admin", "admin"),
  getStudentProfileByStudentId,
);
router.get(
  "/users/management/students/:studentId/grades-history",
  authMiddleware,
  authorizationMiddleware("super_admin", "admin"),
  getStudentGradesHistoryByStudentId,
);
router.get(
  "/users/management/doctors/:userId/profile",
  authMiddleware,
  authorizationMiddleware("super_admin", "admin"),
  getDoctorProfileByUserId,
);
router.get(
  "/users/management/doctors/:userId/courses",
  authMiddleware,
  authorizationMiddleware("super_admin", "admin"),
  getDoctorCoursesByUserId,
);
router.get(
  "/users/management/teaching-assistants/:userId/profile",
  authMiddleware,
  authorizationMiddleware("super_admin", "admin"),
  getTeachingAssistantProfileByUserId,
);
router.get(
  "/users/management/teaching-assistants/:userId/courses",
  authMiddleware,
  authorizationMiddleware("super_admin", "admin"),
  getTeachingAssistantCoursesByUserId,
);
router.post(
  "/users/management/admins",
  authMiddleware,
  authorizationMiddleware("super_admin"),
  createAdminForManagement,
);
router.get(
  "/users",
  authMiddleware,
  authorizationMiddleware("super_admin"),
  getUsers,
);

router.get(
  "/users/profile",
  authMiddleware,
  authorizationMiddleware(
    "doctor",
    "teaching_assistant",
    "admin",
    "super_admin",
  ),
  getOwnProfile,
);

router.patch(
  "/users/profile",
  authMiddleware,
  authorizationMiddleware(
    "doctor",
    "teaching_assistant",
    "admin",
    "super_admin",
  ),
  upload.single("avatar"),
  updateOwnProfile,
);

// Non-student users (doctor, teaching_assistant, admin, super_admin, leader)
router.post(
  "/users",
  authMiddleware,
  authorizationMiddleware("super_admin", "admin"),
  addUsers,
);

router.patch(
  "/users/:id",
  authMiddleware,
  authorizationMiddleware("super_admin", "admin"),
  upload.single("avatar"),
  updateUser,
);

router.delete(
  "/users/:id",
  authMiddleware,
  authorizationMiddleware("super_admin", "admin"),
  deleteUser,
);

// Students
router.post(
  "/users/students",
  authMiddleware,
  authorizationMiddleware("super_admin", "admin"),
  addStudent,
);

// Bulk upload – non-student users
router.post(
  "/users/upload-excel",
  authMiddleware,
  authorizationMiddleware("super_admin", "admin"),
  uploadExcel.single("file"),
  addExcelUsers,
);

// Bulk upload – students
router.post(
  "/users/upload-excel/students",
  authMiddleware,
  authorizationMiddleware("super_admin", "admin"),
  uploadExcel.single("file"),
  addExcelStudents,
);

router.get(
  "/users/upload-excel/jobs/:jobId",
  authMiddleware,
  authorizationMiddleware("super_admin", "admin"),
  getExcelImportJobStatus,
);

export default router;
