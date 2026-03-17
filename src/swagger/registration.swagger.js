export default {
    paths: {
        "/registration/available-offerings": {
            get: {
                tags: ["Registration"],
                summary: "Get available course offerings",
                description: [
                    "Role-aware endpoint that returns course offerings for the given semester.",
                    "",
                    "### Student / Leader",
                    "- Only courses the student is **eligible** to take are returned.",
                    "- Courses already **completed** are excluded.",
                    "- Courses with **unmet prerequisites** are excluded.",
                    "- Each lecture and lab includes an `enrolled` boolean indicating whether the student is already registered.",
                    "",
                    "### Doctor / Teaching Assistant / Admin / Super Admin",
                    "- Returns **all** offerings for the semester with no eligibility filtering.",
                    "- `enrolled` flag is not included.",
                    "",
                    "Use the `semester` query parameter to switch between semesters. Defaults to the most recent semester in the database.",
                ].join("\n"),
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "semester",
                        in: "query",
                        required: false,
                        schema: {
                            type: "string",
                            example: "Fall 2025",
                        },
                        description:
                            "Semester to fetch offerings for (e.g. `Fall 2025`, `Spring 2026`). Omit to use the latest available semester.",
                    },
                ],
                responses: {
                    200: {
                        description:
                            "Available course offerings retrieved successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/AvailableOfferingsResponse",
                                },
                                example: {
                                    semester: "Spring 2026",
                                    offerings: [
                                        {
                                            offeringId: 3,
                                            courseName: "Data Structures",
                                            courseCode: "CS201",
                                            creditHours: 3,
                                            lectures: [
                                                {
                                                    id: 5,
                                                    group_number: "1",
                                                    day_of_week: "Monday",
                                                    start_time: "09:00",
                                                    end_time: "10:30",
                                                    location: "Hall A",
                                                    instructor:
                                                        "Dr. Ahmed Hassan",
                                                    capacity: 50,
                                                    enrolled_count: 32,
                                                    available_seats: 18,
                                                    type: "LECTURE",
                                                    enrolled: false,
                                                },
                                            ],
                                            labs: [
                                                {
                                                    id: 12,
                                                    group_number: "G1",
                                                    day_of_week: "Wednesday",
                                                    start_time: "11:00",
                                                    end_time: "12:30",
                                                    location: "Lab 3",
                                                    instructor:
                                                        "Eng. Sara Khaled",
                                                    capacity: 25,
                                                    enrolled_count: 10,
                                                    available_seats: 15,
                                                    type: "lab",
                                                    enrolled: false,
                                                },
                                                {
                                                    id: 13,
                                                    group_number: "G2",
                                                    day_of_week: "Thursday",
                                                    start_time: "14:00",
                                                    end_time: "15:30",
                                                    location: "Lab 3",
                                                    instructor:
                                                        "Eng. Sara Khaled",
                                                    capacity: 25,
                                                    enrolled_count: 25,
                                                    available_seats: 0,
                                                    type: "lab",
                                                    enrolled: true,
                                                },
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    },
                    401: {
                        description:
                            "Not authenticated — missing or invalid token",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                                example: { error: "Not authenticated" },
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
                                example: { error: "Internal server error" },
                            },
                        },
                    },
                },
            },
        },

        "/registration/register": {
            post: {
                tags: ["Registration"],
                summary: "Register for courses (lecture + lab pairs)",
                description: [
                    "Registers a student for one or more courses. Each course requires **both** a lecture and a lab to be selected.",
                    "",
                    "### Rules",
                    "- `selectedLectureIds` and `selectedLabIds` must both be arrays (can be empty but not both).",
                    "- Each lecture must have **exactly one matching lab** from the same course offering.",
                    "- The system checks for **schedule conflicts** between:",
                    "  - The newly selected sessions with each other.",
                    "  - Each new session against the student's **already-enrolled** sessions.",
                    "- If any lecture or lab is **at full capacity**, the entire registration is rejected.",
                    "- If the student is **already enrolled** in a lecture, the registration is rejected.",
                    "- Each successful enrollment generates a **pending invoice**: `credit_price × credit_hours`.",
                    "",
                    "### Important",
                    "All validations run inside a database transaction — either everything succeeds or nothing is saved.",
                ].join("\n"),
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/RegisterCoursesRequest",
                            },
                            example: {
                                selectedLectureIds: [5, 8],
                                selectedLabIds: [12, 19],
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description:
                            "Registration successful — all enrollments created",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/RegisterCoursesResponse",
                                },
                                example: {
                                    message: "Registration successful",
                                    enrollments: 2,
                                    details: [
                                        {
                                            id: 44,
                                            student_user_id:
                                                "9c60d94a-99e3-44e7-86df-074833cab9e8",
                                            lecture_id: 5,
                                            tutorial_lab_id: 12,
                                            status: "enrolled",
                                        },
                                        {
                                            id: 45,
                                            student_user_id:
                                                "9c60d94a-99e3-44e7-86df-074833cab9e8",
                                            lecture_id: 8,
                                            tutorial_lab_id: 19,
                                            status: "enrolled",
                                        },
                                    ],
                                },
                            },
                        },
                    },
                    400: {
                        description:
                            "Validation error — time conflict, capacity full, missing lab, or already enrolled",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                                examples: {
                                    scheduleConflict: {
                                        summary:
                                            "Conflict between newly selected sessions",
                                        value: {
                                            error: "Schedule conflict on Monday: Data Structures (CS201) [09:00-10:30] overlaps with Algorithms (CS301) [10:00-11:30]",
                                        },
                                    },
                                    conflictWithExisting: {
                                        summary:
                                            "Conflict with an already-enrolled session",
                                        value: {
                                            error: "Schedule conflict on Wednesday: Operating Systems (CS401) [11:00-12:30] overlaps with Networks (CS402) [11:30-13:00]",
                                        },
                                    },
                                    capacityFull: {
                                        summary: "Lecture is full",
                                        value: {
                                            error: "Lecture Data Structures (CS201) is full",
                                        },
                                    },
                                    noLabSelected: {
                                        summary:
                                            "No lab selected for a lecture",
                                        value: {
                                            error: "No lab selected for course Data Structures (CS201)",
                                        },
                                    },
                                    alreadyEnrolled: {
                                        summary:
                                            "Already enrolled in this lecture",
                                        value: {
                                            error: "Already enrolled in Data Structures (CS201)",
                                        },
                                    },
                                    invalidInput: {
                                        summary:
                                            "Invalid request body structure",
                                        value: {
                                            error: "Invalid input. Required: selectedLectureIds (array), selectedLabIds (array)",
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
                                example: { error: "Not authenticated" },
                            },
                        },
                    },
                    403: {
                        description:
                            "Forbidden — only students and leaders can register",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                                example: { error: "Forbidden" },
                            },
                        },
                    },
                    402: {
                        description:
                            "Payment required — user has pending unpaid invoices",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                                example: {
                                    error: "You have unpaid invoices. Please complete payment before continuing.",
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
                                example: { error: "Internal server error" },
                            },
                        },
                    },
                },
            },
        },

        "/registration/register-lab": {
            post: {
                tags: ["Registration"],
                summary: "Register a replacement lab for an enrolled lecture",
                description: [
                    "Use this endpoint **after unregistering from a lab** to assign a new lab to an existing lecture enrollment.",
                    "",
                    "### When to use",
                    "The student already holds a lecture enrollment (created via `POST /registration/register`) but `tutorial_lab_id` is currently `null` — either because the lab was unregistered via `DELETE /registration/unregister` or was never assigned.",
                    "",
                    "### Rules",
                    "- The student must be **already enrolled** in the specified `lectureId`.",
                    "- The current `tutorial_lab_id` must be **null**. If a lab is already assigned, unregister it first.",
                    "- The selected lab must belong to the **same course offering** as the lecture.",
                    "- The lab must **not be at full capacity**.",
                    "- The lab's schedule must **not conflict** with any other enrolled session.",
                ].join("\n"),
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/RegisterLabRequest",
                            },
                            example: {
                                lectureId: 5,
                                labId: 13,
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Lab registered successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/RegisterLabResponse",
                                },
                                example: {
                                    message:
                                        "Successfully registered for lab G2 in Data Structures.",
                                    courseCode: "CS201",
                                    enrollment: {
                                        id: 44,
                                        student_user_id:
                                            "9c60d94a-99e3-44e7-86df-074833cab9e8",
                                        lecture_id: 5,
                                        tutorial_lab_id: 13,
                                        status: "enrolled",
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description:
                            "Validation error — not enrolled, lab already assigned, wrong offering, capacity full, or schedule conflict",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                                examples: {
                                    notEnrolled: {
                                        summary: "Not enrolled in this lecture",
                                        value: {
                                            error: "You are not enrolled in this lecture. Register for the full course first.",
                                        },
                                    },
                                    labAlreadyAssigned: {
                                        summary:
                                            "Lab already assigned to this enrollment",
                                        value: {
                                            error: "You already have a lab assigned for this lecture. Unregister from the current lab first.",
                                        },
                                    },
                                    wrongOffering: {
                                        summary:
                                            "Lab does not belong to the same offering",
                                        value: {
                                            error: "The selected lab does not belong to the same course offering as the lecture.",
                                        },
                                    },
                                    capacityFull: {
                                        summary: "Lab is at full capacity",
                                        value: {
                                            error: "Lab G2 for Data Structures is full",
                                        },
                                    },
                                    scheduleConflict: {
                                        summary:
                                            "Lab time conflicts with another enrolled session",
                                        value: {
                                            error: "Schedule conflict on Wednesday: Data Structures (CS201) [11:00-12:30] overlaps with Networks (CS402) [11:30-13:00]",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: {
                        description: "Lecture or lab not found",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                                examples: {
                                    lectureNotFound: {
                                        summary: "Lecture ID does not exist",
                                        value: { error: "Lecture not found" },
                                    },
                                    labNotFound: {
                                        summary: "Lab ID does not exist",
                                        value: { error: "Lab not found" },
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
                                example: { error: "Not authenticated" },
                            },
                        },
                    },
                    403: {
                        description:
                            "Forbidden — only students and leaders can register",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                                example: { error: "Forbidden" },
                            },
                        },
                    },
                    402: {
                        description:
                            "Payment required — user has pending unpaid invoices",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                                example: {
                                    error: "You have unpaid invoices. Please complete payment before continuing.",
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
                                example: { error: "Internal server error" },
                            },
                        },
                    },
                },
            },
        },

        "/registration/unregister": {
            delete: {
                tags: ["Registration"],
                summary: "Unregister from a course or lab",
                description: [
                    "Two distinct behaviors depending on which field is provided:",
                    "",
                    "### Unregister from a full course — provide `lectureId`",
                    "- Deletes **all** enrollment rows for that lecture.",
                    "- Both the lecture and the associated lab are fully removed.",
                    "- Billing behavior:",
                    "  - Unpaid invoice (`pending`/`failed`) for that enrollment is deleted.",
                    "  - Paid invoice is refunded via PayPal and marked as `refunded`.",
                    "- Use this to completely drop a course.",
                    "",
                    "### Unregister from a lab only — provide `tutorialLabId`",
                    "- Sets `tutorial_lab_id = null` on the enrollment row.",
                    "- The **lecture enrollment is kept** — the student remains registered for the course.",
                    "- No refund is performed for lab-only unregister.",
                    "- Use `POST /registration/register-lab` afterwards to pick a different lab.",
                    "",
                    "**Only one of `lectureId` or `tutorialLabId` should be provided per request.**",
                ].join("\n"),
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/UnregisterRequest",
                            },
                            examples: {
                                dropFullCourse: {
                                    summary:
                                        "Drop entire course (lecture + lab)",
                                    value: { lectureId: 5 },
                                },
                                dropLabOnly: {
                                    summary: "Drop lab only (lecture is kept)",
                                    value: { tutorialLabId: 12 },
                                },
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
                                examples: {
                                    courseDrop: {
                                        summary: "Full course dropped",
                                        value: {
                                            message:
                                                "Successfully unregistered from Data Structures. Lecture and associated lab removed.",
                                            courseCode: "CS201",
                                            enrollmentsDeleted: 1,
                                            billing: {
                                                pendingInvoicesDeleted: 1,
                                                paidInvoicesRefunded: 0,
                                            },
                                        },
                                    },
                                    labDrop: {
                                        summary: "Lab dropped, lecture kept",
                                        value: {
                                            message:
                                                "Successfully unregistered from lab for Data Structures. You can now register the same lecture with a different lab.",
                                            courseCode: "CS201",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description:
                            "Neither lectureId nor tutorialLabId was provided",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                                example: {
                                    error: "Must provide either lectureId or tutorialLabId",
                                },
                            },
                        },
                    },
                    404: {
                        description: "Lecture, lab, or enrollment not found",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                                examples: {
                                    lectureNotFound: {
                                        summary: "Lecture ID does not exist",
                                        value: { error: "Lecture not found" },
                                    },
                                    refundFailed: {
                                        summary:
                                            "Paid invoice refund failed (unregister blocked)",
                                        value: {
                                            error: "Refund failed for invoice 12",
                                            paypalStatus: "DENIED",
                                        },
                                    },
                                    enrollmentNotFound: {
                                        summary:
                                            "Student is not enrolled in this lecture",
                                        value: {
                                            error: "No enrollment found for this lecture",
                                        },
                                    },
                                    labEnrollmentNotFound: {
                                        summary:
                                            "Student is not enrolled in this lab",
                                        value: {
                                            error: "No enrollment found for this lab",
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
                                example: { error: "Not authenticated" },
                            },
                        },
                    },
                    403: {
                        description:
                            "Forbidden — only students and leaders can unregister",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                                example: { error: "Forbidden" },
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
                                example: { error: "Internal server error" },
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
                description:
                    "A single lecture or lab section within a course offering",
                properties: {
                    id: {
                        type: "integer",
                        description:
                            "Unique ID of the session (use as lectureId or labId in registration requests)",
                        example: 5,
                    },
                    group_number: {
                        type: "string",
                        description: "Group label for this section",
                        example: "G1",
                    },
                    day_of_week: {
                        type: "string",
                        description: "Day this session is held",
                        example: "Monday",
                    },
                    start_time: {
                        type: "string",
                        description:
                            "Start time in HH:MM format (24-hour, Africa/Cairo timezone)",
                        example: "09:00",
                    },
                    end_time: {
                        type: "string",
                        description:
                            "End time in HH:MM format (24-hour, Africa/Cairo timezone)",
                        example: "10:30",
                    },
                    location: {
                        type: "string",
                        description: "Room or hall",
                        example: "Hall A",
                    },
                    instructor: {
                        type: "string",
                        description:
                            "Name of the instructor or teaching assistant",
                        example: "Dr. Ahmed Hassan",
                    },
                    capacity: {
                        type: "integer",
                        description:
                            "Maximum number of students allowed in this section",
                        example: 50,
                    },
                    enrolled_count: {
                        type: "integer",
                        description: "Current number of enrolled students",
                        example: 32,
                    },
                    available_seats: {
                        type: "integer",
                        description:
                            "Remaining seats (capacity - enrolled_count)",
                        example: 18,
                    },
                    type: {
                        type: "string",
                        description:
                            "Session type — `LECTURE` for lectures, `lab` or `tutorial` for labs",
                        example: "LECTURE",
                    },
                    enrolled: {
                        type: "boolean",
                        description:
                            "Whether the current student is already enrolled in this section. Only present in student/leader responses.",
                        example: false,
                    },
                },
            },

            CourseOffering: {
                type: "object",
                description:
                    "A course offered in a specific semester. Contains separate arrays of available lecture and lab sections to choose from.",
                properties: {
                    offeringId: {
                        type: "integer",
                        description: "Unique ID of the course offering",
                        example: 3,
                    },
                    courseName: {
                        type: "string",
                        description: "Full name of the course",
                        example: "Data Structures",
                    },
                    courseCode: {
                        type: "string",
                        description: "Course code",
                        example: "CS201",
                    },
                    creditHours: {
                        type: "integer",
                        description: "Credit hours awarded upon completion",
                        example: 3,
                    },
                    lectures: {
                        type: "array",
                        description:
                            "Available lecture sections for this offering",
                        items: { $ref: "#/components/schemas/Session" },
                    },
                    labs: {
                        type: "array",
                        description:
                            "Available lab/tutorial sections for this offering",
                        items: { $ref: "#/components/schemas/Session" },
                    },
                },
            },

            AvailableOfferingsResponse: {
                type: "object",
                properties: {
                    semester: {
                        type: "string",
                        description: "The semester these offerings belong to",
                        example: "Spring 2026",
                    },
                    offerings: {
                        type: "array",
                        description: "List of available course offerings",
                        items: { $ref: "#/components/schemas/CourseOffering" },
                    },
                },
            },

            RegisterCoursesRequest: {
                type: "object",
                required: ["selectedLectureIds", "selectedLabIds"],
                description:
                    "Submit parallel arrays of lecture and lab IDs. The system matches each lecture to its corresponding lab by course offering — array order does not need to match, but each lecture must have exactly one lab from the same offering.",
                properties: {
                    selectedLectureIds: {
                        type: "array",
                        description:
                            "IDs of the lectures to register for (one per course)",
                        items: { type: "integer" },
                        example: [5, 8],
                    },
                    selectedLabIds: {
                        type: "array",
                        description:
                            "IDs of the labs to register for. Each lab must belong to the same course offering as one of the selected lectures.",
                        items: { type: "integer" },
                        example: [12, 19],
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
                        description: "Total number of enrollment rows created",
                        example: 2,
                    },
                    details: {
                        type: "array",
                        description: "The newly created enrollment records",
                        items: {
                            $ref: "#/components/schemas/EnrollmentRecord",
                        },
                    },
                    billing: {
                        type: "object",
                        properties: {
                            invoices: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        id: { type: "integer", example: 12 },
                                        course_code: {
                                            type: "string",
                                            example: "CS201",
                                        },
                                        total_amount: {
                                            type: "number",
                                            example: 900,
                                        },
                                        status: {
                                            type: "string",
                                            example: "pending",
                                        },
                                    },
                                },
                            },
                            totalBilled: { type: "number", example: 900 },
                            currency: { type: "string", example: "USD" },
                        },
                    },
                },
            },

            RegisterLabRequest: {
                type: "object",
                required: ["lectureId", "labId"],
                description:
                    "Assign a lab to an existing lecture enrollment whose `tutorial_lab_id` is currently null.",
                properties: {
                    lectureId: {
                        type: "integer",
                        description:
                            "ID of the lecture the student is already enrolled in. The enrollment must have `tutorial_lab_id = null`.",
                        example: 5,
                    },
                    labId: {
                        type: "integer",
                        description:
                            "ID of the new lab to assign. Must belong to the same course offering as the lecture.",
                        example: 13,
                    },
                },
            },

            RegisterLabResponse: {
                type: "object",
                properties: {
                    message: {
                        type: "string",
                        example:
                            "Successfully registered for lab G2 in Data Structures.",
                    },
                    courseCode: {
                        type: "string",
                        example: "CS201",
                    },
                    enrollment: {
                        $ref: "#/components/schemas/EnrollmentRecord",
                    },
                },
            },

            UnregisterRequest: {
                type: "object",
                description:
                    "Provide **either** `lectureId` (drop full course) **or** `tutorialLabId` (drop lab only, keep lecture). Do not provide both.",
                properties: {
                    lectureId: {
                        type: "integer",
                        description:
                            "Drop the entire course enrollment. Removes the enrollment row — both the lecture and lab associations are deleted.",
                        example: 5,
                    },
                    tutorialLabId: {
                        type: "integer",
                        description:
                            "Drop the lab only. Sets `tutorial_lab_id = null` on the enrollment — the lecture registration is preserved.",
                        example: 12,
                    },
                },
            },

            UnregisterResponse: {
                type: "object",
                properties: {
                    message: {
                        type: "string",
                        example:
                            "Successfully unregistered from Data Structures. Lecture and associated lab removed.",
                    },
                    courseCode: {
                        type: "string",
                        example: "CS201",
                    },
                    enrollmentsDeleted: {
                        type: "integer",
                        description:
                            "Number of enrollment rows deleted. Only present when `lectureId` is used (full course drop).",
                        example: 1,
                    },
                    billing: {
                        type: "object",
                        description:
                            "Billing impact summary. Present when `lectureId` is used.",
                        properties: {
                            pendingInvoicesDeleted: {
                                type: "integer",
                                description:
                                    "How many unpaid invoices were removed",
                                example: 1,
                            },
                            paidInvoicesRefunded: {
                                type: "integer",
                                description:
                                    "How many paid invoices were refunded",
                                example: 0,
                            },
                        },
                    },
                },
            },

            EnrollmentRecord: {
                type: "object",
                description: "A single row from the enrollments table",
                properties: {
                    id: {
                        type: "integer",
                        description: "Auto-incremented enrollment ID",
                        example: 44,
                    },
                    student_user_id: {
                        type: "string",
                        format: "uuid",
                        description: "UUID of the enrolled student",
                        example: "9c60d94a-99e3-44e7-86df-074833cab9e8",
                    },
                    lecture_id: {
                        type: "integer",
                        description: "ID of the lecture for this enrollment",
                        example: 5,
                    },
                    tutorial_lab_id: {
                        type: "integer",
                        nullable: true,
                        description:
                            "ID of the assigned lab. `null` if no lab has been registered yet — use `POST /registration/register-lab` to assign one.",
                        example: 12,
                    },
                    status: {
                        type: "string",
                        enum: ["enrolled", "dropped", "completed"],
                        description: "Current enrollment status",
                        example: "enrolled",
                    },
                },
            },

            ErrorResponse: {
                type: "object",
                properties: {
                    error: {
                        type: "string",
                        description: "Human-readable error message",
                        example: "Internal server error",
                    },
                },
            },
        },
    },
};
