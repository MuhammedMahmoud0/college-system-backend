import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";

/**
 * Helper function to check if two time slots overlap
 * @param {Date} startA - Start time of first slot
 * @param {Date} endA - End time of first slot
 * @param {Date} startB - Start time of second slot
 * @param {Date} endB - End time of second slot
 * @returns {boolean} - True if times overlap
 */
const timesOverlap = (startA, endA, startB, endB) => {
    return startA < endB && endA > startB;
};

/**
 * Helper function to format time for display
 * @param {Date} time - Time to format
 * @returns {string} - Formatted time string (HH:MM)
 */
const formatTime = (time) => {
    if (!time) return "";
    return new Date(time).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
};

// GET /api/registration/available-offerings
export const getAvailableOfferings = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // Resolve semester
        let currentSemester = req.query.semester;
        if (!currentSemester) {
            const latestOffering = await prisma.course_offerings.findFirst({
                orderBy: { semester: "desc" },
                select: { semester: true },
            });
            currentSemester = latestOffering?.semester || "Fall 2025";
        }

        // Fetch all course offerings for the semester (shared base query)
        const courseOfferings = await prisma.course_offerings.findMany({
            where: { semester: currentSemester },
            include: {
                courses: true,
                lectures: {
                    include: {
                        users: { select: { full_name: true } },
                    },
                },
                tutorials_labs: {
                    include: {
                        users: { select: { full_name: true } },
                    },
                },
            },
        });

        // --- Staff / Admin view: return all offerings with no filtering ---
        if (
            ["doctor", "teaching_assistant", "admin", "super_admin"].includes(
                userRole
            )
        ) {
            const offerings = courseOfferings.map((offering) => ({
                offeringId: offering.offering_id,
                courseName: offering.courses.name,
                courseCode: offering.course_code,
                creditHours: offering.courses.credits,
                lectures: offering.lectures.map((lecture) => ({
                    id: lecture.lecture_id,
                    group_number: lecture.group || "1",
                    day_of_week: lecture.day_of_week,
                    start_time: formatTime(lecture.start_time),
                    end_time: formatTime(lecture.end_time),
                    location: lecture.location || "TBD",
                    instructor: lecture.users.full_name,
                    capacity: lecture.capacity,
                    type: "LECTURE",
                })),
                labs: offering.tutorials_labs.map((lab) => ({
                    id: lab.tutorial_lab_id,
                    group_number: lab.group,
                    day_of_week: lab.day_of_week,
                    start_time: formatTime(lab.start_time),
                    end_time: formatTime(lab.end_time),
                    location: lab.location || "TBD",
                    instructor: lab.users.full_name,
                    capacity: lab.capacity,
                    type: lab.type,
                })),
            }));

            return res.status(200).json({
                semester: currentSemester,
                total: offerings.length,
                offerings,
            });
        }

        // --- Student / Leader view: filter by eligibility ---

        // Courses the student has already completed
        const completedEnrollments = await prisma.enrollments.findMany({
            where: { student_user_id: userId, status: "completed" },
            include: {
                lectures: { include: { course_offerings: true } },
            },
        });
        const completedCourseCodes = new Set(
            completedEnrollments.map(
                (en) => en.lectures.course_offerings.course_code
            )
        );

        // Current active enrollments to mark as already enrolled
        const currentEnrollments = await prisma.enrollments.findMany({
            where: { student_user_id: userId, status: "enrolled" },
            select: { lecture_id: true, tutorial_lab_id: true },
        });
        const enrolledLectureIds = new Set(
            currentEnrollments.map((en) => en.lecture_id)
        );
        const enrolledTutorialLabIds = new Set(
            currentEnrollments.map((en) => en.tutorial_lab_id)
        );

        // Build prerequisite map: course_code -> [prerequisite_codes]
        const prerequisites = await prisma.course_prerequisites.findMany();
        const prerequisiteMap = new Map();
        prerequisites.forEach((prereq) => {
            if (!prerequisiteMap.has(prereq.course_code)) {
                prerequisiteMap.set(prereq.course_code, []);
            }
            prerequisiteMap
                .get(prereq.course_code)
                .push(prereq.prerequisite_code);
        });

        const availableOfferings = [];

        for (const offering of courseOfferings) {
            const courseCode = offering.course_code;

            // Skip already completed courses
            if (completedCourseCodes.has(courseCode)) continue;

            // Skip if prerequisites not met
            const requiredPrereqs = prerequisiteMap.get(courseCode) || [];
            const hasAllPrereqs = requiredPrereqs.every((prereq) =>
                completedCourseCodes.has(prereq)
            );
            if (!hasAllPrereqs) continue;

            const lectures = offering.lectures.map((lecture) => ({
                id: lecture.lecture_id,
                group_number: lecture.group || "1",
                day_of_week: lecture.day_of_week,
                start_time: formatTime(lecture.start_time),
                end_time: formatTime(lecture.end_time),
                location: lecture.location || "TBD",
                instructor: lecture.users.full_name,
                capacity: lecture.capacity,
                type: "LECTURE",
                enrolled: enrolledLectureIds.has(lecture.lecture_id),
            }));

            const labs = offering.tutorials_labs.map((lab) => ({
                id: lab.tutorial_lab_id,
                group_number: lab.group,
                day_of_week: lab.day_of_week,
                start_time: formatTime(lab.start_time),
                end_time: formatTime(lab.end_time),
                location: lab.location || "TBD",
                instructor: lab.users.full_name,
                capacity: lab.capacity,
                type: lab.type,
                enrolled: enrolledTutorialLabIds.has(lab.tutorial_lab_id),
            }));

            availableOfferings.push({
                offeringId: offering.offering_id,
                courseName: offering.courses.name,
                courseCode: offering.course_code,
                creditHours: offering.courses.credits,
                lectures,
                labs,
            });
        }

        res.status(200).json({
            semester: currentSemester,
            offerings: availableOfferings,
        });
    } catch (err) {
        logger.error("Error fetching available offerings:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// POST /api/registration/register
export const registerCourses = async (req, res) => {
    try {
        const studentId = req.user.id; // Get studentId from authenticated user token
        const { selectedLectureIds, selectedLabIds } = req.body;

        // Validate input
        if (
            !Array.isArray(selectedLectureIds) ||
            !Array.isArray(selectedLabIds)
        ) {
            return res.status(400).json({
                error: "Invalid input. Required: selectedLectureIds (array), selectedLabIds (array)",
            });
        }

        if (selectedLectureIds.length === 0 && selectedLabIds.length === 0) {
            return res.status(400).json({
                error: "Must select at least one lecture or lab",
            });
        }

        // Fetch all selected lectures
        const lectures = await prisma.lectures.findMany({
            where: {
                lecture_id: { in: selectedLectureIds },
            },
            include: {
                course_offerings: {
                    include: {
                        courses: true,
                    },
                },
            },
        });

        // Fetch all selected labs
        const labs = await prisma.tutorials_labs.findMany({
            where: {
                tutorial_lab_id: { in: selectedLabIds },
            },
            include: {
                course_offerings: {
                    include: {
                        courses: true,
                    },
                },
            },
        });

        // Fetch already-enrolled sessions for this student to check conflicts against
        const existingEnrollments = await prisma.enrollments.findMany({
            where: { student_user_id: studentId, status: "enrolled" },
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

        const existingSessions = [];
        existingEnrollments.forEach((en) => {
            if (en.lectures) {
                existingSessions.push({
                    id: en.lectures.lecture_id,
                    type: "lecture",
                    day_of_week: en.lectures.day_of_week,
                    start_time: en.lectures.start_time,
                    end_time: en.lectures.end_time,
                    courseName: en.lectures.course_offerings.courses.name,
                    courseCode: en.lectures.course_offerings.course_code,
                });
            }
            if (en.tutorials_labs) {
                existingSessions.push({
                    id: en.tutorials_labs.tutorial_lab_id,
                    type: "lab",
                    day_of_week: en.tutorials_labs.day_of_week,
                    start_time: en.tutorials_labs.start_time,
                    end_time: en.tutorials_labs.end_time,
                    courseName: en.tutorials_labs.course_offerings.courses.name,
                    courseCode: en.tutorials_labs.course_offerings.course_code,
                });
            }
        });

        // New sessions being registered in this request
        const newSessions = [
            ...lectures.map((lecture) => ({
                id: lecture.lecture_id,
                type: "lecture",
                day_of_week: lecture.day_of_week,
                start_time: lecture.start_time,
                end_time: lecture.end_time,
                courseName: lecture.course_offerings.courses.name,
                courseCode: lecture.course_offerings.course_code,
            })),
            ...labs.map((lab) => ({
                id: lab.tutorial_lab_id,
                type: "lab",
                day_of_week: lab.day_of_week,
                start_time: lab.start_time,
                end_time: lab.end_time,
                courseName: lab.course_offerings.courses.name,
                courseCode: lab.course_offerings.course_code,
            })),
        ];

        /**
         * Check conflicts:
         * 1. Among newly selected sessions with each other
         * 2. Each new session against all existing enrolled sessions
         */
        const checkConflict = (sessionA, sessionB) => {
            if (sessionA.id === sessionB.id && sessionA.type === sessionB.type)
                return;
            if (sessionA.day_of_week !== sessionB.day_of_week) return;
            if (
                timesOverlap(
                    sessionA.start_time,
                    sessionA.end_time,
                    sessionB.start_time,
                    sessionB.end_time
                )
            ) {
                throw {
                    status: 400,
                    message: `Schedule conflict on ${sessionA.day_of_week}: ${
                        sessionA.courseName
                    } (${sessionA.courseCode}) [${formatTime(
                        sessionA.start_time
                    )}-${formatTime(sessionA.end_time)}] overlaps with ${
                        sessionB.courseName
                    } (${sessionB.courseCode}) [${formatTime(
                        sessionB.start_time
                    )}-${formatTime(sessionB.end_time)}]`,
                };
            }
        };

        try {
            // Check new vs new
            for (let i = 0; i < newSessions.length; i++) {
                for (let j = i + 1; j < newSessions.length; j++) {
                    checkConflict(newSessions[i], newSessions[j]);
                }
            }
            // Check new vs existing
            for (const newSession of newSessions) {
                for (const existingSession of existingSessions) {
                    checkConflict(newSession, existingSession);
                }
            }
        } catch (conflictErr) {
            return res
                .status(conflictErr.status || 400)
                .json({ error: conflictErr.message });
        }

        // Start database transaction
        try {
            const result = await prisma.$transaction(async (tx) => {
                const enrollmentsCreated = [];

                // Process each lecture-lab pair
                // Group lectures and labs by course offering
                const lecturesByOffering = new Map();
                const labsByOffering = new Map();

                lectures.forEach((lecture) => {
                    lecturesByOffering.set(lecture.offering_id, lecture);
                });

                labs.forEach((lab) => {
                    if (!labsByOffering.has(lab.offering_id)) {
                        labsByOffering.set(lab.offering_id, []);
                    }
                    labsByOffering.get(lab.offering_id).push(lab);
                });

                // Create enrollments for each course
                for (const lecture of lectures) {
                    // Check lecture capacity
                    const lectureEnrollmentCount = await tx.enrollments.count({
                        where: { lecture_id: lecture.lecture_id },
                    });

                    if (lectureEnrollmentCount >= lecture.capacity) {
                        throw new Error(
                            `Lecture ${lecture.course_offerings.courses.name} (${lecture.course_offerings.course_code}) is full`
                        );
                    }

                    // Find corresponding lab(s) for this offering
                    const courseLabs = labs.filter(
                        (lab) => lab.offering_id === lecture.offering_id
                    );

                    if (courseLabs.length === 0) {
                        throw new Error(
                            `No lab selected for course ${lecture.course_offerings.courses.name} (${lecture.course_offerings.course_code})`
                        );
                    }

                    for (const lab of courseLabs) {
                        // Check lab capacity
                        const labEnrollmentCount = await tx.enrollments.count({
                            where: { tutorial_lab_id: lab.tutorial_lab_id },
                        });

                        if (labEnrollmentCount >= lab.capacity) {
                            throw new Error(
                                `Lab ${lab.group} for ${lecture.course_offerings.courses.name} is full`
                            );
                        }

                        // Check if student is already enrolled in this lecture-lab combination
                        const existingEnrollment =
                            await tx.enrollments.findUnique({
                                where: {
                                    student_user_id_lecture_id_tutorial_lab_id:
                                        {
                                            student_user_id: studentId,
                                            lecture_id: lecture.lecture_id,
                                            tutorial_lab_id:
                                                lab.tutorial_lab_id,
                                        },
                                },
                            });

                        if (existingEnrollment) {
                            throw new Error(
                                `Already enrolled in ${lecture.course_offerings.courses.name} (${lecture.course_offerings.course_code}) with this lecture and lab combination`
                            );
                        }

                        // Create enrollment
                        const enrollment = await tx.enrollments.create({
                            data: {
                                student_user_id: studentId,
                                lecture_id: lecture.lecture_id,
                                tutorial_lab_id: lab.tutorial_lab_id,
                                status: "enrolled",
                            },
                        });

                        enrollmentsCreated.push(enrollment);
                    }
                }

                return enrollmentsCreated;
            });

            res.status(201).json({
                message: "Registration successful",
                enrollments: result.length,
                details: result,
            });
        } catch (transactionError) {
            logger.error("Transaction error:", transactionError);
            return res.status(400).json({
                error:
                    transactionError.message ||
                    "Registration failed due to capacity or validation issues",
            });
        }
    } catch (err) {
        logger.error("Error registering courses:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// DELETE /api/registration/unregister
export const unregisterSession = async (req, res) => {
    try {
        const studentId = req.user.id; // Get studentId from authenticated user token
        const { lectureId, tutorialLabId } = req.body;

        // Validate that at least one ID is provided
        if (!lectureId && !tutorialLabId) {
            return res.status(400).json({
                error: "Must provide either lectureId or tutorialLabId",
            });
        }

        let offeringId;
        let sessionType;

        // Determine which type of session to delete and get the offering_id
        if (lectureId) {
            const lecture = await prisma.lectures.findUnique({
                where: { lecture_id: parseInt(lectureId) },
                select: { offering_id: true },
            });

            if (!lecture) {
                return res.status(404).json({ error: "Lecture not found" });
            }

            offeringId = lecture.offering_id;
            sessionType = "lecture";
        } else {
            const tutorialLab = await prisma.tutorials_labs.findUnique({
                where: { tutorial_lab_id: parseInt(tutorialLabId) },
                select: { offering_id: true },
            });

            if (!tutorialLab) {
                return res
                    .status(404)
                    .json({ error: "Tutorial/Lab not found" });
            }

            offeringId = tutorialLab.offering_id;
            sessionType = "tutorialLab";
        }

        // Find all enrollments for this student in this course offering
        const enrollments = await prisma.enrollments.findMany({
            where: {
                student_user_id: studentId,
                lectures: {
                    offering_id: offeringId,
                },
            },
            include: {
                lectures: {
                    include: {
                        course_offerings: {
                            include: {
                                courses: true,
                            },
                        },
                    },
                },
            },
        });

        if (enrollments.length === 0) {
            return res
                .status(404)
                .json({ error: "No enrollment found for this course" });
        }

        // Delete all enrollments for this student in this course offering
        // This will remove both lecture and lab registrations together
        const deleteResult = await prisma.enrollments.deleteMany({
            where: {
                student_user_id: studentId,
                lectures: {
                    offering_id: offeringId,
                },
            },
        });

        res.status(200).json({
            message: `Successfully unregistered from ${enrollments[0].lectures.course_offerings.courses.name}`,
            courseCode: enrollments[0].lectures.course_offerings.course_code,
            enrollmentsDeleted: deleteResult.count,
        });
    } catch (err) {
        logger.error("Error unregistering from course:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};
