export default {
    paths: {
        // ── Academic Calendar ────────────────────────────────────────────
        "/config/calendar": {
            get: {
                tags: ["System Configuration"],
                summary: "Get all academic calendar events",
                description:
                    "Retrieve all academic calendar events with optional filtering by semester, academic year, or event type. Requires Admin or Super Admin role.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "query",
                        name: "semester",
                        schema: { type: "string" },
                        description: 'Filter by semester (e.g., "Fall 2026")',
                        required: false,
                    },
                    {
                        in: "query",
                        name: "academic_year",
                        schema: { type: "string" },
                        description:
                            'Filter by academic year (e.g., "2026-2027")',
                        required: false,
                    },
                    {
                        in: "query",
                        name: "event_type",
                        schema: {
                            $ref: "#/components/schemas/AcademicCalendarEventType",
                        },
                        description:
                            'Filter by event type (e.g., "registration_start", "registration_end", "payment_start", "payment_end", "semester_start", "exam_week", "holiday")',
                        required: false,
                    },
                ],
                responses: {
                    200: {
                        description: "Calendar events retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/AcademicCalendarListResponse",
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
                summary: "Create a new academic calendar event",
                description:
                    "Add a new event to the academic calendar. If an event with the same event_type and semester already exists, it will be overwritten and return a 200 status. Otherwise, it creates a new event and returns 201. For registration/payment window control, use event_type values registration_start, registration_end, payment_start, and payment_end with semester and academic_year populated. Requires Admin or Super Admin role.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/CreateAcademicCalendarEventRequest",
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Existing calendar event with the same type and semester was overwritten.",
                        content: {
                            "application/json": {
                                schema: {
                                    allOf: [
                                        { $ref: "#/components/schemas/AcademicCalendarEventResponse" },
                                        {
                                            type: "object",
                                            properties: {
                                                overwritten: {
                                                    type: "boolean",
                                                    example: true,
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                    201: {
                        description: "Calendar event created successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/AcademicCalendarEventResponse",
                                },
                            },
                        },
                    },
                    400: {
                        description:
                            "Missing required fields or invalid date format.",
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
        "/config/calendar/{id}": {
            patch: {
                tags: ["System Configuration"],
                summary: "Update an academic calendar event",
                description:
                    "Update an existing calendar event. All fields are optional. Requires Admin or Super Admin role.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "integer" },
                        description: "Calendar event ID",
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/UpdateAcademicCalendarEventRequest",
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Calendar event updated successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/AcademicCalendarEventResponse",
                                },
                            },
                        },
                    },
                    400: {
                        description:
                            "No updatable fields provided or invalid date format.",
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
                        description: "Calendar event not found.",
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
                summary: "Delete an academic calendar event",
                description:
                    "Remove an event from the academic calendar. Requires Admin or Super Admin role.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "integer" },
                        description: "Calendar event ID",
                    },
                ],
                responses: {
                    200: {
                        description: "Calendar event deleted successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: {
                                            type: "string",
                                            example:
                                                "Academic calendar event deleted successfully.",
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
                    404: {
                        description: "Calendar event not found.",
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
                summary: "Get active announcements for current user",
                description:
                    "Returns active announcements filtered by the authenticated user's role. Faculty audience (admin, super_admin, doctor, teaching_assistant) see 'Faculty' + 'All' announcements. Students audience (student, leader) see 'Students' + 'All' announcements. Accessible by any authenticated user.",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description:
                            "List of active announcements visible to the user.",
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
        ErrorResponse: {
            type: "object",
            properties: {
                error: { type: "string", example: "Error message" },
            },
        },
        AcademicCalendarEventType: {
            type: "string",
            enum: [
                "semester_start",
                "semester_end",
                "registration_start",
                "registration_end",
                "payment_start",
                "payment_end",
                "registration_deadline",
                "exam_week",
                "midterm",
                "final_exam",
                "holiday",
                "orientation",
                "other",
            ],
            example: "registration_start",
        },
        AcademicCalendarEventObject: {
            type: "object",
            properties: {
                id: { type: "integer", example: 1 },
                event_name: {
                    type: "string",
                    example: "Fall Semester Start",
                },
                event_type: {
                    allOf: [
                        {
                            $ref: "#/components/schemas/AcademicCalendarEventType",
                        },
                    ],
                    description:
                        "Event type. Payment/registration windows expect: registration_start, registration_end, payment_start, payment_end. Other event types are also allowed.",
                },
                event_date: {
                    type: "string",
                    format: "date",
                    example: "2026-09-01",
                },
                end_date: {
                    type: "string",
                    format: "date",
                    nullable: true,
                    example: "2026-09-05",
                    description: "Optional end date for multi-day events",
                },
                description: {
                    type: "string",
                    nullable: true,
                    example: "First day of Fall 2026 semester",
                },
                semester: {
                    type: "string",
                    nullable: true,
                    example: "Fall",
                },
                academic_year: {
                    type: "string",
                    nullable: true,
                    example: "2026-2027",
                },
                created_at: {
                    type: "string",
                    format: "date-time",
                    example: "2026-03-03T10:00:00.000Z",
                },
                updated_at: {
                    type: "string",
                    format: "date-time",
                    example: "2026-03-03T10:00:00.000Z",
                },
                created_by_user_id: {
                    type: "string",
                    format: "uuid",
                    nullable: true,
                    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                },
                users: {
                    type: "object",
                    nullable: true,
                    properties: {
                        id: {
                            type: "string",
                            format: "uuid",
                            example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                        },
                        full_name: { type: "string", example: "Admin User" },
                    },
                },
            },
        },
        AcademicCalendarListResponse: {
            type: "object",
            properties: {
                message: {
                    type: "string",
                    example: "Academic calendar retrieved successfully.",
                },
                data: {
                    type: "array",
                    items: {
                        $ref: "#/components/schemas/AcademicCalendarEventObject",
                    },
                },
            },
        },
        AcademicCalendarEventResponse: {
            type: "object",
            properties: {
                message: {
                    type: "string",
                    example: "Academic calendar event created successfully.",
                },
                data: {
                    $ref: "#/components/schemas/AcademicCalendarEventObject",
                },
            },
        },
        CreateAcademicCalendarEventRequest: {
            type: "object",
            required: ["event_name", "event_type", "event_date"],
            properties: {
                event_name: {
                    type: "string",
                    example: "Fall Semester Start",
                },
                event_type: {
                    allOf: [
                        {
                            $ref: "#/components/schemas/AcademicCalendarEventType",
                        },
                    ],
                    description:
                        "Event type. Use registration_start/registration_end for registration windows and payment_start/payment_end for payment windows.",
                },
                event_date: {
                    type: "string",
                    format: "date",
                    example: "2026-09-01",
                },
                end_date: {
                    type: "string",
                    format: "date",
                    nullable: true,
                    example: "2026-09-05",
                    description: "Optional end date for multi-day events",
                },
                description: {
                    type: "string",
                    nullable: true,
                    example: "First day of Fall 2026 semester",
                },
                semester: {
                    type: "string",
                    nullable: true,
                    example: "Fall",
                },
                academic_year: {
                    type: "string",
                    nullable: true,
                    example: "2026-2027",
                },
            },
        },
        UpdateAcademicCalendarEventRequest: {
            type: "object",
            properties: {
                event_name: { type: "string", example: "Updated Event Name" },
                event_type: {
                    allOf: [
                        {
                            $ref: "#/components/schemas/AcademicCalendarEventType",
                        },
                    ],
                    description:
                        "Examples: registration_start, registration_end, payment_start, payment_end, holiday.",
                },
                event_date: {
                    type: "string",
                    format: "date",
                    example: "2026-09-02",
                },
                end_date: {
                    type: "string",
                    format: "date",
                    nullable: true,
                    example: "2026-09-06",
                },
                description: {
                    type: "string",
                    nullable: true,
                    example: "Updated description",
                },
                semester: { type: "string", nullable: true, example: "Fall" },
                academic_year: {
                    type: "string",
                    nullable: true,
                    example: "2026-2027",
                },
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
