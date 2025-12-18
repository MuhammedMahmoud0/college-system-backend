import express from "express";
import { getAllTeachers } from "../controllers/teacherController.js";
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

export default router;
