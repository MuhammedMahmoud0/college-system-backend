import express from "express";
import * as departmentController from "../controllers/departmentController.js";
import {
    authMiddleware,
    authorizationMiddleware,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Anyone authenticated can list/view departments
router.get("/", authMiddleware, departmentController.getAllDepartments);
router.get("/:id", authMiddleware, departmentController.getDepartmentById);

// Only admins can create / update / delete
router.post(
    "/",
    authMiddleware,
    authorizationMiddleware("admin", "super_admin"),
    departmentController.createDepartment
);
router.patch(
    "/:id",
    authMiddleware,
    authorizationMiddleware("admin", "super_admin"),
    departmentController.updateDepartment
);
router.delete(
    "/:id",
    authMiddleware,
    authorizationMiddleware("admin", "super_admin"),
    departmentController.deleteDepartment
);

export default router;
