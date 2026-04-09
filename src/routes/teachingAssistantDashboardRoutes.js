import { Router } from "express";
import {
  authMiddleware,
  authorizationMiddleware,
} from "../middlewares/authMiddleware.js";
import { getTeachingAssistantAlerts } from "../controllers/teachingAssistantDashboardController.js";

const router = Router();

router.use(authMiddleware);
router.use(authorizationMiddleware("teaching_assistant", "super_admin"));

/** GET /api/v1/teaching-assistant/alerts — Active tasks, expired tasks, ungraded submissions */
router.get("/alerts", getTeachingAssistantAlerts);

export default router;
