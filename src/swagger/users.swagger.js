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
                        description: "User created",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/CreateUserResponse",
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
