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
        // Attendance
        StartAttendanceSessionRequest: {
            type: "object",
            required: ["session_date"],
            properties: {
                lecture_id: {
                    type: "integer",
                    description:
                        "Lecture ID (required if tutorial_lab_id not provided)",
                    example: 1,
                },
                tutorial_lab_id: {
                    type: "integer",
                    description:
                        "Tutorial/Lab ID (required if lecture_id not provided)",
                    example: 1,
                },
                session_date: {
                    type: "string",
                    format: "date",
                    description: "Session date (YYYY-MM-DD)",
                    example: "2026-02-10",
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
                    description:
                        "QR code token scanned from the live attendance page",
                    example:
                        "550e8400-e29b-41d4-a716-446655440000:1707580800000:abc123def456",
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
                    example:
                        "https://storage.example.com/posts/project-demo.jpg",
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
                                example:
                                    "https://storage.example.com/avatars/sarah-j.jpg",
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
                    example:
                        "Great post! Really inspiring to see your progress.",
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
