import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";
import { sendNotification } from "../utils/notificationService.js";

/**
 * PUT /api/v1/grades/enrollment/:enrollmentId
 * Update mid_score, work_score, final_score, grade for an enrollment.
 * Accessible to: doctor, teaching_assistant, admin, super_admin
 */
export const updateGrade = async (req, res) => {
    try {
        const { enrollmentId } = req.params;
        const { mid_score, work_score, final_score, grade } = req.body;
        const io = req.app.get("io");

        const enrollment = await prisma.enrollments.findUnique({
            where: { id: parseInt(enrollmentId) },
            include: {
                lectures: {
                    include: {
                        course_offerings: {
                            include: { courses: true },
                        },
                    },
                },
            },
        });

        if (!enrollment) {
            return res.status(404).json({ error: "Enrollment not found" });
        }

        // Build update payload with only provided fields
        const updateData = {};
        if (mid_score !== undefined)
            updateData.mid_score = parseFloat(mid_score);
        if (work_score !== undefined)
            updateData.work_score = parseFloat(work_score);
        if (final_score !== undefined)
            updateData.final_score = parseFloat(final_score);
        if (grade !== undefined) updateData.grade = grade;

        if (Object.keys(updateData).length === 0) {
            return res
                .status(400)
                .json({ error: "No updatable fields provided." });
        }

        const updated = await prisma.enrollments.update({
            where: { id: parseInt(enrollmentId) },
            data: updateData,
        });

        const courseName =
            enrollment.lectures?.course_offerings?.courses?.name || "a course";

        // Notify student about grade update
        await sendNotification({
            userId: enrollment.student_user_id,
            message: `Your grade for ${courseName} has been updated.`,
            type: "new_grade",
            io,
        });

        // Check if student is now in the top 3 leaderboard
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

        return res.status(200).json({
            message: "Grade updated successfully.",
            enrollment: updated,
        });
    } catch (err) {
        logger.error("Error updating grade:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * GET /api/v1/grades/enrollment/:enrollmentId
 * Get grade details for a specific enrollment.
 */
export const getGrade = async (req, res) => {
    try {
        const { enrollmentId } = req.params;

        const enrollment = await prisma.enrollments.findUnique({
            where: { id: parseInt(enrollmentId) },
            include: {
                lectures: {
                    include: {
                        course_offerings: {
                            include: { courses: true },
                        },
                    },
                },
                users: {
                    select: { id: true, full_name: true, email: true },
                },
            },
        });

        if (!enrollment) {
            return res.status(404).json({ error: "Enrollment not found" });
        }

        return res.status(200).json({
            enrollmentId: enrollment.id,
            student: enrollment.users,
            course: enrollment.lectures?.course_offerings?.courses?.name,
            mid_score: enrollment.mid_score,
            work_score: enrollment.work_score,
            final_score: enrollment.final_score,
            grade: enrollment.grade,
        });
    } catch (err) {
        logger.error("Error fetching grade:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};
