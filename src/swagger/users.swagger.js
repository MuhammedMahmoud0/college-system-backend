export default {
  paths: {
    "/users": {
      get: {
        tags: ["Users"],
        summary: "Get list of users",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "List of users",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UsersListResponse",
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Users"],
        summary: "Create a non-student user",
        description:
          "Creates a user with a non-student role (doctor, teaching_assistant, admin, super_admin, leader). Use POST /users/students for students.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateUserRequest",
              },
            },
          },
        },
        responses: {
          201: {
            description: "User created successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreateUserResponse",
                },
              },
            },
          },
          400: {
            description: "Validation error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
                examples: {
                  missingFields: {
                    value: {
                      error:
                        "All fields (name, email, password, role) are required",
                    },
                  },
                  studentRole: {
                    value: {
                      error:
                        "Use POST /users/students to create student accounts",
                    },
                  },
                  invalidRole: {
                    value: { error: "Invalid role" },
                  },
                },
              },
            },
          },
          409: {
            description: "Email already exists",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          500: { description: "Internal server error" },
        },
      },
    },
    "/users/profile": {
      patch: {
        tags: ["Users"],
        summary: "Update current non-student user profile",
        description:
          "Allows authenticated non-student users (doctor, teaching_assistant, admin, super_admin) to update their own phone, address, and avatar image.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                $ref: "#/components/schemas/UpdateOwnProfileRequest",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Profile updated successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UpdateOwnProfileResponse",
                },
              },
            },
          },
          400: {
            description: "No update fields provided (phone, address, avatar)",
          },
          401: { description: "Unauthorized" },
          403: {
            description:
              "Forbidden – only doctor, teaching_assistant, admin, and super_admin",
          },
          404: { description: "User not found" },
          500: {
            description: "Internal server error or avatar upload failure",
          },
        },
      },
    },
    "/users/students": {
      post: {
        tags: ["Users"],
        summary: "Create a student user",
        description:
          "Creates a student user and their profile. Password is automatically set to the national ID. Requires admin or super_admin.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateStudentRequest",
              },
            },
          },
        },
        responses: {
          201: {
            description: "Student created successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreateUserResponse",
                },
              },
            },
          },
          400: { description: "Missing required fields" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Department not found" },
          409: { description: "Email or student ID already exists" },
          500: { description: "Internal server error" },
        },
      },
    },
    "/users/{id}": {
      patch: {
        tags: ["Users"],
        summary: "Update user",
        description:
          "Updates one or more user fields (partial update). Supported fields: name, email, password, role, phone, address, national_id, department_id, and avatar image upload. department_id applies to student/leader accounts. Requires admin or super_admin.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "User UUID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                $ref: "#/components/schemas/UpdateUserRequest",
              },
              examples: {
                allFields: {
                  value: {
                    name: "Dr. Ahmed Hassan",
                    email: "ahmed.hassan@example.edu",
                    password: "NewSecurePass123",
                    role: "doctor",
                    phone: "+201234567890",
                    address: "Alexandria, Egypt",
                    avatar: "(binary image file)",
                    national_id: "30001011234567",
                  },
                },
                partialUpdate: {
                  value: {
                    name: "Dr. Ahmed Hassan (Updated)",
                    phone: "+201111111111",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "User updated successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UpdateUserResponse",
                },
              },
            },
          },
          400: { description: "Bad request" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "User not found" },
          409: { description: "Email already exists" },
          500: { description: "Internal server error" },
        },
      },
      delete: {
        tags: ["Users"],
        summary: "Delete user",
        description:
          "Deletes a user. If the user has blocking related records, deletion is rejected.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "User UUID",
          },
        ],
        responses: {
          200: {
            description: "User deleted successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/DeleteUserResponse",
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "User not found" },
          409: {
            description: "Cannot delete user because related records exist",
          },
          500: { description: "Internal server error" },
        },
      },
    },
    "/users/management/students": {
      get: {
        tags: ["Users"],
        summary: "List students & leaders for admin user management",
        description:
          "Returns a paginated list of all students and leaders (batch representatives) with their profile details and role. Accessible by admin and super_admin only.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1, minimum: 1 },
            description: "Page number",
          },
          {
            name: "limit",
            in: "query",
            schema: {
              type: "integer",
              default: 10,
              minimum: 1,
              maximum: 100,
            },
            description: "Number of records per page",
          },
        ],
        responses: {
          200: {
            description: "Paginated student/leader list",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ManagementStudentsResponse",
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: {
            description: "Forbidden – admin or super_admin only",
          },
          500: { description: "Internal server error" },
        },
      },
    },
    "/users/management/students/{studentId}/profile": {
      get: {
        tags: ["Users"],
        summary: "Get student profile by student_id",
        description:
          "Returns a student or leader profile by student_id with basic profile fields and academic summary. Accessible by admin and super_admin only.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "studentId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Academic student ID",
            example: "2024001234",
          },
        ],
        responses: {
          200: {
            description: "Student profile retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    student: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        student_id: { type: "string" },
                        avatar_url: { type: "string", nullable: true },
                        email: { type: "string", format: "email" },
                        phone: { type: "string", nullable: true },
                        address: { type: "string", nullable: true },
                        department: { type: "string", nullable: true },
                        year: { type: "integer", nullable: true },
                        cgpa: { type: "number", nullable: true },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden – admin or super_admin only" },
          404: { description: "Student profile not found" },
          500: { description: "Internal server error" },
        },
      },
    },
    "/users/management/students/{studentId}/grades-history": {
      get: {
        tags: ["Users"],
        summary: "Get student grades history by student_id",
        description:
          "Returns student grade history across courses including semester, year, and grade. Accessible by admin and super_admin only.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "studentId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Academic student ID",
            example: "2024001234",
          },
        ],
        responses: {
          200: {
            description: "Student grades history retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    student_id: { type: "string" },
                    grades_history: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          course_code: { type: "string" },
                          course_name: { type: "string", nullable: true },
                          semester: {
                            type: "string",
                            enum: ["Spring", "Fall", "Summer", "Winter"],
                          },
                          year: { type: "integer" },
                          grade: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden – admin or super_admin only" },
          404: { description: "Student profile not found" },
          500: { description: "Internal server error" },
        },
      },
    },
    "/users/management/doctors/{userId}/profile": {
      get: {
        tags: ["Users"],
        summary: "Get doctor profile by user_id",
        description:
          "Returns doctor profile details by user_id. Accessible by admin and super_admin only.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Doctor user UUID",
          },
        ],
        responses: {
          200: {
            description: "Doctor profile retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    doctor: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        id: { type: "string", format: "uuid" },
                        avatar_url: { type: "string", nullable: true },
                        email: { type: "string", format: "email" },
                        phone: { type: "string", nullable: true },
                        address: { type: "string", nullable: true },
                        department: { type: "string", nullable: true },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden – admin or super_admin only" },
          404: { description: "Doctor not found" },
          500: { description: "Internal server error" },
        },
      },
    },
    "/users/management/doctors/{userId}/courses": {
      get: {
        tags: ["Users"],
        summary: "Get doctor courses by user_id (schedule format)",
        description:
          "Returns the doctor's courses/schedule using the same structure as the teacher schedule endpoint. Accessible by admin and super_admin only.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Doctor user UUID",
          },
        ],
        responses: {
          200: {
            description: "Doctor courses retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/TeacherScheduleResponse",
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden – admin or super_admin only" },
          404: { description: "Doctor not found" },
          500: { description: "Internal server error" },
        },
      },
    },
    "/users/management/teaching-assistants/{userId}/profile": {
      get: {
        tags: ["Users"],
        summary: "Get teaching assistant profile by user_id",
        description:
          "Returns teaching assistant profile details by user_id. Accessible by admin and super_admin only.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Teaching assistant user UUID",
          },
        ],
        responses: {
          200: {
            description: "Teaching assistant profile retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    teaching_assistant: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        id: { type: "string", format: "uuid" },
                        avatar_url: { type: "string", nullable: true },
                        email: { type: "string", format: "email" },
                        phone: { type: "string", nullable: true },
                        address: { type: "string", nullable: true },
                        department: { type: "string", nullable: true },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden – admin or super_admin only" },
          404: { description: "Teaching assistant not found" },
          500: { description: "Internal server error" },
        },
      },
    },
    "/users/management/teaching-assistants/{userId}/courses": {
      get: {
        tags: ["Users"],
        summary: "Get teaching assistant courses by user_id (schedule format)",
        description:
          "Returns the teaching assistant courses/schedule using the same structure as the teacher schedule endpoint. Accessible by admin and super_admin only.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Teaching assistant user UUID",
          },
        ],
        responses: {
          200: {
            description: "Teaching assistant courses retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/TeacherScheduleResponse",
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden – admin or super_admin only" },
          404: { description: "Teaching assistant not found" },
          500: { description: "Internal server error" },
        },
      },
    },
    "/users/management/leaders": {
      get: {
        tags: ["Users"],
        summary: "List all batch representatives (leaders)",
        description:
          "Returns all users with the leader role, ordered by year level then name. Accessible by admin and super_admin only.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "List of leaders",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    leaders: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: {
                            type: "string",
                            format: "uuid",
                          },
                          full_name: {
                            type: "string",
                          },
                          email: {
                            type: "string",
                            format: "email",
                          },
                          avatar_url: {
                            type: "string",
                            nullable: true,
                          },
                          created_at: {
                            type: "string",
                            format: "date-time",
                          },
                          student_profiles: {
                            type: "object",
                            nullable: true,
                            properties: {
                              student_id: {
                                type: "string",
                              },
                              year_level: {
                                type: "integer",
                                nullable: true,
                              },
                              departments: {
                                type: "object",
                                nullable: true,
                                properties: {
                                  department_id: {
                                    type: "string",
                                    format: "uuid",
                                  },
                                  name: {
                                    type: "string",
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: {
            description: "Forbidden – admin or super_admin only",
          },
          500: { description: "Internal server error" },
        },
      },
    },
    "/users/management/admins": {
      get: {
        tags: ["Users"],
        summary: "List all admin users",
        description:
          "Returns all users with the admin role. Accessible by super_admin only.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "List of admins",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    admins: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string", format: "uuid" },
                          full_name: { type: "string" },
                          email: { type: "string", format: "email" },
                          national_id: { type: "string", nullable: true },
                          phone: { type: "string", nullable: true },
                          address: { type: "string", nullable: true },
                          avatar_url: { type: "string", nullable: true },
                          created_at: {
                            type: "string",
                            format: "date-time",
                            nullable: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden – super_admin only" },
          500: { description: "Internal server error" },
        },
      },
      post: {
        tags: ["Users"],
        summary: "Create a new admin user",
        description:
          "Creates a new user with the admin role. Accessible by super_admin only.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
              examples: {
                createAdmin: {
                  value: {
                    name: "Admin User",
                    email: "admin.user@example.edu",
                    password: "SecurePass123",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Admin user created successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreateUserResponse",
                },
              },
            },
          },
          400: { description: "Missing required fields" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden – super_admin only" },
          409: { description: "Email already exists" },
          500: { description: "Internal server error" },
        },
      },
    },
    "/users/students/{id}/role": {
      patch: {
        tags: ["Users"],
        summary: "Promote or demote a student / leader",
        description:
          'Sets the role of a student to "leader" (promote) or back to "student" (demote). Only works on users who are already student or leader.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "User UUID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["role"],
                properties: {
                  role: {
                    type: "string",
                    enum: ["student", "leader"],
                    description: "Target role",
                  },
                },
              },
              examples: {
                promote: { value: { role: "leader" } },
                demote: { value: { role: "student" } },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Role updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "User role updated to leader successfully",
                    },
                    user: {
                      type: "object",
                      properties: {
                        id: {
                          type: "string",
                          format: "uuid",
                        },
                        full_name: { type: "string" },
                        email: {
                          type: "string",
                          format: "email",
                        },
                        role: {
                          type: "string",
                          enum: ["student", "leader"],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Invalid role value or user already has that role",
          },
          401: { description: "Unauthorized" },
          403: {
            description: "Forbidden – admin or super_admin only",
          },
          404: { description: "User not found" },
          500: { description: "Internal server error" },
        },
      },
    },
    "/users/management/staff": {
      get: {
        tags: ["Users"],
        summary: "List doctors & teaching assistants for admin user management",
        description:
          "Returns a paginated list of doctors and/or teaching assistants with their department and course count. Accessible by admin and super_admin only.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1, minimum: 1 },
            description: "Page number",
          },
          {
            name: "limit",
            in: "query",
            schema: {
              type: "integer",
              default: 10,
              minimum: 1,
              maximum: 100,
            },
            description: "Number of records per page",
          },
          {
            name: "role",
            in: "query",
            schema: {
              type: "string",
              enum: ["doctor", "teaching_assistant"],
            },
            description:
              "Filter by role. Omit to return both doctors and teaching assistants.",
          },
        ],
        responses: {
          200: {
            description: "Paginated staff list",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ManagementStaffResponse",
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: {
            description: "Forbidden – admin or super_admin only",
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
    "/users/upload-excel": {
      post: {
        tags: ["Users"],
        summary: "Bulk create non-student users from Excel",
        description:
          "Upload an Excel file (.xlsx) with columns: Name, Email, Password, Role. Student rows are rejected – use /users/upload-excel/students for students. Duplicate emails are skipped.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                    description:
                      "Excel file with columns: Name | Email | Password | Role",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Users processed successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UploadExcelResponse",
                },
              },
            },
          },
          202: {
            description: "Large file accepted for background processing",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UploadExcelQueuedResponse",
                },
              },
            },
          },
          400: { description: "Bad request or no valid data" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          500: { description: "Internal server error" },
        },
      },
    },
    "/users/upload-excel/students": {
      post: {
        tags: ["Users"],
        summary: "Bulk create student users from Excel",
        description:
          "Upload an Excel file (.xlsx) with columns: Name, Email, NationalId, StudentId, DepartmentName. Password is automatically set to the NationalId. Duplicate emails and student IDs are skipped.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                    description:
                      "Excel file with columns: Name | Email | NationalId | StudentId | DepartmentName",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Students processed successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UploadExcelResponse",
                },
                example: {
                  message: "Students processed successfully",
                  insertedCount: 30,
                  skippedDueToValidation: 1,
                  errors: [
                    {
                      row: 5,
                      error: "Department not found: Unknown Dept",
                    },
                  ],
                },
              },
            },
          },
          202: {
            description: "Large file accepted for background processing",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UploadExcelQueuedResponse",
                },
              },
            },
          },
          400: { description: "Bad request or no valid data" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          500: { description: "Internal server error" },
        },
      },
    },
    "/users/upload-excel/jobs/{jobId}": {
      get: {
        tags: ["Users"],
        summary: "Get status of a queued Excel import job",
        description:
          "Returns progress and final result for a previously queued large Excel import job.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "jobId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "BullMQ job ID",
          },
        ],
        responses: {
          200: {
            description: "Job status",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UploadExcelJobStatusResponse",
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Import job not found" },
          503: { description: "Queue is not configured" },
          500: { description: "Internal server error" },
        },
      },
    },
  },
};
