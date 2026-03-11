export default {
    paths: {
        "/departments": {
            get: {
                tags: ["Departments"],
                summary: "List all departments",
                description:
                    "Returns all departments with course and student counts. Supports optional name search.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "query",
                        name: "search",
                        schema: { type: "string" },
                        description:
                            "Filter departments by name (case-insensitive)",
                    },
                ],
                responses: {
                    200: {
                        description: "List of departments",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        departments: {
                                            type: "array",
                                            items: {
                                                $ref: "#/components/schemas/DepartmentWithCount",
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
                tags: ["Departments"],
                summary: "Create a department",
                description:
                    "Creates a new department. Requires admin or super_admin role.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/DepartmentCreateRequest",
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Department created",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/DepartmentItem",
                                },
                            },
                        },
                    },
                    400: { description: "Validation error" },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden" },
                    409: { description: "Department already exists" },
                    500: { description: "Internal server error" },
                },
            },
        },
        "/departments/{id}": {
            get: {
                tags: ["Departments"],
                summary: "Get a department by ID",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                        description: "Department UUID",
                    },
                ],
                responses: {
                    200: {
                        description: "Department details",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/DepartmentWithCount",
                                },
                            },
                        },
                    },
                    401: { description: "Unauthorized" },
                    404: { description: "Department not found" },
                    500: { description: "Internal server error" },
                },
            },
            patch: {
                tags: ["Departments"],
                summary: "Update a department",
                description:
                    "Updates an existing department name. Requires admin or super_admin role.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                        description: "Department UUID",
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/DepartmentCreateRequest",
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Department updated",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/DepartmentItem",
                                },
                            },
                        },
                    },
                    400: { description: "Validation error" },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden" },
                    404: { description: "Department not found" },
                    409: { description: "Name already taken" },
                    500: { description: "Internal server error" },
                },
            },
            delete: {
                tags: ["Departments"],
                summary: "Delete a department",
                description:
                    "Deletes a department. Fails if there are linked courses or students. Requires admin or super_admin role.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                        description: "Department UUID",
                    },
                ],
                responses: {
                    200: {
                        description: "Department deleted",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: {
                                            type: "string",
                                            example:
                                                "Department deleted successfully",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden" },
                    404: { description: "Department not found" },
                    409: {
                        description:
                            "Department has linked courses or students",
                    },
                    500: { description: "Internal server error" },
                },
            },
        },
    },
    schemas: {
        DepartmentItem: {
            type: "object",
            properties: {
                department_id: { type: "string", format: "uuid" },
                name: { type: "string", example: "Computer Science" },
            },
        },
        DepartmentWithCount: {
            type: "object",
            properties: {
                department_id: { type: "string", format: "uuid" },
                name: { type: "string", example: "Computer Science" },
                _count: {
                    type: "object",
                    properties: {
                        courses: { type: "integer", example: 12 },
                        student_profiles: { type: "integer", example: 150 },
                    },
                },
            },
        },
        DepartmentCreateRequest: {
            type: "object",
            required: ["name"],
            properties: {
                name: {
                    type: "string",
                    example: "Electrical Engineering",
                    description: "Unique department name",
                },
            },
        },
    },
};
