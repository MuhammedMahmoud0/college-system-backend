import express from "express";
import {
    getUsers,
    addUsers,
    addExcelUsers,
} from "../controllers/usersController.js";
import {
    authMiddleware,
    authorizationMiddleware,
} from "../middlewares/authMiddleware.js";
import { uploadExcel } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/users", authMiddleware, getUsers);
router.post("/users", authMiddleware, addUsers);
router.post(
    "/users/upload-excel",
    authMiddleware,
    authorizationMiddleware("super_admin", "admin"),
    uploadExcel.single("file"),
    addExcelUsers
);

export default router;
