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
                summary: "Update current student's profile (address/phone)",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
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
                },
            },
        },
    },
};
