export default {
    paths: {
        "/registration/available-offerings": {
            get: {
                tags: ["Registration"],
                summary: "Get available course offerings for registration",
                description: "Role-aware endpoint.\n\n**Students / Leaders**: Returns only the courses the student is eligible for — completed courses and courses with unmet prerequisites are excluded. Each lecture/lab includes an `enrolled` flag indicating current registration status.\n\n**Doctor / Teaching Assistant / Admin / Super Admin**: Returns all course offerings for the semester with no filtering.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "semester",
                        in: "query",
                        required: false,
                        schema: { type: "string", example: "Fall 2025" },
                        description: "Semester to fetch offerings for. Defaults to the latest available semester.",
                    },
                ],
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
        "/registration/register-lab": {
            post: {
                tags: ["Registration"],
                summary: "Register a lab for an already-enrolled lecture",
                description: "Use this endpoint after unregistering from a lab to pick a different lab for a course you are already enrolled in. The student must already have an active enrollment for the given `lectureId`.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["lectureId", "labId"],
                                properties: {
                                    lectureId: {
                                        type: "integer",
                                        description: "ID of the lecture the student is already enrolled in",
                                        example: 5,
                                    },
                                    labId: {
                                        type: "integer",
                                        description: "ID of the new lab to register for",
                                        example: 12,
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: "Lab registered successfully" },
                    400: { description: "Validation error, conflict, or capacity issue" },
                    404: { description: "Lecture or lab not found" },
                    401: { description: "Not authenticated" },
                    500: { description: "Internal server error" },
                },
            },
        },
        "/registration/unregister": {
            delete: {
                tags: ["Registration"],
                summary: "Unregister from a course or lab",
                description: "Provide `lectureId` to unregister from the entire course (lecture + lab removed). Provide `tutorialLabId` to unregister from the lab only — the lecture enrollment is removed for that pairing and you can re-register the same lecture with a different lab.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/UnregisterRequest",
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Successfully unregistered",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/UnregisterResponse",
                                },
                            },
                        },
                    },
                    400: {
                        description: "Bad request - must provide either lectureId or tutorialLabId",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    404: {
                        description: "Lecture/Lab or enrollment not found",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
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
                    enrolled: {
                        type: "boolean",
                        description: "Indicates if the current student is already enrolled in this session",
                        example: false,
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
                required: ["selectedLectureIds", "selectedLabIds"],
                properties: {
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
            UnregisterRequest: {
                type: "object",
                properties: {
                    lectureId: {
                        type: "integer",
                        description: "ID of the lecture to unregister from. Removes the lecture and all its associated lab enrollments.",
                        example: 101,
                    },
                    tutorialLabId: {
                        type: "integer",
                        description: "ID of the lab to unregister from. Removes only this lab pairing; you can then register the same lecture with a different lab.",
                        example: 201,
                    },
                },
            },
            UnregisterResponse: {
                type: "object",
                properties: {
                    message: {
                        type: "string",
                        example: "Successfully unregistered from Data Structures",
                    },
                    courseCode: {
                        type: "string",
                        example: "CS201",
                    },
                    enrollmentsDeleted: {
                        type: "integer",
                        description: "Number of enrollment records deleted",
                        example: 1,
                    },
                },
            },
        },
    },
};
