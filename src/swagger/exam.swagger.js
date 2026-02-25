export default {
  paths: {
    "/exams/all": {
      get: {
        tags: ["Exams"],
        summary: "Get all created exams",
        description:
          "Retrieves all exams created in the system for admins to view, modify, or delete (Admin/Super Admin only)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "All exams retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    count: {
                      type: "integer",
                      description: "Total number of exams",
                      example: 15,
                    },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          exam_id: {
                            type: "integer",
                            description: "Exam ID",
                          },
                          course_code: {
                            type: "string",
                            description: "Course code",
                          },
                          course_name: {
                            type: "string",
                            description: "Course name",
                          },
                          exam_type: {
                            type: "string",
                            description: "Type of exam",
                          },
                          exam_date: {
                            type: "string",
                            format: "date",
                            description: "Date of the exam",
                          },
                          day_of_week: {
                            type: "string",
                            description: "Day of the week",
                          },
                          start_time: {
                            type: "string",
                            description: "Start time (HH:mm:ss)",
                          },
                          end_time: {
                            type: "string",
                            description: "End time (HH:mm:ss)",
                          },
                          location: {
                            type: "string",
                            nullable: true,
                            description: "Location of the exam",
                          },
                          semester: {
                            type: "string",
                            enum: ["Spring", "Fall", "Summer", "Winter"],
                            description: "Semester of the course offering",
                          },
                          year: {
                            type: "integer",
                            description: "Year of the course offering",
                          },
                          credits: {
                            type: "integer",
                            description: "Course credits",
                          },
                        },
                      },
                    },
                  },
                },
                example: {
                  success: true,
                  count: 3,
                  data: [
                    {
                      exam_id: 1,
                      course_code: "CS301",
                      course_name: "Database Systems",
                      exam_type: "Midterm",
                      exam_date: "2026-03-15",
                      day_of_week: "Sunday",
                      start_time: "10:00:00",
                      end_time: "12:00:00",
                      location: "Hall A",
                      semester: "Spring",
                      year: 2026,
                      credits: 3,
                    },
                    {
                      exam_id: 2,
                      course_code: "CS302",
                      course_name: "Operating Systems",
                      exam_type: "Final",
                      exam_date: "2026-05-20",
                      day_of_week: "Wednesday",
                      start_time: "14:00:00",
                      end_time: "16:00:00",
                      location: "Hall B",
                      semester: "Spring",
                      year: 2026,
                      credits: 3,
                    },
                  ],
                },
              },
            },
          },
          401: {
            description: "Unauthorized - Invalid or missing token",
          },
          403: {
            description: "Forbidden - Only admins and super admins can access",
          },
          500: {
            description: "Internal server error",
          },
        },
      },
    },
    "/exams/active-courses": {
      get: {
        tags: ["Exams"],
        summary: "Get all active course offerings for dropdown selection",
        description:
          "Retrieves all course offerings to populate dropdown when creating/editing exams (Admin/Super Admin only)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Active courses retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    count: {
                      type: "integer",
                      description: "Number of active course offerings",
                      example: 10,
                    },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          offering_id: {
                            type: "integer",
                            description: "Course offering ID",
                          },
                          course_code: {
                            type: "string",
                            description: "Course code",
                          },
                          course_name: {
                            type: "string",
                            description: "Course name",
                          },
                          credits: {
                            type: "integer",
                            description: "Course credits",
                          },
                          semester: {
                            type: "string",
                            enum: ["Spring", "Fall", "Summer", "Winter"],
                            description: "Semester of the course offering",
                          },
                          year: {
                            type: "integer",
                            description: "Year of the course offering",
                          },
                          lectures_count: {
                            type: "integer",
                            description: "Number of lectures",
                          },
                          exams_count: {
                            type: "integer",
                            description: "Number of exams already scheduled",
                          },
                        },
                      },
                    },
                  },
                },
                example: {
                  success: true,
                  count: 3,
                  data: [
                    {
                      offering_id: 1,
                      course_code: "CS301",
                      course_name: "Database Systems",
                      credits: 3,
                      semester: "Spring 2026",
                      lectures_count: 2,
                      exams_count: 1,
                    },
                    {
                      offering_id: 2,
                      course_code: "CS302",
                      course_name: "Operating Systems",
                      credits: 3,
                      semester: "Spring 2026",
                      lectures_count: 2,
                      exams_count: 0,
                    },
                  ],
                },
              },
            },
          },
          401: {
            description: "Unauthorized - Invalid or missing token",
          },
          403: {
            description: "Forbidden - Only admins and super admins can access",
          },
          500: {
            description: "Internal server error",
          },
        },
      },
    },
    "/exams/schedule": {
      get: {
        tags: ["Exams"],
        summary: "Get exam schedule for the authenticated student",
        description:
          "Retrieves all exams for courses the student is enrolled in",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Exam schedule retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    count: {
                      type: "integer",
                      description: "Number of exams",
                      example: 5,
                    },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          exam_id: {
                            type: "integer",
                            description: "The exam ID",
                          },
                          course_code: {
                            type: "string",
                            description: "Course code",
                          },
                          course_name: {
                            type: "string",
                            description: "Course name",
                          },
                          exam_type: {
                            type: "string",
                            description: "Type of exam",
                          },
                          exam_date: {
                            type: "string",
                            format: "date",
                            description: "Date of the exam",
                          },
                          day_of_week: {
                            type: "string",
                            description: "Day of the week",
                          },
                          start_time: {
                            type: "string",
                            format: "time",
                            description: "Start time of the exam",
                          },
                          end_time: {
                            type: "string",
                            format: "time",
                            description: "End time of the exam",
                          },
                          location: {
                            type: "string",
                            nullable: true,
                            description: "Location of the exam",
                          },
                          semester: {
                            type: "string",
                            enum: ["Spring", "Fall", "Summer", "Winter"],
                            description: "Semester of the course offering",
                          },
                          year: {
                            type: "integer",
                            description: "Year of the course offering",
                          },
                          instructor: {
                            type: "string",
                            description: "Instructor name",
                          },
                        },
                      },
                    },
                  },
                },
                example: {
                  success: true,
                  count: 2,
                  data: [
                    {
                      exam_id: 1,
                      course_code: "CS301",
                      course_name: "Database Systems",
                      exam_type: "Midterm",
                      exam_date: "2026-03-15",
                      day_of_week: "Sunday",
                      start_time: "09:00:00",
                      end_time: "11:00:00",
                      location: "Hall A",
                      semester: "Spring",
                      year: 2026,
                      instructor: "Dr. John Doe",
                    },
                    {
                      exam_id: 2,
                      course_code: "CS302",
                      course_name: "Operating Systems",
                      exam_type: "Final",
                      exam_date: "2026-05-20",
                      day_of_week: "Wednesday",
                      start_time: "14:00:00",
                      end_time: "16:00:00",
                      location: "Hall B",
                      semester: "Spring",
                      year: 2026,
                      instructor: "Dr. Jane Smith",
                    },
                  ],
                },
              },
            },
          },
          401: {
            description: "Unauthorized - Invalid or missing token",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Authentication invalid",
                    },
                  },
                },
              },
            },
          },
          403: {
            description: "Forbidden - Only students can access this endpoint",
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
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: false,
                    },
                    error: {
                      type: "string",
                      example: "Internal server error",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/exams/set": {
      post: {
        tags: ["Exams"],
        summary: "Create a new exam",
        description:
          "Create a new exam for a course offering (Admin/Super Admin only). Use GET /active-courses to get the offering_id.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "offering_id",
                  "exam_type",
                  "exam_date",
                  "day_of_week",
                  "start_time",
                  "end_time",
                ],
                properties: {
                  offering_id: {
                    type: "integer",
                    description:
                      "Course offering ID (from active-courses endpoint)",
                    example: 1,
                  },
                  exam_type: {
                    type: "string",
                    description: "Type of exam",
                    example: "Midterm",
                  },
                  exam_date: {
                    type: "string",
                    format: "date",
                    description: "Date of the exam (YYYY-MM-DD)",
                    example: "2026-03-15",
                  },
                  day_of_week: {
                    type: "string",
                    description: "Day of the week",
                    example: "Sunday",
                  },
                  start_time: {
                    type: "string",
                    format: "time",
                    description: "Start time (HH:mm:ss)",
                    example: "09:00:00",
                  },
                  end_time: {
                    type: "string",
                    format: "time",
                    description: "End time (HH:mm:ss)",
                    example: "11:00:00",
                  },
                  location: {
                    type: "string",
                    description: "Location of the exam",
                    example: "Hall A",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Exam created successfully",
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
                      example: "Exam created successfully",
                    },
                    data: {
                      type: "object",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Bad request - Missing required fields",
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
            description: "Forbidden - Only admins and super admins can access",
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
    "/exams/set/{exam_id}": {
      put: {
        tags: ["Exams"],
        summary: "Update an existing exam",
        description: "Update exam details (Admin/Super Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "exam_id",
            required: true,
            schema: {
              type: "integer",
            },
            description: "The exam ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  exam_type: {
                    type: "string",
                    description: "Type of exam",
                    example: "Final",
                  },
                  exam_date: {
                    type: "string",
                    format: "date",
                    description: "Date of the exam (YYYY-MM-DD)",
                    example: "2026-05-20",
                  },
                  day_of_week: {
                    type: "string",
                    description: "Day of the week",
                    example: "Wednesday",
                  },
                  start_time: {
                    type: "string",
                    format: "time",
                    description: "Start time (HH:mm:ss)",
                    example: "14:00:00",
                  },
                  end_time: {
                    type: "string",
                    format: "time",
                    description: "End time (HH:mm:ss)",
                    example: "16:00:00",
                  },
                  location: {
                    type: "string",
                    description: "Location of the exam",
                    example: "Hall B",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Exam updated successfully",
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
                      example: "Exam updated successfully",
                    },
                    data: {
                      type: "object",
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
            description: "Forbidden - Only admins and super admins can access",
          },
          404: {
            description: "Exam not found",
          },
          500: {
            description: "Internal server error",
          },
        },
      },
      delete: {
        tags: ["Exams"],
        summary: "Delete an exam",
        description: "Delete an exam from the system (Admin/Super Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "exam_id",
            required: true,
            schema: {
              type: "integer",
            },
            description: "The exam ID",
          },
        ],
        responses: {
          200: {
            description: "Exam deleted successfully",
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
                      example: "Exam deleted successfully",
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
            description: "Forbidden - Only admins and super admins can access",
          },
          404: {
            description: "Exam not found",
          },
          500: {
            description: "Internal server error",
          },
        },
      },
    },
  },
};
