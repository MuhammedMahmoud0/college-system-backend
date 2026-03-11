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
        "/attendance/sessions/{sessionId}/live-info": {
            get: {
                tags: ["Attendance"],
                summary: "Get session live info",
                description:
                    "Returns is_live, latitude, and longitude for an active attendance session. Accessible by all authenticated users.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "sessionId",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                        description: "Session ID",
                    },
                ],
                responses: {
                    200: {
                        description: "Live info retrieved successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        sessionId: {
                                            type: "string",
                                            format: "uuid",
                                            example:
                                                "550e8400-e29b-41d4-a716-446655440000",
                                        },
                                        is_live: {
                                            type: "boolean",
                                            description:
                                                "Whether the session uses live (selfie) attendance",
                                            example: true,
                                        },
                                        latitude: {
                                            type: "number",
                                            format: "double",
                                            nullable: true,
                                            example: 31.2001,
                                        },
                                        longitude: {
                                            type: "number",
                                            format: "double",
                                            nullable: true,
                                            example: 29.9187,
                                        },
                                    },
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
        "/attendance/sessions/my-active": {
            get: {
                tags: ["Attendance"],
                summary:
                    "Get active attendance session for the logged-in student",
                description:
                    "Returns the active attendance session(s) the student is enrolled in. Includes the current QR code, location data, and whether the student has already been marked present.",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "Active session found",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        sessions: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    sessionId: {
                                                        type: "string",
                                                        example:
                                                            "uuid-session-id",
                                                    },
                                                    session_type: {
                                                        type: "string",
                                                        enum: [
                                                            "lecture",
                                                            "tutorial_lab",
                                                        ],
                                                        example: "lecture",
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
                                                        example: "2026-03-11",
                                                    },
                                                    is_live: {
                                                        type: "boolean",
                                                        example: true,
                                                    },
                                                    latitude: {
                                                        type: "number",
                                                        nullable: true,
                                                        example: 31.2001,
                                                    },
                                                    longitude: {
                                                        type: "number",
                                                        nullable: true,
                                                        example: 29.9187,
                                                    },
                                                    qr_code: {
                                                        type: "string",
                                                        example:
                                                            "sessionId:timestamp:random",
                                                    },
                                                    qr_expiry: {
                                                        type: "integer",
                                                        example: 1741705200000,
                                                    },
                                                    already_marked: {
                                                        type: "boolean",
                                                        example: false,
                                                    },
                                                    course_name: {
                                                        type: "string",
                                                        nullable: true,
                                                        example:
                                                            "Data Structures",
                                                    },
                                                    course_code: {
                                                        type: "string",
                                                        nullable: true,
                                                        example: "CS301",
                                                    },
                                                    group: {
                                                        type: "string",
                                                        nullable: true,
                                                        example: "A",
                                                    },
                                                    location: {
                                                        type: "string",
                                                        nullable: true,
                                                        example: "Hall 3",
                                                    },
                                                    day_of_week: {
                                                        type: "string",
                                                        nullable: true,
                                                        example: "Monday",
                                                    },
                                                    start_time: {
                                                        type: "string",
                                                        nullable: true,
                                                        example: "09:00",
                                                    },
                                                    end_time: {
                                                        type: "string",
                                                        nullable: true,
                                                        example: "11:00",
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: {
                        description: "No active attendance session found",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        error: {
                                            type: "string",
                                            example:
                                                "No active attendance session found",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/attendance/sessions": {
            get: {
                tags: ["Attendance"],
                summary: "Get all attendance sessions with students",
                description:
                    "Returns all saved attendance sessions grouped by date, each with the full list of students and their status. Requires either lecture_id or tutorial_lab_id.",
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
                ],
                responses: {
                    200: {
                        description: "Sessions retrieved successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        total_sessions: {
                                            type: "integer",
                                            example: 5,
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
                                        sessions: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    session_date: {
                                                        type: "string",
                                                        format: "date",
                                                        example: "2026-02-10",
                                                    },
                                                    lecture_id: {
                                                        type: "integer",
                                                        nullable: true,
                                                    },
                                                    tutorial_lab_id: {
                                                        type: "integer",
                                                        nullable: true,
                                                    },
                                                    is_live: {
                                                        type: "boolean",
                                                        example: false,
                                                    },
                                                    longitude: {
                                                        type: "number",
                                                        nullable: true,
                                                        example: 123885,
                                                    },
                                                    latitude: {
                                                        type: "number",
                                                        nullable: true,
                                                        example: 2326,
                                                    },
                                                    students: {
                                                        type: "array",
                                                        items: {
                                                            type: "object",
                                                            properties: {
                                                                student_user_id:
                                                                    {
                                                                        type: "string",
                                                                        format: "uuid",
                                                                    },
                                                                student_id: {
                                                                    type: "string",
                                                                    nullable: true,
                                                                },
                                                                full_name: {
                                                                    type: "string",
                                                                },
                                                                email: {
                                                                    type: "string",
                                                                },
                                                                avatar_url: {
                                                                    type: "string",
                                                                    nullable: true,
                                                                },
                                                                status: {
                                                                    type: "string",
                                                                    enum: [
                                                                        "present",
                                                                        "absent",
                                                                    ],
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
                        description: "Not authorized",
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
        "/attendance/my-history": {
            get: {
                tags: ["Attendance"],
                summary: "Get my attendance history (Student)",
                description:
                    "Returns the logged-in student's full attendance history grouped by date. Each date lists all sessions (lectures and/or labs) with status, course info, and location.",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description:
                            "Attendance history retrieved successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        total_sessions: {
                                            type: "integer",
                                            example: 20,
                                        },
                                        present_count: {
                                            type: "integer",
                                            example: 17,
                                        },
                                        absent_count: {
                                            type: "integer",
                                            example: 3,
                                        },
                                        attendance_percentage: {
                                            type: "integer",
                                            nullable: true,
                                            example: 85,
                                        },
                                        history: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    date: {
                                                        type: "string",
                                                        format: "date",
                                                        example: "2026-02-10",
                                                    },
                                                    sessions: {
                                                        type: "array",
                                                        items: {
                                                            type: "object",
                                                            properties: {
                                                                attendance_id: {
                                                                    type: "integer",
                                                                },
                                                                session_type: {
                                                                    type: "string",
                                                                    enum: [
                                                                        "lecture",
                                                                        "tutorial_lab",
                                                                    ],
                                                                },
                                                                lecture_id: {
                                                                    type: "integer",
                                                                    nullable: true,
                                                                },
                                                                tutorial_lab_id:
                                                                    {
                                                                        type: "integer",
                                                                        nullable: true,
                                                                    },
                                                                course_name: {
                                                                    type: "string",
                                                                    nullable: true,
                                                                    example:
                                                                        "Data Structures",
                                                                },
                                                                course_code: {
                                                                    type: "string",
                                                                    nullable: true,
                                                                    example:
                                                                        "CS201",
                                                                },
                                                                group: {
                                                                    type: "string",
                                                                    nullable: true,
                                                                    example:
                                                                        "G1",
                                                                },
                                                                tutorial_type: {
                                                                    type: "string",
                                                                    nullable: true,
                                                                    example:
                                                                        "lab",
                                                                },
                                                                location: {
                                                                    type: "string",
                                                                    nullable: true,
                                                                },
                                                                day_of_week: {
                                                                    type: "string",
                                                                    nullable: true,
                                                                    example:
                                                                        "Monday",
                                                                },
                                                                start_time: {
                                                                    type: "string",
                                                                    nullable: true,
                                                                },
                                                                end_time: {
                                                                    type: "string",
                                                                    nullable: true,
                                                                },
                                                                status: {
                                                                    type: "string",
                                                                    enum: [
                                                                        "present",
                                                                        "absent",
                                                                    ],
                                                                },
                                                                is_live: {
                                                                    type: "boolean",
                                                                    example: false,
                                                                },
                                                                longitude: {
                                                                    type: "number",
                                                                    nullable: true,
                                                                },
                                                                latitude: {
                                                                    type: "number",
                                                                    nullable: true,
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
                        },
                    },
                    401: {
                        description: "Unauthorized",
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
        "/attendance/grid": {
            get: {
                tags: ["Attendance"],
                summary: "Get attendance grid",
                description:
                    "Returns all enrolled students (rows) × all session dates (columns). Each cell contains the attendance_id and status (present/absent) or null if no record exists for that student on that date. Use PUT /attendance/records/update to toggle a cell's status.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "query",
                        name: "lecture_id",
                        schema: { type: "integer" },
                        description:
                            "ID of the lecture (provide either this or tutorial_lab_id)",
                    },
                    {
                        in: "query",
                        name: "tutorial_lab_id",
                        schema: { type: "integer" },
                        description:
                            "ID of the tutorial/lab (provide either this or lecture_id)",
                    },
                ],
                responses: {
                    200: {
                        description: "Attendance grid returned successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        lecture_id: {
                                            type: "integer",
                                            nullable: true,
                                        },
                                        tutorial_lab_id: {
                                            type: "integer",
                                            nullable: true,
                                        },
                                        total_students: {
                                            type: "integer",
                                            example: 25,
                                        },
                                        total_sessions: {
                                            type: "integer",
                                            example: 4,
                                        },
                                        dates: {
                                            type: "array",
                                            items: {
                                                type: "string",
                                                format: "date",
                                                example: "2025-10-13",
                                            },
                                            description:
                                                "Sorted list of all session dates (grid column headers)",
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
                                                    },
                                                    full_name: {
                                                        type: "string",
                                                    },
                                                    email: { type: "string" },
                                                    avatar_url: {
                                                        type: "string",
                                                        nullable: true,
                                                    },
                                                    present_count: {
                                                        type: "integer",
                                                    },
                                                    absent_count: {
                                                        type: "integer",
                                                    },
                                                    attendance_percentage: {
                                                        type: "integer",
                                                        nullable: true,
                                                        example: 75,
                                                    },
                                                    attendance: {
                                                        type: "object",
                                                        description:
                                                            "Keys are session dates (YYYY-MM-DD). Value is null when no record exists, otherwise { attendance_id, status }.",
                                                        additionalProperties: {
                                                            nullable: true,
                                                            type: "object",
                                                            properties: {
                                                                attendance_id: {
                                                                    type: "integer",
                                                                },
                                                                status: {
                                                                    type: "string",
                                                                    enum: [
                                                                        "present",
                                                                        "absent",
                                                                    ],
                                                                },
                                                            },
                                                        },
                                                        example: {
                                                            "2025-10-13": {
                                                                attendance_id: 5,
                                                                status: "absent",
                                                            },
                                                            "2025-10-15": {
                                                                attendance_id: 6,
                                                                status: "present",
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
                            "Not authorized to view attendance for this lecture/tutorial",
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
        "/attendance/stats/avg": {
            get: {
                tags: ["Attendance"],
                summary: "Get average attendance rate",
                description:
                    "Returns the average attendance rate across all enrolled students for a lecture or tutorial. Rate is the mean of each student's individual attendance percentage.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "query",
                        name: "lecture_id",
                        schema: { type: "integer" },
                        description: "ID of the lecture",
                    },
                    {
                        in: "query",
                        name: "tutorial_lab_id",
                        schema: { type: "integer" },
                        description: "ID of the tutorial/lab",
                    },
                ],
                responses: {
                    200: {
                        description: "Average attendance rate",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        lecture_id: {
                                            type: "integer",
                                            nullable: true,
                                        },
                                        tutorial_lab_id: {
                                            type: "integer",
                                            nullable: true,
                                        },
                                        total_students: {
                                            type: "integer",
                                            example: 25,
                                        },
                                        total_sessions: {
                                            type: "integer",
                                            example: 4,
                                        },
                                        avg_attendance_rate: {
                                            type: "integer",
                                            nullable: true,
                                            example: 92,
                                            description:
                                                "Percentage (0-100), null if no sessions yet",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: "Missing/conflicting query params",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    403: {
                        description: "Unauthorized",
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
        "/attendance/stats/lowest": {
            get: {
                tags: ["Attendance"],
                summary: "Get lowest attendance students",
                description:
                    "Returns the students with the lowest attendance rates for a lecture or tutorial. Only students who have at least one recorded session are included.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "query",
                        name: "lecture_id",
                        schema: { type: "integer" },
                        description: "ID of the lecture",
                    },
                    {
                        in: "query",
                        name: "tutorial_lab_id",
                        schema: { type: "integer" },
                        description: "ID of the tutorial/lab",
                    },
                    {
                        in: "query",
                        name: "limit",
                        schema: { type: "integer", default: 3 },
                        description: "Number of students to return (default 3)",
                    },
                ],
                responses: {
                    200: {
                        description: "Lowest attendance students",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        lecture_id: {
                                            type: "integer",
                                            nullable: true,
                                        },
                                        tutorial_lab_id: {
                                            type: "integer",
                                            nullable: true,
                                        },
                                        limit: { type: "integer", example: 3 },
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
                                                    },
                                                    full_name: {
                                                        type: "string",
                                                    },
                                                    email: { type: "string" },
                                                    avatar_url: {
                                                        type: "string",
                                                        nullable: true,
                                                    },
                                                    present_count: {
                                                        type: "integer",
                                                    },
                                                    absent_count: {
                                                        type: "integer",
                                                    },
                                                    total_sessions: {
                                                        type: "integer",
                                                    },
                                                    attendance_percentage: {
                                                        type: "integer",
                                                        nullable: true,
                                                        example: 75,
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
                        description: "Missing/conflicting query params",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    403: {
                        description: "Unauthorized",
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
        "/attendance/stats/trend": {
            get: {
                tags: ["Attendance"],
                summary: "Get attendance trend by week",
                description:
                    "Returns attendance data grouped by relative week (Week 1, Week 2, …) anchored to the first session date. Useful for charting attendance trends over time.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "query",
                        name: "lecture_id",
                        schema: { type: "integer" },
                        description: "ID of the lecture",
                    },
                    {
                        in: "query",
                        name: "tutorial_lab_id",
                        schema: { type: "integer" },
                        description: "ID of the tutorial/lab",
                    },
                ],
                responses: {
                    200: {
                        description: "Weekly attendance trend",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        lecture_id: {
                                            type: "integer",
                                            nullable: true,
                                        },
                                        tutorial_lab_id: {
                                            type: "integer",
                                            nullable: true,
                                        },
                                        total_weeks: {
                                            type: "integer",
                                            example: 4,
                                        },
                                        weeks: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    week: {
                                                        type: "integer",
                                                        example: 1,
                                                        description:
                                                            "Relative week number starting from 1",
                                                    },
                                                    session_dates: {
                                                        type: "array",
                                                        items: {
                                                            type: "string",
                                                            format: "date",
                                                        },
                                                        example: [
                                                            "2025-10-13",
                                                            "2025-10-15",
                                                        ],
                                                    },
                                                    present_count: {
                                                        type: "integer",
                                                    },
                                                    absent_count: {
                                                        type: "integer",
                                                    },
                                                    total_count: {
                                                        type: "integer",
                                                    },
                                                    attendance_rate: {
                                                        type: "integer",
                                                        nullable: true,
                                                        example: 88,
                                                        description:
                                                            "Percentage (0-100)",
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
                        description: "Missing/conflicting query params",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    403: {
                        description: "Unauthorized",
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
        "/attendance/admin/overall-rate": {
            get: {
                tags: ["Attendance - Admin"],
                summary: "Overall college attendance rate",
                description:
                    "Returns the overall attendance rate computed across every attendance record in the college (admin only).",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "Overall rate",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        total_records: { type: "integer" },
                                        present_count: { type: "integer" },
                                        absent_count: { type: "integer" },
                                        overall_attendance_rate: {
                                            type: "integer",
                                            nullable: true,
                                            example: 92,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    403: {
                        description: "Unauthorized",
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
        "/attendance/admin/lowest-courses": {
            get: {
                tags: ["Attendance - Admin"],
                summary: "Courses with lowest attendance",
                description:
                    "Returns courses ranked by lowest attendance rate.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "query",
                        name: "limit",
                        schema: { type: "integer", default: 5 },
                        description: "Number of courses to return",
                    },
                ],
                responses: {
                    200: {
                        description: "Lowest attendance courses",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        limit: { type: "integer" },
                                        courses: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    course_code: {
                                                        type: "string",
                                                    },
                                                    course_name: {
                                                        type: "string",
                                                        nullable: true,
                                                    },
                                                    department_name: {
                                                        type: "string",
                                                        nullable: true,
                                                    },
                                                    present: {
                                                        type: "integer",
                                                    },
                                                    total: { type: "integer" },
                                                    attendance_rate: {
                                                        type: "integer",
                                                        nullable: true,
                                                        example: 78,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    403: {
                        description: "Unauthorized",
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
        "/attendance/admin/trend": {
            get: {
                tags: ["Attendance - Admin"],
                summary: "Attendance trend over time",
                description:
                    "Returns attendance rate grouped by month for the line trend chart. Filters: department_id, semester, course_code.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "query",
                        name: "department_id",
                        schema: { type: "string", format: "uuid" },
                        description: "Filter by department",
                    },
                    {
                        in: "query",
                        name: "semester",
                        schema: {
                            type: "string",
                            enum: ["Spring", "Fall", "Summer", "Winter"],
                        },
                        description: "Filter by semester",
                    },
                    {
                        in: "query",
                        name: "course_code",
                        schema: { type: "string" },
                        description: "Filter by course code",
                    },
                ],
                responses: {
                    200: {
                        description: "Monthly trend data",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        filters: { type: "object" },
                                        total_months: { type: "integer" },
                                        trend: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    month: {
                                                        type: "string",
                                                        example: "2026-01",
                                                    },
                                                    month_label: {
                                                        type: "string",
                                                        example: "Jan 2026",
                                                    },
                                                    present: {
                                                        type: "integer",
                                                    },
                                                    total: { type: "integer" },
                                                    attendance_rate: {
                                                        type: "integer",
                                                        nullable: true,
                                                        example: 90,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    403: {
                        description: "Unauthorized",
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
        "/attendance/admin/dept-comparison": {
            get: {
                tags: ["Attendance - Admin"],
                summary: "Department attendance comparison",
                description:
                    "Returns attendance rate per department for the bar chart. Filters: department_id, semester, course_code.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "query",
                        name: "department_id",
                        schema: { type: "string", format: "uuid" },
                        description: "Filter to a specific department",
                    },
                    {
                        in: "query",
                        name: "semester",
                        schema: {
                            type: "string",
                            enum: ["Spring", "Fall", "Summer", "Winter"],
                        },
                    },
                    {
                        in: "query",
                        name: "course_code",
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    200: {
                        description: "Per-department attendance rates",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        filters: { type: "object" },
                                        departments: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    department_id: {
                                                        type: "string",
                                                    },
                                                    department_name: {
                                                        type: "string",
                                                    },
                                                    present: {
                                                        type: "integer",
                                                    },
                                                    total: { type: "integer" },
                                                    attendance_rate: {
                                                        type: "integer",
                                                        nullable: true,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    403: {
                        description: "Unauthorized",
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
        "/attendance/admin/distribution": {
            get: {
                tags: ["Attendance - Admin"],
                summary: "Attendance distribution (pie chart)",
                description:
                    "Returns count and percentage of students in each attendance bucket: Excellent (90-100%), Good (80-89%), Fair (70-79%), Poor (<70%). Filters: department_id, semester, course_code.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "query",
                        name: "department_id",
                        schema: { type: "string", format: "uuid" },
                    },
                    {
                        in: "query",
                        name: "semester",
                        schema: {
                            type: "string",
                            enum: ["Spring", "Fall", "Summer", "Winter"],
                        },
                    },
                    {
                        in: "query",
                        name: "course_code",
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    200: {
                        description: "Distribution buckets",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        filters: { type: "object" },
                                        total_students: { type: "integer" },
                                        distribution: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    label: {
                                                        type: "string",
                                                        example: "Excellent",
                                                    },
                                                    range: {
                                                        type: "string",
                                                        example: "90-100%",
                                                    },
                                                    count: { type: "integer" },
                                                    percentage: {
                                                        type: "integer",
                                                        example: 45,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    403: {
                        description: "Unauthorized",
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
        "/attendance/admin/top-students": {
            get: {
                tags: ["Attendance - Admin"],
                summary: "Top performing students",
                description:
                    "Returns the top N students by attendance rate. Filters: department_id, semester, course_code. Default limit: 5.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "query",
                        name: "department_id",
                        schema: { type: "string", format: "uuid" },
                    },
                    {
                        in: "query",
                        name: "semester",
                        schema: {
                            type: "string",
                            enum: ["Spring", "Fall", "Summer", "Winter"],
                        },
                    },
                    {
                        in: "query",
                        name: "course_code",
                        schema: { type: "string" },
                    },
                    {
                        in: "query",
                        name: "limit",
                        schema: { type: "integer", default: 5 },
                    },
                ],
                responses: {
                    200: {
                        description: "Top students",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        filters: { type: "object" },
                                        limit: { type: "integer" },
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
                                                    },
                                                    full_name: {
                                                        type: "string",
                                                    },
                                                    department_name: {
                                                        type: "string",
                                                        nullable: true,
                                                    },
                                                    attendance_percentage: {
                                                        type: "integer",
                                                        example: 98,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    403: {
                        description: "Unauthorized",
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
        "/attendance/admin/students": {
            get: {
                tags: ["Attendance - Admin"],
                summary: "Students attendance table",
                description:
                    "Returns all students with their average attendance rate, major, and name. Filters: department_id, course_code, search (name).",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "query",
                        name: "department_id",
                        schema: { type: "string", format: "uuid" },
                        description: "Filter by department",
                    },
                    {
                        in: "query",
                        name: "course_code",
                        schema: { type: "string" },
                        description: "Filter by course",
                    },
                    {
                        in: "query",
                        name: "search",
                        schema: { type: "string" },
                        description: "Search by student name",
                    },
                ],
                responses: {
                    200: {
                        description: "Student attendance list",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        filters: { type: "object" },
                                        total_students: { type: "integer" },
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
                                                    },
                                                    full_name: {
                                                        type: "string",
                                                    },
                                                    department_name: {
                                                        type: "string",
                                                        nullable: true,
                                                    },
                                                    present_count: {
                                                        type: "integer",
                                                    },
                                                    absent_count: {
                                                        type: "integer",
                                                    },
                                                    total_sessions: {
                                                        type: "integer",
                                                    },
                                                    avg_attendance: {
                                                        type: "integer",
                                                        nullable: true,
                                                        example: 94,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    403: {
                        description: "Unauthorized",
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
    },
};
