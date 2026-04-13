import express from "express";
import { updatePassword } from "../controllers/settingsController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// PUT /api/v1/settings/password - Any authenticated user can update their password
router.put("/password", authMiddleware, updatePassword);

export default router;
