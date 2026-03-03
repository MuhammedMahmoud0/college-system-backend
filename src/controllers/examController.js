import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";
import { sendBulkNotification } from "../utils/notificationService.js";

/**
 * Helper function to format time from Date object to HH:mm:ss
 * Extracts time without timezone conversion
 */
const formatTime = (dateTime) => {
    if (!dateTime) return null;
    const date = new Date(dateTime);

    // Extract time components directly without timezone conversion
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const seconds = String(date.getUTCSeconds()).padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
};

/**
 * GET /api/v1/exams/all
 * Get all created exams for admins to view, modify, or delete
 * Only accessible to admins and super admins
 */
export const getAllExams = async (req, res) => {
    try {
        const exams = await prisma.exams.findMany({
            include: {
                course_offerings: {
                    include: {
                        courses: {
                            select: {
                                code: true,
                                name: true,
                                credits: true,
                            },
                        },
                    },
                },
            },
            orderBy: [{ exam_date: "asc" }, { start_time: "asc" }],
        });

        const formattedExams = exams.map((exam) => ({
            exam_id: exam.exam_id,
            course_code: exam.course_offerings.course_code,
            course_name: exam.course_offerings.courses.name,
            exam_type: exam.exam_type,
            exam_date: exam.exam_date,
            day_of_week: exam.day_of_week,
            start_time: formatTime(exam.start_time),
            end_time: formatTime(exam.end_time),
            location: exam.location,
            semester: exam.course_offerings.semester,
            year: exam.course_offerings.year,
            credits: exam.course_offerings.courses.credits,
        }));

        res.status(200).json({
            success: true,
            count: formattedExams.length,
            data: formattedExams,
        });
    } catch (err) {
        logger.error("Error fetching all exams:", err);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};

/**
 * GET /api/v1/exams/active-courses
 * Get all active course offerings for dropdown selection
 * Only accessible to admins and super admins
 */
export const getActiveCourses = async (req, res) => {
    try {
        const courseOfferings = await prisma.course_offerings.findMany({
            include: {
                courses: {
                    select: {
                        code: true,
                        name: true,
                        credits: true,
                        department_id: true,
                    },
                },
                _count: {
                    select: {
                        lectures: true,
                        exams: true,
                    },
                },
            },
            orderBy: [{ semester: "desc" }, { course_code: "asc" }],
        });

        const formattedCourses = courseOfferings.map((offering) => ({
            offering_id: offering.offering_id,
            course_code: offering.course_code,
            course_name: offering.courses.name,
            credits: offering.courses.credits,
            semester: offering.semester,
            year: offering.year,
            lectures_count: offering._count.lectures,
            exams_count: offering._count.exams,
        }));

        res.status(200).json({
            success: true,
            count: formattedCourses.length,
            data: formattedCourses,
        });
    } catch (err) {
        logger.error("Error fetching active courses:", err);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};

/**
 * GET /api/v1/exams/schedule
 * Get exam schedule for a student based on their registered courses
 * Only accessible to students
 */
export const examSchedule = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get all enrollments for the student
        const enrollments = await prisma.enrollments.findMany({
            where: {
                student_user_id: userId,
                status: "enrolled", // Only show exams for enrolled courses
            },
            include: {
                lectures: {
                    include: {
                        course_offerings: {
                            include: {
                                courses: true,
                                exams: {
                                    orderBy: {
                                        exam_date: "asc",
                                    },
                                },
                            },
                        },
                        users: {
                            select: {
                                full_name: true,
                            },
                        },
                    },
                },
            },
        });

        // Extract and format exam information
        const exams = [];
        const courseCodesAdded = new Set();

        for (const enrollment of enrollments) {
            const offering = enrollment.lectures.course_offerings;
            const course = offering.courses;

            // Avoid duplicate exams for the same course
            if (!courseCodesAdded.has(offering.course_code)) {
                courseCodesAdded.add(offering.course_code);

                for (const exam of offering.exams) {
                    exams.push({
                        exam_id: exam.exam_id,
                        course_code: offering.course_code,
                        course_name: course.name,
                        exam_type: exam.exam_type,
                        exam_date: exam.exam_date,
                        day_of_week: exam.day_of_week,
                        start_time: formatTime(exam.start_time),
                        end_time: formatTime(exam.end_time),
                        location: exam.location,
                        semester: offering.semester,
                        year: offering.year,
                        instructor: enrollment.lectures.users.full_name,
                    });
                }
            }
        }

        // Sort exams by date
        exams.sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date));

        res.status(200).json({
            success: true,
            count: exams.length,
            data: exams,
        });
    } catch (err) {
        logger.error("Error fetching exam schedule:", err);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};

/**
 * POST /api/v1/exams/set
 * Create a new exam for a course offering
 * Only accessible to admins and super admins
 */
