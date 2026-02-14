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
    },
};
