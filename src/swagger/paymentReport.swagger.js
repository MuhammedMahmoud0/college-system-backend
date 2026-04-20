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
        summary: "Get student_payments table rows",
        description:
          "Returns realtime rows from student_payments table, includes student_name from users relation, and derives status from linked payments records. Supports filtering by paid date, payment method, and status.",
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
              "Filter by student payment date (paid_at) in YYYY-MM-DD.",
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
                  $ref: "#/components/schemas/AdminStudentPaymentsResponse",
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
  schemas: {},
};
