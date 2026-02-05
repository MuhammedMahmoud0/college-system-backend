export default {
    paths: {
        "/registration/available-offerings": {
            get: {
                tags: ["Registration"],
                summary: "Get available course offerings for registration",
                description: "Fetches all course offerings for the current semester that the student is eligible to register for. Filters out completed courses and checks prerequisites.",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "Available course offerings retrieved successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/AvailableOfferingsResponse",
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
        "/registration/register": {
            post: {
                tags: ["Registration"],
                summary: "Register for selected courses",
                description: "Registers a student for selected lecture and lab sections. Performs time conflict checking and capacity validation.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/RegisterCoursesRequest",
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Registration successful",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/RegisterCoursesResponse",
                                },
                            },
                        },
                    },
                    400: {
                        description: "Bad request - time conflict, capacity full, or validation error",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                                examples: {
                                    timeConflict: {
                                        summary: "Time conflict",
                                        value: {
                                            error: "Conflict on Monday: Data Structures (CS201) [10:00-11:30] overlaps with Algorithms (CS301) [11:00-12:30]",
                                        },
                                    },
                                    capacityFull: {
                                        summary: "Capacity full",
                                        value: {
                                            error: "Lecture Data Structures (CS201) is full",
                                        },
                                    },
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
    components: {
        schemas: {
            Session: {
                type: "object",
                properties: {
                    id: {
                        type: "integer",
                        description: "Unique identifier for the session (lecture_id or tutorial_lab_id)",
                        example: 101,
                    },
                    group_number: {
                        type: "string",
                        description: "Group number for the session",
                        example: "1",
                    },
                    day_of_week: {
                        type: "string",
                        description: "Day of the week for the session",
                        example: "Monday",
                    },
                    start_time: {
                        type: "string",
                        description: "Start time in HH:MM format",
                        example: "10:00",
                    },
                    end_time: {
                        type: "string",
                        description: "End time in HH:MM format",
                        example: "11:30",
                    },
                    location: {
                        type: "string",
                        description: "Room or building location",
                        example: "Room 201",
                    },
                    instructor: {
                        type: "string",
                        description: "Name of the instructor or teaching assistant",
                        example: "Dr. John Smith",
                    },
                    capacity: {
                        type: "integer",
                        description: "Maximum number of students",
                        example: 40,
                    },
                    type: {
                        type: "string",
                        enum: ["LECTURE", "LAB"],
                        description: "Type of session",
                        example: "LECTURE",
                    },
                },
            },
            CourseOffering: {
                type: "object",
                properties: {
                    courseName: {
                        type: "string",
                        description: "Full name of the course",
                        example: "Data Structures and Algorithms",
                    },
                    courseCode: {
                        type: "string",
                        description: "Course code identifier",
                        example: "CS201",
                    },
                    creditHours: {
                        type: "integer",
                        description: "Number of credit hours",
                        example: 3,
                    },
                    lectures: {
                        type: "array",
                        description: "Available lecture sections",
                        items: {
                            $ref: "#/components/schemas/Session",
                        },
                    },
                    labs: {
                        type: "array",
                        description: "Available lab sections",
                        items: {
                            $ref: "#/components/schemas/Session",
                        },
                    },
                },
            },
            AvailableOfferingsResponse: {
                type: "object",
                properties: {
                    semester: {
                        type: "string",
                        description: "Current semester",
                        example: "Spring 2026",
                    },
                    offerings: {
                        type: "array",
                        description: "List of available course offerings",
                        items: {
                            $ref: "#/components/schemas/CourseOffering",
                        },
                    },
                },
            },
            RegisterCoursesRequest: {
                type: "object",
                required: ["studentId", "selectedLectureIds", "selectedLabIds"],
                properties: {
                    studentId: {
                        type: "string",
                        format: "uuid",
                        description: "UUID of the student",
                        example: "550e8400-e29b-41d4-a716-446655440000",
                    },
                    selectedLectureIds: {
                        type: "array",
                        description: "Array of lecture IDs to register for",
                        items: {
                            type: "integer",
                        },
                        example: [101, 102],
                    },
                    selectedLabIds: {
                        type: "array",
                        description: "Array of lab IDs to register for",
                        items: {
                            type: "integer",
                        },
                        example: [201, 202],
                    },
                },
            },
            RegisterCoursesResponse: {
                type: "object",
                properties: {
                    message: {
                        type: "string",
                        example: "Registration successful",
                    },
                    enrollments: {
                        type: "integer",
                        description: "Number of enrollments created",
                        example: 2,
                    },
                    details: {
                        type: "array",
                        description: "Details of created enrollments",
                        items: {
                            type: "object",
                            properties: {
                                student_user_id: {
                                    type: "string",
                                    format: "uuid",
                                },
                                lecture_id: {
                                    type: "integer",
                                },
                                tutorial_lab_id: {
                                    type: "integer",
                                },
                                status: {
                                    type: "string",
                                    example: "enrolled",
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};
