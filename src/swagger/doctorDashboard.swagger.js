export default {
    schemas: {
        DoctorCourseItem: {
            type: "object",
            properties: {
                offering_id: { type: "integer", example: 5 },
                course_code: { type: "string", example: "CS301" },
                course_name: { type: "string", example: "Database Systems" },
                credits: { type: "integer", example: 3 },
                semester: {
                    type: "string",
                    enum: ["Spring", "Fall", "Summer", "Winter"],
                    example: "Spring",
                },
                year: { type: "integer", example: 2026 },
                total_students: {
                    type: "integer",
                    description:
                        "Sum of enrollment counts across all lectures for this course.",
                    example: 74,
                },
                lectures: {
                    type: "array",
                    items: { $ref: "#/components/schemas/DoctorLectureItem" },
                },
            },
        },

        DoctorLectureItem: {
            type: "object",
            properties: {
                lecture_id: { type: "integer", example: 12 },
                group: { type: "string", nullable: true, example: "G1" },
                day_of_week: { type: "string", example: "Monday" },
                start_time: {
                    type: "string",
                    format: "date-time",
                    example: "09:00:00",
                },
                end_time: {
                    type: "string",
                    format: "date-time",
                    example: "11:00:00",
                },
                location: {
                    type: "string",
                    nullable: true,
                    example: "Hall A",
                },
                capacity: { type: "integer", example: 50 },
                enrollment_count: { type: "integer", example: 37 },
            },
        },

        GradeBreakdownItem: {
            type: "object",
            properties: {
                grade: { type: "string", example: "A" },
                count: { type: "integer", example: 12 },
            },
        },

        LowGradeStudentItem: {
            type: "object",
            properties: {
                student_id: {
                    type: "string",
                    format: "uuid",
                    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                },
                student_name: { type: "string", example: "Ali Hassan" },
                email: {
                    type: "string",
                    format: "email",
                    example: "ali@university.edu",
                },
                grade: { type: "string", enum: ["D", "F"], example: "F" },
                lecture_id: { type: "integer", example: 12 },
                group: { type: "string", nullable: true, example: "G1" },
            },
        },

        DoctorTaskItem: {
            type: "object",
            properties: {
                id: { type: "integer", example: 7 },
                lecture_id: { type: "integer", example: 12 },
                title: { type: "string", example: "Assignment 1" },
                description: {
                    type: "string",
                    nullable: true,
                    example: "Submit a report on normalization.",
                },
                due_date: {
                    type: "string",
                    format: "date-time",
                    nullable: true,
                    example: "2026-04-01T23:59:00Z",
                },
                created_at: {
                    type: "string",
                    format: "date-time",
                    example: "2026-03-12T10:00:00Z",
                },
            },
        },

        DoctorAlertItem: {
            type: "object",
            properties: {
                type: {
                    type: "string",
                    enum: [
                        "active_task",
                        "expired_task",
                        "ungraded_submissions",
                        "low_midterm_scores",
                        "low_work_scores",
                    ],
                    description:
                        "Alert category: active_task, expired_task, ungraded_submissions, low_midterm_scores, or low_work_scores.",
                    example: "active_task",
                },
                label: {
                    type: "string",
                    description:
                        "Human-readable alert message ready to display in the UI.",
                    example:
                        '"Assignment 1" for Database Systems is due in 48h 30m — 5 student(s) have not submitted yet.',
                },
                data: {
                    type: "object",
                    description:
                        "Structured data behind the alert (shape varies by type).",
                },
            },
        },
    },

    paths: {
        "/doctor/courses": {
            get: {
                tags: ["Doctor Dashboard"],
                summary: "Get assigned courses & enrollment stats",
                description:
                    "Returns all lectures assigned to the authenticated doctor, with course details and enrollment counts. The instructor identity is extracted strictly from the JWT token.",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "Courses retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        count: {
                                            type: "integer",
                                            example: 3,
                                        },
                                        courses: {
                                            type: "array",
                                            items: {
                                                $ref: "#/components/schemas/DoctorCourseItem",
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    401: { description: "Unauthorized." },
                    403: { description: "Forbidden — Doctor or Super Admin only." },
                    500: { description: "Internal server error." },
                },
            },
        },

        "/doctor/courses/{courseCode}/analytics": {
            get: {
                tags: ["Doctor Dashboard"],
                summary: "Course performance analytics & low-grade alerts",
                description:
                    "Returns a grade breakdown (bar-chart data) for A/B/C/D/F grades, plus a sorted list of students with a D or F grade (F first, then D) for the specified course taught by the authenticated doctor.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "courseCode",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                        description: "Course code, e.g. CS301",
                        example: "CS301",
                    },
                ],
                responses: {
                    200: {
                        description: "Analytics retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        course_code: {
                                            type: "string",
                                            example: "CS301",
                                        },
                                        grade_breakdown: {
                                            type: "array",
                                            items: {
                                                $ref: "#/components/schemas/GradeBreakdownItem",
                                            },
                                        },
                                        low_grade_alerts: {
                                            type: "object",
                                            properties: {
                                                count: {
                                                    type: "integer",
                                                    example: 5,
                                                },
                                                students: {
                                                    type: "array",
                                                    items: {
                                                        $ref: "#/components/schemas/LowGradeStudentItem",
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    401: { description: "Unauthorized." },
                    403: { description: "Forbidden — Doctor or Super Admin only." },
                    404: {
                        description:
                            "No lectures found for this course assigned to the doctor.",
                    },
                    500: { description: "Internal server error." },
                },
            },
        },

        "/doctor/tasks": {
            post: {
                tags: ["Doctor Dashboard"],
                summary: "Create task for all lectures in a course",
                description:
                    "Creates one task per lecture that the authenticated doctor teaches for the given course. Enrolled students are notified automatically.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["course_code", "title"],
                                properties: {
                                    course_code: {
                                        type: "string",
                                        example: "CS301",
                                    },
                                    title: {
                                        type: "string",
                                        example: "Assignment 1",
                                    },
                                    description: {
                                        type: "string",
                                        example:
                                            "Submit a report on normalization.",
                                    },
                                    due_date: {
                                        type: "string",
                                        format: "date-time",
                                        example: "2026-04-01T23:59:00Z",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description:
                            "Tasks created successfully for all lectures.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: {
                                            type: "string",
                                            example:
                                                "Tasks created successfully for all your lectures in this course.",
                                        },
                                        course_code: {
                                            type: "string",
                                            example: "CS301",
                                        },
                                        lectures_count: {
                                            type: "integer",
                                            example: 2,
                                        },
                                        tasks: {
                                            type: "array",
                                            items: {
                                                $ref: "#/components/schemas/DoctorTaskItem",
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: "course_code and title are required." },
                    401: { description: "Unauthorized." },
                    403: { description: "Forbidden — Doctor or Super Admin only." },
                    404: {
                        description:
                            "No lectures found for this course assigned to the doctor.",
                    },
                    500: { description: "Internal server error." },
                },
            },
        },

        "/doctor/alerts": {
            get: {
                tags: ["Doctor Dashboard"],
                summary: "Doctor alerts (active tasks, expired tasks, ungraded submissions, low score counts)",
                description:
                    "Returns a unified list of labeled alerts for the doctor's dashboard: active tasks with time remaining and unsubmitted counts, expired tasks with failed-to-submit counts, the total number of ungraded submissions, and counts of students below 50% of max in midterm/work. Each alert has a `type`, a human-readable `label`, and a `data` object.",
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
                                            example: 4,
                                        },
                                        alerts: {
                                            type: "array",
                                            items: {
                                                $ref: "#/components/schemas/DoctorAlertItem",
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    401: { description: "Unauthorized." },
                    403: { description: "Forbidden — Doctor or Super Admin only." },
                    500: { description: "Internal server error." },
                },
            },
        },
    },
};
