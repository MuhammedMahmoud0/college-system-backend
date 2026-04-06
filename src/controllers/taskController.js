import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";
import { sendBulkNotification } from "../utils/notificationService.js";

// ─────────────────────────────────────────────
// Task CRUD
// ─────────────────────────────────────────────

/**
 * POST /api/v1/tasks
 * Create a new task for a lecture or tutorial/lab.
 * Accessible to: doctor, teaching_assistant, admin, super_admin
 */
export const createTask = async (req, res) => {
    try {
        const { lecture_id, tutorial_lab_id, title, description, due_date } =
            req.body;
        const io = req.app.get("io");

        if (!title) {
            return res.status(400).json({ error: "title is required" });
        }

        if (!lecture_id && !tutorial_lab_id) {
            return res
                .status(400)
                .json({
                    error: "Either lecture_id or tutorial_lab_id is required",
                });
        }

        if (lecture_id && tutorial_lab_id) {
            return res
                .status(400)
                .json({
                    error: "Provide either lecture_id or tutorial_lab_id, not both",
                });
        }

        const task = await prisma.tasks.create({
            data: {
                lecture_id: lecture_id ? parseInt(lecture_id) : null,
                tutorial_lab_id: tutorial_lab_id
                    ? parseInt(tutorial_lab_id)
                    : null,
                title,
                description: description || null,
                due_date: due_date ? new Date(due_date) : null,
            },
            include: {
                lectures: {
                    include: {
                        course_offerings: { include: { courses: true } },
                    },
                },
                tutorials_labs: {
                    include: {
                        course_offerings: { include: { courses: true } },
                    },
                },
            },
        });

        // Notify enrolled students
        const enrollments = await prisma.enrollments.findMany({
            where: lecture_id
                ? { lecture_id: parseInt(lecture_id) }
                : { tutorial_lab_id: parseInt(tutorial_lab_id) },
            select: { student_user_id: true },
            distinct: ["student_user_id"],
        });

        const studentIds = enrollments.map((e) => e.student_user_id);

        const courseName =
            task.lectures?.course_offerings?.courses?.name ||
            task.tutorials_labs?.course_offerings?.courses?.name ||
            "your course";

        if (studentIds.length > 0) {
            await sendBulkNotification({
                userIds: studentIds,
                message: `New task "${title}" has been added for ${courseName}. Due: ${
                    due_date
                        ? new Date(due_date).toLocaleDateString()
                        : "No due date"
                }.`,
                type: "exam_deadline",
                io,
            });
        }

        return res.status(201).json({
            message: "Task created successfully",
            task,
        });
    } catch (err) {
        logger.error("Error creating task:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * GET /api/v1/tasks
 * Get tasks by lecture_id or tutorial_lab_id (query param).
 */
export const getTasks = async (req, res) => {
    try {
        const { lecture_id, tutorial_lab_id } = req.query;

        if (!lecture_id && !tutorial_lab_id) {
            return res
                .status(400)
                .json({
                    error: "Provide either lecture_id or tutorial_lab_id as query param",
                });
        }

        const where = {};
        if (lecture_id) where.lecture_id = parseInt(lecture_id);
        if (tutorial_lab_id) where.tutorial_lab_id = parseInt(tutorial_lab_id);

        const tasks = await prisma.tasks.findMany({
            where,
            include: {
                _count: { select: { task_submissions: true } },
            },
            orderBy: { created_at: "desc" },
        });

        return res.status(200).json({ count: tasks.length, tasks });
    } catch (err) {
        logger.error("Error fetching tasks:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * GET /api/v1/tasks/my/available
 * Get tasks assigned to the authenticated student/leader that are still open for submission.
 */
export const getMyAvailableTasks = async (req, res) => {
    try {
        const studentId = req.user.id;
        const now = new Date();

        const enrollments = await prisma.enrollments.findMany({
            where: { student_user_id: studentId },
            select: { lecture_id: true, tutorial_lab_id: true },
        });

        if (enrollments.length === 0) {
            return res.status(200).json({ count: 0, tasks: [] });
        }

        const lectureIds = [
            ...new Set(enrollments.map((e) => e.lecture_id).filter(Boolean)),
        ];
        const tutorialLabIds = [
            ...new Set(
                enrollments.map((e) => e.tutorial_lab_id).filter(Boolean)
            ),
        ];

        const scopeFilters = [];
        if (lectureIds.length > 0) {
            scopeFilters.push({ lecture_id: { in: lectureIds } });
        }
        if (tutorialLabIds.length > 0) {
            scopeFilters.push({ tutorial_lab_id: { in: tutorialLabIds } });
        }

        if (scopeFilters.length === 0) {
            return res.status(200).json({ count: 0, tasks: [] });
        }

        const tasks = await prisma.tasks.findMany({
            where: {
                OR: scopeFilters,
                AND: [{ OR: [{ due_date: null }, { due_date: { gte: now } }] }],
            },
            include: {
                lectures: {
                    include: {
                        course_offerings: { include: { courses: true } },
                    },
                },
                tutorials_labs: {
                    include: {
                        course_offerings: { include: { courses: true } },
                    },
                },
                task_submissions: {
                    where: { student_id: studentId },
                    select: {
                        id: true,
                        submitted_at: true,
                        grade: true,
                    },
                    orderBy: { submitted_at: "desc" },
                    take: 1,
                },
            },
            orderBy: [{ due_date: "asc" }, { created_at: "desc" }],
        });

        const formattedTasks = tasks.map((task) => {
            const { task_submissions, ...taskWithoutSubmissions } = task;
            return {
                ...taskWithoutSubmissions,
                my_submission: task_submissions[0] || null,
            };
        });

        return res.status(200).json({ count: formattedTasks.length, tasks: formattedTasks });
    } catch (err) {
        logger.error("Error fetching available tasks for student:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * GET /api/v1/tasks/:taskId
 * Get a specific task by ID.
 */
export const getTaskById = async (req, res) => {
    try {
        const { taskId } = req.params;

        const task = await prisma.tasks.findUnique({
            where: { id: parseInt(taskId) },
            include: {
                lectures: {
                    include: {
                        course_offerings: { include: { courses: true } },
                    },
                },
                tutorials_labs: {
                    include: {
                        course_offerings: { include: { courses: true } },
                    },
                },
                _count: { select: { task_submissions: true } },
            },
        });

        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }

        return res.status(200).json({ task });
    } catch (err) {
        logger.error("Error fetching task:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * PUT /api/v1/tasks/:taskId
 * Update a task.
 * Accessible to: doctor, teaching_assistant, admin, super_admin
 */
export const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, description, due_date } = req.body;

        const existing = await prisma.tasks.findUnique({
            where: { id: parseInt(taskId) },
        });

        if (!existing) {
            return res.status(404).json({ error: "Task not found" });
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (due_date !== undefined) updateData.due_date = new Date(due_date);

        if (Object.keys(updateData).length === 0) {
            return res
                .status(400)
                .json({ error: "No updatable fields provided." });
        }

        const updated = await prisma.tasks.update({
            where: { id: parseInt(taskId) },
            data: updateData,
        });

        return res
            .status(200)
            .json({ message: "Task updated successfully", task: updated });
    } catch (err) {
        logger.error("Error updating task:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * DELETE /api/v1/tasks/:taskId
 * Delete a task.
 * Accessible to: doctor, teaching_assistant, admin, super_admin
 */
export const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        const existing = await prisma.tasks.findUnique({
            where: { id: parseInt(taskId) },
        });

        if (!existing) {
            return res.status(404).json({ error: "Task not found" });
        }

        await prisma.tasks.delete({ where: { id: parseInt(taskId) } });

        return res.status(200).json({ message: "Task deleted successfully" });
    } catch (err) {
        logger.error("Error deleting task:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ─────────────────────────────────────────────
// Task Submissions
// ─────────────────────────────────────────────

/**
 * POST /api/v1/tasks/:taskId/submit
 * Submit a task (student).
 */
export const submitTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { submission_content } = req.body;
        const studentId = req.user.id;

        const task = await prisma.tasks.findUnique({
            where: { id: parseInt(taskId) },
        });

        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }

        // Submission is allowed only once
        const existing = await prisma.task_submissions.findFirst({
            where: { task_id: parseInt(taskId), student_id: studentId },
        });

        if (existing) {
            return res.status(409).json({
                error: "You have already submitted this task.",
            });
        }

        const submission = await prisma.task_submissions.create({
            data: {
                task_id: parseInt(taskId),
                student_id: studentId,
                submission_content: submission_content || null,
                submitted_at: new Date(),
            },
        });

        return res.status(201).json({
            message: "Task submitted successfully",
            submission,
        });
    } catch (err) {
        logger.error("Error submitting task:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * GET /api/v1/tasks/:taskId/submissions
 * Get all submissions for a task.
 * Accessible to: doctor, teaching_assistant, admin, super_admin
 */
export const getSubmissions = async (req, res) => {
    try {
        const { taskId } = req.params;

        const task = await prisma.tasks.findUnique({
            where: { id: parseInt(taskId) },
        });

        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }

        const submissions = await prisma.task_submissions.findMany({
            where: { task_id: parseInt(taskId) },
            include: {
                users: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        avatar_url: true,
                    },
                },
            },
            orderBy: { submitted_at: "asc" },
        });

        const formattedSubmissions = submissions.map((submission) => ({
            id: submission.id,
            task_id: submission.task_id,
            student_id: submission.student_id,
            submission_content: submission.submission_content,
            submitted_at: submission.submitted_at,
            grade: submission.grade,
            full_name: submission.users?.full_name || null,
            email: submission.users?.email || null,
            avatar_url: submission.users?.avatar_url || null,
        }));

        return res
            .status(200)
            .json({ count: formattedSubmissions.length, submissions: formattedSubmissions });
    } catch (err) {
        logger.error("Error fetching submissions:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * PUT /api/v1/tasks/:taskId/submissions/:submissionId/grade
 * Grade a task submission.
 * Accessible to: doctor, teaching_assistant, admin, super_admin
 */
export const gradeSubmission = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { grade } = req.body;
        const io = req.app.get("io");

        if (grade === undefined || grade === null) {
            return res.status(400).json({ error: "grade is required" });
        }

        const submission = await prisma.task_submissions.findUnique({
            where: { id: parseInt(submissionId) },
            include: {
                tasks: true,
            },
        });

        if (!submission) {
            return res.status(404).json({ error: "Submission not found" });
        }

        const updated = await prisma.task_submissions.update({
            where: { id: parseInt(submissionId) },
            data: { grade: parseFloat(grade) },
        });

        // Notify student that their submission was graded
        await sendBulkNotification({
            userIds: [submission.student_id],
            message: `Your submission for "${submission.tasks.title}" has been graded: ${grade}.`,
            type: "new_grade",
            io,
        });

        return res.status(200).json({
            message: "Submission graded successfully",
            submission: updated,
        });
    } catch (err) {
        logger.error("Error grading submission:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * GET /api/v1/tasks/:taskId/my-submission
 * Get my submission for a task (student).
 */
export const getMySubmission = async (req, res) => {
    try {
        const { taskId } = req.params;
        const studentId = req.user.id;

        const submission = await prisma.task_submissions.findFirst({
            where: {
                task_id: parseInt(taskId),
                student_id: studentId,
            },
        });

        if (!submission) {
            return res
                .status(404)
                .json({ error: "No submission found for this task" });
        }

        return res.status(200).json({ submission });
    } catch (err) {
        logger.error("Error fetching submission:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * DELETE /api/v1/tasks/:taskId/my-submission
 * Delete my submission for a task (student/leader), only before due date.
 */
export const deleteMySubmission = async (req, res) => {
    try {
        const { taskId } = req.params;
        const studentId = req.user.id;

        const task = await prisma.tasks.findUnique({
            where: { id: parseInt(taskId) },
            select: { id: true, due_date: true },
        });

        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }

        const now = new Date();
        if (task.due_date && now >= task.due_date) {
            return res.status(403).json({
                error: "Submission can only be deleted before the due date.",
            });
        }

        const submission = await prisma.task_submissions.findFirst({
            where: {
                task_id: parseInt(taskId),
                student_id: studentId,
            },
            select: { id: true },
        });

        if (!submission) {
            return res
                .status(404)
                .json({ error: "No submission found for this task" });
        }

        await prisma.task_submissions.delete({
            where: { id: submission.id },
        });

        return res.status(200).json({
            message: "Submission deleted successfully",
        });
    } catch (err) {
        logger.error("Error deleting submission:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};
