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
    },
    schemas: {
        // Notification object
        Notification: {
            type: "object",
            properties: {
                id: { type: "integer" },
                message: { type: "string" },
                type: { type: "string", nullable: true },
                is_read: { type: "boolean" },
                created_at: { type: "string", format: "date-time" },
            },
            example: {
                id: 1,
                message: "Your grades have been published",
                type: "grades",
                is_read: false,
                created_at: "2026-01-27T10:30:00.000Z",
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
            properties: {
                unreadCount: { type: "integer" },
            },
            example: {
                unreadCount: 5,
            },
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
                    description: "Target user ID",
                },
                message: {
                    type: "string",
                    description: "Notification message",
                },
                type: {
                    type: "string",
                    nullable: true,
                    description: "Notification type/category",
                },
            },
            example: {
                user_id: "550e8400-e29b-41d4-a716-446655440000",
                message: "Your assignment has been graded",
                type: "grades",
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
                    description: "Array of user IDs",
                },
                message: {
                    type: "string",
                    description: "Notification message",
                },
                type: {
                    type: "string",
                    nullable: true,
                    description: "Notification type/category",
                },
            },
            example: {
                user_ids: [
                    "550e8400-e29b-41d4-a716-446655440000",
                    "550e8400-e29b-41d4-a716-446655440001",
                ],
                message: "Exam schedule has been updated",
                type: "schedule",
            },
        },
        // POST /notifications/bulk response
        CreateBulkNotificationsResponse: {
            type: "object",
            properties: {
                message: { type: "string" },
                createdCount: { type: "integer" },
            },
            example: {
                message: "Notifications created successfully",
                createdCount: 25,
            },
        },
    },
};
