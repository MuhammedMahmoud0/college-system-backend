import express from "express";
import { getLeaderboard } from "../controllers/leaderboard/leaderboard.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Route to get the leaderboard (requires authentication)
router.get("/", authMiddleware, getLeaderboard);

export default router;
