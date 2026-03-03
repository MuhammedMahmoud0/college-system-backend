/**
 * Exam Reminder Background Job
 * Runs daily at midnight to notify students about exams tomorrow.
 * Called from server.js after connectDB().
 */

import { prisma } from "../config/connection.js";
import { sendNotification } from "./notificationService.js";
import logger from "./logger.js";

/**
 * Send exam-tomorrow reminders to all enrolled students.
 * @param {import("socket.io").Server} io - Socket.IO server instance
 */
export async function sendExamReminders(io) {
    try {
        const now = new Date();
        const tomorrowStart = new Date(now);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        tomorrowStart.setHours(0, 0, 0, 0);

        const tomorrowEnd = new Date(tomorrowStart);
        tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

        const tomorrowExams = await prisma.exams.findMany({
            where: {
                exam_date: {
                    gte: tomorrowStart,
                    lt: tomorrowEnd,
                },
            },
            include: {
                course_offerings: {
                    include: { courses: true },
                },
            },
        });

        if (tomorrowExams.length === 0) {
            logger.info("[ExamReminder] No exams scheduled for tomorrow.");
            return;
        }

        let notificationsSent = 0;

        for (const exam of tomorrowExams) {
            const courseName = exam.course_offerings.courses.name;
            const examDate = new Date(exam.exam_date).toLocaleDateString();

            // Get distinct enrolled students for this offering
            const enrollments = await prisma.enrollments.findMany({
                where: {
                    lectures: {
                        offering_id: exam.offering_id,
                    },
                    status: "enrolled",
                },
                select: { student_user_id: true },
                distinct: ["student_user_id"],
            });

            for (const enrollment of enrollments) {
                await sendNotification({
                    userId: enrollment.student_user_id,
                    message: `Reminder: You have a ${exam.exam_type} exam for ${courseName} tomorrow (${examDate}).`,
                    type: "exam_deadline",
                    io,
                });
                notificationsSent++;
            }
        }

        logger.info(
            `[ExamReminder] Sent ${notificationsSent} reminder(s) for ${tomorrowExams.length} exam(s).`
        );
    } catch (err) {
        logger.error("[ExamReminder] Error sending exam reminders:", err);
    }
}

/**
 * Start the daily exam reminder job.
 * Fires immediately, then every 24 hours.
 * @param {import("socket.io").Server} io
 */
export function startExamReminderJob(io) {
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    // Run once at startup (at midnight the daily job would have fired)
    // Schedule next run at the next midnight
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setDate(nextMidnight.getDate() + 1);
    nextMidnight.setHours(0, 0, 0, 0);

    const msUntilMidnight = nextMidnight.getTime() - now.getTime();

    logger.info(
        `[ExamReminder] Job scheduled. First run in ${Math.round(
            msUntilMidnight / 60000
        )} minutes, then every 24h.`
    );

    // setTimeout to align with midnight, then setInterval every 24h
    setTimeout(() => {
        sendExamReminders(io);
        setInterval(() => sendExamReminders(io), TWENTY_FOUR_HOURS);
    }, msUntilMidnight);
}
