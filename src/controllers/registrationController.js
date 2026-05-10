import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";
import { sendNotification } from "../utils/notificationService.js";
import { paypalRequest, validatePayPalConfig } from "../config/paypal.js";
import {
    getCurrentSemester,
    getRegistrationPeriod,
} from "../utils/periodHelpers.js";
import {
    getMaxSemesterHours,
    isEligibleForGraduation,
    GRADUATION_CREDITS,
} from "../utils/academicRules.js";
import {
    getCache,
    setCache,
    invalidateByPattern,
} from "../services/cacheService.js";

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

const toMoneyString = (value) => Number.parseFloat(value).toFixed(2);

const isSandboxBypassTransaction = (transactionId) =>
    typeof transactionId === "string" &&
    transactionId.startsWith("sandbox_bypass_");

const extractCaptureId = (transactionId) => {
    if (!transactionId || typeof transactionId !== "string") return null;
    return transactionId.includes(":")
        ? transactionId.split(":")[0]
        : transactionId;
};

const parseSemesterQuery = (semesterQuery, yearQuery) => {
    const cleanedSemester =
        typeof semesterQuery === "string" ? semesterQuery.trim() : "";
    const semesterToken = cleanedSemester
        ? cleanedSemester.split(" ")[0]
        : null;

    const yearFromSemester = Number.parseInt(cleanedSemester.split(" ")[1], 10);
    const parsedYearQuery = Number.parseInt(yearQuery, 10);

    return {
        semester: semesterToken,
        year: Number.isInteger(parsedYearQuery)
            ? parsedYearQuery
            : Number.isInteger(yearFromSemester)
              ? yearFromSemester
              : null,
    };
};

const MANUAL_REGISTRATION_ALLOWED_ROLES = ["student", "leader"];

const normalizeDayName = (day) => {
    const dayMap = {
        sun: "Sunday",
        mon: "Monday",
        tue: "Tuesday",
        wed: "Wednesday",
        thu: "Thursday",
        fri: "Friday",
        sat: "Saturday",
        sunday: "Sunday",
        monday: "Monday",
        tuesday: "Tuesday",
        wednesday: "Wednesday",
        thursday: "Thursday",
        friday: "Friday",
        saturday: "Saturday",
    };

    return dayMap[String(day || "").toLowerCase()] || day;
};

