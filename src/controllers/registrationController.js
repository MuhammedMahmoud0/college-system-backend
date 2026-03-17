import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";
import { sendNotification } from "../utils/notificationService.js";

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
                    enrolled_count: lecture.enrolled_count,
                    available_seats: lecture.capacity - lecture.enrolled_count,
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
                    enrolled_count: lab.enrolled_count,
                    available_seats: lab.capacity - lab.enrolled_count,
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
                enrolled_count: lecture.enrolled_count,
                available_seats: lecture.capacity - lecture.enrolled_count,
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
                enrolled_count: lab.enrolled_count,
                available_seats: lab.capacity - lab.enrolled_count,
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

        const departmentIds = [
            ...new Set(
                lectures
                    .map(
                        (lecture) =>
                            lecture.course_offerings.courses.department_id
                    )
                    .filter(Boolean)
            ),
        ];

        const financialRows = await prisma.financials.findMany({
            where: { department_id: { in: departmentIds } },
            select: {
                department_id: true,
                credit_price: true,
            },
        });

        const creditPriceByDepartment = new Map(
            financialRows.map((row) => [
                row.department_id,
                Number.parseFloat(row.credit_price),
            ])
        );

        const missingFinancialDepartments = departmentIds.filter(
            (departmentId) => !creditPriceByDepartment.has(departmentId)
        );

        if (missingFinancialDepartments.length > 0) {
            return res.status(400).json({
                error: "Credit price is not configured for one or more course departments",
                missingDepartmentIds: missingFinancialDepartments,
            });
        }

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
                const invoicesCreated = [];
                let totalBilled = 0;

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
                    // Re-fetch lecture inside TX for up-to-date enrolled_count
                    const freshLecture = await tx.lectures.findUnique({
                        where: { lecture_id: lecture.lecture_id },
                        select: { enrolled_count: true, capacity: true },
                    });

                    if (freshLecture.enrolled_count >= freshLecture.capacity) {
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
                        // Re-fetch lab inside TX for up-to-date enrolled_count
                        const freshLab = await tx.tutorials_labs.findUnique({
                            where: { tutorial_lab_id: lab.tutorial_lab_id },
                            select: { enrolled_count: true, capacity: true },
                        });

                        if (freshLab.enrolled_count >= freshLab.capacity) {
                            throw new Error(
                                `Lab ${lab.group} for ${lecture.course_offerings.courses.name} is full`
                            );
                        }

                        // Check if student is already enrolled in this lecture
                        const existingEnrollment =
                            await tx.enrollments.findUnique({
                                where: {
                                    student_user_id_lecture_id: {
                                        student_user_id: studentId,
                                        lecture_id: lecture.lecture_id,
                                    },
                                },
                            });

                        if (existingEnrollment) {
                            throw new Error(
                                `Already enrolled in ${lecture.course_offerings.courses.name} (${lecture.course_offerings.course_code})`
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

                        const courseDepartmentId =
                            lecture.course_offerings.courses.department_id;
                        const creditPrice =
                            creditPriceByDepartment.get(courseDepartmentId);
                        const totalAmount =
                            Number(lecture.course_offerings.courses.credits) *
                            Number(creditPrice);

                        const invoice = await tx.invoices.create({
                            data: {
                                student_user_id: studentId,
                                enrollment_id: enrollment.id,
                                course_code:
                                    lecture.course_offerings.course_code,
                                semester: lecture.course_offerings.semester,
                                year: lecture.course_offerings.year,
                                credit_hours:
                                    lecture.course_offerings.courses.credits,
                                credit_price: Number(creditPrice).toFixed(2),
                                total_amount: totalAmount.toFixed(2),
                                status: "pending",
                            },
                        });

                        // Increment enrolled_count for lecture and lab
                        await tx.lectures.update({
                            where: { lecture_id: lecture.lecture_id },
                            data: { enrolled_count: { increment: 1 } },
                        });
                        await tx.tutorials_labs.update({
                            where: { tutorial_lab_id: lab.tutorial_lab_id },
                            data: { enrolled_count: { increment: 1 } },
                        });

                        enrollmentsCreated.push(enrollment);
                        invoicesCreated.push(invoice);
                        totalBilled += totalAmount;
                    }
                }

                return {
                    enrollmentsCreated,
                    invoicesCreated,
                    totalBilled,
                };
            });

            const courseNames = [
                ...new Set(newSessions.map((s) => s.courseName)),
            ];
            const io = req.app.get("io");
            await sendNotification({
                userId: studentId,
                message: `You have successfully registered for: ${courseNames.join(
                    ", "
                )}. A bill of $${result.totalBilled.toFixed(
                    2
                )} was added to your account.`,
                type: "general",
                io,
            });

            res.status(201).json({
                message: "Registration successful",
                enrollments: result.enrollmentsCreated.length,
                details: result.enrollmentsCreated,
                billing: {
                    invoices: result.invoicesCreated.map((invoice) => ({
                        id: invoice.id,
                        course_code: invoice.course_code,
                        total_amount: Number.parseFloat(invoice.total_amount),
                        status: invoice.status,
                    })),
                    totalBilled: Number.parseFloat(
                        result.totalBilled.toFixed(2)
                    ),
                    currency: "USD",
                },
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
// POST /api/registration/register-lab
export const registerLab = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { lectureId, labId } = req.body;

        if (!lectureId || !labId) {
            return res.status(400).json({
                error: "Both lectureId and labId are required",
            });
        }

        // Verify the lecture exists and belongs to an offering
        const lecture = await prisma.lectures.findUnique({
            where: { lecture_id: parseInt(lectureId) },
            include: { course_offerings: { include: { courses: true } } },
        });

        if (!lecture) {
            return res.status(404).json({ error: "Lecture not found" });
        }

        // Check if already enrolled in this lecture
        const existingLectureEnrollment = await prisma.enrollments.findUnique({
            where: {
                student_user_id_lecture_id: {
                    student_user_id: studentId,
                    lecture_id: parseInt(lectureId),
                },
            },
        });

        if (!existingLectureEnrollment) {
            return res.status(400).json({
                error: "You are not enrolled in this lecture. Register for the full course first.",
            });
        }

        if (existingLectureEnrollment.tutorial_lab_id !== null) {
            return res.status(400).json({
                error: "You already have a lab assigned for this lecture. Unregister from the current lab first.",
            });
        }

        // Verify the lab exists and belongs to the same offering
        const lab = await prisma.tutorials_labs.findUnique({
            where: { tutorial_lab_id: parseInt(labId) },
            include: { course_offerings: { include: { courses: true } } },
        });

        if (!lab) {
            return res.status(404).json({ error: "Lab not found" });
        }

        if (lab.offering_id !== lecture.offering_id) {
            return res.status(400).json({
                error: "The selected lab does not belong to the same course offering as the lecture.",
            });
        }

        // Check lab capacity
        if (lab.enrolled_count >= lab.capacity) {
            return res.status(400).json({
                error: `Lab ${lab.group} for ${lab.course_offerings.courses.name} is full`,
            });
        }

        // Check schedule conflict: new lab vs all existing enrolled sessions
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

        const newLabSession = {
            id: lab.tutorial_lab_id,
            type: "lab",
            day_of_week: lab.day_of_week,
            start_time: lab.start_time,
            end_time: lab.end_time,
            courseName: lab.course_offerings.courses.name,
            courseCode: lab.course_offerings.course_code,
        };

        for (const en of existingEnrollments) {
            const sessions = [];
            if (en.lectures)
                sessions.push({
                    id: en.lectures.lecture_id,
                    type: "lecture",
                    day_of_week: en.lectures.day_of_week,
                    start_time: en.lectures.start_time,
                    end_time: en.lectures.end_time,
                    courseName: en.lectures.course_offerings.courses.name,
                    courseCode: en.lectures.course_offerings.course_code,
                });
            if (en.tutorials_labs)
                sessions.push({
                    id: en.tutorials_labs.tutorial_lab_id,
                    type: "lab",
                    day_of_week: en.tutorials_labs.day_of_week,
                    start_time: en.tutorials_labs.start_time,
                    end_time: en.tutorials_labs.end_time,
                    courseName: en.tutorials_labs.course_offerings.courses.name,
                    courseCode: en.tutorials_labs.course_offerings.course_code,
                });
            for (const s of sessions) {
                if (s.id === newLabSession.id && s.type === newLabSession.type)
                    continue;
                if (s.day_of_week !== newLabSession.day_of_week) continue;
                if (
                    timesOverlap(
                        newLabSession.start_time,
                        newLabSession.end_time,
                        s.start_time,
                        s.end_time
                    )
                ) {
                    return res.status(400).json({
                        error: `Schedule conflict on ${
                            newLabSession.day_of_week
                        }: ${newLabSession.courseName} (${
                            newLabSession.courseCode
                        }) [${formatTime(
                            newLabSession.start_time
                        )}-${formatTime(
                            newLabSession.end_time
                        )}] overlaps with ${s.courseName} (${
                            s.courseCode
                        }) [${formatTime(s.start_time)}-${formatTime(
                            s.end_time
                        )}]`,
                    });
                }
            }
        }

        // Update the existing enrollment row with the new lab
        const enrollment = await prisma.enrollments.update({
            where: { id: existingLectureEnrollment.id },
            data: { tutorial_lab_id: parseInt(labId) },
        });

        // Increment lab enrolled_count
        await prisma.tutorials_labs.update({
            where: { tutorial_lab_id: parseInt(labId) },
            data: { enrolled_count: { increment: 1 } },
        });

        const io = req.app.get("io");
        await sendNotification({
            userId: studentId,
            message: `You have been registered for lab ${lab.group} in ${lab.course_offerings.courses.name}.`,
            type: "general",
            io,
        });

        return res.status(201).json({
            message: `Successfully registered for lab ${lab.group} in ${lab.course_offerings.courses.name}.`,
            courseCode: lab.course_offerings.course_code,
            enrollment,
        });
    } catch (err) {
        logger.error("Error registering lab:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// DELETE /api/registration/unregister
export const unregisterSession = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { lectureId, tutorialLabId } = req.body;

        if (!lectureId && !tutorialLabId) {
            return res.status(400).json({
                error: "Must provide either lectureId or tutorialLabId",
            });
        }

        // --- Unregister from a lecture (and its associated lab) ---
        if (lectureId) {
            const lecture = await prisma.lectures.findUnique({
                where: { lecture_id: parseInt(lectureId) },
                include: { course_offerings: { include: { courses: true } } },
            });

            if (!lecture) {
                return res.status(404).json({ error: "Lecture not found" });
            }

            const enrollments = await prisma.enrollments.findMany({
                where: {
                    student_user_id: studentId,
                    lecture_id: parseInt(lectureId),
                },
            });

            if (enrollments.length === 0) {
                return res.status(404).json({
                    error: "No enrollment found for this lecture",
                });
            }

            // Collect distinct lab ids before deleting
            const labIds = [
                ...new Set(
                    enrollments
                        .map((e) => e.tutorial_lab_id)
                        .filter((id) => id !== null)
                ),
            ];

            const enrollmentIds = enrollments.map(
                (enrollment) => enrollment.id
            );

            if (enrollmentIds.length > 0) {
                await prisma.invoices.deleteMany({
                    where: {
                        student_user_id: studentId,
                        enrollment_id: { in: enrollmentIds },
                    },
                });
            }

            const deleteResult = await prisma.enrollments.deleteMany({
                where: {
                    student_user_id: studentId,
                    lecture_id: parseInt(lectureId),
                },
            });

            // Decrement enrolled_count for the lecture and any associated labs
            await prisma.lectures.update({
                where: { lecture_id: parseInt(lectureId) },
                data: { enrolled_count: { decrement: deleteResult.count } },
            });
            for (const labId of labIds) {
                await prisma.tutorials_labs.update({
                    where: { tutorial_lab_id: labId },
                    data: { enrolled_count: { decrement: 1 } },
                });
            }

            const io = req.app.get("io");
            await sendNotification({
                userId: studentId,
                message: `You have been unregistered from ${lecture.course_offerings.courses.name}.`,
                type: "general",
                io,
            });

            return res.status(200).json({
                message: `Successfully unregistered from ${lecture.course_offerings.courses.name}. Lecture and associated lab removed.`,
                courseCode: lecture.course_offerings.course_code,
                enrollmentsDeleted: deleteResult.count,
            });
        }

        // --- Unregister from a lab only (lecture enrollment is kept) ---
        if (tutorialLabId) {
            const tutorialLab = await prisma.tutorials_labs.findUnique({
                where: { tutorial_lab_id: parseInt(tutorialLabId) },
                include: { course_offerings: { include: { courses: true } } },
            });

            if (!tutorialLab) {
                return res
                    .status(404)
                    .json({ error: "Tutorial/Lab not found" });
            }

            const enrollment = await prisma.enrollments.findFirst({
                where: {
                    student_user_id: studentId,
                    tutorial_lab_id: parseInt(tutorialLabId),
                },
            });

            if (!enrollment) {
                return res.status(404).json({
                    error: "No enrollment found for this lab",
                });
            }

            await prisma.enrollments.update({
                where: { id: enrollment.id },
                data: { tutorial_lab_id: null },
            });

            // Decrement lab enrolled_count
            await prisma.tutorials_labs.update({
                where: { tutorial_lab_id: parseInt(tutorialLabId) },
                data: { enrolled_count: { decrement: 1 } },
            });

            const unregIo = req.app.get("io");
            await sendNotification({
                userId: studentId,
                message: `You have been unregistered from the lab for ${tutorialLab.course_offerings.courses.name}.`,
                type: "general",
                io: unregIo,
            });

            return res.status(200).json({
                message: `Successfully unregistered from lab for ${tutorialLab.course_offerings.courses.name}. You can now register the same lecture with a different lab.`,
                courseCode: tutorialLab.course_offerings.course_code,
            });
        }
    } catch (err) {
        logger.error("Error unregistering from course:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};
