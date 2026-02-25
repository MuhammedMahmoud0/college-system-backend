export default {
    paths: {
        "/attendance/sessions/start": {
            post: {
                tags: ["Attendance"],
                summary: "Start a live attendance session",
                description:
                    "Start a live QR-based attendance session for a lecture or tutorial. Only doctors and teaching assistants can start sessions.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/StartAttendanceSessionRequest",
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Attendance session started successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/AttendanceSessionResponse",
                                },
                            },
                        },
                    },
                    400: {
                        description: "Validation error",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    403: {
                        description:
                            "Not authorized to start session for this lecture/tutorial",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    404: {
                        description: "Lecture or tutorial not found",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    500: {
                        description: "Internal server error",
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
        "/attendance/sessions/{sessionId}": {
            get: {
                tags: ["Attendance"],
                summary: "Get attendance session details",
                description:
                    "Retrieve current state of an attendance session including present/absent students",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "sessionId",
                        required: true,
                        schema: {
                            type: "string",
                            format: "uuid",
                        },
                        description: "Session ID",
                    },
                ],
                responses: {
                    200: {
                        description: "Session details retrieved successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/SessionDetailsResponse",
                                },
                            },
                        },
                    },
                    404: {
                        description: "Session not found or expired",
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
        "/attendance/sessions/active": {
            get: {
                tags: ["Attendance"],
                summary: "Get active attendance sessions for instructor",
                description:
                    "Retrieve all active attendance sessions for the logged-in instructor",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "Active sessions retrieved successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        sessions: {
                                            type: "array",
                                            items: {
                                                $ref: "#/components/schemas/ActiveSessionSummary",
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/attendance/scan": {
            post: {
                tags: ["Attendance"],
                summary: "Scan QR code for attendance (Student)",
                description:
                    "Students scan the QR code to mark their attendance. Only enrolled students can scan.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ScanQRCodeRequest",
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description:
                            "Attendance marked successfully or already present",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: {
                                            type: "string",
                                            example:
                                                "Attendance marked successfully",
                                        },
                                        status: {
                                            type: "string",
                                            enum: ["present"],
                                            example: "present",
                                        },
                                        sessionId: {
                                            type: "string",
                                            format: "uuid",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: "Invalid or expired QR code",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    403: {
                        description: "Not enrolled in this lecture/tutorial",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    404: {
                        description: "Session not found",
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
        "/attendance/sessions/{sessionId}/end": {
            post: {
                tags: ["Attendance"],
                summary: "End attendance session and save to database",
                description:
                    "End the live attendance session and save all attendance records to the database",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "sessionId",
                        required: true,
                        schema: {
                            type: "string",
                            format: "uuid",
                        },
                        description: "Session ID",
                    },
                ],
                responses: {
                    200: {
                        description:
                            "Session ended and attendance saved successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: {
                                            type: "string",
                                            example:
                                                "Attendance session ended and saved",
                                        },
                                        presentCount: {
                                            type: "integer",
                                            example: 25,
                                        },
                                        totalCount: {
                                            type: "integer",
                                            example: 30,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    403: {
                        description: "Not authorized to end this session",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    404: {
                        description: "Session not found",
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
        "/attendance/sessions/{sessionId}/toggle": {
            put: {
                tags: ["Attendance"],
                summary:
                    "Manually toggle student attendance during active session",
                description:
                    "Instructor can manually mark a student as present or absent during an active session. This allows correcting attendance in real-time.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "sessionId",
                        required: true,
                        schema: {
                            type: "string",
                            format: "uuid",
                        },
                        description: "Session ID",
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ToggleAttendanceRequest",
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Attendance toggled successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: {
                                            type: "string",
                                            example:
                                                "Attendance toggled successfully",
                                        },
                                        student: {
                                            type: "object",
                                            properties: {
                                                user_id: { type: "string" },
                                                full_name: { type: "string" },
                                                email: { type: "string" },
                                                student_id: { type: "string" },
                                                status: {
                                                    type: "string",
                                                    enum: ["present", "absent"],
                                                },
                                            },
                                        },
                                        presentCount: { type: "integer" },
                                        totalCount: { type: "integer" },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: "Validation error",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    403: {
                        description: "Not authorized to modify this session",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    404: {
                        description:
                            "Session not found or student not enrolled",
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
        "/attendance/records/update": {
            put: {
                tags: ["Attendance"],
                summary:
                    "Update attendance record (works even after session ended)",
                description:
                    "Allows instructor to update attendance records even after the session has ended. Useful for students with valid excuses or corrections.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/UpdateAttendanceRecordRequest",
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Attendance record updated successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: {
                                            type: "string",
                                            example:
                                                "Attendance record updated successfully",
                                        },
                                        record: {
                                            type: "object",
                                            properties: {
                                                id: { type: "integer" },
                                                student_user_id: {
                                                    type: "string",
                                                },
                                                lecture_id: {
                                                    type: "integer",
                                                    nullable: true,
                                                },
                                                tutorial_lab_id: {
                                                    type: "integer",
                                                    nullable: true,
                                                },
                                                session_date: {
                                                    type: "string",
                                                    format: "date",
                                                },
                                                status: { type: "string" },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: "Validation error",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    403: {
                        description:
                            "Not authorized to update attendance for this lecture/tutorial",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    404: {
                        description:
                            "Lecture/tutorial not found or student not enrolled",
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
        "/attendance/students": {
            get: {
                tags: ["Attendance"],
                summary: "Get all students with attendance summary",
                description:
                    "Returns all students enrolled in the instructor's lecture or tutorial, along with their overall attendance summary (total sessions, present/absent counts, percentage). Optionally filter by a specific session date to see per-session status.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "lecture_id",
                        in: "query",
                        description:
                            "Lecture ID (provide either this or tutorial_lab_id)",
                        schema: { type: "integer", example: 1 },
                    },
                    {
                        name: "tutorial_lab_id",
                        in: "query",
                        description:
                            "Tutorial/Lab ID (provide either this or lecture_id)",
                        schema: { type: "integer", example: 2 },
                    },
                    {
                        name: "session_date",
                        in: "query",
                        description:
                            "Optional date (YYYY-MM-DD) to also return each student's status for that specific session",
                        schema: {
                            type: "string",
                            format: "date",
                            example: "2025-12-01",
                        },
                    },
                ],
                responses: {
                    200: {
                        description: "List of students with attendance data",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        total_students: {
                                            type: "integer",
                                            example: 30,
                                        },
                                        lecture_id: {
                                            type: "integer",
                                            nullable: true,
                                            example: 1,
                                        },
                                        tutorial_lab_id: {
                                            type: "integer",
                                            nullable: true,
                                            example: null,
                                        },
                                        session_date: {
                                            type: "string",
                                            nullable: true,
                                            example: "2025-12-01",
                                        },
                                        students: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    student_user_id: {
                                                        type: "string",
                                                        format: "uuid",
                                                    },
                                                    student_id: {
                                                        type: "string",
                                                        nullable: true,
                                                        example: "20220001",
                                                    },
                                                    full_name: {
                                                        type: "string",
                                                        example: "Ahmed Ali",
                                                    },
                                                    email: {
                                                        type: "string",
                                                        example:
                                                            "ahmed@example.com",
                                                    },
                                                    avatar_url: {
                                                        type: "string",
                                                        nullable: true,
                                                    },
                                                    total_sessions: {
                                                        type: "integer",
                                                        example: 10,
                                                    },
                                                    present_count: {
                                                        type: "integer",
                                                        example: 8,
                                                    },
                                                    absent_count: {
                                                        type: "integer",
                                                        example: 2,
                                                    },
                                                    attendance_percentage: {
                                                        type: "integer",
                                                        nullable: true,
                                                        example: 80,
                                                    },
                                                    session_status: {
                                                        type: "string",
                                                        nullable: true,
                                                        enum: [
                                                            "present",
                                                            "absent",
                                                            "not_recorded",
                                                        ],
                                                        description:
                                                            "Only included when session_date query param is provided",
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description:
                            "Validation error (missing or conflicting query params)",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    403: {
                        description:
                            "Not authorized to view students for this lecture/tutorial",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    404: {
                        description: "Lecture or tutorial not found",
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
};
