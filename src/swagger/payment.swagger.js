export default {
    paths: {
        "/payments/invoices/me": {
            get: {
                tags: ["Payments"],
                summary: "Get my invoices",
                description:
                    "Returns current user's invoices and payment summary. Only for student and leader roles.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "query",
                        name: "status",
                        required: false,
                        schema: {
                            type: "string",
                            enum: ["pending", "paid", "failed", "refunded"],
                        },
                    },
                ],
                responses: {
                    200: {
                        description: "Invoices retrieved",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/MyInvoicesResponse",
                                },
                            },
                        },
                    },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden" },
                    500: { description: "Internal server error" },
                },
            },
        },
        "/payments/invoices/{invoiceId}/paypal-order": {
            post: {
                tags: ["Payments"],
                summary: "Create PayPal order for invoice",
                description:
                    "Creates a PayPal checkout order for a pending invoice owned by the authenticated student/leader.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "invoiceId",
                        required: true,
                        schema: { type: "integer" },
                    },
                ],
                responses: {
                    201: {
                        description: "PayPal order created",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/CreatePayPalOrderResponse",
                                },
                            },
                        },
                    },
                    400: { description: "Invalid request" },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden" },
                    404: { description: "Invoice not found" },
                    500: { description: "Internal server error" },
                },
            },
        },
        "/payments/invoices/paypal-order/bulk": {
            post: {
                tags: ["Payments"],
                summary: "Create PayPal order for multiple invoices",
                description:
                    "Creates one PayPal order for either selected pending invoices or all pending invoices for the authenticated user.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/BulkInvoiceSelectionRequest",
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Bulk PayPal order created",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/BulkPayPalOrderResponse",
                                },
                            },
                        },
                    },
                    400: { description: "Invalid selection" },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden" },
                    404: { description: "No matching pending invoices" },
                    500: { description: "Internal server error" },
                },
            },
        },
        "/payments/invoices/{invoiceId}/capture": {
            post: {
                tags: ["Payments"],
                summary: "Capture PayPal order",
                description:
                    "Captures a previously created PayPal order and marks invoice as paid on success.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "invoiceId",
                        required: true,
                        schema: { type: "integer" },
                    },
                ],
                requestBody: {
                    required: false,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/CapturePayPalRequest",
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Payment captured",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/CapturePayPalResponse",
                                },
                            },
                        },
                    },
                    400: {
                        description:
                            "Capture failed, invalid request, or order not approved yet",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/CapturePayPalNotApprovedResponse",
                                },
                            },
                        },
                    },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden" },
                    404: { description: "Invoice not found" },
                    500: { description: "Internal server error" },
                },
            },
        },
        "/payments/invoices/capture/bulk": {
            post: {
                tags: ["Payments"],
                summary: "Capture PayPal order for multiple invoices",
                description:
                    "Captures a previously created bulk order and marks all selected pending invoices as paid.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/BulkCaptureRequest",
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Bulk payment captured",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/BulkCaptureResponse",
                                },
                            },
                        },
                    },
                    400: { description: "Capture failed or invalid request" },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden" },
                    404: { description: "No pending invoices found" },
                    500: { description: "Internal server error" },
                },
            },
        },
    },
    schemas: {
        PaymentItem: {
            type: "object",
            properties: {
                id: { type: "integer" },
                gateway: { type: "string", example: "paypal" },
                transaction_id: { type: "string" },
                amount: { type: "number", example: 900 },
                status: { type: "string", example: "paid" },
                created_at: { type: "string", format: "date-time" },
            },
        },
        InvoiceItem: {
            type: "object",
            properties: {
                id: { type: "integer" },
                student_user_id: { type: "string", format: "uuid" },
                enrollment_id: { type: "integer", nullable: true },
                course_code: { type: "string", example: "CS201" },
                semester: { type: "string", example: "Fall" },
                year: { type: "integer", example: 2026 },
                credit_hours: { type: "integer", example: 3 },
                credit_price: { type: "number", example: 300 },
                total_amount: { type: "number", example: 900 },
                status: {
                    type: "string",
                    enum: ["pending", "paid", "failed", "refunded"],
                },
                paypal_order_id: { type: "string", nullable: true },
                payment_date: {
                    type: "string",
                    format: "date-time",
                    nullable: true,
                },
                created_at: {
                    type: "string",
                    format: "date-time",
                    nullable: true,
                },
                updated_at: {
                    type: "string",
                    format: "date-time",
                    nullable: true,
                },
                payments: {
                    type: "array",
                    items: { $ref: "#/components/schemas/PaymentItem" },
                },
            },
        },
        MyInvoicesResponse: {
            type: "object",
            properties: {
                invoices: {
                    type: "array",
                    items: { $ref: "#/components/schemas/InvoiceItem" },
                },
                summary: {
                    type: "object",
                    properties: {
                        totalInvoices: { type: "integer", example: 3 },
                        pendingInvoices: { type: "integer", example: 1 },
                        totalDue: { type: "number", example: 900 },
                    },
                },
            },
        },
        CreatePayPalOrderResponse: {
            type: "object",
            properties: {
                message: { type: "string", example: "PayPal order created" },
                invoiceId: { type: "integer", example: 14 },
                orderId: { type: "string", example: "8RU61172RB300401A" },
                approveUrl: {
                    type: "string",
                    nullable: true,
                    example:
                        "https://www.sandbox.paypal.com/checkoutnow?token=8RU61172RB300401A",
                },
            },
        },
        CapturePayPalRequest: {
            type: "object",
            properties: {
                orderId: {
                    type: "string",
                    description:
                        "Optional. If omitted, server uses invoice.paypal_order_id",
                },
            },
        },
        CapturePayPalResponse: {
            type: "object",
            properties: {
                message: {
                    type: "string",
                    example: "Payment captured successfully",
                },
                invoiceId: { type: "integer", example: 14 },
                transactionId: { type: "string", example: "2D723339RG245992X" },
                status: { type: "string", example: "paid" },
            },
        },
        CapturePayPalNotApprovedResponse: {
            type: "object",
            properties: {
                error: {
                    type: "string",
                    example:
                        "Payer has not approved this order yet. Redirect the payer to approveUrl first.",
                },
                paypalStatus: {
                    type: "string",
                    example: "CREATED",
                },
                paypalIssue: {
                    type: "string",
                    nullable: true,
                    example: "COMPLIANCE_VIOLATION",
                },
                paypalDebugId: {
                    type: "string",
                    nullable: true,
                    example: "f2a1d8f164f9a",
                },
                approveUrl: {
                    type: "string",
                    nullable: true,
                    example:
                        "https://www.sandbox.paypal.com/checkoutnow?token=8RU61172RB300401A",
                },
                orderId: {
                    type: "string",
                    example: "8RU61172RB300401A",
                },
            },
        },
        BulkInvoiceSelectionRequest: {
            type: "object",
            properties: {
                payAll: {
                    type: "boolean",
                    description:
                        "When true, includes all pending invoices for the user",
                    example: true,
                },
                invoiceIds: {
                    type: "array",
                    items: { type: "integer" },
                    description:
                        "Used when payAll is false. Contains selected pending invoice IDs.",
                    example: [4, 7, 11],
                },
            },
        },
        BulkPayPalOrderResponse: {
            type: "object",
            properties: {
                message: {
                    type: "string",
                    example: "PayPal order created for selected invoices",
                },
                orderId: { type: "string" },
                approveUrl: { type: "string", nullable: true },
                invoiceIds: {
                    type: "array",
                    items: { type: "integer" },
                },
                totalAmount: { type: "number", example: 1800 },
                currency: { type: "string", example: "USD" },
            },
        },
        BulkCaptureRequest: {
            type: "object",
            required: ["orderId"],
            properties: {
                orderId: { type: "string" },
                payAll: { type: "boolean", example: true },
                invoiceIds: {
                    type: "array",
                    items: { type: "integer" },
                    example: [4, 7, 11],
                },
            },
        },
        BulkCaptureResponse: {
            type: "object",
            properties: {
                message: {
                    type: "string",
                    example: "Payment captured successfully",
                },
                invoiceIds: {
                    type: "array",
                    items: { type: "integer" },
                },
                transactionId: { type: "string" },
                status: { type: "string", example: "paid" },
            },
        },
    },
};
