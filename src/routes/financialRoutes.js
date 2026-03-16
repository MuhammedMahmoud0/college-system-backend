import express from "express";
import * as financialController from "../controllers/financialController.js";
import {
    authMiddleware,
    authorizationMiddleware,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, financialController.getAllFinancials);
router.get("/:id", authMiddleware, financialController.getFinancialById);

router.post(
    "/",
    authMiddleware,
    authorizationMiddleware("admin", "super_admin"),
    financialController.createFinancial
);

router.patch(
    "/:id",
    authMiddleware,
    authorizationMiddleware("admin", "super_admin"),
    financialController.updateFinancial
);

router.delete(
    "/:id",
    authMiddleware,
    authorizationMiddleware("admin", "super_admin"),
    financialController.deleteFinancial
);

export default router;
