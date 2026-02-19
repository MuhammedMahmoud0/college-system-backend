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
                description:
                    "Upload an Excel file (.xlsx) with columns: Name, Email, Password, Role, StudentId. The first row should be headers. For students, StudentId is required. Duplicate emails will be skipped automatically.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                required: ["file"],
                                properties: {
                                    file: {
                                        type: "string",
                                        format: "binary",
                                        description:
                                            "Excel file with columns: Name, Email, Password, Role, StudentId (required for students)",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Users processed successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/UploadExcelResponse",
                                },
                                example: {
                                    message: "Users processed successfully",
                                    insertedCount: 5,
                                    skippedDueToValidation: 0,
                                    errors: [],
                                },
                            },
                        },
                    },
                    400: {
                        description:
                            "Bad request - validation errors or no valid data",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        error: { type: "string" },
                                        errors: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    row: { type: "integer" },
                                                    error: { type: "string" },
                                                },
                                            },
                                        },
                                    },
                                },
                                examples: {
                                    noFile: {
                                        value: {
                                            error: "No file uploaded",
                                        },
                                    },
                                    noWorksheet: {
                                        value: {
                                            error: "No worksheet found in the Excel file",
                                        },
                                    },
                                    noValidData: {
                                        value: {
                                            error: "No valid user data found",
                                            errors: [
                                                {
                                                    row: 2,
                                                    error: "Missing required fields",
                                                },
                                                {
                                                    row: 5,
                                                    error: "Student ID required for student role",
                                                },
                                            ],
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
    },
};
