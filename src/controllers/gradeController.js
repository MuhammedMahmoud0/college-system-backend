import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";
import { sendNotification } from "../utils/notificationService.js";

// Map letter grades to grade points (standard 4.0 scale)
const GRADE_POINTS = {
    "A+": 4.0,
    A: 4.0,
    "A-": 3.7,
    "B+": 3.3,
    B: 3.0,
    "B-": 2.7,
    "C+": 2.3,
    C: 2.0,
    "C-": 1.7,
    "D+": 1.3,
    D: 1.0,
    "D-": 0.7,
    F: 0.0,
};

/**
 * Compute a letter grade from a total score out of 100.
 * Also returns the equivalent grade points (GPA for this course).
 */
function computeGrade(total) {
    if (total >= 97) return { letter: "A+", points: 4.0 };
    if (total >= 93) return { letter: "A", points: 4.0 };
    if (total >= 90) return { letter: "A-", points: 3.7 };
    if (total >= 87) return { letter: "B+", points: 3.3 };
    if (total >= 83) return { letter: "B", points: 3.0 };
    if (total >= 80) return { letter: "B-", points: 2.7 };
    if (total >= 77) return { letter: "C+", points: 2.3 };
    if (total >= 73) return { letter: "C", points: 2.0 };
    if (total >= 70) return { letter: "C-", points: 1.7 };
    if (total >= 67) return { letter: "D+", points: 1.3 };
    if (total >= 63) return { letter: "D", points: 1.0 };
    if (total >= 60) return { letter: "D-", points: 0.7 };
    return { letter: "F", points: 0.0 };
}

/**
 * Recalculate and persist a student's CGPA based on all graded enrollments.
 * @returns {number|null} new CGPA
 */
async function recalculateCgpa(studentUserId) {
    const allEnrollments = await prisma.enrollments.findMany({
        where: { student_user_id: studentUserId, status: "enrolled" },
        include: {
            lectures: {
                include: {
                    course_offerings: { include: { courses: true } },
                },
            },
        },
    });

    let totalPoints = 0;
    let totalCredits = 0;

    for (const e of allEnrollments) {
        const gp = GRADE_POINTS[e.grade];
        const credits = e.lectures?.course_offerings?.courses?.credits;
        if (gp !== undefined && credits) {
            totalPoints += gp * credits;
            totalCredits += credits;
        }
    }

    const newCgpa =
        totalCredits > 0
            ? parseFloat((totalPoints / totalCredits).toFixed(2))
            : null;

    await prisma.student_profiles.updateMany({
        where: { user_id: studentUserId },
        data: {
            cgpa: newCgpa,
            ...(totalCredits > 0 && { total_credits: totalCredits }),
        },
    });

    return newCgpa;
}

/**
 * Shared helper: apply score/grade updates, notify student, recalculate CGPA.
 * Returns { updated, total_score, grade_points } for the response.
 */
async function applyGradeUpdate(enrollment, updateData, io) {
    // Strip internal tracking keys before persisting
    const { _total, _grade_points, ...dbData } = updateData;

    const updated = await prisma.enrollments.update({
        where: { id: enrollment.id },
        data: dbData,
    });

    const courseName =
        enrollment.lectures?.course_offerings?.courses?.name || "a course";

    // Always notify when scores change
    await sendNotification({
        userId: enrollment.student_user_id,
        message: `Your grades for ${courseName} have been updated. Total: ${
            _total ?? "—"
        }/100 — Grade: ${dbData.grade ?? "pending"}${
            dbData.status === "completed"
                ? " — your enrollment is now completed."
                : "."
        }`,
        type: "new_grade",
        io,
    });

    // Recalculate CGPA whenever a letter grade is now set
    if (updateData.grade) {
        const newCgpa = await recalculateCgpa(enrollment.student_user_id);

        if (newCgpa !== null) {
            const top3 = await prisma.student_profiles.findMany({
                orderBy: { cgpa: "desc" },
                take: 3,
                select: { user_id: true },
            });

            const isInTop3 = top3.some(
                (p) => p.user_id === enrollment.student_user_id
            );
            if (isInTop3) {
                await sendNotification({
                    userId: enrollment.student_user_id,
                    message:
                        "Congratulations! You've entered the top 3 students on the leaderboard!",
                    type: "general",
                    io,
                });
            }
        }
    }

    // Strip the internal _total key before returning
    return {
        updated,
        total_score: _total ?? null,
        grade_points: _grade_points ?? null,
    };
}

/**
 * Build the score update payload from request body.
 * Grade is ALWAYS auto-computed from the total — never accepted from the caller.
 *
 * Merges provided scores with the student's current enrollment values so a
 * partial update (e.g. only mid_score) still produces a correct total once
 * all three scores are present.
 *
 * Attaches `_total` and `_grade_points` as internal keys (prefixed with _)
 * so they travel through to the response without being persisted.
 */
