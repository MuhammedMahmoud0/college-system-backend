export default {
    paths: {
        "/courses/student": {
            get: {
                tags: ["Courses"],
                summary: "Get student's enrolled courses",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "List of enrolled courses and GPA totals",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/StudentCoursesResponse",
                                },
                            },
                        },
                    },
                },
            },
        },
        "/courses/{courseId}": {
            get: {
                tags: ["Courses"],
                summary: "Get course details by lecture/course id",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "courseId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                        description: "Lecture/course identifier",
                    },
                ],
                responses: {
                    200: {
                        description: "Course detail",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/CourseDetailsResponse",
                                },
                            },
                        },
                    },
                    404: { description: "Course not found" },
                },
            },
        },
        "/courses/{courseId}/grades": {
            get: {
                tags: ["Courses"],
                summary: "Get grade breakdown for the student's enrollment",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "courseId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                        description: "Lecture/course identifier",
                    },
                ],
                responses: {
                    200: {
                        description: "Grade breakdown",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/GradeBreakdownResponse",
                                },
                            },
                        },
                    },
                    404: { description: "Enrollment not found" },
                },
            },
        },
        "/courses": {
            post: {
                tags: ["Courses"],
                summary: "Create a new course",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/CourseCreateRequest",
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Course created successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/CourseResponse",
                                },
                            },
                        },
                    },
                },
            },
        },
        "/courses/{code}": {
            patch: {
                tags: ["Courses"],
                summary: "Update a course",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "code",
                        in: "path",
                        required: true,
                        schema: {
                            type: "string",
                        },
                        description: "Course code",
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/CourseUpdateRequest",
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Course updated successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/CourseResponse",
                                },
                            },
                        },
                    },
                },
            },
            delete: {
                tags: ["Courses"],
                summary: "Delete a course",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "code",
                        in: "path",
                        required: true,
                        schema: {
                            type: "string",
                        },
                        description: "Course code",
                    },
                ],
                responses: {
                    200: {
                        description: "Course deleted successfully",
                    },
                    400: {
                        description: "Cannot delete course, it is a prerequisite for other modules",
                    },
                },
            },
        },
    },
    schemas: {
        CourseCreateRequest: {
            type: "object",
            properties: {
                code: {
                    type: "string",
                    example: "CS101",
                },
                name: {
                    type: "string",
                    example: "Introduction to Computer Science",
                },
                credits: {
                    type: "integer",
                    example: 3,
                },
                department: {
                    type: "string",
                    description: "Department name",
                    example: "Computer Science",
                },
                prerequisites: {
                    type: "array",
                    items: {
                        type: "string",
                    },
                    example: ["MATH101"],
                },
            },
            required: ["code", "name", "credits", "department"],
        },
        CourseUpdateRequest: {
            type: "object",
            properties: {
                name: {
                    type: "string",
                    example: "Advanced Computer Science",
                },
                prerequisites: {
                    type: "array",
                    items: {
                        type: "string",
                    },
                    example: ["CS101"],
                },
            },
        },
        CourseResponse: {
            type: "object",
            properties: {
                code: {
                    type: "string",
                },
                name: {
                    type: "string",
                },
                credits: {
                    type: "integer",
                },
                department: {
                    type: "string",
                    description: "Department name",
                },
                course_prerequisites_course_prerequisites_course_codeTocourses: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            courses_course_prerequisites_prerequisite_codeTocourses: {
                                type: "object",
                                properties: {
                                    code: { type: "string" },
                                    name: { type: "string" },
                                }
                            }
                        }
                    }
                }
            },
        },
        StudentCoursesResponse: {
            type: "object",
            properties: {
                courses: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string" },
                            code: { type: "string" },
                            name: { type: "string" },
                            credits: { type: "integer" },
                            instructor: { type: "string" },
                            semester: { type: "string" },
                            grade: { type: "string" },
                            status: { type: "string" },
                        },
                    },
                },
                cumulativeGPA: { type: "number" },
                totalCredits: { type: "integer" },
            },
        },
        CourseDetailsResponse: {
            type: "object",
            properties: {
                id: { type: "string" },
                code: { type: "string" },
                name: { type: "string" },
                credits: { type: "integer" },
                instructor: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        email: { type: "string" },
                    },
                },
                schedule: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            day: { type: "string" },
                            startTime: { type: "string" },
                            endTime: { type: "string" },
                            location: { type: "string" },
                        },
                    },
                },
            },
        },
        GradeBreakdownResponse: {
            type: "object",
            properties: {
                courseId: { type: "string" },
                courseName: { type: "string" },
                totalGrade: { type: "number" },
                breakdown: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            category: { type: "string" },
                            score: { type: "number" },
                            maxScore: { type: "number" },
                        },
                    },
                },
                letterGrade: { type: "string" },
            },
        },
    },
};
