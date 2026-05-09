import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";
import { getCache, setCache } from "../services/cacheService.js";

// ─── Helper: format a Date as "YYYY-MM-DD HH:mm" ────────────────────────────
const formatDateTime = (date = new Date()) => {
    const d = date instanceof Date ? date : new Date(date);
    const yyyy = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${MM}-${dd} ${hh}:${mm}`;
};

// ─── Helper: compute the start date of a semester/year combo ────────────────
const semesterStartDate = (semester, year) => {
    const monthMap = { Spring: 0, Summer: 5, Fall: 8, Winter: 11 };
    const month = monthMap[semester] ?? 0;
    return new Date(year, month, 1);
};

// ─── Helper: invoice overdue data by student ────────────────────────────────
// Overdue means: enrolled student with NO paid invoice on an enrollment.
// Aging buckets are computed ONLY from invoice.created_at where invoice exists
// and invoice status is not "paid" (pending, failed, refunded).
const getInvoiceOverdueSnapshot = async (now = new Date()) => {
    const enrollments = await prisma.enrollments.findMany({
        where: { status: "enrolled" },
        select: {
            student_user_id: true,
            invoices: {
                select: { status: true, created_at: true },
            },
        },
    });

    const studentsWithoutPaidInvoice = new Set();
    const maxDaysByStudentFromInvoice = new Map();

    for (const enrollment of enrollments) {
        const invoice = enrollment.invoices;
        const hasPaidInvoice = invoice?.status === "paid";
        if (hasPaidInvoice) continue;

        studentsWithoutPaidInvoice.add(enrollment.student_user_id);

        // Payment-aging must use invoice.created_at; skip if invoice is missing.
        if (!invoice?.created_at) continue;

        const createdAt = new Date(invoice.created_at);
        if (Number.isNaN(createdAt.getTime())) continue;

        const daysElapsed = Math.max(
            0,
            Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
        );

        const currentMax =
            maxDaysByStudentFromInvoice.get(enrollment.student_user_id) ?? -1;
        if (daysElapsed > currentMax) {
            maxDaysByStudentFromInvoice.set(enrollment.student_user_id, daysElapsed);
        }
    }

    const overdueStudentsByInvoiceAge = Array.from(
        maxDaysByStudentFromInvoice.entries()
    ).map(([student_user_id, days]) => ({
        student_user_id,
        days,
    }));

    return {
        studentsWithoutPaidInvoiceCount: studentsWithoutPaidInvoice.size,
        overdueStudentsByInvoiceAge,
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /api/v1/admin/alerts
//    Scans real data for urgent issues across capacity, faculty, and financials.
// ─────────────────────────────────────────────────────────────────────────────
export const getAlerts = async (req, res) => {
    try {
        const cacheKey = "v1:admin:alerts";
        const cached = await getCache(cacheKey);
        if (cached) return res.status(200).json(cached);

        const now = new Date();
        const alerts = [];

        // ── Alert A: Lectures at or above 95% capacity ───────────────────────
        const lectures = await prisma.lectures.findMany({
            where: { capacity: { gt: 0 } },
            select: {
                lecture_id: true,
                capacity: true,
                course_offerings: {
                    select: { course_code: true, semester: true, year: true },
                },
                enrollments: {
                    where: { status: "enrolled" },
                    select: { id: true },
                },
            },
        });

        for (const lec of lectures) {
            const count = lec.enrollments.length;
            const pct = count / lec.capacity;
            if (pct >= 0.95) {
                const { course_code, semester, year } = lec.course_offerings;
                alerts.push({
                    priority: pct >= 1 ? "high" : "medium",
                    message: `Lecture #${lec.lecture_id} for ${course_code} (${semester} ${year}) is at ${Math.round(pct * 100)}% capacity (${count}/${lec.capacity} seats filled).`,
                    link: `/course-offerings?course=${course_code}&year=${year}&semester=${semester}`,
                });
            }
        }

        // ── Alert B: New faculty/TA accounts (last 7 days) with no assignment ─
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const newFacultyAccounts = await prisma.users.findMany({
            where: {
                role: { in: ["doctor", "teaching_assistant"] },
                created_at: { gte: sevenDaysAgo },
            },
            select: {
                id: true,
                full_name: true,
                role: true,
                created_at: true,
                lectures: { select: { lecture_id: true }, take: 1 },
                tutorials_labs: { select: { tutorial_lab_id: true }, take: 1 },
            },
        });

        for (const faculty of newFacultyAccounts) {
            const isUnassigned =
                faculty.lectures.length === 0 && faculty.tutorials_labs.length === 0;
            if (isUnassigned) {
                const label =
                    faculty.role === "doctor" ? "Faculty" : "Teaching Assistant";
                alerts.push({
                    priority: "medium",
                    message: `New ${label} account "${faculty.full_name}" (created ${new Date(faculty.created_at).toLocaleDateString("en-GB")}) has not been assigned to any course yet.`,
                    link: `/users?id=${faculty.id}`,
                });
            }
        }

        // ── Alert C: Students with enrolled courses but no PAID invoice ──────
        const invoiceSnapshot = await getInvoiceOverdueSnapshot(now);

        if (invoiceSnapshot.studentsWithoutPaidInvoiceCount > 0) {
            alerts.push({
                priority: "high",
                message: `${invoiceSnapshot.studentsWithoutPaidInvoiceCount} student(s) have payment overdue.`,
                link: `/admin/stats/payment-aging`,
            });
        }

        // ── Alert D: Courses with high dropout rate (≥20%) ───────────────────
        //    Go through lectures to reach enrollments (course_offerings has none direct).
        const lecturesWithEnrollments = await prisma.lectures.findMany({
            select: {
                course_offerings: {
                    select: {
                        offering_id: true,
                        course_code: true,
                        semester: true,
                        year: true,
                    },
                },
                enrollments: { select: { status: true } },
            },
        });

        const offeringMap = new Map();
        for (const lec of lecturesWithEnrollments) {
            const oid = lec.course_offerings.offering_id;
            if (!offeringMap.has(oid)) {
                offeringMap.set(oid, { ...lec.course_offerings, enrollments: [] });
            }
            offeringMap.get(oid).enrollments.push(...lec.enrollments);
        }

        for (const offering of offeringMap.values()) {
            const total = offering.enrollments.length;
            const dropped = offering.enrollments.filter(
                (e) => e.status === "dropped"
            ).length;
            if (total > 0 && dropped / total >= 0.2) {
                alerts.push({
                    priority: "medium",
                    message: `Course ${offering.course_code} (${offering.semester} ${offering.year}) has a ${Math.round((dropped / total) * 100)}% dropout rate (${dropped} out of ${total} students).`,
                    link: `/admin/reports/retention`,
                });
            }
        }

        const response = { count: alerts.length, data: alerts };
        await setCache(cacheKey, response, 180); // 3 min
        return res.status(200).json(response);
    } catch (err) {
        logger.error("Error fetching admin alerts:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET /api/v1/admin/activity
//    Chronological feed of recent system events from multiple tables.
// ─────────────────────────────────────────────────────────────────────────────
export const getRecentActivity = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const cacheKey = `v1:admin:activity:${limit}`;

        const cached = await getCache(cacheKey);
        if (cached) return res.status(200).json(cached);

        const [newUsers, recentPosts, recentAnnouncements, recentSubmissions] =
            await Promise.all([
                prisma.users.findMany({
                    where: { created_at: { not: null } },
                    orderBy: { created_at: "desc" },
                    take: limit,
                    select: { id: true, full_name: true, role: true, created_at: true },
                }),
                prisma.community_posts.findMany({
                    orderBy: { created_at: "desc" },
                    take: limit,
                    select: {
                        id: true,
                        content: true,
                        created_at: true,
                        users: { select: { full_name: true } },
                        community_groups: { select: { name: true } },
                    },
                }),
                prisma.announcements.findMany({
                    orderBy: { publish_at: "desc" },
                    take: limit,
                    select: {
                        id: true,
                        title: true,
                        audience: true,
                        publish_at: true,
                        users: { select: { full_name: true } },
                    },
                }),
                prisma.task_submissions.findMany({
                    orderBy: { submitted_at: "desc" },
                    take: limit,
                    select: {
                        id: true,
                        submitted_at: true,
                        grade: true,
                        users: { select: { full_name: true } },
                        tasks: { select: { title: true } },
                    },
                }),
            ]);

        const rawActivities = [];

        newUsers.forEach((u) => {
            if (u.created_at)
                rawActivities.push({ rawDate: u.created_at, type: "user_registered", payload: u });
        });
        recentPosts.forEach((p) => {
            if (p.created_at)
                rawActivities.push({ rawDate: p.created_at, type: "community_post", payload: p });
        });
        recentAnnouncements.forEach((a) => {
            if (a.publish_at)
                rawActivities.push({ rawDate: a.publish_at, type: "announcement", payload: a });
        });
        recentSubmissions.forEach((s) => {
            if (s.submitted_at)
                rawActivities.push({ rawDate: s.submitted_at, type: "task_submission", payload: s });
        });

        rawActivities.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));

        const result = rawActivities.slice(0, limit).map(({ type, rawDate, payload }) => {
            const d = new Date(rawDate);
            const datePart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            const timestamp = `${datePart} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

            if (type === "user_registered") {
                return {
                    type,
                    timestamp,
                    description: `New ${payload.role.replace(/_/g, " ")} account "${payload.full_name}" registered.`,
                    link: `/users?id=${payload.id}`,
                };
            }
            if (type === "community_post") {
                const group = payload.community_groups?.name ?? "General Feed";
                const preview = payload.content.length > 60 ? `${payload.content.slice(0, 60)}…` : payload.content;
                return {
                    type,
                    timestamp,
                    description: `${payload.users.full_name} posted in "${group}": "${preview}"`,
                    link: `/community/posts/${payload.id}`,
                };
            }
            if (type === "announcement") {
                return {
                    type,
                    timestamp,
                    description: `Announcement "${payload.title}" published by ${payload.users.full_name} (Audience: ${payload.audience}).`,
                    link: `/config/announcements/${payload.id}`,
                };
            }
            if (type === "task_submission") {
                const gradeText = payload.grade != null ? ` (scored ${payload.grade})` : "";
                return {
                    type,
                    timestamp,
                    description: `${payload.users.full_name} submitted task "${payload.tasks.title}"${gradeText}.`,
                    link: `/tasks/${payload.id}`,
                };
            }
            return { type, timestamp };
        });

        const activityResponse = { count: result.length, data: result };
        await setCache(cacheKey, activityResponse, 90); // 90 sec
        return res.status(200).json(activityResponse);
    } catch (err) {
        logger.error("Error fetching recent activity:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET /api/v1/admin/stats/enrollment-trends
//    Active enrolled student count grouped by offering year.
// ─────────────────────────────────────────────────────────────────────────────
export const getEnrollmentTrends = async (req, res) => {
    try {
        const fromYear = parseInt(req.query.from) || 2021;
        const toYear = parseInt(req.query.to) || new Date().getFullYear();

        if (fromYear > toYear) {
            return res
                .status(400)
                .json({ error: "`from` year must be less than or equal to `to` year." });
        }

        const cacheKey = `v1:admin:enrollment-trends:${fromYear}:${toYear}`;
        const cached = await getCache(cacheKey);
        if (cached) return res.status(200).json(cached);

        // Count distinct students enrolled per offering year
        const rows = await prisma.$queryRaw`
            SELECT
                co.year,
                COUNT(DISTINCT e.student_user_id)::int AS student_count
            FROM enrollments e
            JOIN lectures l ON l.lecture_id = e.lecture_id
            JOIN course_offerings co ON co.offering_id = l.offering_id
            WHERE e.status = 'enrolled'
              AND co.year BETWEEN ${fromYear} AND ${toYear}
            GROUP BY co.year
            ORDER BY co.year ASC
        `;

        // Fill years that had zero enrollments
        const yearMap = {};
        for (let y = fromYear; y <= toYear; y++) yearMap[y] = 0;
        rows.forEach((row) => {
            yearMap[row.year] = row.student_count;
        });

        const data = Object.entries(yearMap).map(([year, count]) => ({
            year: parseInt(year),
            student_count: count,
        }));

        const trendsResponse = { data };
        await setCache(cacheKey, trendsResponse, 1800); // 30 min
        return res.status(200).json(trendsResponse);
    } catch (err) {
        logger.error("Error fetching enrollment trends:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. GET /api/v1/admin/stats/payment-aging
//    Sums theoretical outstanding tuition (credits × credit_price) per student
//    enrollment, bucketed by how many days ago their semester started.
// ─────────────────────────────────────────────────────────────────────────────
export const getPaymentAging = async (req, res) => {
    try {
        const cacheKey = "v1:admin:payment-aging";
        const cached = await getCache(cacheKey);
        if (cached) return res.status(200).json(cached);

        const now = new Date();

        const invoiceSnapshot = await getInvoiceOverdueSnapshot(now);
        const overdueStudents = invoiceSnapshot.overdueStudentsByInvoiceAge;

        const buckets = {
            "0-30": 0,
            "31-60": 0,
            "60+": 0,
        };

        for (const student of overdueStudents) {
            if (student.days <= 30) {
                buckets["0-30"] += 1;
            } else if (student.days <= 60) {
                buckets["31-60"] += 1;
            } else {
                buckets["60+"] += 1;
            }
        }

        const totalOverdueStudents = overdueStudents.length;

        const agingResponse = {
            total_overdue_students: totalOverdueStudents,
            data: [
                {
                    label: "0-30 Days",
                    student_count: buckets["0-30"],
                },
                {
                    label: "31-60 Days",
                    student_count: buckets["31-60"],
                },
                {
                    label: "60+ Days",
                    student_count: buckets["60+"],
                },
            ],
        };
        await setCache(cacheKey, agingResponse, 300); // 5 min
        return res.status(200).json(agingResponse);
    } catch (err) {
        logger.error("Error fetching payment aging:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. POST /api/v1/admin/reports/:reportType
//    Queries the necessary tables for each report type and returns JSON
//    ready to be converted to CSV or PDF on the frontend.
// ─────────────────────────────────────────────────────────────────────────────
export const generateReport = async (req, res) => {
    const { reportType } = req.params;

    try {
        // Safe destructure — body may be absent or sent without Content-Type: application/json
        const {
            semester,
            year,
            department_id,
            student_id,
            limit = 200,
        } = req.body ?? {};

        const parsedLimit = Math.min(parseInt(limit) || 200, 1000);
        // ── student-reports ───────────────────────────────────────────────────
        if (reportType === "student-reports") {
            const profileWhere = {};
            if (department_id) profileWhere.department_id = department_id;

            const students = await prisma.student_profiles.findMany({
                where: profileWhere,
                select: {
                    student_id: true,
                    year_level: true,
                    cgpa: true,
                    total_credits: true,
                    departments: { select: { name: true } },
                    users: {
                        select: {
                            full_name: true,
                            email: true,
                            phone: true,
                            created_at: true,
                        },
                    },
                },
                take: parsedLimit,
                orderBy: { student_id: "asc" },
            });

            return res.status(200).json({
                report_type: reportType,
                generated_at: formatDateTime(),
                total: students.length,
                data: students.map((s) => ({
                    student_id: s.student_id,
                    full_name: s.users.full_name,
                    email: s.users.email,
                    phone: s.users.phone ?? null,
                    department: s.departments?.name ?? null,
                    year_level: s.year_level,
                    cgpa: s.cgpa,
                    total_credits: s.total_credits,
                    registered_at: s.users.created_at,
                })),
            });
        }

        // ── academic-transcript ───────────────────────────────────────────────
        if (reportType === "academic-transcript") {
            if (!student_id) {
                return res.status(400).json({
                    error: "Body field `student_id` is required for the academic-transcript report.",
                });
            }

            const profile = await prisma.student_profiles.findUnique({
                where: { student_id },
                select: {
                    student_id: true,
                    cgpa: true,
                    total_credits: true,
                    year_level: true,
                    departments: { select: { name: true } },
                    users: { select: { full_name: true, email: true } },
                },
            });

            if (!profile) {
                return res.status(404).json({
                    error: `No student found with student_id "${student_id}".`,
                });
            }

            // Separate query avoids overly deep Prisma nesting
            const enrollments = await prisma.enrollments.findMany({
                where: { users: { student_profiles: { student_id } } },
                select: {
                    mid_score: true,
                    work_score: true,
                    final_score: true,
                    grade: true,
                    status: true,
                    lectures: {
                        select: {
                            course_offerings: {
                                select: {
                                    course_code: true,
                                    semester: true,
                                    year: true,
                                    courses: { select: { name: true, credits: true } },
                                },
                            },
                        },
                    },
                },
            });

            const courseRows = enrollments.map((e) => {
                const co = e.lectures.course_offerings;
                return {
                    course_code: co.course_code,
                    course_name: co.courses.name,
                    credits: co.courses.credits,
                    semester: co.semester,
                    year: co.year,
                    mid_score: e.mid_score,
                    work_score: e.work_score,
                    final_score: e.final_score,
                    grade: e.grade,
                    status: e.status,
                };
            });

            return res.status(200).json({
                report_type: reportType,
                generated_at: formatDateTime(),
                data: {
                    student_id: profile.student_id,
                    full_name: profile.users.full_name,
                    email: profile.users.email,
                    department: profile.departments?.name ?? null,
                    year_level: profile.year_level,
                    cgpa: profile.cgpa,
                    total_credits: profile.total_credits,
                    courses: courseRows,
                },
            });
        }

        // ── revenue ───────────────────────────────────────────────────────────
        if (reportType === "revenue") {
            const offeringWhere = {};
            if (year) offeringWhere.year = parseInt(year);
            if (semester) offeringWhere.semester = semester;

            const offerings = await prisma.course_offerings.findMany({
                where: offeringWhere,
                select: {
                    offering_id: true,
                    course_code: true,
                    semester: true,
                    year: true,
                    courses: {
                        select: {
                            credits: true,
                            departments: {
                                select: {
                                    name: true,
                                    financials: { select: { credit_price: true } },
                                },
                            },
                        },
                    },
                    lectures: {
                        select: {
                            enrollments: {
                                where: { status: "enrolled" },
                                select: { student_user_id: true },
                            },
                        },
                    },
                },
                take: parsedLimit,
            });

            let grandTotal = 0;
            const rows = offerings.map((o) => {
                const uniqueStudents = new Set(
                    o.lectures.flatMap((l) => l.enrollments.map((e) => e.student_user_id))
                );
                const enrolledCount = uniqueStudents.size;
                const creditPrice = parseFloat(
                    o.courses.departments?.financials?.credit_price ?? 0
                );
                const expectedRevenue = o.courses.credits * creditPrice * enrolledCount;
                grandTotal += expectedRevenue;
                return {
                    offering_id: o.offering_id,
                    course_code: o.course_code,
                    semester: o.semester,
                    year: o.year,
                    department: o.courses.departments?.name ?? null,
                    credits: o.courses.credits,
                    credit_price: creditPrice,
                    enrolled_students: enrolledCount,
                    expected_revenue: parseFloat(expectedRevenue.toFixed(2)),
                };
            });

            return res.status(200).json({
                report_type: reportType,
                generated_at: formatDateTime(),
                total_expected_revenue: parseFloat(grandTotal.toFixed(2)),
                total_offerings: rows.length,
                data: rows,
            });
        }

        // ── retention ─────────────────────────────────────────────────────────
        if (reportType === "retention") {
            // course_offerings has no direct enrollments — go through lectures
            const offerings = await prisma.course_offerings.findMany({
                where: {
                    ...(year ? { year: parseInt(year) } : {}),
                    ...(semester ? { semester } : {}),
                },
                select: {
                    offering_id: true,
                    course_code: true,
                    semester: true,
                    year: true,
                    lectures: {
                        select: {
                            enrollments: { select: { status: true } },
                        },
                    },
                },
                take: parsedLimit,
            });

            const rows = offerings.map((o) => {
                const allEnrollments = o.lectures.flatMap((l) => l.enrollments);
                const total = allEnrollments.length;
                const active = allEnrollments.filter((e) => e.status === "enrolled").length;
                const dropped = allEnrollments.filter((e) => e.status === "dropped").length;
                const completed = allEnrollments.filter((e) => e.status === "completed").length;
                const retentionRate =
                    total > 0
                        ? parseFloat((((active + completed) / total) * 100).toFixed(2))
                        : null;

                return {
                    offering_id: o.offering_id,
                    course_code: o.course_code,
                    semester: o.semester,
                    year: o.year,
                    total_enrolled: total,
                    active,
                    dropped,
                    completed,
                    retention_rate_pct: retentionRate,
                };
            });

            return res.status(200).json({
                report_type: reportType,
                generated_at: formatDateTime(),
                total: rows.length,
                data: rows,
            });
        }

        // ── faculty-workload ──────────────────────────────────────────────────
        if (reportType === "faculty-workload") {
            const lectureFilter = {};
            if (semester || year) {
                lectureFilter.course_offerings = {
                    is: {
                        ...(semester ? { semester } : {}),
                        ...(year ? { year: parseInt(year) } : {}),
                    },
                };
            }

            const faculty = await prisma.users.findMany({
                where: { role: "doctor" },
                select: {
                    id: true,
                    full_name: true,
                    email: true,
                    lectures: {
                        where: Object.keys(lectureFilter).length ? lectureFilter : undefined,
                        select: {
                            lecture_id: true,
                            capacity: true,
                            day_of_week: true,
                            course_offerings: {
                                select: { course_code: true, semester: true, year: true },
                            },
                            enrollments: {
                                where: { status: "enrolled" },
                                select: { id: true },
                            },
                        },
                    },
                },
                take: parsedLimit,
            });

            const rows = faculty.map((f) => ({
                faculty_id: f.id,
                full_name: f.full_name,
                email: f.email,
                total_lectures: f.lectures.length,
                total_enrolled_students: f.lectures.reduce(
                    (sum, l) => sum + l.enrollments.length,
                    0
                ),
                lectures: f.lectures.map((l) => ({
                    lecture_id: l.lecture_id,
                    course_code: l.course_offerings.course_code,
                    semester: l.course_offerings.semester,
                    year: l.course_offerings.year,
                    day_of_week: l.day_of_week,
                    capacity: l.capacity,
                    enrolled: l.enrollments.length,
                })),
            }));

            return res.status(200).json({
                report_type: reportType,
                generated_at: formatDateTime(),
                total: rows.length,
                data: rows,
            });
        }

        // ── course-popularity ─────────────────────────────────────────────────
        if (reportType === "course-popularity") {
            const rows = await prisma.$queryRaw`
                SELECT
                    c.code,
                    c.name,
                    c.credits,
                    d.name                                    AS department,
                    COUNT(DISTINCT co.offering_id)::int       AS total_offerings,
                    COUNT(e.id)::int                          AS total_enrollments,
                    COUNT(DISTINCT e.student_user_id)::int    AS students_number,
                    ROUND(AVG(e.final_score)::numeric, 2)     AS avg_final_score
                FROM courses c
                JOIN departments d ON d.department_id = c.department_id
                LEFT JOIN course_offerings co ON co.course_code = c.code
                LEFT JOIN lectures l ON l.offering_id = co.offering_id
                LEFT JOIN enrollments e
                    ON e.lecture_id = l.lecture_id
                   AND e.status != 'dropped'
                GROUP BY c.code, c.name, c.credits, d.name
                ORDER BY total_enrollments DESC
                LIMIT ${parsedLimit}
            `;

            return res.status(200).json({
                report_type: reportType,
                generated_at: formatDateTime(),
                total: rows.length,
                data: rows,
            });
        }

        // ── unknown report type ───────────────────────────────────────────────
        return res.status(400).json({
            error: `Unknown report type "${reportType}". Valid values: student-reports, academic-transcript, revenue, retention, faculty-workload, course-popularity.`,
        });
    } catch (err) {
        logger.error(`Error generating report [${reportType}]:`, err);
        return res.status(500).json({ error: "Internal server error." });
    }
};
