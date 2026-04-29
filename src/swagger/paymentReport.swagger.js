export default {
  paths: {
    "/payments/admin/cards": {
      get: {
        tags: ["Payment Report"],
        summary: "Get payment management cards",
        description:
          "Returns realtime payment card metrics for admin dashboard: outstanding balance, collected this semester, and overdue payments percentage.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Payment cards retrieved",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AdminPaymentCardsResponse",
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
    "/payments/admin/student-payments": {
      get: {
        tags: ["Payment Report"],
        summary: "Get invoice-based payment report rows",
        description:
          "Returns realtime rows from invoices table so all invoices are included (paid, pending, failed, refunded). Status is always sourced from invoice.status. Supports filtering by invoice creation date, payment method, and status.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "date",
            required: false,
            schema: {
              type: "string",
              format: "date",
              example: "2026-04-17",
            },
            description:
              "Filter by invoice creation date (created_at) in YYYY-MM-DD.",
          },
          {
            in: "query",
            name: "payMethod",
            required: false,
            schema: {
              type: "string",
              enum: ["paypal", "paymob", "manual"],
            },
            description: "Filter by payment method/gateway.",
          },
          {
            in: "query",
            name: "status",
            required: false,
            schema: {
              type: "string",
              enum: ["pending", "paid", "failed", "refunded"],
            },
            description: "Filter by payment status.",
          },
          {
            in: "query",
            name: "limit",
            required: false,
            schema: {
              type: "integer",
              default: 20,
              minimum: 1,
              maximum: 100,
            },
            description: "Max rows returned (default 20, max 100).",
          },
        ],
        responses: {
          200: {
            description: "Student payments retrieved",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AdminInvoicePaymentsReportResponse",
                },
              },
            },
          },
          400: { description: "Invalid query filters" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          500: { description: "Internal server error" },
        },
      },
    },
  },
  schemas: {
    AdminInvoicePaymentReportRow: {
      type: "object",
      properties: {
        id: { type: "integer" },
        student_user_id: { type: "string", format: "uuid" },
        student_name: {
          type: "string",
          nullable: true,
          example: "Sarah Johnson",
        },
        semester: { type: "string", example: "Fall" },
        year: { type: "integer", example: 2026 },
        total_amount: { type: "number", example: 2700 },
        invoice_count: { type: "integer", example: 1 },
        gateway: {
          type: "string",
          nullable: true,
          enum: ["paypal", "paymob", "manual"],
        },
        transaction_id: {
          type: "string",
          nullable: true,
        },
        status: {
          type: "string",
          enum: ["pending", "paid", "failed", "refunded"],
        },
        paid_at: {
          type: "string",
          format: "date-time",
          nullable: true,
        },
        created_at: {
          type: "string",
          format: "date-time",
          nullable: true,
        },
      },
    },
    AdminInvoicePaymentsReportResponse: {
      type: "object",
      properties: {
        total: { type: "integer", example: 120 },
        count: { type: "integer", example: 20 },
        filters: {
          type: "object",
          properties: {
            date: { type: "string", nullable: true, example: "2026-04-17" },
            payMethod: {
              type: "string",
              nullable: true,
              enum: ["paypal", "paymob", "manual"],
            },
            status: {
              type: "string",
              nullable: true,
              enum: ["pending", "paid", "failed", "refunded"],
            },
            limit: { type: "integer", example: 20 },
          },
        },
        payments: {
          type: "array",
          items: { $ref: "#/components/schemas/AdminInvoicePaymentReportRow" },
        },
        refreshedAt: { type: "string", format: "date-time" },
      },
    },
  },
};
