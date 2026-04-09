import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";

// GET /api/v1/teaching-assistant/alerts
// Consolidated alerts for the authenticated teaching assistant.
export const getTeachingAssistantAlerts = async (req, res) => {
  try {
    const teachingAssistantId = req.user.id;
    const now = new Date();
    const alerts = [];

    const tutorialLabs = await prisma.tutorials_labs.findMany({
      where: { ta_id: teachingAssistantId },
      select: { tutorial_lab_id: true },
    });

    const tutorialLabIds = tutorialLabs.map((t) => t.tutorial_lab_id);

    if (tutorialLabIds.length > 0) {
      const gradeRows = await prisma.enrollments.findMany({
        where: {
          tutorial_lab_id: { in: tutorialLabIds },
          OR: [{ mid_score: { not: null } }, { work_score: { not: null } }],
        },
        select: {
          student_user_id: true,
          mid_score: true,
          work_score: true,
          lectures: {
            select: {
              grade_distribution: {
                select: { mid_max: true, work_max: true },
              },
            },
          },
        },
      });

      const lowMidtermStudents = new Set();
      const lowWorkStudents = new Set();

      for (const row of gradeRows) {
        const distribution = row.lectures?.grade_distribution;
        if (!distribution) continue;

        if (
          row.mid_score !== null &&
          distribution.mid_max > 0 &&
          row.mid_score < distribution.mid_max * 0.5
        ) {
          lowMidtermStudents.add(row.student_user_id);
        }

        if (
          row.work_score !== null &&
          distribution.work_max > 0 &&
          row.work_score < distribution.work_max * 0.5
        ) {
          lowWorkStudents.add(row.student_user_id);
        }
      }

      if (lowMidtermStudents.size > 0) {
        alerts.push({
          type: "low_midterm_scores",
          label: `${lowMidtermStudents.size} student(s) have a midterm score below 50% of max.`,
          data: { low_midterm_students_count: lowMidtermStudents.size },
        });
      }

      if (lowWorkStudents.size > 0) {
        alerts.push({
          type: "low_work_scores",
          label: `${lowWorkStudents.size} student(s) have a work score below 50% of max.`,
          data: { low_work_students_count: lowWorkStudents.size },
        });
      }
    }

    if (tutorialLabIds.length > 0) {
      const activeTasks = await prisma.tasks.findMany({
        where: {
          tutorial_lab_id: { in: tutorialLabIds },
          due_date: { gt: now },
        },
        orderBy: { due_date: "asc" },
        include: {
          tutorials_labs: {
            include: {
              course_offerings: { include: { courses: true } },
            },
          },
          _count: { select: { task_submissions: true } },
        },
      });

      for (const activeTask of activeTasks) {
        const enrollmentCount = await prisma.enrollments.count({
          where: { tutorial_lab_id: activeTask.tutorial_lab_id },
        });

        const submissionCount = activeTask._count.task_submissions;
        const unsubmittedCount = Math.max(0, enrollmentCount - submissionCount);

        const msRemaining = activeTask.due_date.getTime() - now.getTime();
        const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
        const minutesRemaining = Math.floor(
          (msRemaining % (1000 * 60 * 60)) / (1000 * 60),
        );

        const courseName =
          activeTask.tutorials_labs?.course_offerings?.courses?.name ||
          "a course";

        alerts.push({
          type: "active_task",
          label: `"${activeTask.title}" for ${courseName} is due in ${hoursRemaining}h ${minutesRemaining}m - ${unsubmittedCount} student(s) have not submitted yet.`,
          data: {
            task_id: activeTask.id,
            title: activeTask.title,
            due_date: activeTask.due_date,
            course_code:
              activeTask.tutorials_labs?.course_offerings?.courses?.code ||
              null,
            course_name: courseName,
            tutorial_lab_id: activeTask.tutorial_lab_id,
            time_remaining: `${hoursRemaining}h ${minutesRemaining}m`,
            enrollment_count: enrollmentCount,
            submission_count: submissionCount,
            unsubmitted_count: unsubmittedCount,
          },
        });
      }
    }

    if (tutorialLabIds.length > 0) {
      const expiredTasks = await prisma.tasks.findMany({
        where: {
          tutorial_lab_id: { in: tutorialLabIds },
          due_date: { lte: now },
        },
        orderBy: { due_date: "desc" },
        include: {
          tutorials_labs: {
            include: {
              course_offerings: { include: { courses: true } },
            },
          },
          _count: { select: { task_submissions: true } },
        },
      });

      for (const task of expiredTasks) {
        const enrollmentCount = await prisma.enrollments.count({
          where: { tutorial_lab_id: task.tutorial_lab_id },
        });
        const submissionCount = task._count.task_submissions;
        const failedToSubmit = Math.max(0, enrollmentCount - submissionCount);

        const courseName =
          task.tutorials_labs?.course_offerings?.courses?.name || "a course";

        alerts.push({
          type: "expired_task",
          label: `"${task.title}" for ${courseName} has expired - ${failedToSubmit} student(s) did not submit.`,
          data: {
            task_id: task.id,
            title: task.title,
            due_date: task.due_date,
            course_code:
              task.tutorials_labs?.course_offerings?.courses?.code || null,
            course_name: courseName,
            tutorial_lab_id: task.tutorial_lab_id,
            enrollment_count: enrollmentCount,
            submission_count: submissionCount,
            failed_to_submit: failedToSubmit,
          },
        });
      }
    }

    if (tutorialLabIds.length > 0) {
      const taskIds = (
        await prisma.tasks.findMany({
          where: { tutorial_lab_id: { in: tutorialLabIds } },
          select: { id: true },
        })
      ).map((t) => t.id);

      if (taskIds.length > 0) {
        const ungradedCount = await prisma.task_submissions.count({
          where: { task_id: { in: taskIds }, grade: null },
        });

        if (ungradedCount > 0) {
          alerts.push({
            type: "ungraded_submissions",
            label: `You have ${ungradedCount} submission(s) waiting to be graded.`,
            data: { ungraded_count: ungradedCount },
          });
        }
      }
    }

    return res.status(200).json({ count: alerts.length, alerts });
  } catch (err) {
    logger.error("Error fetching teaching assistant alerts:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