function buildUpdateData(body, currentEnrollment) {
    const { mid_score, work_score, final_score } = body;
    const updateData = {};

    if (mid_score !== undefined) updateData.mid_score = parseFloat(mid_score);
    if (work_score !== undefined)
        updateData.work_score = parseFloat(work_score);
    if (final_score !== undefined)
        updateData.final_score = parseFloat(final_score);

    // Reject negative scores
    for (const [key, val] of Object.entries(updateData)) {
        if (val < 0) {
            return { validationError: `${key} cannot be negative.` };
        }
    }

    // Effective values after merging with stored scores
    const effectiveMid = updateData.mid_score ?? currentEnrollment.mid_score;
    const effectiveWork = updateData.work_score ?? currentEnrollment.work_score;
    const effectiveFinal =
        updateData.final_score ?? currentEnrollment.final_score;

    // Validate total whenever at least two scores are known (catches partial over-budget)
    const knownScores = [effectiveMid, effectiveWork, effectiveFinal].filter(
        (v) => v !== null && v !== undefined
    );
    if (knownScores.length >= 2) {
        const partialTotal = knownScores.reduce((a, b) => a + b, 0);
        if (parseFloat(partialTotal.toFixed(2)) > 100) {
            return {
                validationError: `Total score exceeds 100. Current sum of provided scores: ${partialTotal.toFixed(
                    2
                )}.`,
            };
        }
    }

    // Compute grade only when all three scores are available
    if (
        effectiveMid !== null &&
        effectiveMid !== undefined &&
        effectiveWork !== null &&
        effectiveWork !== undefined &&
        effectiveFinal !== null &&
        effectiveFinal !== undefined
    ) {
        const total = parseFloat(
            (effectiveMid + effectiveWork + effectiveFinal).toFixed(2)
        );
        const { letter, points } = computeGrade(total);
        updateData.grade = letter;
        updateData.status = "completed"; // all scores entered — mark enrollment as completed
        updateData._total = total;
        updateData._grade_points = points;
    }

    return { updateData };
}

/**
 * PUT /api/v1/grades/lecture/:lectureId/student/:studentId
 * Update a specific student's grades within a lecture.
 * Accessible to: the lecture's instructor (doctor), admin, super_admin
 */
