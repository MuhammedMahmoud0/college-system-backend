export default {
    paths: {
        "/grades/lecture/{lectureId}": {
            get: {
                tags: ["Grades"],
                summary: "List student grades for a lecture",
                description:
                    "Returns all enrolled students with their grade breakdown (mid, work, final, letter) for the given lecture. Accessible only to the lecture's instructor (doctor), Admin, and Super Admin.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "lectureId",
                        in: "path",
                        required: true,
                        schema: { type: "integer" },
                        description: "The lecture ID",
                    },
                ],
                responses: {
                    200: {
                        description: "Student grades retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/GradesByLectureResponse",
                                },
                            },
                        },
                    },
                    403: {
                        description:
                            "Forbidden — caller is not the instructor for this lecture.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    404: {
                        description: "Lecture not found.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    401: { description: "Unauthorized." },
                    500: { description: "Internal server error." },
                },
            },
        },

        "/grades/tutorial-lab/{tutorialLabId}": {
            get: {
                tags: ["Grades"],
                summary: "List student grades for a tutorial/lab",
                description:
                    "Returns all enrolled students with their grade breakdown (mid, work, final, letter) for the given tutorial/lab. Accessible only to the tutorial/lab's TA, Admin, and Super Admin.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "tutorialLabId",
                        in: "path",
                        required: true,
                        schema: { type: "integer" },
                        description: "The tutorial/lab ID",
                    },
                ],
                responses: {
                    200: {
                        description: "Student grades retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/GradesByTutorialLabResponse",
                                },
                            },
                        },
                    },
                    403: {
                        description:
                            "Forbidden — caller is not the TA for this tutorial/lab.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    404: {
                        description: "Tutorial/Lab not found.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    401: { description: "Unauthorized." },
                    500: { description: "Internal server error." },
                },
            },
        },

        "/grades/lecture/{lectureId}/student/{studentId}": {
            put: {
                tags: ["Grades"],
                summary: "Update a student's grades in a lecture",
                description:
                    "Provide mid_score, work_score, and/or final_score. When all three scores are present the letter grade and course GPA points are computed automatically from the total (out of 100) — no manual grade input required. Triggers a student notification and recalculates their CGPA. Accessible to the lecture's instructor (Doctor), Admin, and Super Admin.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "lectureId",
                        in: "path",
                        required: true,
                        schema: { type: "integer" },
                        description: "The lecture ID",
                    },
                    {
                        name: "studentId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                        description: "The student's user ID (UUID)",
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/UpdateGradeRequest",
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Grade updated successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/UpdateGradeResponse",
                                },
                            },
                        },
                    },
                    400: {
                        description:
                            "Validation error — no fields provided, a score is negative, or the total exceeds 100.",
                    },
                    403: {
                        description:
                            "Forbidden — caller is not the instructor for this lecture.",
                    },
                    404: { description: "Lecture or enrollment not found." },
                    401: { description: "Unauthorized." },
                    500: { description: "Internal server error." },
                },
            },
        },

        "/grades/tutorial-lab/{tutorialLabId}/student/{studentId}": {
            put: {
                tags: ["Grades"],
                summary: "Update a student's grades in a tutorial/lab",
                description:
                    "Provide mid_score, work_score, and/or final_score. When all three scores are present the letter grade and course GPA points are computed automatically from the total (out of 100) — no manual grade input required. Triggers a student notification and recalculates their CGPA. Accessible to the tutorial/lab's TA, Admin, and Super Admin.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "tutorialLabId",
                        in: "path",
                        required: true,
                        schema: { type: "integer" },
                        description: "The tutorial/lab ID",
                    },
                    {
                        name: "studentId",
                        in: "path",
                        required: true,
                        schema: { type: "string", format: "uuid" },
                        description: "The student's user ID (UUID)",
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/UpdateGradeRequest",
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Grade updated successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/UpdateGradeResponse",
                                },
                            },
                        },
                    },
                    400: {
                        description:
                            "Validation error — no fields provided, a score is negative, or the total exceeds 100.",
                    },
                    403: {
                        description:
                            "Forbidden — caller is not the TA for this tutorial/lab.",
                    },
                    404: {
                        description: "Tutorial/Lab or enrollment not found.",
                    },
                    401: { description: "Unauthorized." },
                    500: { description: "Internal server error." },
                },
            },
        },
    },

    schemas: {
        UpdateGradeRequest: {
            type: "object",
            description:
                "Provide at least one score field. The letter grade is computed automatically from the total (mid + work + final out of 100) — do NOT send a grade field.",
            properties: {
                mid_score: {
                    type: "number",
                    format: "float",
                    example: 18.5,
                    description: "Midterm score (partial of 100 total)",
                },
                work_score: {
                    type: "number",
                    format: "float",
                    example: 9.0,
                    description:
                        "Coursework / assignment score (partial of 100 total)",
                },
                final_score: {
                    type: "number",
                    format: "float",
                    example: 55.0,
                    description: "Final exam score (partial of 100 total)",
                },
            },
        },

        UpdateGradeResponse: {
            type: "object",
            properties: {
                message: {
                    type: "string",
                    example: "Grade updated successfully.",
                },
                enrollment: {
                    $ref: "#/components/schemas/EnrollmentObject",
                },
                total_score: {
                    type: "number",
                    example: 82.5,
                    nullable: true,
                    description:
                        "Computed total score (mid + work + final). Present only when all three scores are available.",
                },
                grade_points: {
                    type: "number",
                    example: 2.7,
                    nullable: true,
                    description:
                        "GPA points for this course, derived from the letter grade (4.0 scale). Present only when all three scores are available.",
                },
            },
        },

        GradeStudentRow: {
            type: "object",
            properties: {
                enrollment_id: { type: "integer", example: 42 },
                student_id: { type: "string", format: "uuid" },
                full_name: { type: "string", example: "Ahmed Hassan" },
                email: {
                    type: "string",
                    example: "ahmed@university.edu",
                },
                mid_score: { type: "number", example: 18.5, nullable: true },
                work_score: { type: "number", example: 9.0, nullable: true },
                final_score: { type: "number", example: 55.0, nullable: true },
                grade: { type: "string", example: "A", nullable: true },
            },
        },

        GradesByLectureResponse: {
            type: "object",
            properties: {
                lecture_id: { type: "integer", example: 3 },
                course: { type: "string", example: "Data Structures" },
                course_code: { type: "string", example: "CS201" },
                group: { type: "string", example: "G1", nullable: true },
                total: { type: "integer", example: 35 },
                students: {
                    type: "array",
                    items: {
                        allOf: [
                            { $ref: "#/components/schemas/GradeStudentRow" },
                            {
                                type: "object",
                                properties: {
                                    lab_group: {
                                        type: "string",
                                        example: "L2",
                                        nullable: true,
                                        description:
                                            "The tutorial/lab group this student belongs to, if any",
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        },

        GradesByTutorialLabResponse: {
            type: "object",
            properties: {
                tutorial_lab_id: { type: "integer", example: 7 },
                course: { type: "string", example: "Data Structures" },
                course_code: { type: "string", example: "CS201" },
                type: { type: "string", example: "lab" },
                group: { type: "string", example: "L2", nullable: true },
                total: { type: "integer", example: 20 },
                students: {
                    type: "array",
                    items: {
                        allOf: [
                            { $ref: "#/components/schemas/GradeStudentRow" },
                            {
                                type: "object",
                                properties: {
                                    lecture_group: {
                                        type: "string",
                                        example: "G1",
                                        nullable: true,
                                        description:
                                            "The lecture group this student belongs to",
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        },

        EnrollmentObject: {
            type: "object",
            properties: {
                id: { type: "integer", example: 42 },
                student_user_id: { type: "string", format: "uuid" },
                lecture_id: { type: "integer", example: 3 },
                tutorial_lab_id: {
                    type: "integer",
                    example: 7,
                    nullable: true,
                },
                status: {
                    type: "string",
                    enum: ["enrolled", "dropped", "completed"],
                    example: "completed",
                    description:
                        "Changes to 'completed' automatically when all three scores are entered and the final grade is assigned.",
                },
                mid_score: { type: "number", example: 18.5, nullable: true },
                work_score: { type: "number", example: 9.0, nullable: true },
                final_score: { type: "number", example: 55.0, nullable: true },
                grade: { type: "string", example: "A", nullable: true },
            },
        },
    },
};
