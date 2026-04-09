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
    "/courses/student/labs": {
      get: {
        tags: ["Courses"],
        summary: "Get student's enrolled labs/tutorials",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "List of enrolled labs and tutorials",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/StudentLabsResponse",
                },
              },
            },
          },
        },
      },
    },
    "/courses/all": {
      get: {
        tags: ["Courses"],
        summary: "Get all courses in the system",
        description:
          "Retrieve all courses from the course table with their details and prerequisites",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "List of all courses",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AllCoursesResponse",
                },
              },
            },
          },
        },
      },
    },
    "/courses/{offeringId}": {
      get: {
        tags: ["Courses"],
        summary: "Get course offering details by offering ID",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "offeringId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Course offering identifier",
          },
        ],
        responses: {
          200: {
            description:
              "Course offering details with lectures and tutorials/labs",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CourseOfferingDetailsResponse",
                },
              },
            },
          },
          404: { description: "Course offering not found" },
        },
      },
    },
    "/courses/{courseId}/grades": {
      get: {
        tags: ["Courses"],
        summary: "Get grade breakdown for the student's enrollment",
        description:
          "Returns the student's scores breakdown (midterm, work, final) for their enrollment in the given lecture. If the instructor has set a grade distribution, each component's max score is included.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "courseId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "The lecture ID the student is enrolled in",
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
    "/courses/lectures": {
      post: {
        tags: ["Courses"],
        summary: "Create a new lecture",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/LectureCreateRequest",
              },
            },
          },
        },
        responses: {
          201: {
            description: "Lecture created successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/LectureCreateResponse",
                },
              },
            },
          },
          404: {
            description: "Course offering or instructor not found",
          },
        },
      },
    },
    "/courses/tutorials-labs": {
      post: {
        tags: ["Courses"],
        summary: "Create a new tutorial/lab session",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/TutorialLabCreateRequest",
              },
            },
          },
        },
        responses: {
          201: {
            description: "Tutorial/Lab created successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/TutorialLabCreateResponse",
                },
              },
            },
          },
          404: {
            description: "Course offering or teaching assistant not found",
          },
        },
      },
    },
    "/courses/lectures/{lectureId}": {
      patch: {
        tags: ["Courses"],
        summary: "Update a lecture",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "lectureId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Lecture ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/LectureUpdateRequest",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Lecture updated successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/LectureCreateResponse",
                },
              },
            },
          },
          404: { description: "Lecture or instructor not found" },
        },
      },
      delete: {
        tags: ["Courses"],
        summary: "Delete a lecture",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "lectureId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Lecture ID",
          },
        ],
        responses: {
          200: { description: "Lecture deleted successfully" },
          404: { description: "Lecture not found" },
        },
      },
    },
    "/courses/tutorials-labs/{tutorialLabId}": {
      patch: {
        tags: ["Courses"],
        summary: "Update a tutorial/lab session",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "tutorialLabId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Tutorial/Lab ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/TutorialLabUpdateRequest",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Tutorial/Lab updated successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/TutorialLabCreateResponse",
                },
              },
            },
          },
          404: {
            description: "Tutorial/Lab or teaching assistant not found",
          },
        },
      },
      delete: {
        tags: ["Courses"],
        summary: "Delete a tutorial/lab session",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "tutorialLabId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "Tutorial/Lab ID",
          },
        ],
        responses: {
          200: { description: "Tutorial/Lab deleted successfully" },
          404: { description: "Tutorial/Lab not found" },
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
            description:
              "Cannot delete course, it is a prerequisite for other modules",
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
                },
              },
            },
          },
        },
      },
    },
    StudentLabsResponse: {
      type: "object",
      properties: {
        labs: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              code: { type: "string" },
              name: { type: "string" },
              credits: { type: "integer" },
              instructor: { type: "string" },
              type: { type: "string", enum: ["tutorial", "lab"] },
              group: { type: "string" },
              semester: {
                type: "string",
                enum: ["Spring", "Fall", "Summer", "Winter"],
              },
              year: { type: "integer", example: 2026 },
              work_score: {
                type: "number",
                nullable: true,
                example: 17,
              },
              midterm_score: {
                type: "number",
                nullable: true,
                example: 24,
              },
              final_score: {
                type: "number",
                nullable: true,
                example: 42,
              },
              grade: { type: "string" },
              status: { type: "string" },
            },
          },
        },
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
              semester: {
                type: "string",
                enum: ["Spring", "Fall", "Summer", "Winter"],
              },
              year: { type: "integer", example: 2026 },
              work_score: {
                type: "number",
                nullable: true,
                example: 17,
              },
              midterm_score: {
                type: "number",
                nullable: true,
                example: 24,
              },
              final_score: {
                type: "number",
                nullable: true,
                example: 42,
              },
              grade: { type: "string" },
              status: { type: "string" },
            },
          },
        },
        cumulativeGPA: { type: "number" },
        totalCredits: { type: "integer" },
      },
    },
    AllCoursesResponse: {
      type: "object",
      properties: {
        courses: {
          type: "array",
          items: {
            type: "object",
            properties: {
              code: { type: "string", example: "CS101" },
              name: {
                type: "string",
                example: "Introduction to Programming",
              },
              credits: { type: "integer", example: 3 },
              department: {
                type: "string",
                example: "Computer Science",
              },
              prerequisites: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    code: { type: "string" },
                    name: { type: "string" },
                  },
                },
              },
            },
          },
        },
        total: { type: "integer", example: 1 },
      },
    },
    CourseOfferingDetailsResponse: {
      type: "object",
      properties: {
        name: { type: "string", example: "Data Structures" },
        code: { type: "string", example: "CS201" },
        credits: { type: "integer", example: 3 },
        semester: {
          type: "string",
          enum: ["Spring", "Fall", "Summer", "Winter"],
          example: "Spring",
        },
        year: { type: "integer", example: 2026 },
        lectures: {
          type: "array",
          items: {
            type: "object",
            properties: {
              instructor: {
                type: "string",
                example: "Dr. John Doe",
              },
              instructorEmail: {
                type: "string",
                example: "john.doe@university.edu",
              },
              capacity: { type: "integer", example: 40 },
              dayOfWeek: { type: "string", example: "Monday" },
              startTime: { type: "string", example: "08:30" },
              endTime: { type: "string", example: "10:00" },
              location: { type: "string", example: "Room 101" },
              group: { type: "string", example: "1" },
            },
          },
        },
        tutorialsLabs: {
          type: "array",
          items: {
            type: "object",
            properties: {
              ta: { type: "string", example: "Jane Smith" },
              taEmail: {
                type: "string",
                example: "jane.smith@university.edu",
              },
              type: { type: "string", example: "LAB" },
              capacity: { type: "integer", example: 20 },
              dayOfWeek: { type: "string", example: "Wednesday" },
              startTime: { type: "string", example: "14:00" },
              endTime: { type: "string", example: "16:00" },
              location: { type: "string", example: "Lab A" },
              group: { type: "string", example: "1" },
            },
          },
        },
      },
    },
    LectureCreateRequest: {
      type: "object",
      required: [
        "offeringId",
        "instructorId",
        "capacity",
        "dayOfWeek",
        "startTime",
        "endTime",
      ],
      properties: {
        offeringId: { type: "integer", example: 1 },
        offering_id: {
          type: "integer",
          example: 1,
          description:
            "Alias for offeringId (snake_case accepted for backward compatibility).",
        },
        instructorId: {
          type: "string",
          format: "uuid",
          example: "550e8400-e29b-41d4-a716-446655440000",
        },
        capacity: { type: "integer", example: 40 },
        dayOfWeek: { type: "string", example: "Monday" },
        startTime: {
          type: "string",
          example: "08:30",
          description: "Time in HH:MM format",
        },
        endTime: {
          type: "string",
          example: "10:00",
          description: "Time in HH:MM format",
        },
        location: { type: "string", example: "Room 101" },
        group: { type: "string", example: "1" },
      },
    },
    LectureUpdateRequest: {
      type: "object",
      properties: {
        instructorId: {
          type: "string",
          format: "uuid",
          example: "550e8400-e29b-41d4-a716-446655440000",
        },
        capacity: { type: "integer", example: 40 },
        dayOfWeek: { type: "string", example: "Monday" },
        startTime: {
          type: "string",
          example: "08:30",
          description: "Time in HH:MM format",
        },
        endTime: {
          type: "string",
          example: "10:00",
          description: "Time in HH:MM format",
        },
        location: { type: "string", example: "Room 101" },
        group: { type: "string", example: "1" },
      },
    },
    LectureCreateResponse: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Lecture created successfully",
        },
        lecture: {
          type: "object",
          properties: {
            lectureId: { type: "integer" },
            courseName: { type: "string" },
            courseCode: { type: "string" },
            instructor: { type: "string" },
            capacity: { type: "integer" },
            dayOfWeek: { type: "string" },
            startTime: { type: "string" },
            endTime: { type: "string" },
            location: { type: "string" },
            group: { type: "string" },
          },
        },
      },
    },
    TutorialLabCreateRequest: {
      type: "object",
      required: [
        "offeringId",
        "taId",
        "type",
        "capacity",
        "dayOfWeek",
        "startTime",
        "endTime",
        "group",
      ],
      properties: {
        offeringId: { type: "integer", example: 1 },
        taId: {
          type: "string",
          format: "uuid",
          example: "550e8400-e29b-41d4-a716-446655440000",
        },
        type: { type: "string", example: "LAB" },
        capacity: { type: "integer", example: 20 },
        dayOfWeek: { type: "string", example: "Wednesday" },
        startTime: {
          type: "string",
          example: "14:00",
          description: "Time in HH:MM format",
        },
        endTime: {
          type: "string",
          example: "16:00",
          description: "Time in HH:MM format",
        },
        location: { type: "string", example: "Lab A" },
        group: { type: "string", example: "1" },
      },
    },
    TutorialLabUpdateRequest: {
      type: "object",
      properties: {
        taId: {
          type: "string",
          format: "uuid",
          example: "550e8400-e29b-41d4-a716-446655440000",
        },
        type: { type: "string", example: "LAB" },
        capacity: { type: "integer", example: 20 },
        dayOfWeek: { type: "string", example: "Wednesday" },
        startTime: {
          type: "string",
          example: "14:00",
          description: "Time in HH:MM format",
        },
        endTime: {
          type: "string",
          example: "16:00",
          description: "Time in HH:MM format",
        },
        location: { type: "string", example: "Lab A" },
        group: { type: "string", example: "1" },
      },
    },
    TutorialLabCreateResponse: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Tutorial/Lab created successfully",
        },
        tutorialLab: {
          type: "object",
          properties: {
            tutorialLabId: { type: "integer" },
            courseName: { type: "string" },
            courseCode: { type: "string" },
            ta: { type: "string" },
            type: { type: "string" },
            capacity: { type: "integer" },
            dayOfWeek: { type: "string" },
            startTime: { type: "string" },
            endTime: { type: "string" },
            location: { type: "string" },
            group: { type: "string" },
          },
        },
      },
    },
    GradeBreakdownResponse: {
      type: "object",
      properties: {
        lecture_id: { type: "integer", example: 5 },
        course_code: { type: "string", example: "CS301" },
        course_name: { type: "string", example: "Data Structures" },
        credits: { type: "integer", example: 3 },
        letter_grade: {
          type: "string",
          example: "B+",
          description:
            "Computed letter grade, or 'In Progress' if not all scores are entered yet.",
        },
        total_score: {
          type: "number",
          nullable: true,
          example: 78.5,
          description:
            "Sum of all present scores. Null if no scores entered yet.",
        },
        distribution: {
          type: "object",
          nullable: true,
          description:
            "Grade distribution set by the instructor. Null if not configured.",
          properties: {
            work_max: { type: "number", example: 20 },
            mid_max: { type: "number", example: 30 },
            final_max: { type: "number", example: 50 },
          },
        },
        breakdown: {
          type: "array",
          items: {
            type: "object",
            properties: {
              category: { type: "string", example: "Midterm" },
              score: {
                type: "number",
                nullable: true,
                example: 25.0,
                description:
                  "Student's score for this component. Null if not entered yet.",
              },
              max_score: {
                type: "number",
                nullable: true,
                example: 30,
                description:
                  "Maximum allowed score from the grade distribution. Null if no distribution is set.",
              },
            },
          },
        },
      },
    },
  },
};
