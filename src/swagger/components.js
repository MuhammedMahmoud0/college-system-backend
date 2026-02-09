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
                token: { type: "string" },
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
                        "student",
                        "doctor",
                        "admin",
                        "super_admin",
                        "teaching_assistant",
                        "leader",
                    ],
                    description: "User role",
                },
                id: {
                    type: "string",
                    description:
                        "Student ID (required when role is 'student', must be unique)",
                },
            },
            example: {
                name: "John Smith",
                email: "john.smith@example.edu",
                password: "SuperSecurePass123",
                role: "student",
                id: "2021001234",
            },
        },
        CreateUserResponse: {
            type: "object",
            properties: {
                message: { type: "string" },
                userId: { type: "string" },
            },
        },
        UploadExcelResponse: {
            type: "object",
            properties: {
                message: { type: "string" },
                addedCount: { type: "integer" },
                skippedRows: { type: "integer" },
                errors: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            row: { type: "integer" },
                            error: { type: "string" },
                        },
                    },
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
                full_name: {
                    type: "string",
                    description: "Student's full name",
                },
                address: {
                    type: "string",
                    description: "Student's address",
                },
                phone: {
                    type: "string",
                    description: "Student's phone number",
                },
                national_id: {
                    type: "string",
                    description: "Student's national ID number",
                },
                avatar: {
                    type: "string",
                    format: "binary",
                    description: "Avatar image file (JPG, PNG, etc.)",
                },
            },
            example: {
                full_name: "John Doe",
                address: "Apartment 4B, 456 College Rd",
                phone: "+201112223334",
                national_id: "12345678901234",
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
        // Student Settings
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
                    description:
                        "Confirmation of new password (must match newPassword)",
                    example: "newSecurePassword456",
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
                startTime: {
                    type: "string",
                    description: "Start time",
                },
                endTime: {
                    type: "string",
                    description: "End time",
                },
                courseCode: {
                    type: "string",
                    nullable: true,
                    description: "Course code (null for office hours)",
                },
                courseName: {
                    type: "string",
                    nullable: true,
                    description: "Course name (null for office hours)",
                },
                location: {
                    type: "string",
                    description: "Location",
                },
                type: {
                    type: "string",
                    enum: ["lecture", "lab", "tutorial", "office_hours"],
                    description: "Type of slot",
                },
            },
            example: {
                startTime: "09:00:00",
                endTime: "10:30:00",
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
    },
};
