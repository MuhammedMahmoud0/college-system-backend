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
  setStudentRole,
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
router.patch(
  "/users/students/:id/role",
  authMiddleware,
  authorizationMiddleware("super_admin", "admin"),
  setStudentRole,
);
router.get("/users", authMiddleware, getUsers);

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