export const updateGradeByLecture = async (req, res) => {
    try {
        const { lectureId, studentId } = req.params;
        const io = req.app.get("io");
        const callerId = req.user.id;
        const callerRole = req.user.role;

        const lecture = await prisma.lectures.findUnique({
            where: { lecture_id: parseInt(lectureId) },
        });

        if (!lecture) {
            return res.status(404).json({ error: "Lecture not found." });
        }

        if (callerRole === "doctor" && lecture.instructor_id !== callerId) {
            return res.status(403).json({
                error: "You are not the instructor for this lecture.",
            });
        }

        const enrollment = await prisma.enrollments.findFirst({
            where: {
                lecture_id: parseInt(lectureId),
                student_user_id: studentId,
            },
            include: {
                lectures: {
                    include: {
                        course_offerings: { include: { courses: true } },
                    },
                },
            },
        });

        if (!enrollment) {
            return res.status(404).json({
                error: "No enrollment found for this student in the given lecture.",
            });
        }

        const { updateData, validationError } = buildUpdateData(
            req.body,
            enrollment
        );

        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        if (
            Object.keys(updateData).filter((k) => !k.startsWith("_")).length ===
            0
        ) {
            return res
                .status(400)
                .json({ error: "No updatable fields provided." });
        }

        const { updated, total_score, grade_points } = await applyGradeUpdate(
            enrollment,
            updateData,
            io
        );

        return res.status(200).json({
            message: "Grade updated successfully.",
            enrollment: updated,
            ...(total_score !== null && { total_score, grade_points }),
        });
    } catch (err) {
        logger.error("Error updating lecture grade:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * PUT /api/v1/grades/tutorial-lab/:tutorialLabId/student/:studentId
 * Update a specific student's grades within a tutorial/lab.
 * Accessible to: the tutorial/lab's TA, admin, super_admin
 */
export const updateGradeByTutorialLab = async (req, res) => {
    try {
        const { tutorialLabId, studentId } = req.params;
        const io = req.app.get("io");
        const callerId = req.user.id;
        const callerRole = req.user.role;

        const tutorialLab = await prisma.tutorials_labs.findUnique({
            where: { tutorial_lab_id: parseInt(tutorialLabId) },
        });

        if (!tutorialLab) {
            return res.status(404).json({ error: "Tutorial/Lab not found." });
        }

        if (
            callerRole === "teaching_assistant" &&
            tutorialLab.ta_id !== callerId
        ) {
            return res.status(403).json({
                error: "You are not the TA for this tutorial/lab.",
            });
        }

        const enrollment = await prisma.enrollments.findFirst({
            where: {
                tutorial_lab_id: parseInt(tutorialLabId),
                student_user_id: studentId,
            },
            include: {
                lectures: {
                    include: {
                        course_offerings: { include: { courses: true } },
                    },
                },
            },
        });

        if (!enrollment) {
            return res.status(404).json({
                error: "No enrollment found for this student in the given tutorial/lab.",
            });
        }

        const { updateData, validationError } = buildUpdateData(
            req.body,
            enrollment
        );

        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        if (
            Object.keys(updateData).filter((k) => !k.startsWith("_")).length ===
            0
        ) {
            return res
                .status(400)
                .json({ error: "No updatable fields provided." });
        }

        const { updated, total_score, grade_points } = await applyGradeUpdate(
            enrollment,
            updateData,
            io
        );

        return res.status(200).json({
            message: "Grade updated successfully.",
            enrollment: updated,
            ...(total_score !== null && { total_score, grade_points }),
        });
    } catch (err) {
        logger.error("Error updating tutorial/lab grade:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * GET /api/v1/grades/lecture/:lectureId
 * List all students' grades for a specific lecture.
 * Doctor who owns the lecture, or Admin/Super Admin.
 */
export const getGradesByLecture = async (req, res) => {
    try {
        const { lectureId } = req.params;
        const callerId = req.user.id;
        const callerRole = req.user.role;

        const lecture = await prisma.lectures.findUnique({
            where: { lecture_id: parseInt(lectureId) },
            include: { course_offerings: { include: { courses: true } } },
        });

        if (!lecture) {
            return res.status(404).json({ error: "Lecture not found" });
        }

        if (callerRole === "doctor" && lecture.instructor_id !== callerId) {
            return res.status(403).json({
                error: "You are not the instructor for this lecture.",
            });
        }

        const enrollments = await prisma.enrollments.findMany({
            where: { lecture_id: parseInt(lectureId) },
            include: {
                users: {
                    select: { id: true, full_name: true, email: true },
                },
                tutorials_labs: {
                    select: { tutorial_lab_id: true, group: true, type: true },
                },
            },
            orderBy: { users: { full_name: "asc" } },
        });

        return res.status(200).json({
            lecture_id: lecture.lecture_id,
            course: lecture.course_offerings.courses.name,
            course_code: lecture.course_offerings.course_code,
            group: lecture.group,
            total: enrollments.length,
            students: enrollments.map((e) => ({
                enrollment_id: e.id,
                student_id: e.users.id,
                full_name: e.users.full_name,
                email: e.users.email,
                lab_group: e.tutorials_labs?.group ?? null,
                mid_score: e.mid_score,
                work_score: e.work_score,
                final_score: e.final_score,
                grade: e.grade,
            })),
        });
    } catch (err) {
        logger.error("Error fetching lecture grades:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * GET /api/v1/grades/tutorial-lab/:tutorialLabId
 * List all students' grades for a specific tutorial/lab.
 * TA who owns the tutorial/lab, or Admin/Super Admin.
 */
export const getGradesByTutorialLab = async (req, res) => {
    try {
        const { tutorialLabId } = req.params;
        const callerId = req.user.id;
        const callerRole = req.user.role;

        const tutorialLab = await prisma.tutorials_labs.findUnique({
            where: { tutorial_lab_id: parseInt(tutorialLabId) },
            include: { course_offerings: { include: { courses: true } } },
        });

        if (!tutorialLab) {
            return res.status(404).json({ error: "Tutorial/Lab not found" });
        }

        if (
            callerRole === "teaching_assistant" &&
            tutorialLab.ta_id !== callerId
        ) {
            return res.status(403).json({
                error: "You are not the TA for this tutorial/lab.",
            });
        }

        const enrollments = await prisma.enrollments.findMany({
            where: { tutorial_lab_id: parseInt(tutorialLabId) },
            include: {
                users: {
                    select: { id: true, full_name: true, email: true },
                },
                lectures: {
                    include: {
                        course_offerings: { include: { courses: true } },
                    },
                },
            },
            orderBy: { users: { full_name: "asc" } },
        });

        return res.status(200).json({
            tutorial_lab_id: tutorialLab.tutorial_lab_id,
            course: tutorialLab.course_offerings.courses.name,
            course_code: tutorialLab.course_offerings.course_code,
            type: tutorialLab.type,
            group: tutorialLab.group,
            total: enrollments.length,
            students: enrollments.map((e) => ({
                enrollment_id: e.id,
                student_id: e.users.id,
                full_name: e.users.full_name,
                email: e.users.email,
                lecture_group: e.lectures?.group ?? null,
                mid_score: e.mid_score,
                work_score: e.work_score,
                final_score: e.final_score,
                grade: e.grade,
            })),
        });
    } catch (err) {
        logger.error("Error fetching tutorial/lab grades:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};
