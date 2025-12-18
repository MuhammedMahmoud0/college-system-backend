import express from "express";
import {
    getStudentProfile,
    updateStudentProfile,
} from "../controllers/studentProfileController.js";
import {
    authMiddleware,
    authorizationMiddleware,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Route to get student profile
router.get(
    "/profile",
    authMiddleware,
    authorizationMiddleware("student"),
    getStudentProfile
);

// Route to update student profile
router.put(
    "/profile",
    authMiddleware,
    authorizationMiddleware("student"),
    updateStudentProfile
);

export default router;
