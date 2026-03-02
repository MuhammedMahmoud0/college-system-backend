export default {
    paths: {
        "/grades/enrollment/{enrollmentId}": {
            get: {
                tags: ["Grades"],
                summary: "Get grade details for an enrollment",
                description:
                    "Returns mid_score, work_score, final_score, and letter grade for a specific enrollment. Accessible to Doctor, Teaching Assistant, Admin, and Super Admin.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "enrollmentId",
                        in: "path",
                        required: true,
                        schema: { type: "integer" },
                        description: "The enrollment ID",
                    },
                ],
                responses: {
                    200: {
                        description: "Grade details retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/GradeDetailResponse",
                                },
                            },
                        },
                    },
                    404: {
                        description: "Enrollment not found.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    401: { description: "Unauthorized." },
                    403: { description: "Forbidden." },
                    500: { description: "Internal server error." },
                },
            },
            put: {
                tags: ["Grades"],
                summary: "Update grades for an enrollment",
                description:
                    "Update mid_score, work_score, final_score, and/or letter grade for a student enrollment. Triggers a notification to the student and checks if they entered the top 3 leaderboard. Accessible to Doctor, Teaching Assistant, Admin, and Super Admin.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "enrollmentId",
                        in: "path",
                        required: true,
                        schema: { type: "integer" },
                        description: "The enrollment ID",
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/UpdateGradeRequest",
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Grade updated successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: {
                                            type: "string",
                                            example:
                                                "Grade updated successfully.",
                                        },
                                        enrollment: {
                                            $ref: "#/components/schemas/EnrollmentObject",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: "No updatable fields provided.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    404: {
                        description: "Enrollment not found.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    401: { description: "Unauthorized." },
                    403: { description: "Forbidden." },
                    500: { description: "Internal server error." },
                },
            },
        },
    },

    schemas: {
        UpdateGradeRequest: {
            type: "object",
            description: "At least one field must be provided.",
            properties: {
                mid_score: {
                    type: "number",
                    format: "float",
                    example: 18.5,
                    description: "Midterm score",
                    nullable: true,
                },
                work_score: {
                    type: "number",
                    format: "float",
                    example: 9.0,
                    description: "Coursework / assignment score",
                    nullable: true,
                },
                final_score: {
                    type: "number",
                    format: "float",
                    example: 55.0,
                    description: "Final exam score",
                    nullable: true,
                },
                grade: {
                    type: "string",
                    example: "A",
                    description: "Letter grade (A, B, C, D, F, etc.)",
                    nullable: true,
                },
            },
        },
        GradeDetailResponse: {
            type: "object",
            properties: {
                enrollmentId: { type: "integer", example: 42 },
                student: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        full_name: { type: "string", example: "Ahmed Hassan" },
                        email: { type: "string", example: "ahmed@example.com" },
                    },
                },
                course: { type: "string", example: "Data Structures" },
                mid_score: { type: "number", example: 18.5, nullable: true },
                work_score: { type: "number", example: 9.0, nullable: true },
                final_score: { type: "number", example: 55.0, nullable: true },
                grade: { type: "string", example: "A", nullable: true },
            },
        },
        EnrollmentObject: {
            type: "object",
            properties: {
                id: { type: "integer", example: 42 },
                student_user_id: { type: "string", format: "uuid" },
                lecture_id: { type: "integer", example: 3 },
                tutorial_lab_id: {
                    type: "integer",
                    example: 7,
                    nullable: true,
                },
                status: { type: "string", example: "enrolled" },
                mid_score: { type: "number", example: 18.5, nullable: true },
                work_score: { type: "number", example: 9.0, nullable: true },
                final_score: { type: "number", example: 55.0, nullable: true },
                grade: { type: "string", example: "A", nullable: true },
            },
        },
    },
};
