export default {
    paths: {
        "/settings/password": {
            put: {
                tags: ["Settings"],
                summary: "Update user password",
                description:
                    "Allows any authenticated user to update their password. Requires current password verification.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/UpdatePasswordRequest",
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Password updated successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: {
                                            type: "string",
                                            example:
                                                "Password updated successfully",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description:
                            "Validation error - missing fields, password mismatch, or weak password",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                                examples: {
                                    missingFields: {
                                        value: {
                                            error: "All fields (currentPassword, newPassword, confirmNewPassword) are required",
                                        },
                                    },
                                    passwordMismatch: {
                                        value: {
                                            error: "New password and confirmation do not match",
                                        },
                                    },
                                    weakPassword: {
                                        value: {
                                            error: "New password must be at least 6 characters long",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    401: {
                        description:
                            "Current password is incorrect or user not authenticated",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                                examples: {
                                    incorrectPassword: {
                                        value: {
                                            error: "Current password is incorrect",
                                        },
                                    },
                                    notAuthenticated: {
                                        value: {
                                            error: "Not authenticated",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: {
                        description: "User not found",
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
