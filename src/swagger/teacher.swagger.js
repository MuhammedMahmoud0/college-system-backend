export default {
  paths: {
    "/teachers": {
      get: {
        tags: ["Teachers"],
        summary: "Get all teachers/doctors (Admin and Super Admin only)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "List of all teachers retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    teachers: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: {
                            type: "string",
                            format: "uuid",
                            description: "Teacher unique ID",
                          },
                          name: {
                            type: "string",
                            description: "Teacher full name",
                          },
                          title: {
                            type: "string",
                            description: "Teacher title (e.g., Dr.)",
                          },
                          department: {
                            type: "string",
                            nullable: true,
                            description: "Department name",
                          },
                          email: {
                            type: "string",
                            format: "email",
                            description: "Teacher email address",
                          },
                        },
                      },
                    },
                  },
                },
                example: {
                  teachers: [
                    {
                      id: "123e4567-e89b-12d3-a456-426614174000",
                      name: "Dr. Alice",
                      title: "Dr.",
                      department: "Computer Science",
                      email: "doctor.alice@example.com",
                    },
                    {
                      id: "123e4567-e89b-12d3-a456-426614174001",
                      name: "Dr. Bob",
                      title: "Dr.",
                      department: "Mathematics",
                      email: "doctor.bob@example.com",
                    },
                  ],
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
            description: "Access denied - requires admin or super_admin role",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Access denied",
                    },
                  },
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
