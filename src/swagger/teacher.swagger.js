export default {
    paths: {
        "/teachers": {
            get: {
                tags: ["Teachers"],
                summary:
                    "Get all teachers (doctors and teaching assistants) - Admin and Super Admin only",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description:
                            "List of all teachers retrieved successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/TeachersListResponse",
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
                                        {
                                            id: "123e4567-e89b-12d3-a456-426614174002",
                                            name: "TA John",
                                            title: "TA",
                                            department: "Computer Science",
                                            email: "ta.john@example.com",
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
                        description:
                            "Access denied - requires admin or super_admin role",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                                example: {
                                    error: "Access denied",
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
        "/teachers/{teacherId}/schedule": {
            get: {
                tags: ["Teachers"],
                summary:
                    "Get teacher's schedule (Doctor/TA can view their own schedule only)",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "teacherId",
                        required: true,
                        schema: {
                            type: "string",
                            format: "uuid",
                        },
                        description: "The teacher's unique ID",
                    },
                ],
                responses: {
                    200: {
                        description: "Teacher schedule retrieved successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/TeacherScheduleResponse",
                                },
                                example: {
                                    teacherId:
                                        "123e4567-e89b-12d3-a456-426614174000",
                                    teacherName: "Dr. Alice",
                                    schedule: [
                                        {
                                            day: "Sunday",
                                            slots: [],
                                        },
                                        {
                                            day: "Monday",
                                            slots: [
                                                {
                                                    startTime: "09:00:00",
                                                    endTime: "10:30:00",
                                                    courseCode: "CS101",
                                                    courseName:
                                                        "Intro to Computer Science",
                                                    location: "Hall A",
                                                    type: "lecture",
                                                },
                                                {
                                                    startTime: "10:00:00",
                                                    endTime: "12:00:00",
                                                    courseCode: null,
                                                    courseName: null,
                                                    location: "Office 301",
                                                    type: "office_hours",
                                                },
                                            ],
                                        },
                                        {
                                            day: "Tuesday",
                                            slots: [],
                                        },
                                        {
                                            day: "Wednesday",
                                            slots: [
                                                {
                                                    startTime: "13:00:00",
                                                    endTime: "14:00:00",
                                                    courseCode: "CS101",
                                                    courseName:
                                                        "Intro to Computer Science",
                                                    location: "Lab 1",
                                                    type: "tutorial",
                                                },
                                                {
                                                    startTime: "14:00:00",
                                                    endTime: "16:00:00",
                                                    courseCode: null,
                                                    courseName: null,
                                                    location: "Office 301",
                                                    type: "office_hours",
                                                },
                                            ],
                                        },
                                        {
                                            day: "Thursday",
                                            slots: [],
                                        },
                                        {
                                            day: "Friday",
                                            slots: [],
                                        },
                                        {
                                            day: "Saturday",
                                            slots: [],
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
                        description:
                            "Access denied - Teacher can only view their own schedule",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                                example: {
                                    error: "Access denied. You can only view your own schedule.",
                                },
                            },
                        },
                    },
                    404: {
                        description: "Teacher not found",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                                example: {
                                    error: "Teacher not found",
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
