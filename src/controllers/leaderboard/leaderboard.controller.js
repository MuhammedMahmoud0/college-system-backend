import logger from "../../utils/logger.js";
import { buildLeaderboard } from "./leaderboard.service.js";
import { clamp } from "./leaderboard.utils.js";

export const getLeaderboard = async (req, res) => {
    try {
        const type = (req.query.type || "gpa").toLowerCase();
        const department = req.query.department || null;
        const level = req.query.level ? Number(req.query.level) : null;
        const limit = clamp(Number(req.query.limit) || 50, 1, 100);
        const currentUserId = req.user.id;

        if (!["gpa", "attendance", "activities"].includes(type)) {
            return res.status(400).json({
                error: "Invalid leaderboard type",
            });
        }

        const result = await buildLeaderboard({
            type,
            department,
            level,
            limit,
            currentUserId,
        });

        res.status(200).json(result);
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};
