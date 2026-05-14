export default {
    paths: {
        "/notifications": {
            get: {
                tags: ["Notifications"],
                summary: "Get all notifications for the authenticated user",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "page",
                        in: "query",
                        schema: { type: "integer", default: 1 },
                        description: "Page number for pagination",
                    },
                    {
                        name: "limit",
                        in: "query",
                        schema: { type: "integer", default: 20 },
                        description: "Number of notifications per page",
                    },
                ],
                responses: {
                    200: {
                        description: "List of notifications with pagination",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/NotificationsListResponse",
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
            post: {
                tags: ["Notifications"],
                summary: "Create a notification for a user (Admin only)",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/CreateNotificationRequest",
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Notification created successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/CreateNotificationResponse",
                                },
                            },
                        },
                    },
                    400: {
                        description: "Bad request - missing required fields",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
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
                    403: {
                        description: "Forbidden - Admin access required",
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
            delete: {
                tags: ["Notifications"],
                summary: "Delete all notifications for the authenticated user",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "All notifications deleted",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/DeleteAllNotificationsResponse",
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
                },
            },
        },
        "/notifications/unread-count": {
            get: {
                tags: ["Notifications"],
                summary: "Get count of unread notifications",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "Unread count",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/UnreadCountResponse",
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
                },
            },
        },
        "/notifications/mark-all-read": {
            patch: {
                tags: ["Notifications"],
                summary: "Mark all notifications as read",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "All notifications marked as read",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/MarkAllReadResponse",
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
                },
            },
        },
        "/notifications/bulk": {
            post: {
                tags: ["Notifications"],
                summary: "Create notifications for multiple users (Admin only)",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/CreateBulkNotificationsRequest",
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Notifications created successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/CreateBulkNotificationsResponse",
                                },
                            },
                        },
                    },
                    400: {
                        description: "Bad request - missing required fields",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
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
                    403: {
                        description: "Forbidden - Admin access required",
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
        "/notifications/{id}/read": {
            patch: {
                tags: ["Notifications"],
                summary: "Mark a specific notification as read",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "integer" },
                        description: "Notification ID",
                    },
                ],
                responses: {
                    200: {
                        description: "Notification marked as read",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/MarkAsReadResponse",
                                },
                            },
                        },
                    },
                    404: {
                        description: "Notification not found",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
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
                },
            },
        },
        "/notifications/{id}": {
            delete: {
                tags: ["Notifications"],
                summary: "Delete a specific notification",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "integer" },
                        description: "Notification ID",
                    },
                ],
                responses: {
                    200: {
                        description: "Notification deleted",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                    },
                                },
                            },
                        },
                    },
                    404: {
                        description: "Notification not found",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
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
                },
            },
        },
        "/notifications/register-device": {
            post: {
                tags: ["Notifications"],
                summary: "Register an FCM device token for push notifications",
                description: "Can be used by logged out users to receive global broadasts, or logged in users to attach their device to their account to receive personal pushes.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["fcmToken"],
                                properties: {
                                    fcmToken: { type: "string" },
                                    platform: { type: "string", example: "android" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: "Device registered successfully" },
                    400: { description: "Bad request - missing fcmToken" }
                }
            }
        },
        "/notifications/global-broadcast": {
            post: {
                tags: ["Notifications"],
                summary: "Send a global push blast to all active devices (Admin only)",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["message"],
                                properties: {
                                    message: { type: "string" },
                                    type: { type: "string", example: "campus_announcement" },
                                    persistent_user_ids: { 
                                        type: "array", 
                                        items: { type: "string", format: "uuid" },
                                        description: "Optional list of users to also persist in DB" 
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { 
                        description: "Global announcement dispatched",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                        fcmResult: { type: "object" }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: "Bad request" },
                    403: { description: "Forbidden - Admin only" }
                }
            }
        },
        "/notifications/preferences": {
            get: {
                tags: ["Notifications"],
                summary:
                    "Get notification preferences for the authenticated user",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "Notification preferences",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/NotificationPreferencesResponse",
                                },
                            },
                        },
                    },
                    401: { description: "Unauthorized" },
                    500: { description: "Internal server error" },
                },
            },
            put: {
                tags: ["Notifications"],
                summary: "Save notification preferences (the settings panel)",
                description:
                    "Update which notification categories the user wishes to receive. Only provided fields are updated.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/UpdateNotificationPreferencesRequest",
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Preferences saved",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/NotificationPreferencesResponse",
                                },
                            },
                        },
                    },
                    400: { description: "No valid preference field provided" },
                    401: { description: "Unauthorized" },
                    500: { description: "Internal server error" },
                },
            },
        },
    },
    schemas: {
        NotificationType: {
            type: "string",
            enum: [
                "new_grade",
                "exam_deadline",
                "community_activity",
                "campus_announcement",
                "general",
            ],
            description: "Category of the notification",
        },
        // Notification object
        Notification: {
            type: "object",
            properties: {
                id: { type: "integer" },
                message: { type: "string" },
                type: { $ref: "#/components/schemas/NotificationType" },
                is_read: { type: "boolean" },
                created_at: { type: "string", format: "date-time" },
            },
            example: {
                id: 1,
                message: "Your mid-term grades have been published",
                type: "new_grade",
                is_read: false,
                created_at: "2026-03-01T10:30:00.000Z",
            },
        },
        // GET /notifications response
        NotificationsListResponse: {
            type: "object",
            properties: {
                notifications: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Notification" },
                },
                pagination: {
                    type: "object",
                    properties: {
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        totalCount: { type: "integer" },
                        totalPages: { type: "integer" },
                    },
                },
                unreadCount: { type: "integer" },
            },
        },
        // GET /notifications/unread-count response
        UnreadCountResponse: {
            type: "object",
            properties: { unreadCount: { type: "integer" } },
            example: { unreadCount: 5 },
        },
        // PATCH /notifications/:id/read response
        MarkAsReadResponse: {
            type: "object",
            properties: {
                message: { type: "string" },
                notification: { $ref: "#/components/schemas/Notification" },
            },
        },
        // PATCH /notifications/mark-all-read response
        MarkAllReadResponse: {
            type: "object",
            properties: {
                message: { type: "string" },
                updatedCount: { type: "integer" },
            },
            example: {
                message: "All notifications marked as read",
                updatedCount: 5,
            },
        },
        // DELETE /notifications response
        DeleteAllNotificationsResponse: {
            type: "object",
            properties: {
                message: { type: "string" },
                deletedCount: { type: "integer" },
            },
            example: {
                message: "All notifications deleted successfully",
                deletedCount: 10,
            },
        },
        // POST /notifications request
        CreateNotificationRequest: {
            type: "object",
            required: ["user_id", "message"],
            properties: {
                user_id: {
                    type: "string",
                    format: "uuid",
                    description: "Target user UUID",
                },
                message: {
                    type: "string",
                    description: "Notification message text",
                },
                type: { $ref: "#/components/schemas/NotificationType" },
            },
            example: {
                user_id: "550e8400-e29b-41d4-a716-446655440000",
                message: "Your assignment has been graded",
                type: "new_grade",
            },
        },
        // POST /notifications response
        CreateNotificationResponse: {
            type: "object",
            properties: {
                message: { type: "string" },
                notification: { $ref: "#/components/schemas/Notification" },
            },
        },
        // POST /notifications/bulk request
        CreateBulkNotificationsRequest: {
            type: "object",
            required: ["user_ids", "message"],
            properties: {
                user_ids: {
                    type: "array",
                    items: { type: "string", format: "uuid" },
                    description: "Array of target user UUIDs",
                },
                message: {
                    type: "string",
                    description: "Notification message text",
                },
                type: { $ref: "#/components/schemas/NotificationType" },
            },
            example: {
                user_ids: ["550e8400-e29b-41d4-a716-446655440000"],
                message: "Final exam schedule updated",
                type: "exam_deadline",
            },
        },
        // POST /notifications/bulk response
        CreateBulkNotificationsResponse: {
            type: "object",
            properties: {
                message: { type: "string" },
                sentCount: {
                    type: "integer",
                    description:
                        "Notifications actually delivered (after preference filtering)",
                },
                totalRequested: { type: "integer" },
            },
            example: {
                message: "Notifications sent",
                sentCount: 48,
                totalRequested: 50,
            },
        },
        // GET /notifications/preferences response
        NotificationPreferencesResponse: {
            type: "object",
            properties: {
                preferences: {
                    type: "object",
                    properties: {
                        new_grade: {
                            type: "boolean",
                            description: "New Grades Posted",
                        },
                        exam_deadline: {
                            type: "boolean",
                            description: "Assignment & Exam Deadlines",
                        },
                        community_activity: {
                            type: "boolean",
                            description: "Community Hub Activity",
                        },
                        campus_announcement: {
                            type: "boolean",
                            description: "Campus Events & Announcements",
                        },
                    },
                },
            },
            example: {
                preferences: {
                    new_grade: true,
                    exam_deadline: true,
                    community_activity: false,
                    campus_announcement: true,
                },
            },
        },
        // PUT /notifications/preferences request
        UpdateNotificationPreferencesRequest: {
            type: "object",
            description:
                "Provide one or more preference fields to update. All fields are optional.",
            properties: {
                new_grade: {
                    type: "boolean",
                    description: "New Grades Posted",
                },
                exam_deadline: {
                    type: "boolean",
                    description: "Assignment & Exam Deadlines",
                },
                community_activity: {
                    type: "boolean",
                    description: "Community Hub Activity",
                },
                campus_announcement: {
                    type: "boolean",
                    description: "Campus Events & Announcements",
                },
            },
            example: {
                new_grade: true,
                exam_deadline: true,
                community_activity: false,
                campus_announcement: true,
            },
        },
    },
};
