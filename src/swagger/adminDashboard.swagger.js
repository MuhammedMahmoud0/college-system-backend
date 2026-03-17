export default {
    schemas: {
        // ── Shared ─────────────────────────────────────────────────────────
        AdminAlert: {
            type: "object",
            properties: {
                priority: {
                    type: "string",
                    enum: ["low", "medium", "high"],
                    description: "Severity level of the alert.",
                    example: "high",
                },
                message: {
                    type: "string",
                    description: "Human-readable description of the issue.",
                    example: "15 enrolled students have outstanding tuition from a semester that started more than 30 days ago.",
                },
                link: {
                    type: "string",
                    description: "Frontend route related to the alert.",
                    example: "/admin/reports/revenue",
                },
            },
        },

        ActivityItem: {
            type: "object",
            properties: {
                type: {
                    type: "string",
                    description: "Event category.",
                    example: "user_registered",
                },
                timestamp: {
                    type: "string",
                    description: "Date and time in YYYY-MM-DD HH:mm format.",
                    example: "2026-03-04 10:30",
                },
                description: {
                    type: "string",
                    description: "Plain-text description of what happened.",
                    example: "New student account \"Ahmed Ali\" registered.",
                },
                link: {
                    type: "string",
                    description: "Frontend link to the related resource.",
                    example: "/users?id=12345",
                },
            },
        },

        EnrollmentTrendItem: {
            type: "object",
            properties: {
                year: {
                    type: "integer",
                    example: 2024,
                },
                student_count: {
                    type: "integer",
                    description: "Number of distinct actively enrolled students that year.",
                    example: 312,
                },
            },
        },

        PaymentAgingItem: {
            type: "object",
            properties: {
                label: {
                    type: "string",
                    example: "60+ Days",
                },
                student_count: {
                    type: "integer",
                    description: "Number of overdue students in this aging bucket.",
                    example: 15,
                },
            },
        },
    },

    paths: {
        // ── GET /admin/alerts ───────────────────────────────────────────────
        "/admin/alerts": {
            get: {
                tags: ["Admin Dashboard"],
                summary: "Get system alerts",
                description:
                    "Scans the database and returns a list of actionable alerts. Checks for: lectures at ≥95% capacity, new faculty/TA accounts not yet assigned to a course, students with enrollments that do not have a PAID invoice, and courses with ≥20% dropout rate. Restricted to Admin and Super Admin.",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "Alerts retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        count: {
                                            type: "integer",
                                            example: 3,
                                        },
                                        data: {
                                            type: "array",
                                            items: {
                                                $ref: "#/components/schemas/AdminAlert",
                                            },
                                        },
                                    },
                                },
                                example: {
                                    count: 2,
                                    data: [
                                        {
                                            priority: "high",
                                            message: "15 student(s) have payment overdue.",
                                            link: "/admin/stats/payment-aging",
                                        },
                                        {
                                            priority: "medium",
                                            message: "Lecture #7 for CS101 (Fall 2025) is at 97% capacity (58/60 seats filled).",
                                            link: "/course-offerings?course=CS101&year=2025&semester=Fall",
                                        },
                                    ],
                                },
                            },
                        },
                    },
                    401: {
                        description: "Unauthorized — missing or invalid token.",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                    403: {
                        description: "Forbidden — Admin or Super Admin only.",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                    500: {
                        description: "Internal server error.",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
        },

        // ── GET /admin/activity ─────────────────────────────────────────────
        "/admin/activity": {
            get: {
                tags: ["Admin Dashboard"],
                summary: "Get recent activity feed",
                description:
                    "Returns a chronological feed of the most recent system events: new user registrations, community posts, announcements, and task submissions. Sorted newest-first. Restricted to Admin and Super Admin.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "query",
                        name: "limit",
                        schema: { type: "integer", default: 10, minimum: 1, maximum: 50 },
                        required: false,
                        description: "Number of activity items to return (max 50).",
                    },
                ],
                responses: {
                    200: {
                        description: "Activity feed retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        count: { type: "integer", example: 10 },
                                        data: {
                                            type: "array",
                                            items: { $ref: "#/components/schemas/ActivityItem" },
                                        },
                                    },
                                },
                                example: {
                                    count: 2,
                                    data: [
                                        {
                                            type: "user_registered",
                                            timestamp: "2026-03-04 09:15",
                                            description: "New student account \"Sara Mohamed\" registered.",
                                            link: "/users?id=abc-123",
                                        },
                                        {
                                            type: "announcement",
                                            timestamp: "2026-03-03 14:00",
                                            description: "Announcement \"Final Exam Schedule\" published by Admin (Audience: Students).",
                                            link: "/config/announcements/42",
                                        },
                                    ],
                                },
                            },
                        },
                    },
                    401: {
                        description: "Unauthorized — missing or invalid token.",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                    403: {
                        description: "Forbidden — Admin or Super Admin only.",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                    500: {
                        description: "Internal server error.",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
        },

        // ── GET /admin/stats/enrollment-trends ──────────────────────────────
        "/admin/stats/enrollment-trends": {
            get: {
                tags: ["Admin Dashboard"],
                summary: "Get enrollment trends by year",
                description:
                    "Returns the count of distinct actively enrolled students grouped by course offering year. Use the `from` and `to` query params to control the range (defaults: 2021 – current year). Restricted to Admin and Super Admin.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "query",
                        name: "from",
                        schema: { type: "integer", default: 2021 },
                        required: false,
                        description: "Start year (inclusive).",
                    },
                    {
                        in: "query",
                        name: "to",
                        schema: { type: "integer", default: 2026 },
                        required: false,
                        description: "End year (inclusive).",
                    },
                ],
                responses: {
                    200: {
                        description: "Enrollment trends retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        data: {
                                            type: "array",
                                            items: { $ref: "#/components/schemas/EnrollmentTrendItem" },
                                        },
                                    },
                                },
                                example: {
                                    data: [
                                        { year: 2021, student_count: 120 },
                                        { year: 2022, student_count: 185 },
                                        { year: 2023, student_count: 240 },
                                        { year: 2024, student_count: 312 },
                                        { year: 2025, student_count: 298 },
                                        { year: 2026, student_count: 145 },
                                    ],
                                },
                            },
                        },
                    },
                    400: {
                        description: "Invalid year range.",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                                example: { error: "`from` year must be less than or equal to `to` year." },
                            },
                        },
                    },
                    401: {
                        description: "Unauthorized — missing or invalid token.",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                    403: {
                        description: "Forbidden — Admin or Super Admin only.",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                    500: {
                        description: "Internal server error.",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
        },

        // ── GET /admin/stats/payment-aging ──────────────────────────────────
        "/admin/stats/payment-aging": {
            get: {
                tags: ["Admin Dashboard"],
                summary: "Get outstanding payment aging buckets",
                description:
                    "Returns overdue student counts bucketed by days since invoice created_at for invoices with status not equal to paid (pending, failed, refunded): 0–30 days, 31–60 days, and 60+ days. Restricted to Admin and Super Admin.",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "Payment aging data retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        total_overdue_students: { type: "integer", example: 36 },
                                        data: {
                                            type: "array",
                                            items: { $ref: "#/components/schemas/PaymentAgingItem" },
                                        },
                                    },
                                },
                                example: {
                                    total_overdue_students: 36,
                                    data: [
                                        { label: "0-30 Days", student_count: 11 },
                                        { label: "31-60 Days", student_count: 9 },
                                        { label: "60+ Days", student_count: 16 },
                                    ],
                                },
                            },
                        },
                    },
                    401: {
                        description: "Unauthorized — missing or invalid token.",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                    403: {
                        description: "Forbidden — Admin or Super Admin only.",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                    500: {
                        description: "Internal server error.",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
        },

        // ── POST /admin/reports/{reportType} ────────────────────────────────
        "/admin/reports/{reportType}": {
            post: {
                tags: ["Admin Dashboard"],
                summary: "Generate an admin report",
                description:
                    "Queries the relevant database tables and returns structured JSON data ready for frontend export (CSV/PDF). Supported report types: `student-reports`, `academic-transcript`, `revenue`, `retention`, `faculty-workload`, `course-popularity`. Restricted to Admin and Super Admin.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "reportType",
                        required: true,
                        schema: {
                            type: "string",
                            enum: [
                                "student-reports",
                                "academic-transcript",
                                "revenue",
                                "retention",
                                "faculty-workload",
                                "course-popularity",
                            ],
                        },
                        description: "The type of report to generate.",
                    },
                ],
                requestBody: {
                    required: false,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    semester: {
                                        type: "string",
                                        enum: ["Spring", "Fall", "Summer", "Winter"],
                                        description: "Filter by semester (used by: revenue, retention, faculty-workload).",
                                    },
                                    year: {
                                        type: "integer",
                                        description: "Filter by academic year (used by: revenue, retention, faculty-workload).",
                                    },
                                    department_id: {
                                        type: "string",
                                        format: "uuid",
                                        description: "Filter by department UUID (used by: student-reports).",
                                    },
                                    student_id: {
                                        type: "string",
                                        description: "Student ID string — required for academic-transcript.",
                                    },
                                    limit: {
                                        type: "integer",
                                        default: 200,
                                        maximum: 1000,
                                        description: "Maximum number of records to return.",
                                    },
                                },
                            },
                            examples: {
                                "student-reports": {
                                    summary: "All students in a specific department",
                                    value: { department_id: "063e1341-2ace-4cc1-a03f-a61c7535fba8", limit: 100 },
                                },
                                "academic-transcript": {
                                    summary: "Transcript for a specific student",
                                    value: { student_id: "20220001" },
                                },
                                revenue: {
                                    summary: "Revenue for Spring 2026",
                                    value: { semester: "Spring", year: 2026 },
                                },
                                retention: {
                                    summary: "Retention data for Fall 2025",
                                    value: { semester: "Fall", year: 2025 },
                                },
                                "faculty-workload": {
                                    summary: "Faculty workload for Spring 2026",
                                    value: { semester: "Spring", year: 2026 },
                                },
                                "course-popularity": {
                                    summary: "Top 50 most enrolled courses",
                                    value: { limit: 50 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Report generated successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        report_type: { type: "string", example: "revenue" },
                                        generated_at: {
                                            type: "string",
                                            description: "Date and time in YYYY-MM-DD HH:mm format.",
                                            example: "2026-03-04 22:04",
                                        },
                                        data: {
                                            type: "array",
                                            items: { type: "object" },
                                            description: "Report rows – structure varies per report type.",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: "Invalid report type or missing required field.",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                                example: { error: "Body field `student_id` is required for the academic-transcript report." },
                            },
                        },
                    },
                    401: {
                        description: "Unauthorized — missing or invalid token.",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                    403: {
                        description: "Forbidden — Admin or Super Admin only.",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                    404: {
                        description: "Resource not found (e.g., student_id does not exist).",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                                example: { error: "No student found with student_id \"20220099\"." },
                            },
                        },
                    },
                    500: {
                        description: "Internal server error.",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
        },
    },
};
