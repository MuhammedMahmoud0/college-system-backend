export default {
  paths: {
    "/grades/my/semester-gpa": {
      get: {
        tags: ["Grades"],
        summary: "Get semester GPA",
        description:
          "Returns the weighted GPA for the logged-in student for a specific academic year and semester, based on all completed course grades. Accessible to students and leaders only.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "year",
            in: "query",
            required: true,
            schema: { type: "integer", example: 2025 },
            description: "Academic year (e.g. 2025)",
          },
          {
            name: "semester",
            in: "query",
            required: true,
            schema: {
              type: "string",
              enum: ["Spring", "Summer", "Fall", "Winter"],
            },
            description: "The semester",
          },
        ],
        responses: {
          200: {
            description: "Semester GPA returned successfully.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    year: {
                      type: "integer",
                      example: 2025,
                    },
                    semester: {
                      type: "string",
                      example: "Fall",
                    },
                    semester_gpa: {
                      type: "number",
                      nullable: true,
                      example: 3.45,
                      description:
                        "Weighted GPA for the semester. Null if no graded courses.",
                    },
                    total_credits: {
                      type: "integer",
                      example: 15,
                    },
                    courses_with_grade: {
                      type: "integer",
                      example: 4,
                    },
                    courses: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          course_code: {
                            type: "string",
                            example: "CS301",
                          },
                          course_name: {
                            type: "string",
                            example: "Data Structures",
                          },
                          credits: {
                            type: "integer",
                            example: 3,
                          },
                          grade: {
                            type: "string",
                            example: "A-",
                          },
                          grade_points: {
                            type: "number",
                            example: 3.67,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Missing or invalid year / semester parameters.",
          },
          401: { description: "Unauthorized." },
          500: { description: "Internal server error." },
        },
      },
    },

    "/grades/my/distribution": {
      get: {
        tags: ["Grades"],
        summary: "Get my grade distribution (Student)",
        description:
          "Returns a count of each letter grade the authenticated student has received across all completed enrollments.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Grade distribution retrieved successfully.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    distribution: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          grade: { type: "string", example: "A" },
                          count: { type: "integer", example: 3 },
                        },
                      },
                      example: [
                        { grade: "A", count: 8 },
                        { grade: "A-", count: 5 },
                        { grade: "B+", count: 4 },
                        { grade: "B", count: 2 },
                        { grade: "C+", count: 1 },
                      ],
                    },
                  },
                },
              },
            },
          },
          401: { description: "Not authenticated." },
          403: { description: "Forbidden — students only." },
        },
      },
    },

    "/grades/my/cgpa-trend": {
      get: {
        tags: ["Grades"],
        summary: "Get CGPA trend over semesters",
        description:
          "Returns the semester-by-semester GPA and the running cumulative CGPA (CGPA after each semester) for the logged-in student, sorted chronologically. Accessible to students and leaders only.",
        security: [{ bearerAuth: [] }],
        parameters: [],
        responses: {
          200: {
            description: "CGPA trend returned successfully.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    current_cgpa: {
                      type: "number",
                      nullable: true,
                      example: 3.51,
                      description:
                        "The most recent cumulative CGPA (same as the profile CGPA).",
                    },
                    total_semesters: {
                      type: "integer",
                      example: 4,
                    },
                    trend: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          year: {
                            type: "integer",
                            example: 2024,
                          },
                          semester: {
                            type: "string",
                            example: "Fall",
                          },
                          semester_gpa: {
                            type: "number",
                            nullable: true,
                            example: 3.67,
                            description: "Weighted GPA for this semester only.",
                          },
                          cumulative_cgpa: {
                            type: "number",
                            nullable: true,
                            example: 3.51,
                            description:
                              "Running CGPA including all semesters up to and including this one.",
                          },
                          credits_earned: {
                            type: "integer",
                            example: 15,
                          },
                          courses_count: {
                            type: "integer",
                            example: 4,
                          },
                        },
                      },
                    },
                  },
                },
                example: {
                  current_cgpa: 3.48,
                  total_semesters: 5,
                  trend: [
                    {
                      year: 2023,
                      semester: "Fall",
                      semester_gpa: 3.7,
                      cumulative_cgpa: 3.7,
                      credits_earned: 18,
                      courses_count: 5,
                    },
                    {
                      year: 2024,
                      semester: "Spring",
                      semester_gpa: 3.5,
                      cumulative_cgpa: 3.6,
                      credits_earned: 15,
                      courses_count: 4,
                    },
                    {
                      year: 2024,
                      semester: "Summer",
                      semester_gpa: 3.0,
                      cumulative_cgpa: 3.45,
                      credits_earned: 6,
                      courses_count: 2,
                    },
                    {
                      year: 2024,
                      semester: "Fall",
                      semester_gpa: 3.33,
                      cumulative_cgpa: 3.43,
                      credits_earned: 18,
                      courses_count: 5,
                    },
                    {
                      year: 2025,
                      semester: "Spring",
                      semester_gpa: 3.67,
                      cumulative_cgpa: 3.48,
                      credits_earned: 15,
                      courses_count: 4,
                    },
                  ],
                },
              },
            },
          },
          401: { description: "Unauthorized." },
          500: { description: "Internal server error." },
        },
      },
    },

    "/grades/lecture/{lectureId}/distribution": {
      put: {
        tags: ["Grades"],
        summary: "Set grade distribution for a lecture",
        description:
          "Creates or updates the grade distribution (work, midterm, final maxes) for a lecture. The three values must sum to exactly 100. Once set, any grade entry for students in this lecture is validated against these maxes.",
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
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/GradeDistributionRequest",
              },
              example: {
                work_max: 20,
                mid_max: 30,
                final_max: 50,
              },
            },
          },
        },
        responses: {
          200: {
            description: "Distribution saved successfully.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Grade distribution saved successfully.",
                    },
                    distribution: {
                      $ref: "#/components/schemas/GradeDistribution",
                    },
                  },
                },
              },
            },
          },
          400: {
            description:
              "Validation error (values missing, negative, or don't sum to 100).",
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
      get: {
        tags: ["Grades"],
        summary: "Get grade distribution for a lecture",
        description:
          "Returns the current grade distribution (work, midterm, final maxes) for the given lecture.",
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
            description: "Distribution retrieved successfully.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    distribution: {
                      $ref: "#/components/schemas/GradeDistribution",
                    },
                  },
                },
              },
            },
          },
          403: {
            description: "Forbidden.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          404: {
            description: "Lecture not found or no distribution set yet.",
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

    "/grades/tutorial-lab/{tutorialLabId}/distribution": {
      get: {
        tags: ["Grades"],
        summary: "Get linked lecture distributions for a tutorial/lab",
        description:
          "Returns grade distribution rows (work/mid/final max) for lecture(s) linked to enrollments in the given tutorial/lab.",
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
            description: "Distribution rows retrieved successfully.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/TutorialLabDistributionResponse",
                },
              },
            },
          },
          403: {
            description:
              "Forbidden - caller is not the TA for this tutorial/lab.",
          },
          404: {
            description:
              "Tutorial/Lab not found or no linked distribution exists.",
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
          "Provide any of: mid_score, work_score, and/or final_score. When all three scores are present overall, the letter grade and course GPA points are computed automatically from the total (out of 100) - no manual grade input required. Triggers a student notification and recalculates their CGPA. Accessible to the lecture's instructor (Doctor), Admin, and Super Admin.",
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
                $ref: "#/components/schemas/LectureUpdateGradeRequest",
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
              "Validation error — no fields provided, a score is negative, the total exceeds 100, or (when a distribution is set) a score exceeds its component maximum.",
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
          "Provide at least one score field. Teaching assistants can update only work_score; doctors, admins, and super admins can update mid_score, work_score, and final_score. When all three scores are present the letter grade and course GPA points are computed automatically from the total (out of 100) - no manual grade input required. Triggers a student notification and recalculates their CGPA. **If a grade distribution has been set for the lecture linked to this enrollment**, each score is individually validated against its maximum (work_score <= work_max, mid_score <= mid_max, final_score <= final_max).",
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
                $ref: "#/components/schemas/TutorialLabUpdateGradeRequest",
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
              "Validation error — no fields provided, a score is negative, the total exceeds 100, or (when a distribution is set) a score exceeds its component maximum.",
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
    LectureUpdateGradeRequest: {
      type: "object",
      description:
        "Provide at least one score field for lecture grading. Doctors, admins, and super admins can submit mid_score, work_score, and/or final_score.",
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
          description: "Coursework / assignment score (partial of 100 total)",
        },
        final_score: {
          type: "number",
          format: "float",
          example: 55.0,
          description: "Final exam score (partial of 100 total)",
        },
      },
    },

    TutorialLabUpdateGradeRequest: {
      type: "object",
      description:
        "Provide at least one score field. Teaching assistants can update only work_score; doctors/admins/super admins can update all score fields. The letter grade is computed automatically from the total (mid + work + final out of 100) - do NOT send a grade field.",
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
          description: "Coursework / assignment score (partial of 100 total)",
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
        grade_distribution: {
          type: "object",
          nullable: true,
          description:
            "Included when a distribution is set for the lecture. Shows the maximum for each score component.",
          properties: {
            work_max: { type: "number", example: 20 },
            mid_max: { type: "number", example: 30 },
            final_max: { type: "number", example: 50 },
          },
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
                    description: "The lecture group this student belongs to",
                  },
                },
              },
            ],
          },
        },
      },
    },

    TutorialLabDistributionResponse: {
      type: "object",
      properties: {
        tutorial_lab_id: { type: "integer", example: 7 },
        linked_lectures_count: { type: "integer", example: 1 },
        distributions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              lecture_id: { type: "integer", example: 3 },
              work_max: { type: "number", example: 20 },
              mid_max: { type: "number", example: 30 },
              final_max: { type: "number", example: 50 },
            },
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
