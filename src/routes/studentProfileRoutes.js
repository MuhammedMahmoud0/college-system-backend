import express from "express";
import {
    getStudentProfile,
    getDigitalStudentIdBack,
    getDigitalStudentIdFront,
    updateStudentProfile,
} from "../controllers/studentProfileController.js";
import {
    authMiddleware,
    authorizationMiddleware,
} from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Route to get student profile
router.get(
    "/profile",
    authMiddleware,
    authorizationMiddleware("student", "leader"),
    getStudentProfile,
);

// Route to update student profile (with optional avatar upload)
router.put(
    "/profile",
    authMiddleware,
    authorizationMiddleware("student", "leader"),
    upload.single("avatar"), // Accept avatar file
    updateStudentProfile,
);

router.get(
    "/digital-id/front",
    authMiddleware,
    authorizationMiddleware("student", "leader"),
    getDigitalStudentIdFront,
);

router.get(
    "/digital-id/back",
    authMiddleware,
    authorizationMiddleware("student", "leader"),
    getDigitalStudentIdBack,
);

export default router;
