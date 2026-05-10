export default {
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  },
  schemas: {
    ErrorResponse: {
      type: "object",
      properties: {
        error: { type: "string" },
      },
    },
    // Public user fields returned by many endpoints
    UserPublic: {
      type: "object",
      properties: {
        id: { type: "string" },
        full_name: { type: "string" },
        email: { type: "string", format: "email" },
        role: { type: "string" },
        avatar_url: { type: "string", nullable: true },
        phone: { type: "string", nullable: true },
        address: { type: "string", nullable: true },
      },
      example: {
        id: "user_123",
        full_name: "Jane Doe",
        email: "jane.doe@example.edu",
        role: "student",
        avatar_url: "https://cdn.example.edu/avatars/user_123.png",
        phone: "+201234567890",
        address: "123 University Ave",
      },
    },
    // Authentication
    LoginRequest: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: {
          type: "string",
          format: "email",
          default: "magda_madbouly@example.com",
        },
        password: { type: "string", default: "123456789" },
      },
    },
    LoginResponse: {
      type: "object",
      properties: {
        message: { type: "string" },
        accessToken: { type: "string" },
        requiresPasswordChange: { type: "boolean" },
      },
    },
    RefreshResponse: {
      type: "object",
      properties: {
        accessToken: { type: "string" },
      },
    },
    ChangePasswordRequest: {
      type: "object",
      required: ["currentPassword", "newPassword"],
      properties: {
        currentPassword: { type: "string" },
        newPassword: { type: "string" },
      },
    },
    AdminResetPasswordRequest: {
      type: "object",
      required: ["userId", "newPassword"],
      properties: {
        userId: { type: "string", format: "uuid" },
        newPassword: { type: "string" },
      },
    },
    MessageResponse: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
    },
    MeResponse: {
      type: "object",
      properties: {
        user: { $ref: "#/components/schemas/UserPublic" },
      },
    },
    // Users list and creation
    UsersListResponse: {
      type: "object",
      properties: {
        users: {
          type: "array",
          items: { $ref: "#/components/schemas/UserPublic" },
        },
      },
    },
    PaginationMeta: {
      type: "object",
      properties: {
        total: { type: "integer", example: 120 },
        page: { type: "integer", example: 1 },
        limit: { type: "integer", example: 10 },
        totalPages: { type: "integer", example: 12 },
      },
    },
    ManagementStudentItem: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        full_name: { type: "string", example: "Student A1" },
        email: { type: "string", format: "email" },
        avatar_url: { type: "string", nullable: true },
        created_at: { type: "string", format: "date-time" },
        student_profiles: {
          type: "object",
          nullable: true,
          properties: {
            student_id: { type: "string", example: "AC-123457" },
            year_level: {
              type: "integer",
              nullable: true,
              example: 1,
            },
            departments: {
              type: "object",
              nullable: true,
              properties: {
                name: {
                  type: "string",
                  example: "Computer Science",
                },
              },
            },
          },
        },
      },
    },
    ManagementStudentsResponse: {
      type: "object",
      properties: {
        data: {
          type: "array",
          items: {
            $ref: "#/components/schemas/ManagementStudentItem",
          },
        },
        meta: { $ref: "#/components/schemas/PaginationMeta" },
      },
    },
    ManagementStaffItem: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        full_name: { type: "string", example: "Dr. Evelyn Reed" },
        email: { type: "string", format: "email" },
        role: {
          type: "string",
          enum: ["doctor", "teaching_assistant"],
        },
        avatar_url: { type: "string", nullable: true },
        created_at: { type: "string", format: "date-time" },
        department: {
          type: "string",
          nullable: true,
          example: "Computer Science",
        },
        courses_count: { type: "integer", example: 2 },
      },
    },
    ManagementStaffResponse: {
      type: "object",
      properties: {
        data: {
          type: "array",
          items: { $ref: "#/components/schemas/ManagementStaffItem" },
        },
        meta: { $ref: "#/components/schemas/PaginationMeta" },
      },
    },
    CreateUserRequest: {
      type: "object",
      required: ["name", "email", "password", "role"],
      properties: {
        name: {
          type: "string",
          description: "Full name of the user",
        },
        email: {
          type: "string",
          format: "email",
          description: "Email address (must be unique)",
        },
        password: {
          type: "string",
          description: "User password (will be hashed)",
        },
        role: {
          type: "string",
          enum: [
            "doctor",
            "admin",
            "super_admin",
            "teaching_assistant",
            "leader",
          ],
          description:
            "User role (non-student only – use /users/students for students)",
        },
      },
      example: {
        name: "Dr. Ahmed Hassan",
        email: "ahmed.hassan@example.edu",
        password: "SecurePass123",
        role: "doctor",
      },
    },
    CreateStudentRequest: {
      type: "object",
      required: ["name", "email", "national_id", "student_id", "department_id"],
      properties: {
        name: {
          type: "string",
          description: "Full name of the student",
        },
        email: {
          type: "string",
          format: "email",
          description: "Email address (must be unique)",
        },
        national_id: {
          type: "string",
          description: "National ID – also used as the initial login password",
        },
        student_id: {
          type: "string",
          description: "Academic student ID (must be unique)",
        },
        department_id: {
          type: "string",
          format: "uuid",
          description: "UUID of the department the student belongs to",
        },
      },
      example: {
        name: "Sara Mohamed",
        email: "sara.mohamed@example.edu",
        national_id: "30001011234567",
        student_id: "2024001234",
        department_id: "063e1341-2ace-4cc1-a03f-a61c7535fba8",
      },
    },
    CreateUserResponse: {
      type: "object",
      properties: {
        message: { type: "string" },
        userId: { type: "string" },
      },
    },
    UpdateUserRequest: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Full name",
          default: "",
        },
        email: {
          type: "string",
          format: "email",
          default: "",
        },
        password: {
          type: "string",
          description: "New password (will be hashed)",
          default: "",
        },
        role: {
          type: "string",
          default: "",
          enum: [
            "student",
            "doctor",
            "admin",
            "teaching_assistant",
            "super_admin",
            "leader",
          ],
        },
        phone: {
          type: "string",
          nullable: true,
          default: "",
        },
        address: {
          type: "string",
          nullable: true,
          default: "",
        },
        avatar: {
          type: "string",
          format: "binary",
          nullable: true,
          description: "Avatar image file",
        },
        national_id: {
          type: "string",
          nullable: true,
          default: "",
        },
        department_id: {
          type: "string",
          format: "uuid",
          nullable: true,
          default: "",
          description:
            "Department UUID (applies to student/leader accounts with student profile)",
        },
      },
    },
    UpdateUserResponse: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "User updated successfully",
        },
        user: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            full_name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string" },
            avatar_url: { type: "string", nullable: true },
            phone: { type: "string", nullable: true },
            address: { type: "string", nullable: true },
            national_id: { type: "string", nullable: true },
            updated_at: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
          },
        },
      },
    },
    UpdateOwnProfileRequest: {
      type: "object",
      properties: {
        phone: {
          type: "string",
          nullable: true,
          description: "User phone number",
        },
        address: {
          type: "string",
          nullable: true,
          description: "User home address",
        },
        avatar: {
          type: "string",
          format: "binary",
          nullable: true,
          description: "Avatar image file",
        },
      },
    },
    UpdateOwnProfileResponse: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Profile updated successfully",
        },
        user: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            full_name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string" },
            avatar_url: { type: "string", nullable: true },
            phone: { type: "string", nullable: true },
            address: { type: "string", nullable: true },
            updated_at: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
          },
        },
      },
    },
    StaffProfileResponse: {
      type: "object",
      properties: {
        user: { $ref: "#/components/schemas/UserPublic" },
      },
    },
    DeleteUserResponse: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "User deleted successfully",
        },
        userId: { type: "string", format: "uuid" },
      },
    },
    UploadExcelResponse: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Users processed successfully",
        },
        insertedCount: {
          type: "integer",
          description: "Number of users successfully inserted",
          example: 5,
        },
        skippedDueToValidation: {
          type: "integer",
          description: "Number of rows skipped due to validation errors",
          example: 0,
        },
        errors: {
          type: "array",
          items: {
            type: "object",
            properties: {
              row: { type: "integer" },
              error: { type: "string" },
            },
          },
          example: [],
        },
      },
    },
    UploadExcelQueuedResponse: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Excel import job queued successfully",
        },
        jobId: {
          type: "string",
          description: "BullMQ job ID for tracking import progress",
          example: "42",
        },
        queued: {
          type: "boolean",
          example: true,
        },
        importType: {
          type: "string",
          enum: ["users", "students"],
          example: "students",
        },
        rowsCount: {
          type: "integer",
          example: 1200,
        },
      },
    },
    UploadExcelJobStatusResponse: {
      type: "object",
      properties: {
        jobId: {
          type: "string",
          example: "42",
        },
        state: {
          type: "string",
          example: "completed",
        },
        progress: {
          type: "integer",
          example: 100,
        },
        attemptsMade: {
          type: "integer",
          example: 1,
        },
        createdAt: {
          type: "integer",
          description: "Unix timestamp in milliseconds",
          example: 1773558600000,
        },
        processedOn: {
          type: "integer",
          nullable: true,
          example: 1773558600500,
        },
        finishedOn: {
          type: "integer",
          nullable: true,
          example: 1773558604500,
        },
        failedReason: {
          type: "string",
          nullable: true,
          example: null,
        },
        result: {
          allOf: [{ $ref: "#/components/schemas/UploadExcelResponse" }],
          nullable: true,
        },
      },
    },
    // Student profile
    Department: {
      type: "object",
      properties: {
        department_id: { type: "string" },
        name: { type: "string" },
      },
    },
    StudentProfile: {
      type: "object",
      properties: {
        student_id: { type: "string" },
        year_level: { type: "integer" },
        cgpa: { type: "number", nullable: true },
        total_credits: { type: "integer", nullable: true },
        departments: { $ref: "#/components/schemas/Department" },
      },
      example: {
        student_id: "S20251234",
        year_level: 3,
        cgpa: 3.65,
        total_credits: 90,
        departments: { department_id: "d01", name: "Computer Science" },
      },
    },
    StudentProfileUpdateRequest: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Student's home address",
        },
        phone: {
          type: "string",
          description: "Student's phone number",
        },
        avatar: {
          type: "string",
          format: "binary",
          description: "Avatar image file (JPG, PNG, etc.)",
        },
      },
      example: {
        address: "Apartment 4B, 456 College Rd",
        phone: "+201112223334",
      },
    },
    StudentWithProfiles: {
      type: "object",
      properties: {
        id: { type: "string" },
        full_name: { type: "string" },
        email: { type: "string" },
        role: { type: "string" },
        avatar_url: { type: "string", nullable: true },
        phone: { type: "string", nullable: true },
        address: { type: "string", nullable: true },
        national_id: { type: "string", nullable: true },
        student_profiles: {
          type: "array",
          items: { $ref: "#/components/schemas/StudentProfile" },
        },
      },
    },
    StudentProfileResponse: {
      type: "object",
      properties: {
        studentProfile: {
          $ref: "#/components/schemas/StudentWithProfiles",
        },
      },
    },
    DigitalStudentIdHolder: {
      type: "object",
      properties: {
        full_name: { type: "string", example: "John Doe" },
        role: {
          type: "string",
          enum: ["student", "leader"],
          example: "student",
        },
        student_id: { type: "string", example: "AC-123456" },
        department: {
          type: "string",
          nullable: true,
          example: "Computer Science",
        },
        level: { type: "string", example: "3rd Year" },
        year_level: { type: "integer", example: 3 },
      },
    },
    DigitalStudentIdValidity: {
      type: "object",
      properties: {
        issued_date: {
          type: "string",
          format: "date",
          example: "2023-09-01",
        },
        expires_date: {
          type: "string",
          format: "date",
          example: "2027-07-31",
        },
      },
    },
    DigitalStudentIdFrontResponse: {
      type: "object",
      properties: {
        system_name: { type: "string", example: "Academia College" },
        identity_label: {
          type: "string",
          example: "STUDENT IDENTITY",
        },
        holder: {
          $ref: "#/components/schemas/DigitalStudentIdHolder",
        },
        card_validity: {
          $ref: "#/components/schemas/DigitalStudentIdValidity",
        },
      },
    },
    DigitalStudentIdQrCode: {
      type: "object",
      properties: {
        student_id: { type: "string", example: "AC-123456" },
        national_id: {
          type: "string",
          nullable: true,
          example: "30001011234567",
        },
      },
    },
    DigitalStudentIdBarcode: {
      type: "object",
      properties: {
        access: { type: "boolean", example: true },
      },
    },
    DigitalStudentIdBackResponse: {
      type: "object",
      properties: {
        system_name: { type: "string", example: "Academia College" },
        qr_code: {
          $ref: "#/components/schemas/DigitalStudentIdQrCode",
        },
        barcode: {
          $ref: "#/components/schemas/DigitalStudentIdBarcode",
        },
        access_privileges: {
          type: "array",
          items: { type: "string" },
          example: [
            "Library Access",
            "CS & Engineering Labs",
            "Gym & Sports Facilities",
          ],
        },
      },
    },
    // User Settings
    UpdatePasswordRequest: {
      type: "object",
      required: ["currentPassword", "newPassword", "confirmNewPassword"],
      properties: {
        currentPassword: {
          type: "string",
          format: "password",
          description: "Current password for verification",
          example: "oldPassword123",
        },
        newPassword: {
          type: "string",
          format: "password",
          description: "New password (minimum 6 characters)",
          example: "newSecurePassword456",
        },
        confirmNewPassword: {
          type: "string",
          format: "password",
          description: "Confirmation of new password (must match newPassword)",
          example: "newSecurePassword456",
        },
      },
    },
    // Grade Distribution
    GradeDistributionRequest: {
      type: "object",
      required: ["work_max", "mid_max", "final_max"],
      properties: {
        work_max: {
          type: "number",
          description: "Maximum score for coursework. Must be >= 0.",
          example: 20,
        },
        mid_max: {
          type: "number",
          description: "Maximum score for midterm. Must be >= 0.",
          example: 30,
        },
        final_max: {
          type: "number",
          description: "Maximum score for final exam. Must be >= 0.",
          example: 50,
        },
      },
    },
    GradeDistribution: {
      type: "object",
      properties: {
        id: { type: "integer", example: 1 },
        lecture_id: { type: "integer", example: 5 },
        work_max: { type: "number", example: 20 },
        mid_max: { type: "number", example: 30 },
        final_max: { type: "number", example: 50 },
      },
    },

    // Attendance
    StartAttendanceSessionRequest: {
      type: "object",
      required: ["session_date"],
      properties: {
        lecture_id: {
          type: "integer",
          description: "Lecture ID (required if tutorial_lab_id not provided)",
          example: 1,
        },
        tutorial_lab_id: {
          type: "integer",
          description: "Tutorial/Lab ID (required if lecture_id not provided)",
          example: 1,
        },
        session_date: {
          type: "string",
          format: "date",
          description: "Session date (YYYY-MM-DD)",
          example: "2026-02-10",
        },
        isLive: {
          type: "boolean",
          description: "Whether the session is live",
          default: false,
          example: false,
        },
        longitude: {
          type: "number",
          description: "Longitude coordinate of the session location",
          example: 123885,
          nullable: true,
        },
        latitude: {
          type: "number",
          description: "Latitude coordinate of the session location",
          example: 2326,
          nullable: true,
        },
      },
    },
    AttendanceSessionResponse: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Attendance session started",
        },
        sessionId: {
          type: "string",
          format: "uuid",
          example: "550e8400-e29b-41d4-a716-446655440000",
        },
        qrCode: {
          type: "string",
          description: "QR code token (changes every 10 seconds)",
          example:
            "550e8400-e29b-41d4-a716-446655440000:1707580800000:abc123def456",
        },
        qrExpiry: {
          type: "integer",
          description: "QR code expiry timestamp (milliseconds)",
          example: 1707580810000,
        },
        isLive: {
          type: "boolean",
          example: false,
        },
        longitude: {
          type: "number",
          nullable: true,
          example: 123885,
        },
        latitude: {
          type: "number",
          nullable: true,
          example: 2326,
        },
        enrolledStudents: {
          type: "array",
          items: {
            type: "object",
            properties: {
              user_id: { type: "string" },
              full_name: { type: "string" },
              email: { type: "string" },
              avatar_url: { type: "string", nullable: true },
              student_id: { type: "string" },
              status: {
                type: "string",
                enum: ["absent", "present"],
                example: "absent",
              },
            },
          },
        },
      },
    },
    SessionDetailsResponse: {
      type: "object",
      properties: {
        sessionId: { type: "string", format: "uuid" },
        lectureId: { type: "integer", nullable: true },
        tutorialLabId: { type: "integer", nullable: true },
        sessionDate: { type: "string", format: "date" },
        qrCode: { type: "string" },
        qrExpiry: { type: "integer" },
        students: {
          type: "array",
          items: {
            type: "object",
            properties: {
              user_id: { type: "string" },
              full_name: { type: "string" },
              email: { type: "string" },
              avatar_url: { type: "string", nullable: true },
              student_id: { type: "string" },
              status: {
                type: "string",
                enum: ["absent", "present"],
              },
            },
          },
        },
        presentCount: { type: "integer", example: 25 },
        totalCount: { type: "integer", example: 30 },
      },
    },
    ActiveSessionSummary: {
      type: "object",
      properties: {
        sessionId: { type: "string", format: "uuid" },
        type: {
          type: "string",
          enum: ["lecture", "tutorial"],
          example: "lecture",
        },
        courseName: { type: "string", example: "Data Structures" },
        courseCode: { type: "string", example: "CS201" },
        presentCount: { type: "integer", example: 25 },
        totalCount: { type: "integer", example: 30 },
        createdAt: {
          type: "integer",
          description: "Session creation timestamp (milliseconds)",
          example: 1707580800000,
        },
      },
    },
    ScanQRCodeRequest: {
      type: "object",
      required: ["qrCode"],
      properties: {
        qrCode: {
          type: "string",
          description: "QR code token scanned from the live attendance page",
          example:
            "550e8400-e29b-41d4-a716-446655440000:1707580800000:abc123def456",
        },
      },
    },
    ToggleAttendanceRequest: {
      type: "object",
      required: ["student_user_id"],
      properties: {
        student_user_id: {
          type: "string",
          description: "UUID of the student whose attendance to toggle",
          example: "550e8400-e29b-41d4-a716-446655440000",
        },
      },
    },
    UpdateAttendanceRecordRequest: {
      type: "object",
      required: ["student_user_id", "session_date", "status"],
      properties: {
        student_user_id: {
          type: "string",
          description: "UUID of the student",
          example: "550e8400-e29b-41d4-a716-446655440000",
        },
        lecture_id: {
          type: "integer",
          description: "Lecture ID (required if tutorial_lab_id not provided)",
          example: 1,
        },
        tutorial_lab_id: {
          type: "integer",
          description: "Tutorial/Lab ID (required if lecture_id not provided)",
          example: 1,
        },
        session_date: {
          type: "string",
          format: "date",
          description: "Session date (YYYY-MM-DD)",
          example: "2026-02-25",
        },
        status: {
          type: "string",
          enum: ["present", "absent"],
          description: "New attendance status",
          example: "present",
        },
      },
    },
    // Schedule
    ClassSession: {
      type: "object",
      properties: {
        courseId: { type: "string" },
        courseCode: { type: "string" },
        courseName: { type: "string" },
        startTime: { type: "string" },
        endTime: { type: "string" },
        location: { type: "string" },
        instructor: { type: "string" },
        type: {
          type: "string",
          enum: ["lecture", "lab", "tutorial"],
        },
      },
      example: {
        courseId: "CS301",
        courseCode: "CS301",
        courseName: "Database Systems",
        startTime: "09:00:00",
        endTime: "10:30:00",
        location: "Building A, Room 201",
        instructor: "Dr. Sarah Johnson",
        type: "lecture",
      },
    },
    DaySchedule: {
      type: "object",
      properties: {
        day: { type: "string" },
        date: {
          type: "string",
          format: "date",
          description: "Date in YYYY-MM-DD format",
        },
        classes: {
          type: "array",
          items: { $ref: "#/components/schemas/ClassSession" },
        },
      },
      example: {
        day: "Monday",
        date: "2025-12-18",
        classes: [],
      },
    },
    ScheduleResponse: {
      type: "object",
      properties: {
        schedule: {
          type: "array",
          items: { $ref: "#/components/schemas/DaySchedule" },
        },
      },
    },
    // Leaderboard
    LeaderboardEntry: {
      type: "object",
      properties: {
        rank: { type: "integer" },
        studentId: { type: "string" },
        name: { type: "string" },
        avatar: { type: "string", nullable: true },
        department: { type: "string", nullable: true },
        level: { type: "integer" },
        score: { type: "number" },
        badge: { type: "string" },
      },
    },
    UserRank: {
      type: "object",
      nullable: true,
      properties: {
        rank: { type: "integer" },
        score: { type: "number" },
        percentile: { type: "number" },
      },
    },
    LeaderboardResponse: {
      type: "object",
      properties: {
        leaderboard: {
          type: "array",
          items: { $ref: "#/components/schemas/LeaderboardEntry" },
        },
        userRank: { $ref: "#/components/schemas/UserRank" },
      },
    },
    // Teacher
    Teacher: {
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
          description:
            "Teacher title (Dr. for doctors, TA for teaching assistants)",
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
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Dr. Alice",
        title: "Dr.",
        department: "Computer Science",
        email: "doctor.alice@example.com",
      },
    },
    TeachersListResponse: {
      type: "object",
      properties: {
        teachers: {
          type: "array",
          items: { $ref: "#/components/schemas/Teacher" },
        },
      },
    },
    TeacherScheduleSlot: {
      type: "object",
      properties: {
        lectureId: {
          type: "integer",
          description: "Lecture ID (present for doctors/lectures)",
          nullable: true,
        },
        tutorialLabId: {
          type: "integer",
          description: "Tutorial/Lab ID (present for teaching assistants)",
          nullable: true,
        },
        startTime: {
          type: "string",
          description:
            "Start time in 12-hour format with AM/PM (Cairo timezone)",
          example: "9:00 AM",
        },
        endTime: {
          type: "string",
          description: "End time in 12-hour format with AM/PM (Cairo timezone)",
          example: "10:30 AM",
        },
        courseCode: {
          type: "string",
          description: "Course code",
          example: "CS101",
        },
        courseName: {
          type: "string",
          description: "Course name",
          example: "Intro to Computer Science",
        },
        location: {
          type: "string",
          description: "Location",
          example: "Hall A",
        },
        type: {
          type: "string",
          enum: ["lecture", "lab", "tutorial"],
          description: "Type of slot",
          example: "lecture",
        },
      },
      example: {
        lectureId: 1,
        startTime: "9:00 AM",
        endTime: "10:30 AM",
        courseCode: "CS101",
        courseName: "Intro to Computer Science",
        location: "Hall A",
        type: "lecture",
      },
    },
    TeacherScheduleDay: {
      type: "object",
      properties: {
        day: {
          type: "string",
          description: "Day of the week",
        },
        slots: {
          type: "array",
          items: { $ref: "#/components/schemas/TeacherScheduleSlot" },
        },
      },
      example: {
        day: "Monday",
        slots: [],
      },
    },
    TeacherScheduleResponse: {
      type: "object",
      properties: {
        teacherId: {
          type: "string",
          format: "uuid",
          description: "Teacher unique ID",
        },
        teacherName: {
          type: "string",
          description: "Teacher full name",
        },
        schedule: {
          type: "array",
          items: { $ref: "#/components/schemas/TeacherScheduleDay" },
        },
      },
    },
    // Community Schemas
    CommunityPost: {
      type: "object",
      properties: {
        id: {
          type: "integer",
          example: 1,
        },
        group_id: {
          type: "integer",
          nullable: true,
          example: 1,
        },
        author_id: {
          type: "string",
          format: "uuid",
          example: "550e8400-e29b-41d4-a716-446655440000",
        },
        content: {
          type: "string",
          example: "This is a post content",
        },
        image_url: {
          type: "string",
          nullable: true,
          example: "https://example.com/image.jpg",
        },
        is_pinned: {
          type: "boolean",
          example: false,
        },
        created_at: {
          type: "string",
          format: "date-time",
          example: "2026-02-07T10:30:00Z",
        },
        users: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "a3b5c7d9-e1f2-4a6b-8c9d-0e1f2a3b4c5d",
            },
            full_name: {
              type: "string",
              example: "John Doe",
            },
            avatar_url: {
              type: "string",
              nullable: true,
              example: "https://example.com/avatar.jpg",
            },
          },
        },
        community_groups: {
          type: "object",
          nullable: true,
          properties: {
            id: {
              type: "integer",
              example: 2,
            },
            name: {
              type: "string",
              example: "Computer Science Club",
            },
          },
        },
      },
    },
    CommunityFeedPost: {
      type: "object",
      properties: {
        id: {
          type: "integer",
          example: 1,
        },
        author_name: {
          type: "string",
          example: "John Doe",
        },
        author_avatar: {
          type: "string",
          nullable: true,
          example: "https://example.com/avatar.jpg",
        },
        group_name: {
          type: "string",
          nullable: true,
          example: "Computer Science Club",
        },
        content: {
          type: "string",
          example:
            "Just finished my final project for Database Systems! Really proud of what we accomplished as a team.",
        },
        image_url: {
          type: "string",
          nullable: true,
          example: "https://storage.example.com/posts/project-demo.jpg",
        },
        likes_count: {
          type: "integer",
          example: 15,
        },
        comments_count: {
          type: "integer",
          example: 5,
        },
        created_at: {
          type: "string",
          format: "date-time",
          example: "2026-02-07T14:25:00Z",
        },
        recent_comments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: {
                type: "integer",
                example: 12,
              },
              content: {
                type: "string",
                example: "Congratulations! That's awesome!",
              },
              created_at: {
                type: "string",
                format: "date-time",
                example: "2026-02-07T14:30:00Z",
              },
              author_name: {
                type: "string",
                example: "Sarah Johnson",
              },
              author_avatar: {
                type: "string",
                nullable: true,
                example: "https://storage.example.com/avatars/sarah-j.jpg",
              },
            },
          },
        },
      },
    },
    PostComment: {
      type: "object",
      properties: {
        id: {
          type: "integer",
          example: 1,
        },
        post_id: {
          type: "integer",
          example: 1,
        },
        author_id: {
          type: "string",
          format: "uuid",
          example: "b4c6d8e0-f2a3-5b7c-9d0e-1f2a3b4c5d6e",
        },
        content: {
          type: "string",
          example: "Great post! Really inspiring to see your progress.",
        },
        created_at: {
          type: "string",
          format: "date-time",
          example: "2026-02-07T15:10:00Z",
        },
        author_name: {
          type: "string",
          example: "Jane Smith",
        },
        author_avatar: {
          type: "string",
          nullable: true,
          example: "https://example.com/avatar.jpg",
        },
      },
    },
    CommunityGroup: {
      type: "object",
      properties: {
        id: {
          type: "integer",
          example: 1,
        },
        name: {
          type: "string",
          example: "Computer Science Club",
        },
        description: {
          type: "string",
          nullable: true,
          example: "A community for CS students",
        },
        avatar_url: {
          type: "string",
          nullable: true,
          example: "https://example.com/group-avatar.jpg",
        },
        created_at: {
          type: "string",
          format: "date-time",
          example: "2025-09-01T08:00:00Z",
        },
        members_count: {
          type: "integer",
          example: 45,
        },
      },
    },
    Event: {
      type: "object",
      properties: {
        id: {
          type: "integer",
          example: 1,
        },
        title: {
          type: "string",
          example: "Annual Tech Conference",
        },
        event_date: {
          type: "string",
          example: "2026-03-15",
        },
        time: {
          type: "string",
          nullable: true,
          example: "14:00",
        },
        location: {
          type: "string",
          nullable: true,
          example: "Main Auditorium",
        },
        img_url: {
          type: "string",
          nullable: true,
          example: "https://example.com/event.jpg",
        },
        link: {
          type: "string",
          nullable: true,
          example: "https://example.com/register",
        },
        description: {
          type: "string",
          nullable: true,
          example: "Join us for the annual tech conference",
        },
      },
    },
  },
};
