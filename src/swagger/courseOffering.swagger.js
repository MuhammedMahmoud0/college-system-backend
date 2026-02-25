export default {
  paths: {
    "/course-offerings": {
      get: {
        tags: ["Course Offerings"],
        summary: "Get all course offerings",
        description:
          "Retrieve all course offerings with related courses and counts of lectures, tutorials/labs, and exams (Admin/Super Admin only)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "All course offerings retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CourseOfferingsListResponse",
                },
              },
            },
          },
          401: {
            description: "Unauthorized - Invalid or missing token",
          },
          403: {
            description: "Forbidden - Insufficient permissions",
          },
          500: {
            description: "Internal server error",
          },
        },
      },
      post: {
        tags: ["Course Offerings"],
        summary: "Create a new course offering",
        description:
          "Create a new semester offering for an existing course (Admin/Super Admin only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CourseOfferingCreateRequest",
              },
            },
          },
        },
        responses: {
          201: {
            description: "Course offering created successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CourseOfferingCreateResponse",
                },
              },
            },
          },
          400: {
            description: "Bad request - Missing required fields",
          },
          401: {
            description: "Unauthorized - Invalid or missing token",
          },
          403: {
            description: "Forbidden - Insufficient permissions",
          },
          404: {
            description: "Course not found",
          },
          409: {
            description: "Conflict - Course offering already exists",
          },
          500: {
            description: "Internal server error",
          },
        },
      },
    },
    "/course-offerings/{offering_id}": {
      put: {
        tags: ["Course Offerings"],
        summary: "Update a course offering",
        description:
          "Update the semester of an existing course offering (Admin/Super Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "offering_id",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "Course offering ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CourseOfferingUpdateRequest",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Course offering updated successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CourseOfferingUpdateResponse",
                },
              },
            },
          },
          401: {
            description: "Unauthorized - Invalid or missing token",
          },
          403: {
            description: "Forbidden - Insufficient permissions",
          },
          404: {
            description: "Course offering not found",
          },
          500: {
            description: "Internal server error",
          },
        },
      },
      delete: {
        tags: ["Course Offerings"],
        summary: "Delete a course offering",
        description:
          "Delete a course offering if it has no related lectures, tutorials/labs, or exams (Admin/Super Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "offering_id",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "Course offering ID",
          },
        ],
        responses: {
          200: {
            description: "Course offering deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    message: {
                      type: "string",
                      example: "Course offering deleted successfully",
                    },
                  },
                },
              },
            },
          },
          400: {
            description:
              "Bad request - Cannot delete course offering with related records",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: false,
                    },
                    error: {
                      type: "string",
                      example:
                        "Cannot delete course offering with existing lectures, tutorials/labs, or exams. Please delete those first.",
                    },
                    details: {
                      type: "object",
                      properties: {
                        lectures: {
                          type: "integer",
                          example: 2,
                        },
                        tutorials_labs: {
                          type: "integer",
                          example: 1,
                        },
                        exams: {
                          type: "integer",
                          example: 1,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized - Invalid or missing token",
          },
          403: {
            description: "Forbidden - Insufficient permissions",
          },
          404: {
            description: "Course offering not found",
          },
          500: {
            description: "Internal server error",
          },
        },
      },
    },
  },
  schemas: {
    CourseOfferingsListResponse: {
      type: "object",
      properties: {
        success: {
          type: "boolean",
          example: true,
        },
        count: {
          type: "integer",
          description: "Total number of course offerings",
          example: 25,
        },
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              offering_id: {
                type: "integer",
                description: "Course offering ID",
                example: 1,
              },
              course_code: {
                type: "string",
                description: "Course code",
                example: "CS101",
              },
              course_name: {
                type: "string",
                description: "Course name",
                example: "Introduction to Computer Science",
              },
              credits: {
                type: "integer",
                description: "Course credits",
                example: 3,
              },
              semester: {
                type: "string",
                enum: ["Spring", "Fall", "Summer", "Winter"],
                description: "Semester of the course offering",
                example: "Fall",
              },
              year: {
                type: "integer",
                description: "Year of the course offering",
                example: 2026,
              },
              lectures_count: {
                type: "integer",
                description: "Number of lectures",
                example: 3,
              },
              tutorials_labs_count: {
                type: "integer",
                description: "Number of tutorials/labs",
                example: 2,
              },
              exams_count: {
                type: "integer",
                description: "Number of exams",
                example: 1,
              },
            },
          },
        },
      },
    },
    CourseOfferingCreateRequest: {
      type: "object",
      required: ["course_code", "semester", "year"],
      properties: {
        course_code: {
          type: "string",
          description: "Course code for the offering",
          example: "CS101",
        },
        semester: {
          type: "string",
          enum: ["Spring", "Fall", "Summer", "Winter"],
          description: "Semester season",
          example: "Fall",
        },
        year: {
          type: "integer",
          description: "Year of the offering",
          example: 2026,
        },
      },
    },
    CourseOfferingCreateResponse: {
      type: "object",
      properties: {
        success: {
          type: "boolean",
          example: true,
        },
        message: {
          type: "string",
          example: "Course offering created successfully",
        },
        data: {
          type: "object",
          properties: {
            offering_id: {
              type: "integer",
              description: "Course offering ID",
              example: 1,
            },
            course_code: {
              type: "string",
              description: "Course code",
              example: "CS101",
            },
            course_name: {
              type: "string",
              description: "Course name",
              example: "Introduction to Computer Science",
            },
            semester: {
              type: "string",
              enum: ["Spring", "Fall", "Summer", "Winter"],
              description: "Semester of the course offering",
              example: "Fall",
            },
            year: {
              type: "integer",
              description: "Year of the course offering",
              example: 2026,
            },
            credits: {
              type: "integer",
              description: "Course credits",
              example: 3,
            },
          },
        },
      },
    },
    CourseOfferingUpdateRequest: {
      type: "object",
      properties: {
        semester: {
          type: "string",
          enum: ["Spring", "Fall", "Summer", "Winter"],
          description: "New semester season for the offering",
          example: "Summer",
        },
        year: {
          type: "integer",
          description: "New year for the offering",
          example: 2025,
        },
      },
    },
    CourseOfferingUpdateResponse: {
      type: "object",
      properties: {
        success: {
          type: "boolean",
          example: true,
        },
        message: {
          type: "string",
          example: "Course offering updated successfully",
        },
        data: {
          type: "object",
          properties: {
            offering_id: {
              type: "integer",
              description: "Course offering ID",
              example: 1,
            },
            course_code: {
              type: "string",
              description: "Course code",
              example: "CS101",
            },
            course_name: {
              type: "string",
              description: "Course name",
              example: "Introduction to Computer Science",
            },
            semester: {
              type: "string",
              enum: ["Spring", "Fall", "Summer", "Winter"],
              description: "Updated semester season",
              example: "Summer",
            },
            year: {
              type: "integer",
              description: "Updated year",
              example: 2025,
            },
            credits: {
              type: "integer",
              description: "Course credits",
              example: 3,
            },
          },
        },
      },
    },
  },
};
