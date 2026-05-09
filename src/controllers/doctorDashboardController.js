import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";
import { sendBulkNotification } from "../utils/notificationService.js";
import { getCache, setCache } from "../services/cacheService.js";

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /api/v1/doctor/courses
//    All lectures assigned to the authenticated doctor with enrollment stats.
//    instructor_id is extracted exclusively from the JWT token (req.user.id).
// ─────────────────────────────────────────────────────────────────────────────
export const getDoctorCourses = async (req, res) => {
    try {
        const instructorId = req.user.id;
        const cacheKey = `v1:doctor:courses:${instructorId}`;

        const cached = await getCache(cacheKey);
        if (cached) return res.status(200).json(cached);

        const lectures = await prisma.lectures.findMany({
            where: { instructor_id: instructorId },
            select: {
                lecture_id: true,
                group: true,
                day_of_week: true,
                start_time: true,
                end_time: true,
                location: true,
                capacity: true,
                enrolled_count: true,
                course_offerings: {
                    select: {
                        offering_id: true,
                        semester: true,
                        year: true,
                        courses: {
                            select: { code: true, name: true, credits: true },
                        },
                    },
                },
                _count: { select: { enrollments: true } },
            },
            orderBy: { lecture_id: "asc" },
        });

        // Group lectures by offering_id
        const offeringMap = new Map();
        for (const lec of lectures) {
            const o = lec.course_offerings;
            if (!offeringMap.has(o.offering_id)) {
                offeringMap.set(o.offering_id, {
                    offering_id: o.offering_id,
                    course_code: o.courses.code,
                    course_name: o.courses.name,
                    credits: o.courses.credits,
                    semester: o.semester,
                    year: o.year,
                    lectures: [],
                });
            }
            offeringMap.get(o.offering_id).lectures.push({
                lecture_id: lec.lecture_id,
                group: lec.group,
                day_of_week: lec.day_of_week,
                start_time: lec.start_time,
                end_time: lec.end_time,
                location: lec.location,
                capacity: lec.capacity,
                enrollment_count: lec._count.enrollments,
            });
        }

        const courses = Array.from(offeringMap.values()).map((c) => ({
            ...c,
            total_students: c.lectures.reduce(
                (sum, lec) => sum + lec.enrollment_count,
                0
            ),
        }));

        const doctorCoursesResponse = { count: courses.length, courses };
        await setCache(cacheKey, doctorCoursesResponse, 300); // 5 min
        return res.status(200).json(doctorCoursesResponse);
    } catch (err) {
        logger.error("Error fetching doctor courses:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET /api/v1/doctor/courses/:courseCode/analytics
//    Grade breakdown (bar chart data) + low-grade alerts (D & F) for a course
//    taught by the authenticated doctor.
// ─────────────────────────────────────────────────────────────────────────────
export const getCourseAnalytics = async (req, res) => {
    try {
        const instructorId = req.user.id;
        const { courseCode } = req.params;

        // Find all lectures this doctor teaches for this course
        const lectures = await prisma.lectures.findMany({
            where: {
                instructor_id: instructorId,
                course_offerings: { course_code: courseCode },
            },
            select: { lecture_id: true, group: true },
        });

        if (lectures.length === 0) {
            return res.status(404).json({
                error: "No lectures found for this course assigned to you.",
            });
        }

        const lectureIds = lectures.map((l) => l.lecture_id);

        // All enrollments that have a grade assigned
        const enrollments = await prisma.enrollments.findMany({
            where: {
                lecture_id: { in: lectureIds },
                grade: { not: null },
            },
            select: {
                grade: true,
                student_user_id: true,
                lecture_id: true,
                users: { select: { full_name: true, email: true } },
                lectures: { select: { group: true } },
            },
        });

        // Grade breakdown (bar-chart data)
        const gradeOrder = ["A", "B", "C", "D", "F"];
        const gradeCounts = Object.fromEntries(gradeOrder.map((g) => [g, 0]));

        for (const e of enrollments) {
            if (e.grade && gradeCounts[e.grade] !== undefined) {
                gradeCounts[e.grade]++;
            }
        }

        const gradeBreakdown = gradeOrder.map((grade) => ({
            grade,
            count: gradeCounts[grade],
        }));

        // Low-grade alerts: D and F students, ordered F → D
        const gradeAlertOrder = { F: 0, D: 1 };
        const lowGradeStudents = enrollments
            .filter((e) => e.grade === "D" || e.grade === "F")
            .sort((a, b) => gradeAlertOrder[a.grade] - gradeAlertOrder[b.grade])
            .map((e) => ({
                student_id: e.student_user_id,
                student_name: e.users.full_name,
                email: e.users.email,
                grade: e.grade,
                lecture_id: e.lecture_id,
                group: e.lectures.group,
            }));

        return res.status(200).json({
            course_code: courseCode,
            grade_breakdown: gradeBreakdown,
            low_grade_alerts: {
                count: lowGradeStudents.length,
                students: lowGradeStudents,
            },
        });
    } catch (err) {
        logger.error("Error fetching course analytics:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. POST /api/v1/doctor/tasks
//    Create a task for ALL lecture_ids this doctor teaches for a given course.
//    Body: { course_code, title, description?, due_date? }
// ─────────────────────────────────────────────────────────────────────────────
export const createDoctorTask = async (req, res) => {
    try {
        const instructorId = req.user.id;
        const { course_code, title, description, due_date } = req.body;
        const io = req.app.get("io");

        if (!course_code || !title) {
            return res
                .status(400)
                .json({ error: "course_code and title are required." });
        }

        // Find all lectures taught by this doctor for the specified course
        const lectures = await prisma.lectures.findMany({
            where: {
                instructor_id: instructorId,
                course_offerings: { course_code },
            },
            select: {
                lecture_id: true,
                course_offerings: {
                    select: { courses: { select: { name: true } } },
                },
            },
        });

        if (lectures.length === 0) {
            return res.status(404).json({
                error: "No lectures found for this course assigned to you.",
            });
        }

        const courseName =
            lectures[0].course_offerings.courses.name || course_code;

        // Create one task per lecture in a single transaction
        const createdTasks = await prisma.$transaction(
            lectures.map((lec) =>
                prisma.tasks.create({
                    data: {
                        lecture_id: lec.lecture_id,
                        title,
                        description: description || null,
                        due_date: due_date ? new Date(due_date) : null,
                    },
                })
            )
        );

        // Notify all enrolled students across these lectures
        const lectureIds = lectures.map((l) => l.lecture_id);
        const enrollments = await prisma.enrollments.findMany({
            where: { lecture_id: { in: lectureIds } },
            select: { student_user_id: true },
            distinct: ["student_user_id"],
        });

        const studentIds = enrollments.map((e) => e.student_user_id);

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
            message:
                "Tasks created successfully for all your lectures in this course.",
            course_code,
            lectures_count: createdTasks.length,
            tasks: createdTasks,
        });
    } catch (err) {
        logger.error("Error creating doctor tasks:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. GET /api/v1/doctor/alerts
//    Consolidated alerts: active task monitoring, expired tasks, ungraded count.
//    Each alert has a type + label so the frontend can render them in one panel.
// ─────────────────────────────────────────────────────────────────────────────
export const getDoctorAlerts = async (req, res) => {
    try {
        const instructorId = req.user.id;
        const cacheKey = `v1:doctor:alerts:${instructorId}`;

        const cached = await getCache(cacheKey);
        if (cached) return res.status(200).json(cached);

        const now = new Date();
        const alerts = [];

        // Fetch all doctor lectures once and reuse
        const lectures = await prisma.lectures.findMany({
            where: { instructor_id: instructorId },
            select: { lecture_id: true },
        });

        const lectureIds = lectures.map((l) => l.lecture_id);

        // ── Low Midterm/Work Scores (<50% of max) ──────────────────────
        if (lectureIds.length > 0) {
            const gradeRows = await prisma.enrollments.findMany({
                where: {
                    lecture_id: { in: lectureIds },
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

        // ── Active Task Monitoring ───────────────────────────────────────
        if (lectureIds.length > 0) {
            const activeTasks = await prisma.tasks.findMany({
                where: {
                    lecture_id: { in: lectureIds },
                    due_date: { gt: now },
                },
                orderBy: { due_date: "asc" },
                include: {
                    lectures: {
                        include: {
                            course_offerings: { include: { courses: true } },
                        },
                    },
                    _count: { select: { task_submissions: true } },
                },
            });

            for (const activeTask of activeTasks) {
                const enrollmentCount = await prisma.enrollments.count({
                    where: { lecture_id: activeTask.lecture_id },
                });

                const submissionCount = activeTask._count.task_submissions;
                const unsubmittedCount = Math.max(
                    0,
                    enrollmentCount - submissionCount
                );

                const msRemaining =
                    activeTask.due_date.getTime() - now.getTime();
                const hoursRemaining = Math.floor(
                    msRemaining / (1000 * 60 * 60)
                );
                const minutesRemaining = Math.floor(
                    (msRemaining % (1000 * 60 * 60)) / (1000 * 60)
                );

                const courseName =
                    activeTask.lectures?.course_offerings?.courses?.name ||
                    "a course";

                alerts.push({
                    type: "active_task",
                    label: `"${activeTask.title}" for ${courseName} is due in ${hoursRemaining}h ${minutesRemaining}m — ${unsubmittedCount} student(s) have not submitted yet.`,
                    data: {
                        task_id: activeTask.id,
                        title: activeTask.title,
                        due_date: activeTask.due_date,
                        course_code:
                            activeTask.lectures?.course_offerings?.courses
                                ?.code || null,
                        course_name: courseName,
                        time_remaining: `${hoursRemaining}h ${minutesRemaining}m`,
                        enrollment_count: enrollmentCount,
                        submission_count: submissionCount,
                        unsubmitted_count: unsubmittedCount,
                    },
                });
            }
        }

        // ── Expired Tasks ────────────────────────────────────────────────
        if (lectureIds.length > 0) {
            const expiredTasks = await prisma.tasks.findMany({
                where: {
                    lecture_id: { in: lectureIds },
                    due_date: { lte: now },
                },
                orderBy: { due_date: "desc" },
                include: {
                    lectures: {
                        include: {
                            course_offerings: { include: { courses: true } },
                        },
                    },
                    _count: { select: { task_submissions: true } },
                },
            });

            for (const task of expiredTasks) {
                const enrollmentCount = await prisma.enrollments.count({
                    where: { lecture_id: task.lecture_id },
                });
                const submissionCount = task._count.task_submissions;
                const failedToSubmit = Math.max(
                    0,
                    enrollmentCount - submissionCount
                );

                const courseName =
                    task.lectures?.course_offerings?.courses?.name ||
                    "a course";

                alerts.push({
                    type: "expired_task",
                    label: `"${task.title}" for ${courseName} has expired — ${failedToSubmit} student(s) did not submit.`,
                    data: {
                        task_id: task.id,
                        title: task.title,
                        due_date: task.due_date,
                        course_code:
                            task.lectures?.course_offerings?.courses?.code ||
                            null,
                        course_name: courseName,
                        enrollment_count: enrollmentCount,
                        submission_count: submissionCount,
                        failed_to_submit: failedToSubmit,
                    },
                });
            }
        }

        // ── Ungraded Submissions (count only) ───────────────────────────
        if (lectureIds.length > 0) {
            const taskIds = (
                await prisma.tasks.findMany({
                    where: { lecture_id: { in: lectureIds } },
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

        const doctorAlertsResponse = { count: alerts.length, alerts };
        await setCache(cacheKey, doctorAlertsResponse, 90); // 90 sec
        return res.status(200).json(doctorAlertsResponse);
    } catch (err) {
        logger.error("Error fetching doctor alerts:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
