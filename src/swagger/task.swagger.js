export default {
    paths: {
        "/tasks": {
            post: {
                tags: ["Tasks"],
                summary: "Create a task",
                description:
                    "Creates a new task linked to a lecture or tutorial/lab. Notifies all enrolled students. Accessible to Doctor, Teaching Assistant, Admin, and Super Admin.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/CreateTaskRequest",
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Task created successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: {
                                            type: "string",
                                            example:
                                                "Task created successfully.",
                                        },
                                        task: {
                                            $ref: "#/components/schemas/TaskObject",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: "Validation error." },
                    401: { description: "Unauthorized." },
                    403: { description: "Forbidden." },
                    500: { description: "Internal server error." },
                },
            },
            get: {
                tags: ["Tasks"],
                summary: "List tasks",
                description:
                    "Retrieve tasks for a lecture or tutorial/lab. Provide exactly one of `lecture_id` or `tutorial_lab_id`.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "lecture_id",
                        in: "query",
                        schema: { type: "integer" },
                        description: "Filter tasks by lecture ID",
                    },
                    {
                        name: "tutorial_lab_id",
                        in: "query",
                        schema: { type: "integer" },
                        description: "Filter tasks by tutorial/lab ID",
                    },
                ],
                responses: {
                    200: {
                        description: "Tasks retrieved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        tasks: {
                                            type: "array",
                                            items: {
                                                $ref: "#/components/schemas/TaskObject",
                                            },
                                        },
                                        total: { type: "integer", example: 3 },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: "Missing query parameter." },
                    401: { description: "Unauthorized." },
                    500: { description: "Internal server error." },
                },
            },
        },

        "/tasks/{taskId}": {
            get: {
                tags: ["Tasks"],
                summary: "Get a task by ID",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "taskId",
                        in: "path",
                        required: true,
                        schema: { type: "integer" },
                    },
                ],
                responses: {
                    200: {
                        description: "Task retrieved.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/TaskObject",
                                },
                            },
                        },
                    },
                    404: { description: "Task not found." },
                    401: { description: "Unauthorized." },
                    500: { description: "Internal server error." },
                },
            },
            put: {
                tags: ["Tasks"],
                summary: "Update a task",
                description:
                    "Accessible to Doctor, Teaching Assistant, Admin, and Super Admin.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "taskId",
                        in: "path",
                        required: true,
                        schema: { type: "integer" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/UpdateTaskRequest",
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Task updated successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                        task: {
                                            $ref: "#/components/schemas/TaskObject",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: "No updatable fields provided." },
                    404: { description: "Task not found." },
                    401: { description: "Unauthorized." },
                    403: { description: "Forbidden." },
                    500: { description: "Internal server error." },
                },
            },
            delete: {
                tags: ["Tasks"],
                summary: "Delete a task",
                description:
                    "Accessible to Doctor, Teaching Assistant, Admin, and Super Admin.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "taskId",
                        in: "path",
                        required: true,
                        schema: { type: "integer" },
                    },
                ],
                responses: {
                    200: {
                        description: "Task deleted successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: {
                                            type: "string",
                                            example:
                                                "Task deleted successfully.",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: "Task not found." },
                    401: { description: "Unauthorized." },
                    403: { description: "Forbidden." },
                    500: { description: "Internal server error." },
                },
            },
        },

        "/tasks/{taskId}/submit": {
            post: {
                tags: ["Tasks"],
                summary: "Submit a task (student)",
                description:
                    "Submit a task once. Accessible to Student and Leader roles.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "taskId",
                        in: "path",
                        required: true,
                        schema: { type: "integer" },
                    },
                ],
                requestBody: {
                    required: false,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    submission_content: {
                                        type: "string",
                                        example: "Here is my solution...",
                                        nullable: true,
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Submission saved successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                        submission: {
                                            $ref: "#/components/schemas/TaskSubmissionObject",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    409: {
                        description: "Task already submitted by this student.",
                    },
                    404: { description: "Task not found." },
                    401: { description: "Unauthorized." },
                    403: { description: "Forbidden." },
                    500: { description: "Internal server error." },
                },
            },
        },

        "/tasks/{taskId}/my-submission": {
            get: {
                tags: ["Tasks"],
                summary: "Get own submission for a task (student)",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "taskId",
                        in: "path",
                        required: true,
                        schema: { type: "integer" },
                    },
                ],
                responses: {
                    200: {
                        description: "Submission retrieved.",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/TaskSubmissionObject",
                                },
                            },
                        },
                    },
                    404: { description: "No submission found." },
                    401: { description: "Unauthorized." },
                    500: { description: "Internal server error." },
                },
            },
            delete: {
                tags: ["Tasks"],
                summary: "Delete own submission for a task (student/leader)",
                description:
                    "Deletes the authenticated student/leader submission for the task. Allowed only before task due_date.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "taskId",
                        in: "path",
                        required: true,
                        schema: { type: "integer" },
                    },
                ],
                responses: {
                    200: {
                        description: "Submission deleted successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: {
                                            type: "string",
                                            example:
                                                "Submission deleted successfully",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    403: {
                        description:
                            "Submission can only be deleted before due date.",
                    },
                    404: { description: "Task or submission not found." },
                    401: { description: "Unauthorized." },
                    500: { description: "Internal server error." },
                },
            },
        },

        "/tasks/my/available": {
            get: {
                tags: ["Tasks"],
                summary: "Get my available tasks (student/leader)",
                description:
                    "Returns tasks assigned to the authenticated student/leader through their enrollments, filtered to only tasks still available for submission (due_date is null or in the future).",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "Available tasks retrieved.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        count: {
                                            type: "integer",
                                            example: 2,
                                        },
                                        tasks: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                allOf: [
                                                    {
                                                        $ref: "#/components/schemas/TaskObject",
                                                    },
                                                    {
                                                        type: "object",
                                                        properties: {
                                                            my_submission: {
                                                                allOf: [
                                                                    {
                                                                        $ref: "#/components/schemas/TaskSubmissionObject",
                                                                    },
                                                                ],
                                                                nullable: true,
                                                            },
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    401: { description: "Unauthorized." },
                    403: { description: "Forbidden (student/leader only)." },
                    500: { description: "Internal server error." },
                },
            },
        },

        "/tasks/{taskId}/submissions": {
            get: {
                tags: ["Tasks"],
                summary: "Get all submissions for a task (staff)",
                description:
                    "View all student submissions for a task. Accessible to Doctor, Teaching Assistant, Admin, and Super Admin.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "taskId",
                        in: "path",
                        required: true,
                        schema: { type: "integer" },
                    },
                ],
                responses: {
                    200: {
                        description: "Submissions retrieved.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        count: { type: "integer" },
                                        submissions: {
                                            type: "array",
                                            items: {
                                                $ref: "#/components/schemas/TaskSubmissionWithStudentObject",
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: "Task not found." },
                    401: { description: "Unauthorized." },
                    403: { description: "Forbidden." },
                    500: { description: "Internal server error." },
                },
            },
        },

        "/tasks/{taskId}/submissions/{submissionId}/grade": {
            put: {
                tags: ["Tasks"],
                summary: "Grade a submission (staff)",
                description:
                    "Assign a numeric grade to a student's submission. Accessible to Doctor, Teaching Assistant, Admin, and Super Admin.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "taskId",
                        in: "path",
                        required: true,
                        schema: { type: "integer" },
                    },
                    {
                        name: "submissionId",
                        in: "path",
                        required: true,
                        schema: { type: "integer" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["grade"],
                                properties: {
                                    grade: {
                                        type: "number",
                                        format: "float",
                                        example: 85.5,
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Submission graded successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                        submission: {
                                            $ref: "#/components/schemas/TaskSubmissionObject",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: "Submission not found." },
                    401: { description: "Unauthorized." },
                    403: { description: "Forbidden." },
                    500: { description: "Internal server error." },
                },
            },
        },
    },

    schemas: {
        CreateTaskRequest: {
            type: "object",
            required: ["title"],
            properties: {
                title: {
                    type: "string",
                    example: "Assignment 1: Linked Lists",
                },
                description: {
                    type: "string",
                    example: "Implement a doubly linked list in C++.",
                    nullable: true,
                },
                due_date: {
                    type: "string",
                    format: "date-time",
                    example: "2026-03-20T23:59:00.000Z",
                    nullable: true,
                },
                lecture_id: {
                    type: "integer",
                    example: 3,
                    nullable: true,
                    description:
                        "The lecture this task belongs to. Provide either lecture_id or tutorial_lab_id.",
                },
                tutorial_lab_id: {
                    type: "integer",
                    example: 7,
                    nullable: true,
                    description: "The tutorial/lab this task belongs to.",
                },
            },
        },
        UpdateTaskRequest: {
            type: "object",
            properties: {
                title: { type: "string", example: "Assignment 1 (Updated)" },
                description: { type: "string", nullable: true },
                due_date: {
                    type: "string",
                    format: "date-time",
                    nullable: true,
                    example: "2026-03-25T23:59:00.000Z",
                },
            },
        },
        TaskObject: {
            type: "object",
            properties: {
                id: { type: "integer", example: 1 },
                title: {
                    type: "string",
                    example: "Assignment 1: Linked Lists",
                },
                description: { type: "string", nullable: true },
                due_date: {
                    type: "string",
                    format: "date-time",
                    nullable: true,
                },
                lecture_id: { type: "integer", nullable: true },
                tutorial_lab_id: { type: "integer", nullable: true },
                created_at: { type: "string", format: "date-time" },
            },
        },
        TaskSubmissionObject: {
            type: "object",
            properties: {
                id: { type: "integer", example: 10 },
                task_id: { type: "integer", example: 1 },
                student_id: { type: "string", format: "uuid" },
                submission_content: { type: "string", nullable: true },
                submitted_at: { type: "string", format: "date-time" },
                grade: { type: "number", example: 85.5, nullable: true },
            },
        },
        TaskSubmissionWithStudentObject: {
            allOf: [
                {
                    $ref: "#/components/schemas/TaskSubmissionObject",
                },
                {
                    type: "object",
                    properties: {
                        full_name: {
                            type: "string",
                            example: "Ali Hassan",
                            nullable: true,
                        },
                        email: {
                            type: "string",
                            format: "email",
                            nullable: true,
                        },
                        avatar_url: {
                            type: "string",
                            format: "uri",
                            nullable: true,
                        },
                    },
                },
            ],
        },
    },
};
