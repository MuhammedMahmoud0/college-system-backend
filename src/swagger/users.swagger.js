export default {
    paths: {
        "/users": {
            get: {
                tags: ["Users"],
                summary: "Get list of users",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "List of users",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/UsersListResponse",
                                },
                            },
                        },
                    },
                },
            },
            post: {
                tags: ["Users"],
                summary: "Create a new user",
                description:
                    "Create a new user. For students, student_id is required and a student profile will be created automatically.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/CreateUserRequest",
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "User created successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/CreateUserResponse",
                                },
                            },
                        },
                    },
                    400: {
                        description:
                            "Validation error - missing required fields or invalid role",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                                examples: {
                                    missingFields: {
                                        value: {
                                            error: "All fields (name, email, password, role) are required",
                                        },
                                    },
                                    missingStudentId: {
                                        value: {
                                            error: "Student ID is required for student role",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    409: {
                        description:
                            "Conflict - email or student ID already exists",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                                examples: {
                                    emailExists: {
                                        value: {
                                            error: "Email already exist",
                                        },
                                    },
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
        "/users/upload-excel": {
            post: {
                tags: ["Users"],
                summary: "Upload an Excel file to create users in bulk",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                properties: {
                                    file: {
                                        type: "string",
                                        format: "binary",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Users added",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/UploadExcelResponse",
                                },
                            },
                        },
                    },
                    400: {
                        description: "Bad request",
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