const formatTimeCairo = (dateTime) => {
    if (!dateTime) return null;
    return new Intl.DateTimeFormat("en-US", {
        timeZone: "Africa/Cairo",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(new Date(dateTime));
};

const resolveManualRegistrationTargetStudent = async (studentId) => {
    if (!studentId || typeof studentId !== "string") {
        return {
            ok: false,
            status: 400,
            body: { error: "studentId path parameter is required" },
        };
    }

    const student = await prisma.users.findUnique({
        where: { id: studentId },
        select: {
            id: true,
            full_name: true,
            email: true,
            role: true,
        },
    });

    if (!student) {
        return {
            ok: false,
            status: 404,
            body: { error: "Student/leader user not found" },
        };
    }

    if (!MANUAL_REGISTRATION_ALLOWED_ROLES.includes(student.role)) {
        return {
            ok: false,
            status: 400,
            body: {
                error: "Manual course registration is only supported for users with role student or leader",
            },
        };
    }

    return { ok: true, student };
};

const runWithStudentContext = async ({ req, studentId, runner }) => {
    const originalUser = req.user;
    const originalManualRegistrationBypass = req.manualRegistrationBypass;

    req.user = {
        ...originalUser,
        id: studentId,
        userId: studentId,
    };
    req.manualRegistrationBypass = true;

    try {
        return await runner();
    } finally {
        req.user = originalUser;
        req.manualRegistrationBypass = originalManualRegistrationBypass;
    }
};

const mapEnrollmentInvoice = (invoice) => {
    if (!invoice) return null;

    return {
        id: invoice.id,
        course_code: invoice.course_code,
        semester: invoice.semester,
        year: invoice.year,
        credit_hours: invoice.credit_hours,
        credit_price: Number.parseFloat(invoice.credit_price),
        total_amount: Number.parseFloat(invoice.total_amount),
        status: invoice.status,
        payment_date: invoice.payment_date,
        created_at: invoice.created_at,
        payments: (invoice.payments || []).map((payment) => ({
            id: payment.id,
            gateway: payment.gateway,
            transaction_id: payment.transaction_id,
            amount: Number.parseFloat(payment.amount),
            status: payment.status,
            created_at: payment.created_at,
        })),
    };
};

// GET /api/registration/available-offerings
export const getAvailableOfferings = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // Resolve semester/year from query, then fall back to latest offering.
        const parsedSemesterQuery = parseSemesterQuery(
            req.query.semester,
            req.query.year,
        );

        let currentSemester = parsedSemesterQuery.semester;
        let currentYear = parsedSemesterQuery.year;

        if (!currentSemester || !currentYear) {
            const latestOffering = await getCurrentSemester();

            if (!latestOffering) {
                return res.status(404).json({
                    error: "No course offerings found",
                });
            }

            currentSemester = currentSemester || latestOffering.semester;
            currentYear = currentYear || latestOffering.year;
        }

        if (!currentYear) {
            const latestForSemester = await prisma.course_offerings.findFirst({
                where: { semester: currentSemester },
                orderBy: [{ year: "desc" }, { offering_id: "desc" }],
                select: { year: true },
            });

            currentYear = latestForSemester?.year || null;
        }

        if (!currentSemester || !currentYear) {
            return res.status(400).json({
                error: "Unable to resolve semester/year for offerings",
            });
        }

        const isStaff = [
            "doctor",
            "teaching_assistant",
            "admin",
            "super_admin",
        ].includes(userRole);
        const cacheKey = isStaff
            ? `v1:registration:available:staff:${currentSemester}:${currentYear}`
            : `v1:registration:available:${userId}:${currentSemester}:${currentYear}`;

        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            return res.status(200).json(cachedData);
        }

        const registrationPeriod = await getRegistrationPeriod(
            currentSemester,
            currentYear,
        );

        // Fetch all course offerings for the semester (shared base query)
        const courseOfferings = await prisma.course_offerings.findMany({
            where: {
                semester: currentSemester,
                year: currentYear,
            },
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
                userRole,
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

            const responseData = {
                semester: currentSemester,
                year: currentYear,
                total: offerings.length,
                offerings,
                registrationPeriod,
            };

            await setCache(cacheKey, responseData, 300); // Cache for 5 minutes
            return res.status(200).json(responseData);
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
                (en) => en.lectures.course_offerings.course_code,
            ),
        );

        // Current active enrollments to mark as already enrolled
        const currentEnrollments = await prisma.enrollments.findMany({
            where: { student_user_id: userId, status: "enrolled" },
            select: { lecture_id: true, tutorial_lab_id: true },
        });
        const enrolledLectureIds = new Set(
            currentEnrollments.map((en) => en.lecture_id),
        );
        const enrolledTutorialLabIds = new Set(
            currentEnrollments.map((en) => en.tutorial_lab_id),
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
                completedCourseCodes.has(prereq),
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

        const responseData = {
            semester: currentSemester,
            year: currentYear,
            offerings: availableOfferings,
            registrationPeriod,
        };

        await setCache(cacheKey, responseData, 300); // Cache for 5 minutes
        res.status(200).json(responseData);
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

        const activeSemester = await getCurrentSemester();

        if (!activeSemester) {
            return res.status(404).json({
                error: "No active semester found for registration",
            });
        }

        const registrationPeriod = await getRegistrationPeriod(
            activeSemester.semester,
            activeSemester.year,
        );

        const bypassRegistrationPeriod = req.manualRegistrationBypass === true;

        if (!registrationPeriod.isOpen && !bypassRegistrationPeriod) {
            return res.status(403).json({
                error: "Registration is currently closed",
                registrationPeriod,
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

        const selectedOfferings = [
            ...lectures.map((lecture) => lecture.course_offerings),
            ...labs.map((lab) => lab.course_offerings),
        ];

        const isOutsideActiveRegistrationWindow = selectedOfferings.some(
            (offering) =>
                offering.semester !== activeSemester.semester ||
                offering.year !== activeSemester.year,
        );

        if (isOutsideActiveRegistrationWindow) {
            return res.status(400).json({
                error: `Registration is only allowed for ${activeSemester.semester} ${activeSemester.year} during the active window`,
            });
        }

        // ── Graduation cap & semester hour-limit checks ─────────────
        const studentProfile = await prisma.student_profiles.findUnique({
            where: { user_id: studentId },
            select: { cgpa: true, total_credits: true },
        });

        const completedCredits = studentProfile?.total_credits || 0;

        if (isEligibleForGraduation(completedCredits)) {
            return res.status(400).json({
                error: `You have completed all ${GRADUATION_CREDITS} required credit hours and are eligible for graduation. No further registration is allowed.`,
                graduationProgress: {
                    completed: completedCredits,
                    required: GRADUATION_CREDITS,
                },
            });
        }

        // Sum credit hours the student is already enrolled in this semester
        const currentSemesterEnrollments = await prisma.enrollments.findMany({
            where: {
                student_user_id: studentId,
                status: "enrolled",
                lectures: {
                    course_offerings: {
                        semester: activeSemester.semester,
                        year: activeSemester.year,
                    },
                },
            },
            include: {
                lectures: {
                    include: {
                        course_offerings: { include: { courses: true } },
                    },
                },
            },
        });

        const enrolledSemesterHours = currentSemesterEnrollments.reduce(
            (sum, en) =>
                sum + (en.lectures?.course_offerings?.courses?.credits || 0),
            0,
        );

        // Calculate requested hours from the new lectures
        const requestedHours = lectures.reduce(
            (sum, lecture) =>
                sum + (lecture.course_offerings.courses.credits || 0),
            0,
        );

        const maxSemesterHours = getMaxSemesterHours(studentProfile?.cgpa);

        if (enrolledSemesterHours + requestedHours > maxSemesterHours) {
            return res.status(400).json({
                error: `Cannot register ${requestedHours} credit hours. You already have ${enrolledSemesterHours} hours enrolled this semester. Maximum allowed is ${maxSemesterHours} hours${maxSemesterHours === 18 ? " (GPA > 3.3 allows 21 hours)" : ""}.`,
                semesterHours: {
                    enrolled: enrolledSemesterHours,
                    requested: requestedHours,
                    max: maxSemesterHours,
                },
            });
        }

        const departmentIds = [
            ...new Set(
                lectures
                    .map(
                        (lecture) =>
                            lecture.course_offerings.courses.department_id,
                    )
                    .filter(Boolean),
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
            ]),
        );

        const missingFinancialDepartments = departmentIds.filter(
            (departmentId) => !creditPriceByDepartment.has(departmentId),
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
                    sessionB.end_time,
                )
            ) {
                throw {
                    status: 400,
                    message: `Schedule conflict on ${sessionA.day_of_week}: ${
                        sessionA.courseName
                    } (${sessionA.courseCode}) [${formatTime(
                        sessionA.start_time,
                    )}-${formatTime(sessionA.end_time)}] overlaps with ${
                        sessionB.courseName
                    } (${sessionB.courseCode}) [${formatTime(
                        sessionB.start_time,
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
                            `Lecture ${lecture.course_offerings.courses.name} (${lecture.course_offerings.course_code}) is full`,
                        );
                    }

                    // Find corresponding lab(s) for this offering
                    const courseLabs = labs.filter(
                        (lab) => lab.offering_id === lecture.offering_id,
                    );

                    if (courseLabs.length === 0) {
                        throw new Error(
                            `No lab selected for course ${lecture.course_offerings.courses.name} (${lecture.course_offerings.course_code})`,
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
                                `Lab ${lab.group} for ${lecture.course_offerings.courses.name} is full`,
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
                                `Already enrolled in ${lecture.course_offerings.courses.name} (${lecture.course_offerings.course_code})`,
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
                    ", ",
                )}. A bill of $${result.totalBilled.toFixed(
                    2,
                )} was added to your account.`,
                type: "general",
                io,
            });

            // Invalidate enrollment-dependent caches
            await Promise.all([
                invalidateByPattern("v1:registration:available:*"),
                invalidateByPattern("v1:schedule:student:*"),
                invalidateByPattern("v1:courses:student:*"),
                invalidateByPattern("v1:admin:alerts"),
            ]);

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
                        result.totalBilled.toFixed(2),
                    ),
                    currency: "USD",
                },
                semesterHours: {
                    used: enrolledSemesterHours + requestedHours,
                    max: maxSemesterHours,
                },
                graduationProgress: {
                    completed: completedCredits,
                    required: GRADUATION_CREDITS,
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
                        s.end_time,
                    )
                ) {
                    return res.status(400).json({
                        error: `Schedule conflict on ${
                            newLabSession.day_of_week
                        }: ${newLabSession.courseName} (${
                            newLabSession.courseCode
                        }) [${formatTime(
                            newLabSession.start_time,
                        )}-${formatTime(
                            newLabSession.end_time,
                        )}] overlaps with ${s.courseName} (${
                            s.courseCode
                        }) [${formatTime(s.start_time)}-${formatTime(
                            s.end_time,
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

        const activeSemester = await getCurrentSemester();

        if (!activeSemester) {
            return res.status(404).json({
                error: "No active semester found for registration",
            });
        }

        const registrationPeriod = await getRegistrationPeriod(
            activeSemester.semester,
            activeSemester.year,
        );

        const bypassRegistrationPeriod = req.manualRegistrationBypass === true;

        if (!registrationPeriod.isOpen && !bypassRegistrationPeriod) {
            return res.status(403).json({
                error: "Registration is currently closed. Unregistration and refunds are disabled.",
                registrationPeriod,
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
                        .filter((id) => id !== null),
                ),
            ];

            const enrollmentIds = enrollments.map(
                (enrollment) => enrollment.id,
            );
            let deletedPendingInvoices = 0;
            let refundedPaidInvoices = 0;

            if (enrollmentIds.length > 0) {
                const relatedInvoices = await prisma.invoices.findMany({
                    where: {
                        student_user_id: studentId,
                        enrollment_id: { in: enrollmentIds },
                    },
                    include: {
                        payments: {
                            where: { status: "paid" },
                            orderBy: { created_at: "desc" },
                        },
                    },
                });

                const unpaidInvoiceIds = relatedInvoices
                    .filter((invoice) =>
                        ["pending", "failed"].includes(invoice.status),
                    )
                    .map((invoice) => invoice.id);

                if (unpaidInvoiceIds.length > 0) {
                    const deleteInvoiceResult =
                        await prisma.invoices.deleteMany({
                            where: {
                                student_user_id: studentId,
                                id: { in: unpaidInvoiceIds },
                            },
                        });
                    deletedPendingInvoices = deleteInvoiceResult.count;
                }

                const paidInvoices = relatedInvoices.filter(
                    (invoice) => invoice.status === "paid",
                );

                for (const invoice of paidInvoices) {
                    const latestPaidPayment = invoice.payments[0];

                    if (!latestPaidPayment) {
                        return res.status(400).json({
                            error: `Cannot refund invoice ${invoice.id}: missing payment transaction`,
                        });
                    }

                    let refundTransactionId = null;

                    if (
                        isSandboxBypassTransaction(
                            latestPaidPayment.transaction_id,
                        )
                    ) {
                        refundTransactionId = `sandbox_refund_${Date.now()}:${
                            invoice.id
                        }`;
                    } else {
                        if (!validatePayPalConfig()) {
                            return res.status(500).json({
                                error: "PayPal is not configured on server for refund processing",
                            });
                        }

                        const captureId = extractCaptureId(
                            latestPaidPayment.transaction_id,
                        );

                        if (!captureId) {
                            return res.status(400).json({
                                error: `Cannot refund invoice ${invoice.id}: invalid capture transaction id`,
                            });
                        }

                        const refundResponse = await paypalRequest(
                            `/v2/payments/captures/${captureId}/refund`,
                            {
                                method: "POST",
                                body: JSON.stringify({
                                    amount: {
                                        currency_code: "USD",
                                        value: toMoneyString(
                                            invoice.total_amount,
                                        ),
                                    },
                                }),
                            },
                        );

                        const refundStatus = refundResponse?.status;
                        if (
                            !["COMPLETED", "PENDING"].includes(
                                refundStatus || "",
                            )
                        ) {
                            return res.status(400).json({
                                error: `Refund failed for invoice ${invoice.id}`,
                                paypalStatus: refundStatus || null,
                            });
                        }

                        refundTransactionId =
                            refundResponse?.id ||
                            `paypal_refund_${Date.now()}:${invoice.id}`;
                    }

                    await prisma.$transaction(async (tx) => {
                        await tx.invoices.update({
                            where: { id: invoice.id },
                            data: {
                                status: "refunded",
                            },
                        });

                        await tx.payments.create({
                            data: {
                                invoice_id: invoice.id,
                                gateway: "paypal",
                                transaction_id: refundTransactionId,
                                amount: toMoneyString(invoice.total_amount),
                                status: "refunded",
                            },
                        });
                    });

                    refundedPaidInvoices += 1;
                }
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
                billing: {
                    pendingInvoicesDeleted: deletedPendingInvoices,
                    paidInvoicesRefunded: refundedPaidInvoices,
                },
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

            // Invalidate enrollment-dependent caches
            await Promise.all([
                invalidateByPattern("v1:registration:available:*"),
                invalidateByPattern("v1:schedule:student:*"),
                invalidateByPattern("v1:courses:student:*"),
                invalidateByPattern("v1:admin:alerts"),
            ]);

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

// POST /api/registration/manual-course-registration/students/:studentId/register
export const adminRegisterCoursesForStudent = async (req, res) => {
    try {
        const target = await resolveManualRegistrationTargetStudent(
            req.params.studentId,
        );

        if (!target.ok) {
            return res.status(target.status).json(target.body);
        }

        return runWithStudentContext({
            req,
            studentId: target.student.id,
            runner: () => registerCourses(req, res),
        });
    } catch (err) {
        logger.error("Error in admin manual registration create:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// GET /api/registration/manual-course-registration/students/:studentId/enrollments
export const getManualCourseRegistrationsForStudent = async (req, res) => {
    try {
        const target = await resolveManualRegistrationTargetStudent(
            req.params.studentId,
        );

        if (!target.ok) {
            return res.status(target.status).json(target.body);
        }

        const { status } = req.query;
        const allowedStatuses = ["enrolled", "dropped", "completed"];

        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({
                error: `Invalid status filter. Allowed values: ${allowedStatuses.join(
                    ", ",
                )}`,
            });
        }

        const enrollments = await prisma.enrollments.findMany({
            where: {
                student_user_id: target.student.id,
                ...(status ? { status } : {}),
            },
            include: {
                lectures: {
                    include: {
                        course_offerings: {
                            include: {
                                courses: true,
                            },
                        },
                        users: {
                            select: {
                                id: true,
                                full_name: true,
                            },
                        },
                    },
                },
                tutorials_labs: {
                    include: {
                        course_offerings: {
                            include: {
                                courses: true,
                            },
                        },
                        users: {
                            select: {
                                id: true,
                                full_name: true,
                            },
                        },
                    },
                },
                invoices: {
                    include: {
                        payments: {
                            orderBy: { created_at: "desc" },
                            select: {
                                id: true,
                                gateway: true,
                                transaction_id: true,
                                amount: true,
                                status: true,
                                created_at: true,
                            },
                        },
                    },
                },
            },
            orderBy: { id: "desc" },
        });

        const items = enrollments.map((enrollment) => ({
            id: enrollment.id,
            status: enrollment.status,
            lecture: enrollment.lectures
                ? {
                      lecture_id: enrollment.lectures.lecture_id,
                      course_code:
                          enrollment.lectures.course_offerings.course_code,
                      course_name:
                          enrollment.lectures.course_offerings.courses.name,
                      semester: enrollment.lectures.course_offerings.semester,
                      year: enrollment.lectures.course_offerings.year,
                      day_of_week: enrollment.lectures.day_of_week,
                      start_time: formatTime(enrollment.lectures.start_time),
                      end_time: formatTime(enrollment.lectures.end_time),
                      location: enrollment.lectures.location,
                      instructor: enrollment.lectures.users.full_name,
                  }
                : null,
            tutorialLab: enrollment.tutorials_labs
                ? {
                      tutorial_lab_id:
                          enrollment.tutorials_labs.tutorial_lab_id,
                      course_code:
                          enrollment.tutorials_labs.course_offerings
                              .course_code,
                      course_name:
                          enrollment.tutorials_labs.course_offerings.courses
                              .name,
                      semester:
                          enrollment.tutorials_labs.course_offerings.semester,
                      year: enrollment.tutorials_labs.course_offerings.year,
                      day_of_week: enrollment.tutorials_labs.day_of_week,
                      start_time: formatTime(
                          enrollment.tutorials_labs.start_time,
                      ),
                      end_time: formatTime(enrollment.tutorials_labs.end_time),
                      location: enrollment.tutorials_labs.location,
                      group: enrollment.tutorials_labs.group,
                      type: enrollment.tutorials_labs.type,
                      instructor: enrollment.tutorials_labs.users.full_name,
                  }
                : null,
            invoice: mapEnrollmentInvoice(enrollment.invoices),
        }));

        return res.status(200).json({
            student: target.student,
            total: items.length,
            registrations: items,
        });
    } catch (err) {
        logger.error("Error getting manual student registrations:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// PATCH /api/registration/manual-course-registration/students/:studentId/register-lab
export const adminUpdateStudentRegistrationLab = async (req, res) => {
    try {
        const target = await resolveManualRegistrationTargetStudent(
            req.params.studentId,
        );

        if (!target.ok) {
            return res.status(target.status).json(target.body);
        }

        return runWithStudentContext({
            req,
            studentId: target.student.id,
            runner: () => registerLab(req, res),
        });
    } catch (err) {
        logger.error("Error in admin manual registration update:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// DELETE /api/registration/manual-course-registration/students/:studentId/unregister
export const adminDeleteStudentRegistration = async (req, res) => {
    try {
        const target = await resolveManualRegistrationTargetStudent(
            req.params.studentId,
        );

        if (!target.ok) {
            return res.status(target.status).json(target.body);
        }

        return runWithStudentContext({
            req,
            studentId: target.student.id,
            runner: () => unregisterSession(req, res),
        });
    } catch (err) {
        logger.error("Error in admin manual registration delete:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// GET /api/registration/manual-course-registration/students/:studentId/schedule
export const getManualRegistrationStudentSchedule = async (req, res) => {
    try {
        const target = await resolveManualRegistrationTargetStudent(
            req.params.studentId,
        );

        if (!target.ok) {
            return res.status(target.status).json(target.body);
        }

        const { week, date } = req.query;
        const weekOffset = Number.isInteger(Number.parseInt(week, 10))
            ? Number.parseInt(week, 10)
            : 0;

        const enrollments = await prisma.enrollments.findMany({
            where: {
                student_user_id: target.student.id,
                status: "enrolled",
            },
            include: {
                lectures: {
                    include: {
                        course_offerings: {
                            include: {
                                courses: true,
                            },
                        },
                        users: {
                            select: {
                                full_name: true,
                            },
                        },
                    },
                },
                tutorials_labs: {
                    include: {
                        course_offerings: {
                            include: {
                                courses: true,
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

        const scheduleMap = new Map();

        enrollments.forEach((enrollment) => {
            if (enrollment.lectures) {
                const lecture = enrollment.lectures;
                const dayOfWeek = normalizeDayName(lecture.day_of_week);

                if (!scheduleMap.has(dayOfWeek)) {
                    scheduleMap.set(dayOfWeek, []);
                }

                scheduleMap.get(dayOfWeek).push({
                    courseId: lecture.course_offerings.course_code,
                    courseCode: lecture.course_offerings.course_code,
                    courseName: lecture.course_offerings.courses.name,
                    startTime: formatTimeCairo(lecture.start_time),
                    endTime: formatTimeCairo(lecture.end_time),
                    location: lecture.location || "TBA",
                    instructor: lecture.users.full_name,
                    type: "lecture",
                });
            }

            if (enrollment.tutorials_labs) {
                const tutorialLab = enrollment.tutorials_labs;
                const dayOfWeek = normalizeDayName(tutorialLab.day_of_week);

                if (!scheduleMap.has(dayOfWeek)) {
                    scheduleMap.set(dayOfWeek, []);
                }

                scheduleMap.get(dayOfWeek).push({
                    courseId: tutorialLab.course_offerings.course_code,
                    courseCode: tutorialLab.course_offerings.course_code,
                    courseName: tutorialLab.course_offerings.courses.name,
                    startTime: formatTimeCairo(tutorialLab.start_time),
                    endTime: formatTimeCairo(tutorialLab.end_time),
                    location: tutorialLab.location || "TBA",
                    instructor: tutorialLab.users.full_name,
                    type: tutorialLab.type.toLowerCase(),
                });
            }
        });

        const daysOrder = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ];

        let baseDate = new Date();
        if (date) {
            const parsedDate = new Date(date);
            if (Number.isNaN(parsedDate.getTime())) {
                return res.status(400).json({
                    error: "Invalid date query parameter format. Use YYYY-MM-DD",
                });
            }
            baseDate = parsedDate;
        }

        const startOfWeek = new Date(baseDate);
        startOfWeek.setDate(
            startOfWeek.getDate() - startOfWeek.getDay() + weekOffset * 7,
        );

        const schedule = daysOrder.map((day, index) => {
            const currentDate = new Date(startOfWeek);
            currentDate.setDate(startOfWeek.getDate() + index);

            return {
                day,
                date: currentDate.toISOString().split("T")[0],
                classes: (scheduleMap.get(day) || []).sort((a, b) =>
                    a.startTime.localeCompare(b.startTime),
                ),
            };
        });

        return res.status(200).json({
            student: target.student,
            schedule,
        });
    } catch (err) {
        logger.error("Error getting manual student schedule:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
