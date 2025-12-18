import express from "express";
import {
    getMaterialsByCourseCode,
    getMaterialsByLecture,
    getMaterialsByTutorial,
    getMaterialById,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    getUserFiles,
    getFileById,
} from "../controllers/materialsController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * Public/Authenticated Routes for fetching materials
 */

// Get all materials for a specific course code
router.get("/course/:courseCode", authMiddleware, getMaterialsByCourseCode);

// Get all materials for a specific lecture
router.get("/lecture/:lectureId", authMiddleware, getMaterialsByLecture);

// Get all materials for a specific tutorial/lab
router.get("/tutorial/:tutorialLabId", authMiddleware, getMaterialsByTutorial);

// Get a specific material by ID
router.get("/:materialId", authMiddleware, getMaterialById);

/**
 * File Routes
 */

// Get all files uploaded by the authenticated user
router.get("/files/my-uploads", authMiddleware, getUserFiles);

// Get file details by file ID
router.get("/files/:fileId", authMiddleware, getFileById);

/**
 * CRUD Routes for course materials
 */

// Create a new material
router.post("/", authMiddleware, createMaterial);

// Update a material
router.put("/:materialId", authMiddleware, updateMaterial);

// Delete a material
router.delete("/:materialId", authMiddleware, deleteMaterial);

export default router;
