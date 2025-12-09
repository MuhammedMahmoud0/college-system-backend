import express from "express";
import { getUsers, addUsers } from "../controllers/usersController.js";
import {
    authMiddleware,
    authorizationMiddleware,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/users", authMiddleware, getUsers);
router.post("/users", authMiddleware, addUsers);

export default router;
