import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";
import {
    getCache,
    setCache,
    invalidateByPattern,
} from "../services/cacheService.js";

// GET /api/courses/student
export const getStudentCourses = async (req, res) => {
    try {
        const userId = req.user.id; // From auth middleware

        const enrollments = await prisma.enrollments.findMany({
            where: {
                student_user_id: userId,
            },
            include: {
                lectures: {
                    include: {
                        course_offerings: {
                            include: { courses: true },
                        },
                        users: { select: { full_name: true } }, // The Instructor
                    },
                },
            },
        });

        const profile = await prisma.student_profiles.findUnique({
            where: { user_id: userId },
        });

        const formattedCourses = enrollments
            .filter((en) => en.lecture_id !== null)
            .map((en) => ({
                id: en.lecture_id.toString(),
                code: en.lectures.course_offerings.course_code,
                name: en.lectures.course_offerings.courses.name,
                credits: en.lectures.course_offerings.courses.credits,
                instructor: en.lectures.users.full_name,
                semester: en.lectures.course_offerings.semester,
                year: en.lectures.course_offerings.year,
                work_score: en.work_score,
                midterm_score: en.mid_score,
                final_score: en.final_score,
                grade: en.grade || "N/A",
                status: en.status,
            }));

        res.status(200).json({
            courses: formattedCourses,
            cumulativeGPA: profile?.cgpa || 0,
            totalCredits: profile?.total_credits || 0,
        });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// GET /api/courses/student/labs
export const getStudentLabs = async (req, res) => {
    try {
        const userId = req.user.id;

        const enrollments = await prisma.enrollments.findMany({
            where: {
                student_user_id: userId,
            },
            include: {
                tutorials_labs: {
                    include: {
                        course_offerings: {
                            include: { courses: true },
                        },
                        users: { select: { full_name: true } },
                    },
                },
            },
        });

        const formattedLabs = enrollments
            .filter((en) => en.tutorial_lab_id !== null)
            .map((en) => ({
                id: en.tutorial_lab_id.toString(),
                code: en.tutorials_labs.course_offerings.course_code,
                name: en.tutorials_labs.course_offerings.courses.name,
                credits: en.tutorials_labs.course_offerings.courses.credits,
                instructor: en.tutorials_labs.users.full_name,
                type: en.tutorials_labs.type,
                group: en.tutorials_labs.group,
                semester: en.tutorials_labs.course_offerings.semester,
                year: en.tutorials_labs.course_offerings.year,
                grade: en.grade || "N/A",
                status: en.status,
            }));

        res.status(200).json({ labs: formattedLabs });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Helper function to format time to HH:MM
const formatTime = (time) => {
    if (!time) return "";
    const date = new Date(time);
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
};

// GET /api/courses/all
export const getAllCourses = async (req, res) => {
    try {
        // const cacheKey = "v1:courses:all";
        // const cached = await getCache(cacheKey);
        // if (cached) return res.status(200).json(cached);

        const courses = await prisma.courses.findMany({
            include: {
                departments: {
                    select: {
                        name: true,
                    },
                },
                course_prerequisites_course_prerequisites_course_codeTocourses:
                    {
                        include: {
                            courses_course_prerequisites_prerequisite_codeTocourses:
                                {
                                    select: {
                                        code: true,
                                        name: true,
                                    },
                                },
                        },
                    },
            },
            orderBy: {
                code: "asc",
            },
        });

        const formattedCourses = courses.map((course) => ({
            code: course.code,
            name: course.name,
            credits: course.credits,
            department: course.departments.name,
            prerequisites:
                course.course_prerequisites_course_prerequisites_course_codeTocourses.map(
                    (prereq) => ({
                        code: prereq
                            .courses_course_prerequisites_prerequisite_codeTocourses
                            .code,
                        name: prereq
                            .courses_course_prerequisites_prerequisite_codeTocourses
                            .name,
                    }),
                ),
        }));

        const response = {
            courses: formattedCourses,
            total: formattedCourses.length,
        };
        // await setCache(cacheKey, response, 1800); // 30 min
        res.status(200).json(response);
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// GET /api/courses/:offeringId
export const getCourseDetails = async (req, res) => {
    try {
        const { offeringId } = req.params;
        // const cacheKey = `v1:course:detail:${offeringId}`;

        // const cached = await getCache(cacheKey);
        // if (cached) return res.status(200).json(cached);

        const offering = await prisma.course_offerings.findUnique({
            where: { offering_id: parseInt(offeringId) },
            include: {
                courses: true,
                lectures: {
                    include: {
                        users: {
                            select: {
                                full_name: true,
                                email: true,
                            },
                        },
                    },
                },
                tutorials_labs: {
                    include: {
                        users: {
                            select: {
                                full_name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        if (!offering)
            return res.status(404).json({ error: "Course offering not found" });

        // Format lectures without IDs
        const lectures = offering.lectures.map((lecture) => ({
            instructor: lecture.users.full_name,
            instructorEmail: lecture.users.email,
            capacity: lecture.capacity,
            dayOfWeek: lecture.day_of_week,
            startTime: formatTime(lecture.start_time),
            endTime: formatTime(lecture.end_time),
            location: lecture.location,
            group: lecture.group,
        }));

        // Format tutorials/labs without IDs
        const tutorialsLabs = offering.tutorials_labs.map((lab) => ({
            ta: lab.users.full_name,
            taEmail: lab.users.email,
            type: lab.type,
            capacity: lab.capacity,
            dayOfWeek: lab.day_of_week,
            startTime: formatTime(lab.start_time),
            endTime: formatTime(lab.end_time),
            location: lab.location,
            group: lab.group,
        }));

        const response = {
            name: offering.courses.name,
            code: offering.course_code,
            credits: offering.courses.credits,
            semester: offering.semester,
            year: offering.year,
            lectures: lectures,
            tutorialsLabs: tutorialsLabs,
        };
        // await setCache(cacheKey, response, 900); // 15 min
        res.status(200).json(response);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/courses/:courseId/grades
export const getGradeBreakdown = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;

        const enrollment = await prisma.enrollments.findFirst({
            where: {
                lecture_id: parseInt(courseId),
                student_user_id: userId,
            },
            include: {
                lectures: {
                    include: {
                        course_offerings: { include: { courses: true } },
                    },
                },
            },
        });

        if (!enrollment)
            return res.status(404).json({ error: "Enrollment not found" });

        // Fetch grade distribution for this lecture (if set)
        const distribution = await prisma.grade_distributions.findUnique({
            where: { lecture_id: enrollment.lecture_id },
        });

        const mid = enrollment.mid_score ?? null;
        const work = enrollment.work_score ?? null;
        const final = enrollment.final_score ?? null;

        const midMax = distribution?.mid_max ?? null;
        const workMax = distribution?.work_max ?? null;
        const finalMax = distribution?.final_max ?? null;

        // Calculate total only from scores that are present
        const presentScores = [mid, work, final].filter((v) => v !== null);
        const total =
            presentScores.length > 0
                ? parseFloat(
                      presentScores.reduce((a, b) => a + b, 0).toFixed(2),
                  )
                : null;

        res.status(200).json({
            lecture_id: parseInt(courseId),
            course_code: enrollment.lectures.course_offerings.course_code,
            course_name: enrollment.lectures.course_offerings.courses.name,
            credits: enrollment.lectures.course_offerings.courses.credits,
            letter_grade: enrollment.grade ?? "In Progress",
            total_score: total,
            distribution: distribution
                ? {
                      work_max: distribution.work_max,
                      mid_max: distribution.mid_max,
                      final_max: distribution.final_max,
                  }
                : null,
            breakdown: [
                {
                    category: "Midterm",
                    score: mid,
                    max_score: midMax,
                },
                {
                    category: "Work/Assignments",
                    score: work,
                    max_score: workMax,
                },
                {
                    category: "Final Exam",
                    score: final,
                    max_score: finalMax,
                },
            ],
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/courses
export const createCourse = async (req, res) => {
    try {
        const { code, name, credits, department, prerequisites } = req.body;

        if (!code || !name || !credits || !department) {
            return res.status(400).json({
                error: "Missing required fields",
                required: ["code", "name", "credits", "department"],
            });
        }

        // Resolve department by name
        const dept = await prisma.departments.findUnique({
            where: { name: department },
            select: { department_id: true, name: true },
        });

        if (!dept) {
            return res.status(400).json({
                error: "Invalid department",
                message: `Department with name '${department}' not found`,
            });
        }

        const courseData = {
            code,
            name,
            credits: parseInt(credits),
            department_id: dept.department_id,
        };

        const newCourse = await prisma.courses.create({
            data: courseData,
        });

        if (prerequisites && prerequisites.length > 0) {
            await prisma.course_prerequisites.createMany({
                data: prerequisites.map((prereqCode) => ({
                    course_code: newCourse.code,
                    prerequisite_code: prereqCode,
                })),
            });
        }

        const result = await prisma.courses.findUnique({
            where: { code: newCourse.code },
            include: {
                course_prerequisites_course_prerequisites_course_codeTocourses:
                    {
                        include: {
                            courses_course_prerequisites_prerequisite_codeTocourses: true,
                        },
                    },
                departments: true,
            },
        });

        await invalidateByPattern("v1:courses:*");
        await invalidateByPattern("v1:course-offerings:*");

        res.status(201).json({
            code: result.code,
            name: result.name,
            credits: result.credits,
            department: result.departments?.name || department,
            course_prerequisites_course_prerequisites_course_codeTocourses:
                result.course_prerequisites_course_prerequisites_course_codeTocourses,
        });
    } catch (err) {
        logger.error(err);
        if (err.code === "P2002") {
            return res
                .status(400)
                .json({ error: "A course with this code already exists." });
        }
        if (err.code === "P2003") {
            return res
                .status(400)
                .json({ error: "Invalid prerequisite course." });
        }
        res.status(500).json({ error: "Internal server error" });
    }
};

// PATCH /api/courses/:code
export const updateCourse = async (req, res) => {
    try {
        const { code } = req.params;
        const { name, prerequisites } = req.body;

        logger.info(`Updating course with code: ${code}`);

        const updateData = {};
        if (name) updateData.name = name;

        await prisma.$transaction(async (tx) => {
            if (name) {
                await tx.courses.update({
                    where: { code },
                    data: { name },
                });
            }

            if (prerequisites) {
                await tx.course_prerequisites.deleteMany({
                    where: { course_code: code },
                });
                await tx.course_prerequisites.createMany({
                    data: prerequisites.map((prereqCode) => ({
                        course_code: code,
                        prerequisite_code: prereqCode,
                    })),
                });
            }
        });

        const updatedCourse = await prisma.courses.findUnique({
            where: { code },
            include: {
                departments: true,
                course_prerequisites_course_prerequisites_course_codeTocourses:
                    {
                        include: {
                            courses_course_prerequisites_prerequisite_codeTocourses: true,
                        },
                    },
            },
        });

        await invalidateByPattern("v1:courses:*");
        await invalidateByPattern("v1:course-offerings:*");

        res.status(200).json({
            code: updatedCourse.code,
            name: updatedCourse.name,
            credits: updatedCourse.credits,
            department: updatedCourse.departments?.name || undefined,
            course_prerequisites_course_prerequisites_course_codeTocourses:
                updatedCourse.course_prerequisites_course_prerequisites_course_codeTocourses,
        });
    } catch (err) {
        logger.error("Error updating course:", err);
        logger.error("Error details:", {
            code: err.code,
            message: err.message,
        });
        if (err.code === "P2025") {
            return res.status(404).json({ error: "Course not found." });
        }
        res.status(500).json({
            error: "Internal server error",
            details: err.message,
        });
    }
};

// DELETE /api/courses/:code
export const deleteCourse = async (req, res) => {
    try {
        const { code } = req.params;

        logger.info(`Deleting course with code: ${code}`);

        const prerequisiteFor = await prisma.course_prerequisites.findMany({
            where: { prerequisite_code: code },
        });

        if (prerequisiteFor.length > 0) {
            return res.status(400).json({
                error: "Cannot delete course; it is a prerequisite for other modules.",
            });
        }

        // Check if there are completed enrollments
        const completedEnrollmentsCount = await prisma.enrollments.count({
            where: {
                status: "completed",
                lectures: {
                    course_offerings: {
                        course_code: code,
                    },
                },
            },
        });

        if (completedEnrollmentsCount > 0) {
            // Find all non-completed enrollments for this course
            const nonCompletedEnrollments = await prisma.enrollments.findMany({
                where: {
                    status: { not: "completed" },
                    lectures: {
                        course_offerings: {
                            course_code: code,
                        },
                    },
                },
                select: { id: true },
            });

            const nonCompletedEnrollmentIds = nonCompletedEnrollments.map(
                (e) => e.id,
            );

            if (nonCompletedEnrollmentIds.length > 0) {
                // Delete invoices associated with non-completed enrollments
                await prisma.invoices.deleteMany({
                    where: { enrollment_id: { in: nonCompletedEnrollmentIds } },
                });

                // Delete the non-completed enrollments
                await prisma.enrollments.deleteMany({
                    where: { id: { in: nonCompletedEnrollmentIds } },
                });
            }

            await invalidateByPattern("v1:courses:*");
            await invalidateByPattern("v1:course-offerings:*");

            return res.status(200).json({
                message:
                    "Course could not be fully deleted because some students have already completed it. However, non-completed enrollments have been successfully removed.",
                courseKept: true,
            });
        }

        // If there are no completed enrollments, proceed with full cascade delete
        const offerings = await prisma.course_offerings.findMany({
            where: { course_code: code },
            select: { offering_id: true },
        });
        const offeringIds = offerings.map((o) => o.offering_id);

        if (offeringIds.length > 0) {
            const lectures = await prisma.lectures.findMany({
                where: { offering_id: { in: offeringIds } },
                select: { lecture_id: true },
            });
            const lectureIds = lectures.map((l) => l.lecture_id);

            const tutorials = await prisma.tutorials_labs.findMany({
                where: { offering_id: { in: offeringIds } },
                select: { tutorial_lab_id: true },
            });
            const tutorialIds = tutorials.map((t) => t.tutorial_lab_id);

            if (lectureIds.length > 0) {
                const enrollments = await prisma.enrollments.findMany({
                    where: { lecture_id: { in: lectureIds } },
                    select: { id: true },
                });
                const enrollmentIds = enrollments.map((e) => e.id);

                if (enrollmentIds.length > 0) {
                    await prisma.invoices.deleteMany({
                        where: { enrollment_id: { in: enrollmentIds } },
                    });
                    await prisma.enrollments.deleteMany({
                        where: { id: { in: enrollmentIds } },
                    });
                }
            }

            if (lectureIds.length > 0 || tutorialIds.length > 0) {
                const orConditions = [];
                if (lectureIds.length > 0)
                    orConditions.push({ lecture_id: { in: lectureIds } });
                if (tutorialIds.length > 0)
                    orConditions.push({ tutorial_lab_id: { in: tutorialIds } });

                await prisma.course_materials.deleteMany({
                    where: { OR: orConditions },
                });
            }

            await prisma.exams.deleteMany({
                where: { offering_id: { in: offeringIds } },
            });

            if (tutorialIds.length > 0) {
                await prisma.tutorials_labs.deleteMany({
                    where: { offering_id: { in: offeringIds } },
                });
            }
            if (lectureIds.length > 0) {
                // grade_distributions cascade deletes with lectures
                await prisma.lectures.deleteMany({
                    where: { offering_id: { in: offeringIds } },
                });
            }

            await prisma.course_offerings.deleteMany({
                where: { course_code: code },
            });
        }

        await prisma.course_prerequisites.deleteMany({
            where: { course_code: code },
        });

        const deletedCourse = await prisma.courses.delete({
            where: { code },
        });

        await invalidateByPattern("v1:courses:*");
        await invalidateByPattern("v1:course-offerings:*");

        res.status(200).json({
            message: "Course completely deleted.",
            courseKept: false,
            deletedCourse,
        });
    } catch (err) {
        logger.error("Error deleting course:", err);
        logger.error("Error details:", {
            code: err.code,
            message: err.message,
        });
        if (err.code === "P2025") {
            return res.status(404).json({ error: "Course not found." });
        }
        res.status(500).json({
            error: "Internal server error",
            details: err.message,
        });
    }
};

// POST /api/courses/lectures
export const createLecture = async (req, res) => {
    try {
        const body = req.body || {};
        const {
            offeringId,
            offering_id,
            instructorId,
            capacity,
            dayOfWeek,
            startTime,
            endTime,
            location,
            group,
        } = body;

        const normalizedOfferingId = offeringId ?? offering_id;

        // Validate required fields
        if (
            !normalizedOfferingId ||
            !instructorId ||
            !capacity ||
            !dayOfWeek ||
            !startTime ||
            !endTime
        ) {
            return res.status(400).json({
                error: "Missing required fields",
                required: [
                    "offeringId",
                    "instructorId",
                    "capacity",
                    "dayOfWeek",
                    "startTime",
                    "endTime",
                ],
            });
        }

        // Verify course offering exists
        const offering = await prisma.course_offerings.findUnique({
            where: { offering_id: parseInt(normalizedOfferingId) },
        });

        if (!offering) {
            return res.status(404).json({ error: "Course offering not found" });
        }

        // Verify instructor exists
        const instructor = await prisma.users.findUnique({
            where: { id: instructorId },
        });

        if (!instructor) {
            return res.status(404).json({ error: "Instructor not found" });
        }

        // Parse time strings (HH:MM) to DateTime
        const [startHour, startMin] = startTime.split(":").map(Number);
        const [endHour, endMin] = endTime.split(":").map(Number);

        const startDateTime = new Date();
        startDateTime.setUTCHours(startHour, startMin, 0, 0);

        const endDateTime = new Date();
        endDateTime.setUTCHours(endHour, endMin, 0, 0);

        const newLecture = await prisma.lectures.create({
            data: {
                offering_id: parseInt(normalizedOfferingId),
                instructor_id: instructorId,
                capacity: parseInt(capacity),
                day_of_week: dayOfWeek,
                start_time: startDateTime,
                end_time: endDateTime,
                location: location || null,
                group: group || null,
            },
            include: {
                course_offerings: {
                    include: {
                        courses: true,
                    },
                },
                users: {
                    select: {
                        full_name: true,
                        email: true,
                    },
                },
            },
        });

        await invalidateByPattern("v1:course:detail:*");
        await invalidateByPattern("v1:schedule:teacher:*");
        await invalidateByPattern("v1:doctor:courses:*");
        await invalidateByPattern("v1:admin:alerts");

        res.status(201).json({
            message: "Lecture created successfully",
            lecture: {
                lectureId: newLecture.lecture_id,
                courseName: newLecture.course_offerings.courses.name,
                courseCode: newLecture.course_offerings.course_code,
                instructor: newLecture.users.full_name,
                capacity: newLecture.capacity,
                dayOfWeek: newLecture.day_of_week,
                startTime: formatTime(newLecture.start_time),
                endTime: formatTime(newLecture.end_time),
                location: newLecture.location,
                group: newLecture.group,
            },
        });
    } catch (err) {
        logger.error("Error creating lecture:", err);
        res.status(500).json({
            error: "Internal server error",
            details: err.message,
        });
    }
};

// PATCH /api/courses/lectures/:lectureId
export const updateLecture = async (req, res) => {
    try {
        const { lectureId } = req.params;
        const {
            instructorId,
            capacity,
            dayOfWeek,
            startTime,
            endTime,
            location,
            group,
        } = req.body;

        const existing = await prisma.lectures.findUnique({
            where: { lecture_id: parseInt(lectureId) },
        });

        if (!existing) {
            return res.status(404).json({ error: "Lecture not found" });
        }

        if (instructorId) {
            const instructor = await prisma.users.findUnique({
                where: { id: instructorId },
            });
            if (!instructor) {
                return res.status(404).json({ error: "Instructor not found" });
            }
        }

        const data = {};
        if (instructorId) data.instructor_id = instructorId;
        if (capacity !== undefined) data.capacity = parseInt(capacity);
        if (dayOfWeek) data.day_of_week = dayOfWeek;
        if (startTime) {
            const [h, m] = startTime.split(":").map(Number);
            const d = new Date();
            d.setUTCHours(h, m, 0, 0);
            data.start_time = d;
        }
        if (endTime) {
            const [h, m] = endTime.split(":").map(Number);
            const d = new Date();
            d.setUTCHours(h, m, 0, 0);
            data.end_time = d;
        }
        if (location !== undefined) data.location = location;
        if (group !== undefined) data.group = group;

        const updated = await prisma.lectures.update({
            where: { lecture_id: parseInt(lectureId) },
            data,
            include: {
                course_offerings: { include: { courses: true } },
                users: { select: { full_name: true, email: true } },
            },
        });

        await invalidateByPattern("v1:course:detail:*");
        await invalidateByPattern("v1:schedule:teacher:*");
        await invalidateByPattern("v1:doctor:courses:*");
        await invalidateByPattern("v1:admin:alerts");

        res.status(200).json({
            message: "Lecture updated successfully",
            lecture: {
                lectureId: updated.lecture_id,
                courseName: updated.course_offerings.courses.name,
                courseCode: updated.course_offerings.course_code,
                instructor: updated.users.full_name,
                capacity: updated.capacity,
                dayOfWeek: updated.day_of_week,
                startTime: formatTime(updated.start_time),
                endTime: formatTime(updated.end_time),
                location: updated.location,
                group: updated.group,
            },
        });
    } catch (err) {
        logger.error("Error updating lecture:", err);
        res.status(500).json({
            error: "Internal server error",
            details: err.message,
        });
    }
};

// DELETE /api/courses/lectures/:lectureId
export const deleteLecture = async (req, res) => {
    try {
        const { lectureId } = req.params;

        const existing = await prisma.lectures.findUnique({
            where: { lecture_id: parseInt(lectureId) },
        });

        if (!existing) {
            return res.status(404).json({ error: "Lecture not found" });
        }

        await prisma.lectures.delete({
            where: { lecture_id: parseInt(lectureId) },
        });

        await invalidateByPattern("v1:course:detail:*");
        await invalidateByPattern("v1:schedule:teacher:*");
        await invalidateByPattern("v1:doctor:courses:*");
        await invalidateByPattern("v1:admin:alerts");

        res.status(200).json({ message: "Lecture deleted successfully" });
    } catch (err) {
        logger.error("Error deleting lecture:", err);
        res.status(500).json({
            error: "Internal server error",
            details: err.message,
        });
    }
};

// POST /api/courses/tutorials-labs
export const createTutorialLab = async (req, res) => {
    try {
        const {
            offeringId,
            taId,
            type,
            capacity,
            dayOfWeek,
            startTime,
            endTime,
            location,
            group,
        } = req.body;

        // Validate required fields
        if (
            !offeringId ||
            !taId ||
            !type ||
            !capacity ||
            !dayOfWeek ||
            !startTime ||
            !endTime ||
            !group
        ) {
            return res.status(400).json({
                error: "Missing required fields",
                required: [
                    "offeringId",
                    "taId",
                    "type",
                    "capacity",
                    "dayOfWeek",
                    "startTime",
                    "endTime",
                    "group",
                ],
            });
        }

        // Verify course offering exists
        const offering = await prisma.course_offerings.findUnique({
            where: { offering_id: parseInt(offeringId) },
        });

        if (!offering) {
            return res.status(404).json({ error: "Course offering not found" });
        }

        // Verify TA exists
        const ta = await prisma.users.findUnique({
            where: { id: taId },
        });

        if (!ta) {
            return res
                .status(404)
                .json({ error: "Teaching assistant not found" });
        }

        // Parse time strings (HH:MM) to DateTime
        const [startHour, startMin] = startTime.split(":").map(Number);
        const [endHour, endMin] = endTime.split(":").map(Number);

        const startDateTime = new Date();
        startDateTime.setUTCHours(startHour, startMin, 0, 0);

        const endDateTime = new Date();
        endDateTime.setUTCHours(endHour, endMin, 0, 0);

        const newTutorialLab = await prisma.tutorials_labs.create({
            data: {
                offering_id: parseInt(offeringId),
                ta_id: taId,
                type: type,
                capacity: parseInt(capacity),
                day_of_week: dayOfWeek,
                start_time: startDateTime,
                end_time: endDateTime,
                location: location || null,
                group: group,
            },
            include: {
                course_offerings: {
                    include: {
                        courses: true,
                    },
                },
                users: {
                    select: {
                        full_name: true,
                        email: true,
                    },
                },
            },
        });

        await invalidateByPattern("v1:course:detail:*");
        await invalidateByPattern("v1:schedule:teacher:*");

        res.status(201).json({
            message: "Tutorial/Lab created successfully",
            tutorialLab: {
                tutorialLabId: newTutorialLab.tutorial_lab_id,
                courseName: newTutorialLab.course_offerings.courses.name,
                courseCode: newTutorialLab.course_offerings.course_code,
                ta: newTutorialLab.users.full_name,
                type: newTutorialLab.type,
                capacity: newTutorialLab.capacity,
                dayOfWeek: newTutorialLab.day_of_week,
                startTime: formatTime(newTutorialLab.start_time),
                endTime: formatTime(newTutorialLab.end_time),
                location: newTutorialLab.location,
                group: newTutorialLab.group,
            },
        });
    } catch (err) {
        logger.error("Error creating tutorial/lab:", err);
        res.status(500).json({
            error: "Internal server error",
            details: err.message,
        });
    }
};

// PATCH /api/courses/tutorials-labs/:tutorialLabId
export const updateTutorialLab = async (req, res) => {
    try {
        const { tutorialLabId } = req.params;
        const {
            taId,
            type,
            capacity,
            dayOfWeek,
            startTime,
            endTime,
            location,
            group,
        } = req.body;

        const existing = await prisma.tutorials_labs.findUnique({
            where: { tutorial_lab_id: parseInt(tutorialLabId) },
        });

        if (!existing) {
            return res.status(404).json({ error: "Tutorial/Lab not found" });
        }

        if (taId) {
            const ta = await prisma.users.findUnique({ where: { id: taId } });
            if (!ta) {
                return res
                    .status(404)
                    .json({ error: "Teaching assistant not found" });
            }
        }

        const data = {};
        if (taId) data.ta_id = taId;
        if (type) data.type = type;
        if (capacity !== undefined) data.capacity = parseInt(capacity);
        if (dayOfWeek) data.day_of_week = dayOfWeek;
        if (startTime) {
            const [h, m] = startTime.split(":").map(Number);
            const d = new Date();
            d.setUTCHours(h, m, 0, 0);
            data.start_time = d;
        }
        if (endTime) {
            const [h, m] = endTime.split(":").map(Number);
            const d = new Date();
            d.setUTCHours(h, m, 0, 0);
            data.end_time = d;
        }
        if (location !== undefined) data.location = location;
        if (group !== undefined) data.group = group;

        const updated = await prisma.tutorials_labs.update({
            where: { tutorial_lab_id: parseInt(tutorialLabId) },
            data,
            include: {
                course_offerings: { include: { courses: true } },
                users: { select: { full_name: true, email: true } },
            },
        });

        await invalidateByPattern("v1:course:detail:*");
        await invalidateByPattern("v1:schedule:teacher:*");

        res.status(200).json({
            message: "Tutorial/Lab updated successfully",
            tutorialLab: {
                tutorialLabId: updated.tutorial_lab_id,
                courseName: updated.course_offerings.courses.name,
                courseCode: updated.course_offerings.course_code,
                ta: updated.users.full_name,
                type: updated.type,
                capacity: updated.capacity,
                dayOfWeek: updated.day_of_week,
                startTime: formatTime(updated.start_time),
                endTime: formatTime(updated.end_time),
                location: updated.location,
                group: updated.group,
            },
        });
    } catch (err) {
        logger.error("Error updating tutorial/lab:", err);
        res.status(500).json({
            error: "Internal server error",
            details: err.message,
        });
    }
};

// DELETE /api/courses/tutorials-labs/:tutorialLabId
export const deleteTutorialLab = async (req, res) => {
    try {
        const { tutorialLabId } = req.params;

        const existing = await prisma.tutorials_labs.findUnique({
            where: { tutorial_lab_id: parseInt(tutorialLabId) },
        });

        if (!existing) {
            return res.status(404).json({ error: "Tutorial/Lab not found" });
        }

        await prisma.tutorials_labs.delete({
            where: { tutorial_lab_id: parseInt(tutorialLabId) },
        });

        await invalidateByPattern("v1:course:detail:*");
        await invalidateByPattern("v1:schedule:teacher:*");

        res.status(200).json({ message: "Tutorial/Lab deleted successfully" });
    } catch (err) {
        logger.error("Error deleting tutorial/lab:", err);
        res.status(500).json({
            error: "Internal server error",
            details: err.message,
        });
    }
};
