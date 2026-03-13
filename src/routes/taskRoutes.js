import { Router } from "express";
import {
    authMiddleware,
    authorizationMiddleware,
} from "../middlewares/authMiddleware.js";
import {
    createTask,
    getTasks,
    getMyAvailableTasks,
    getTaskById,
    updateTask,
    deleteTask,
    submitTask,
    getSubmissions,
    gradeSubmission,
    getMySubmission,
    deleteMySubmission,
} from "../controllers/taskController.js";

const router = Router();

router.use(authMiddleware);

const staffRoles = ["doctor", "teaching_assistant", "admin", "super_admin"];

// ── Task CRUD ──────────────────────────────────────────────────────────────

/** POST /api/v1/tasks — Create a task */
router.post("/", authorizationMiddleware(...staffRoles), createTask);

/** GET /api/v1/tasks?lecture_id=1  OR  ?tutorial_lab_id=2 — List tasks */
router.get("/", getTasks);

/** GET /api/v1/tasks/my/available — Student/Leader tasks open for submission */
router.get(
    "/my/available",
    authorizationMiddleware("student", "leader"),
    getMyAvailableTasks
);

/** GET /api/v1/tasks/:taskId — Get a specific task */
router.get("/:taskId", getTaskById);

/** PUT /api/v1/tasks/:taskId — Update a task */
router.put("/:taskId", authorizationMiddleware(...staffRoles), updateTask);

/** DELETE /api/v1/tasks/:taskId — Delete a task */
router.delete("/:taskId", authorizationMiddleware(...staffRoles), deleteTask);

// ── Submissions ────────────────────────────────────────────────────────────

/** POST /api/v1/tasks/:taskId/submit — Student submits a task */
router.post(
    "/:taskId/submit",
    authorizationMiddleware("student", "leader"),
    submitTask
);

/** GET /api/v1/tasks/:taskId/my-submission — Student views their submission */
router.get(
    "/:taskId/my-submission",
    authorizationMiddleware("student", "leader"),
    getMySubmission
);

/** DELETE /api/v1/tasks/:taskId/my-submission — Student deletes their submission before due date */
router.delete(
    "/:taskId/my-submission",
    authorizationMiddleware("student", "leader"),
    deleteMySubmission
);

/** GET /api/v1/tasks/:taskId/submissions — Staff views all submissions */
router.get(
    "/:taskId/submissions",
    authorizationMiddleware(...staffRoles),
    getSubmissions
);

/** PUT /api/v1/tasks/:taskId/submissions/:submissionId/grade — Grade a submission */
router.put(
    "/:taskId/submissions/:submissionId/grade",
    authorizationMiddleware(...staffRoles),
    gradeSubmission
);

export default router;
