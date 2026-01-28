import express from "express";
import { upload } from "../middlewares/uploadMiddleware.js";
import {
    authMiddleware,
    authorizationMiddleware,
} from "../middlewares/authMiddleware.js";
import {
    createMaterial,
    getMaterials,
    updateMaterial,
    deleteMaterial,
    downloadMaterial,
    streamMaterial,
} from "../controllers/materialsController.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Get materials - accessible by all authenticated users (students, doctors, admins)
router.get("/", getMaterials);

// Download endpoints - accessible by all authenticated users
router.get("/:id/download", downloadMaterial); // Returns signed URL
router.get("/:id/stream", streamMaterial); // Streams file directly

// Create, update, delete - only doctors and admins
router.post(
    "/",
    authorizationMiddleware("doctor", "admin", "super_admin"),
    upload.single("file"),
    createMaterial
);
router.put(
    "/:id",
    authorizationMiddleware("doctor", "admin", "super_admin"),
    updateMaterial
);
router.delete(
    "/:id",
    authorizationMiddleware("doctor", "admin", "super_admin"),
    deleteMaterial
);

export default router;
