import express from "express";
import {
    login,
    refresh,
    logout,
    me,
    adminResetPassword,
    changePassword,
} from "../controllers/authController.js";
import {
    authMiddleware,
    authorizationMiddleware,
} from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";
import {
    loginSchema,
    adminResetPasswordSchema,
    changePasswordSchema,
} from "../utils/authSchemas.js";
import { loginLimiter } from "../middlewares/rateLimitMiddleware.js";

const router = express.Router();

// Public
router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/refresh", refresh);

// Authenticated
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, me);
router.post(
    "/change-password",
    authMiddleware,
    validate(changePasswordSchema),
    changePassword
);

// Admin only
router.post(
    "/admin/reset-password",
    authMiddleware,
    authorizationMiddleware("admin", "super_admin"),
    validate(adminResetPasswordSchema),
    adminResetPassword
);

export default router;
