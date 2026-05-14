export default {
    paths: {
        "/auth/login": {
            post: {
                tags: ["Auth"],
                summary:
                    "Authenticate user and return an access token (and refresh token in cookie)",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/LoginRequest",
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Login successful",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/LoginResponse",
                                },
                            },
                        },
                    },
                    401: {
                        description: "Invalid credentials",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    429: {
                        description: "Too many failed attempts, account locked",
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
        "/auth/refresh": {
            post: {
                tags: ["Auth"],
                summary:
                    "Refresh the access token using a valid refresh token cookie",
                responses: {
                    200: {
                        description: "Access token refreshed",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/RefreshResponse",
                                },
                            },
                        },
                    },
                    401: {
                        description: "Refresh token missing or invalid",
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
        "/auth/logout": {
            post: {
                tags: ["Auth"],
                summary:
                    "Logout the current user and revoke their refresh token",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "Logged out successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/MessageResponse",
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
        "/auth/me": {
            get: {
                tags: ["Auth"],
                summary: "Get current authenticated user",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "Current user",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/MeResponse",
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
        "/auth/change-password": {
            post: {
                tags: ["Auth"],
                summary: "Change password for the current authenticated user",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ChangePasswordRequest",
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Password changed successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/MessageResponse",
                                },
                            },
                        },
                    },
                    401: {
                        description:
                            "Not authenticated or current password incorrect",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    422: {
                        description: "Validation error",
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
        "/auth/admin/reset-password": {
            post: {
                tags: ["Auth"],
                summary: "Reset user password by admin",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/AdminResetPasswordRequest",
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Password reset successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/MessageResponse",
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
                    403: {
                        description: "Insufficient privileges",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
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
                    422: {
                        description: "Validation error",
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
