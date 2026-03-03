export default {
    paths: {
        // ── Academic Calendar ────────────────────────────────────────────
        "/config/calendar": {
            post: {
                tags: ["System Configuration"],
                summary: "Set academic calendar configuration (stateless)",
                description:
                    "Accepts static academic calendar settings and returns them as confirmation. No data is stored in the database. Requires Admin or Super Admin role.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/AcademicCalendarRequest",
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description:
                            "Calendar configuration received successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/AcademicCalendarResponse",
                                },
                            },
                        },
                    },
                    400: {
                        description: "Missing required fields.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    401: {
                        description: "Unauthorized.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    403: {
                        description: "Forbidden – Admin or Super Admin only.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                },
            },
        },

        // ── Registration Open ─────────────────────────────────────────────
        "/config/registration-open": {
            post: {
                tags: ["System Configuration"],
                summary: "Notify all students that registration is open",
                description:
                    "Sends a campus_announcement notification to every student in the system, informing them that course registration has opened. Requires Admin or Super Admin role.",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "Notifications dispatched successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: {
                                            type: "string",
                                            example:
                                                "Registration-open notification sent to 320 students.",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    401: {
                        description: "Unauthorized.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    403: {
                        description: "Forbidden – Admin or Super Admin only.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    500: {
                        description: "Internal server error.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                },
            },
        },

        // ── Announcements ────────────────────────────────────────────────
        "/config/announcements": {
            get: {
                tags: ["System Configuration"],
                summary: "Get all active announcements",
                description:
                    "Returns announcements whose expire_at is greater than the current time. Requires Admin or Super Admin role.",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "List of active announcements.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/AnnouncementsListResponse",
                                },
                            },
                        },
                    },
                    401: {
                        description: "Unauthorized.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    403: {
                        description: "Forbidden – Admin or Super Admin only.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    500: {
                        description: "Internal server error.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                },
            },
            post: {
                tags: ["System Configuration"],
                summary: "Create a new announcement",
                description:
                    "Creates an announcement. author_id is extracted from the JWT token. publish_at is set to the current request time. expire_at defaults to 2 weeks from publish_at if not provided. Requires Admin or Super Admin role.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/CreateAnnouncementRequest",
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Announcement created successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/AnnouncementResponse",
                                },
                            },
                        },
                    },
                    400: {
                        description: "Validation error.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    401: {
                        description: "Unauthorized.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    403: {
                        description: "Forbidden – Admin or Super Admin only.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    500: {
                        description: "Internal server error.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                },
            },
        },

        "/config/announcements/{id}": {
            patch: {
                tags: ["System Configuration"],
                summary: "Update specific fields of an announcement",
                description:
                    "Partially updates an announcement by ID. Only provided fields are changed. Requires Admin or Super Admin role.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "integer" },
                        description: "Announcement ID.",
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/UpdateAnnouncementRequest",
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Announcement updated successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/AnnouncementResponse",
                                },
                            },
                        },
                    },
                    400: {
                        description:
                            "Validation error or no updatable fields provided.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    401: {
                        description: "Unauthorized.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    403: {
                        description: "Forbidden – Admin or Super Admin only.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    404: {
                        description: "Announcement not found.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    500: {
                        description: "Internal server error.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                },
            },
            delete: {
                tags: ["System Configuration"],
                summary: "Delete an announcement",
                description:
                    "Permanently removes an announcement by ID. Requires Admin or Super Admin role.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "integer" },
                        description: "Announcement ID.",
                    },
                ],
                responses: {
                    200: {
                        description: "Announcement deleted successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                    },
                                },
                            },
                        },
                    },
                    401: {
                        description: "Unauthorized.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    403: {
                        description: "Forbidden – Admin or Super Admin only.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    404: {
                        description: "Announcement not found.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    500: {
                        description: "Internal server error.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                },
            },
        },
    },

    // ── Schemas ──────────────────────────────────────────────────────────────
    schemas: {
        AcademicCalendarRequest: {
            type: "object",
            required: ["semester_start", "semester_end"],
            properties: {
                semester_start: {
                    type: "string",
                    format: "date",
                    example: "2026-02-01",
                },
                registration_deadline: {
                    type: "string",
                    format: "date",
                    example: "2026-02-15",
                    nullable: true,
                },
                midterm_start: {
                    type: "string",
                    format: "date",
                    example: "2026-03-15",
                    nullable: true,
                },
                holiday_name: {
                    type: "string",
                    example: "Spring Break",
                    nullable: true,
                },
                holiday_date: {
                    type: "string",
                    format: "date",
                    example: "2026-04-01",
                    nullable: true,
                },
                semester_end: {
                    type: "string",
                    format: "date",
                    example: "2026-06-30",
                },
            },
        },
        AcademicCalendarResponse: {
            type: "object",
            properties: {
                message: { type: "string" },
                data: { $ref: "#/components/schemas/AcademicCalendarRequest" },
            },
        },
        AnnouncementObject: {
            type: "object",
            properties: {
                id: { type: "integer", example: 1 },
                author_id: {
                    type: "string",
                    format: "uuid",
                    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                },
                title: {
                    type: "string",
                    example: "Midterm Exam Schedule Released",
                },
                content: {
                    type: "string",
                    example:
                        "Please check the portal for the updated midterm schedule.",
                },
                audience: {
                    type: "string",
                    enum: ["All", "Students", "Faculty"],
                    example: "All",
                },
                publish_at: {
                    type: "string",
                    example: "14:30",
                    description: "Time of publication in HH:mm format.",
                },
                expire_at: {
                    type: "string",
                    format: "date-time",
                    example: "2026-03-11T14:30:00.000Z",
                },
            },
        },
        AnnouncementsListResponse: {
            type: "object",
            properties: {
                count: { type: "integer" },
                data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/AnnouncementObject" },
                },
            },
        },
        AnnouncementResponse: {
            type: "object",
            properties: {
                message: { type: "string" },
                data: { $ref: "#/components/schemas/AnnouncementObject" },
            },
        },
        CreateAnnouncementRequest: {
            type: "object",
            required: ["title", "content"],
            properties: {
                title: {
                    type: "string",
                    example: "Midterm Exam Schedule Released",
                },
                content: {
                    type: "string",
                    example:
                        "Please check the portal for the updated midterm schedule.",
                },
                audience: {
                    type: "string",
                    enum: ["All", "Students", "Faculty"],
                    default: "All",
                    example: "All",
                },
                expire_at: {
                    type: "string",
                    format: "date-time",
                    example: "2026-03-11T14:30:00.000Z",
                    description:
                        "Optional. If not provided, defaults to 2 weeks from the creation time.",
                    nullable: true,
                },
            },
        },
        UpdateAnnouncementRequest: {
            type: "object",
            properties: {
                title: { type: "string", example: "Updated Title" },
                content: { type: "string", example: "Updated content text." },
                audience: {
                    type: "string",
                    enum: ["All", "Students", "Faculty"],
                    example: "Students",
                },
                expire_at: {
                    type: "string",
                    format: "date-time",
                    example: "2026-04-01T00:00:00.000Z",
                    nullable: true,
                },
            },
        },
    },
};
