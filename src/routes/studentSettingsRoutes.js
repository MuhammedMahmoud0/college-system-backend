import express from "express";
import { updatePassword } from "../controllers/studentSettingsController.js";
import {
    authMiddleware,
    authorizationMiddleware,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// PUT /api/student-settings/password - Only students can update their password
router.put(
    "/password",
    authMiddleware,
    authorizationMiddleware("student"),
    updatePassword
);

export default router;
