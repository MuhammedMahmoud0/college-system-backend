export default {
    paths: {
        "/financials": {
            get: {
                tags: ["Financials"],
                summary: "List financial records",
                description:
                    "Returns department credit-hour prices. Supports optional filter by departmentId.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "query",
                        name: "departmentId",
                        required: false,
                        schema: { type: "string", format: "uuid" },
                    },
                ],
                responses: {
                    200: {
                        description: "Financial records",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        financials: {
                                            type: "array",
                                            items: {
                                                $ref: "#/components/schemas/FinancialItem",
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    401: { description: "Unauthorized" },
                    500: { description: "Internal server error" },
                },
            },
            post: {
                tags: ["Financials"],
                summary: "Create financial record",
                description:
                    "Creates credit-hour pricing for a department. Restricted to admin and super_admin.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/FinancialCreateRequest",
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Financial record created",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/FinancialItem",
                                },
                            },
                        },
                    },
                    400: { description: "Validation error" },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden" },
                    404: { description: "Department not found" },
                    409: { description: "Already exists" },
                    500: { description: "Internal server error" },
                },
            },
        },
        "/financials/{id}": {
            get: {
                tags: ["Financials"],
                summary: "Get financial record by id",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "integer" },
                    },
                ],
                responses: {
                    200: {
                        description: "Financial record",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/FinancialItem",
                                },
                            },
                        },
                    },
                    400: { description: "Invalid id" },
                    401: { description: "Unauthorized" },
                    404: { description: "Not found" },
                    500: { description: "Internal server error" },
                },
            },
            patch: {
                tags: ["Financials"],
                summary: "Update financial record",
                description:
                    "Updates department credit-hour price. Restricted to admin and super_admin.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "integer" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/FinancialUpdateRequest",
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Financial record updated",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/FinancialItem",
                                },
                            },
                        },
                    },
                    400: { description: "Validation error" },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden" },
                    404: { description: "Not found" },
                    500: { description: "Internal server error" },
                },
            },
            delete: {
                tags: ["Financials"],
                summary: "Delete financial record",
                description:
                    "Deletes a financial record. Restricted to admin and super_admin.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "integer" },
                    },
                ],
                responses: {
                    200: {
                        description: "Deleted successfully",
                    },
                    400: { description: "Invalid id" },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden" },
                    404: { description: "Not found" },
                    500: { description: "Internal server error" },
                },
            },
        },
    },
    schemas: {
        FinancialDepartment: {
            type: "object",
            properties: {
                department_id: { type: "string", format: "uuid" },
                name: { type: "string", example: "Computer Science" },
            },
        },
        FinancialItem: {
            type: "object",
            properties: {
                id: { type: "integer", example: 1 },
                department_id: { type: "string", format: "uuid" },
                credit_price: { type: "number", example: 300 },
                departments: {
                    $ref: "#/components/schemas/FinancialDepartment",
                },
            },
        },
        FinancialCreateRequest: {
            type: "object",
            required: ["department_id", "credit_price"],
            properties: {
                department_id: { type: "string", format: "uuid" },
                credit_price: {
                    type: "number",
                    example: 300,
                },
            },
        },
        FinancialUpdateRequest: {
            type: "object",
            required: ["credit_price"],
            properties: {
                credit_price: {
                    type: "number",
                    example: 325,
                },
            },
        },
    },
};