export const examSet = async (req, res) => {
    try {
        const {
            offering_id,
            exam_type,
            exam_date,
            day_of_week,
            start_time,
            end_time,
            location,
        } = req.body;

        // Validate required fields
        if (
            !offering_id ||
            !exam_type ||
            !exam_date ||
            !day_of_week ||
            !start_time ||
            !end_time
        ) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: offering_id, exam_type, exam_date, day_of_week, start_time, end_time",
            });
        }

        // Verify that the course offering exists
        const offering = await prisma.course_offerings.findUnique({
            where: { offering_id: parseInt(offering_id) },
            include: { courses: true },
        });

        if (!offering) {
            return res.status(404).json({
                success: false,
                error: "Course offering not found",
            });
        }

        // Create the exam
        const exam = await prisma.exams.create({
            data: {
                offering_id: parseInt(offering_id),
                exam_type,
                exam_date: new Date(exam_date),
                day_of_week,
                start_time: new Date(`1970-01-01T${start_time}Z`),
                end_time: new Date(`1970-01-01T${end_time}Z`),
                location: location || null,
            },
            include: {
                course_offerings: {
                    include: {
                        courses: true,
                    },
                },
            },
        });

        // Notify enrolled students about the new exam
        const enrollments = await prisma.enrollments.findMany({
            where: {
                lectures: { offering_id: parseInt(offering_id) },
                status: "enrolled",
            },
            select: { student_user_id: true },
            distinct: ["student_user_id"],
        });

        const studentIds = enrollments.map((e) => e.student_user_id);
        if (studentIds.length > 0) {
            const io = req.app.get("io");
            sendBulkNotification({
                userIds: studentIds,
                message: `A ${exam_type} exam has been scheduled for ${
                    exam.course_offerings.courses.name
                } on ${new Date(exam_date).toLocaleDateString()}.`,
                type: "exam_deadline",
                io,
            }).catch((err) =>
                logger.error("Error sending exam notifications:", err)
            );
        }

        res.status(201).json({
            success: true,
            message: "Exam created successfully",
            data: {
                exam_id: exam.exam_id,
                course_code: exam.course_offerings.course_code,
                course_name: exam.course_offerings.courses.name,
                exam_type: exam.exam_type,
                exam_date: exam.exam_date,
                day_of_week: exam.day_of_week,
                start_time: formatTime(exam.start_time),
                end_time: formatTime(exam.end_time),
                location: exam.location,
                semester: exam.course_offerings.semester,
                year: exam.course_offerings.year,
            },
        });
    } catch (err) {
        logger.error("Error creating exam:", err);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};

/**
 * PUT /api/v1/exams/set/:exam_id
 * Update an existing exam
 * Only accessible to admins and super admins
 */
export const updateExamSet = async (req, res) => {
    try {
        const { exam_id } = req.params;
        const {
            exam_type,
            exam_date,
            day_of_week,
            start_time,
            end_time,
            location,
        } = req.body;

        // Verify that the exam exists
        const existingExam = await prisma.exams.findUnique({
            where: { exam_id: parseInt(exam_id) },
        });

        if (!existingExam) {
            return res.status(404).json({
                success: false,
                error: "Exam not found",
            });
        }

        // Build update data object (only include provided fields)
        const updateData = {};
        if (exam_type !== undefined) updateData.exam_type = exam_type;
        if (exam_date !== undefined) updateData.exam_date = new Date(exam_date);
        if (day_of_week !== undefined) updateData.day_of_week = day_of_week;
        if (start_time !== undefined)
            updateData.start_time = new Date(`1970-01-01T${start_time}Z`);
        if (end_time !== undefined)
            updateData.end_time = new Date(`1970-01-01T${end_time}Z`);
        if (location !== undefined) updateData.location = location;

        // Update the exam
        const updatedExam = await prisma.exams.update({
            where: { exam_id: parseInt(exam_id) },
            data: updateData,
            include: {
                course_offerings: {
                    include: {
                        courses: true,
                    },
                },
            },
        });

        res.status(200).json({
            success: true,
            message: "Exam updated successfully",
            data: {
                exam_id: updatedExam.exam_id,
                course_code: updatedExam.course_offerings.course_code,
                course_name: updatedExam.course_offerings.courses.name,
                exam_type: updatedExam.exam_type,
                exam_date: updatedExam.exam_date,
                day_of_week: updatedExam.day_of_week,
                start_time: formatTime(updatedExam.start_time),
                end_time: formatTime(updatedExam.end_time),
                location: updatedExam.location,
                semester: updatedExam.course_offerings.semester,
                year: updatedExam.course_offerings.year,
            },
        });
    } catch (err) {
        logger.error("Error updating exam:", err);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};

/**
 * DELETE /api/v1/exams/set/:exam_id
 * Delete an exam
 * Only accessible to admins and super admins
 */
export const deleteExam = async (req, res) => {
    try {
        const { exam_id } = req.params;

        // Verify that the exam exists
        const existingExam = await prisma.exams.findUnique({
            where: { exam_id: parseInt(exam_id) },
        });

        if (!existingExam) {
            return res.status(404).json({
                success: false,
                error: "Exam not found",
            });
        }

        // Delete the exam
        await prisma.exams.delete({
            where: { exam_id: parseInt(exam_id) },
        });

        res.status(200).json({
            success: true,
            message: "Exam deleted successfully",
        });
    } catch (err) {
        logger.error("Error deleting exam:", err);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
