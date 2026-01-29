export default {
    paths: {
        "/student/profile": {
            get: {
                tags: ["StudentProfile"],
                summary: "Get current student's profile",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "Student profile",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/StudentProfileResponse",
                                },
                            },
                        },
                    },
                    401: {
                        description: "Not authenticated",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    404: {
                        description: "Profile not found",
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
            put: {
                tags: ["StudentProfile"],
                summary: "Update current student's profile",
                description:
                    "Update student profile information. All fields are optional - only send the fields you want to update. Supports name, phone, address, national ID, and avatar image upload.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                $ref: "#/components/schemas/StudentProfileUpdateRequest",
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Profile updated",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                        updatedStudent: {
                                            $ref: "#/components/schemas/UserPublic",
                                        },
                                    },
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
                    401: {
                        description: "Not authenticated",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    500: {
                        description:
                            "Failed to upload avatar or update profile",
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
