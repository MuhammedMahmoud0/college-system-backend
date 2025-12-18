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
                email: { type: "string", format: "email" },
                password: { type: "string" },
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
                name: { type: "string" },
                email: { type: "string", format: "email" },
                password: { type: "string" },
                role: { type: "string" },
            },
            example: {
                name: "John Smith",
                email: "john.smith@example.edu",
                password: "SuperSecurePass123",
                role: "student",
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
                address: { type: "string" },
                phone: { type: "string" },
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
    },
};
