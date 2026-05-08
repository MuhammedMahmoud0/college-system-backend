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
          "Use `semester` and optional `year` query parameters to select a target term. Defaults to the most recent offering in the database.",
          "Response includes `registrationPeriod` metadata so clients can show whether registration is currently open.",
        ].join("\n"),
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "semester",
            in: "query",
            required: false,
            schema: {
              type: "string",
              example: "Fall",
            },
            description:
              "Semester to fetch offerings for (e.g. `Fall`, `Spring`). Omit to use latest available semester.",
          },
          {
            name: "year",
            in: "query",
            required: false,
            schema: {
              type: "integer",
              example: 2026,
            },
            description:
              "Academic year for the selected semester. Omit to use latest available year for that semester.",
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
                example: {
                  semester: "Spring",
                  year: 2026,
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
                          instructor: "Dr. Ahmed Hassan",
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
                          instructor: "Eng. Sara Khaled",
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
                          instructor: "Eng. Sara Khaled",
                          capacity: 25,
                          enrolled_count: 25,
                          available_seats: 0,
                          type: "lab",
                          enrolled: true,
                        },
                      ],
                    },
                  ],
                  registrationPeriod: {
                    isOpen: true,
                    semester: "Spring",
                    year: 2026,
                    startDate: "2026-01-10",
                    endDate: "2026-01-24",
                    nextOpenDate: null,
                  },
                },
              },
            },
          },
          401: {
            description: "Not authenticated — missing or invalid token",
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
          "- Registration must be within an open registration period for the active semester.",
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
            description: "Registration successful — all enrollments created",
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
                      student_user_id: "9c60d94a-99e3-44e7-86df-074833cab9e8",
                      lecture_id: 5,
                      tutorial_lab_id: 12,
                      status: "enrolled",
                    },
                    {
                      id: 45,
                      student_user_id: "9c60d94a-99e3-44e7-86df-074833cab9e8",
                      lecture_id: 8,
                      tutorial_lab_id: 19,
                      status: "enrolled",
                    },
                  ],
                  billing: {
                    invoices: [
                      {
                        id: 12,
                        course_code: "CS201",
                        total_amount: 900,
                        status: "pending",
                      },
                      {
                        id: 13,
                        course_code: "CS301",
                        total_amount: 900,
                        status: "pending",
                      },
                    ],
                    totalBilled: 1800,
                    currency: "USD",
                  },
                  semesterHours: {
                    used: 6,
                    max: 18,
                  },
                  graduationProgress: {
                    completed: 45,
                    required: 140,
                  },
                },
              },
            },
          },
          400: {
            description:
              "Validation error — time conflict, capacity full, missing lab, already enrolled, semester hour limit exceeded, or graduation cap reached",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
                examples: {
                  scheduleConflict: {
                    summary: "Conflict between newly selected sessions",
                    value: {
                      error:
                        "Schedule conflict on Monday: Data Structures (CS201) [09:00-10:30] overlaps with Algorithms (CS301) [10:00-11:30]",
                    },
                  },
                  conflictWithExisting: {
                    summary: "Conflict with an already-enrolled session",
                    value: {
                      error:
                        "Schedule conflict on Wednesday: Operating Systems (CS401) [11:00-12:30] overlaps with Networks (CS402) [11:30-13:00]",
                    },
                  },
                  capacityFull: {
                    summary: "Lecture is full",
                    value: {
                      error: "Lecture Data Structures (CS201) is full",
                    },
                  },
                  noLabSelected: {
                    summary: "No lab selected for a lecture",
                    value: {
                      error:
                        "No lab selected for course Data Structures (CS201)",
                    },
                  },
                  alreadyEnrolled: {
                    summary: "Already enrolled in this lecture",
                    value: {
                      error: "Already enrolled in Data Structures (CS201)",
                    },
                  },
                  invalidInput: {
                    summary: "Invalid request body structure",
                    value: {
                      error:
                        "Invalid input. Required: selectedLectureIds (array), selectedLabIds (array)",
                    },
                  },
                  semesterHourLimitExceeded: {
                    summary: "Semester credit hour limit exceeded",
                    value: {
                      error:
                        "Cannot register 6 credit hours. You already have 15 hours enrolled this semester. Maximum allowed is 18 hours (GPA > 3.3 allows 21 hours).",
                      semesterHours: {
                        enrolled: 15,
                        requested: 6,
                        max: 18,
                      },
                    },
                  },
                  graduationCapReached: {
                    summary: "Student has completed all required credit hours",
                    value: {
                      error:
                        "You have completed all 140 required credit hours and are eligible for graduation. No further registration is allowed.",
                      graduationProgress: {
                        completed: 140,
                        required: 140,
                      },
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
            description: "Forbidden (role) or registration period is closed",
            content: {
              "application/json": {
                schema: {
                  oneOf: [
                    {
                      $ref: "#/components/schemas/ErrorResponse",
                    },
                    {
                      $ref: "#/components/schemas/RegistrationClosedResponse",
                    },
                  ],
                },
                examples: {
                  forbidden: {
                    summary:
                      "Forbidden — only students and leaders can register",
                    value: { error: "Forbidden" },
                  },
                  registrationClosed: {
                    summary: "Registration period closed",
                    value: {
                      error: "Registration is currently closed",
                      registrationPeriod: {
                        isOpen: false,
                        semester: "Fall",
                        year: 2026,
                        startDate: "2026-08-01",
                        endDate: "2026-08-15",
                        nextOpenDate: null,
                      },
                    },
                  },
                },
              },
            },
          },
          402: {
            description: "Payment required — user has pending unpaid invoices",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
                example: {
                  error:
                    "You have unpaid invoices. Please complete payment before continuing.",
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
                    student_user_id: "9c60d94a-99e3-44e7-86df-074833cab9e8",
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
                      error:
                        "You are not enrolled in this lecture. Register for the full course first.",
                    },
                  },
                  labAlreadyAssigned: {
                    summary: "Lab already assigned to this enrollment",
                    value: {
                      error:
                        "You already have a lab assigned for this lecture. Unregister from the current lab first.",
                    },
                  },
                  wrongOffering: {
                    summary: "Lab does not belong to the same offering",
                    value: {
                      error:
                        "The selected lab does not belong to the same course offering as the lecture.",
                    },
                  },
                  capacityFull: {
                    summary: "Lab is at full capacity",
                    value: {
                      error: "Lab G2 for Data Structures is full",
                    },
                  },
                  scheduleConflict: {
                    summary: "Lab time conflicts with another enrolled session",
                    value: {
                      error:
                        "Schedule conflict on Wednesday: Data Structures (CS201) [11:00-12:30] overlaps with Networks (CS402) [11:30-13:00]",
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
            description: "Forbidden — only students and leaders can register",
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
            description: "Payment required — user has pending unpaid invoices",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
                example: {
                  error:
                    "You have unpaid invoices. Please complete payment before continuing.",
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
          "  - Paid invoice is refunded via PayPal and marked as `refunded` (only while registration period is open).",
          "- Use this to completely drop a course.",
          "",
          "### Unregister from a lab only — provide `tutorialLabId`",
          "- Sets `tutorial_lab_id = null` on the enrollment row.",
          "- The **lecture enrollment is kept** — the student remains registered for the course.",
          "- No refund is performed for lab-only unregister.",
          "- Use `POST /registration/register-lab` afterwards to pick a different lab.",
          "",
          "If registration period is closed, unregistration and refunds are blocked.",
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
                  summary: "Drop entire course (lecture + lab)",
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
            description: "Neither lectureId nor tutorialLabId was provided",
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
                    summary: "Paid invoice refund failed (unregister blocked)",
                    value: {
                      error: "Refund failed for invoice 12",
                      paypalStatus: "DENIED",
                    },
                  },
                  enrollmentNotFound: {
                    summary: "Student is not enrolled in this lecture",
                    value: {
                      error: "No enrollment found for this lecture",
                    },
                  },
                  labEnrollmentNotFound: {
                    summary: "Student is not enrolled in this lab",
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
            description: "Forbidden (role) or registration period is closed",
            content: {
              "application/json": {
                schema: {
                  oneOf: [
                    {
                      $ref: "#/components/schemas/ErrorResponse",
                    },
                    {
                      $ref: "#/components/schemas/RegistrationClosedResponse",
                    },
                  ],
                },
                examples: {
                  forbidden: {
                    summary:
                      "Forbidden — only students and leaders can unregister",
                    value: { error: "Forbidden" },
                  },
                  registrationClosed: {
                    summary: "Registration period closed",
                    value: {
                      error:
                        "Registration is currently closed. Unregistration and refunds are disabled.",
                      registrationPeriod: {
                        isOpen: false,
                        semester: "Fall",
                        year: 2026,
                        startDate: "2026-08-01",
                        endDate: "2026-08-15",
                        nextOpenDate: null,
                      },
                    },
                  },
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

    "/registration/manual-course-registration/students/{studentId}/register": {
      post: {
        tags: ["Manual Course Registration"],
        summary: "Admin manual course registration (create)",
        description:
          "Allows admin/super_admin to register a student or leader for courses using the same enrollment, conflict, capacity, and invoice creation logic used by student self-registration. This manual endpoint bypasses registration-period window checks.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "studentId",
            required: true,
            schema: { type: "string", format: "uuid" },
            description:
              "Target student/leader user id to register courses for",
          },
        ],
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
            description: "Manual registration created successfully",
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
                      student_user_id: "9c60d94a-99e3-44e7-86df-074833cab9e8",
                      lecture_id: 5,
                      tutorial_lab_id: 12,
                      status: "enrolled",
                    },
                    {
                      id: 45,
                      student_user_id: "9c60d94a-99e3-44e7-86df-074833cab9e8",
                      lecture_id: 8,
                      tutorial_lab_id: 19,
                      status: "enrolled",
                    },
                  ],
                  billing: {
                    invoices: [
                      {
                        id: 12,
                        course_code: "CS201",
                        total_amount: 900,
                        status: "pending",
                      },
                      {
                        id: 13,
                        course_code: "CS301",
                        total_amount: 900,
                        status: "pending",
                      },
                    ],
                    totalBilled: 1800,
                    currency: "USD",
                  },
                  semesterHours: {
                    used: 6,
                    max: 18,
                  },
                  graduationProgress: {
                    completed: 45,
                    required: 140,
                  },
                },
              },
            },
          },
          400: {
            description:
              "Validation error — time conflict, capacity full, missing lab, already enrolled, semester hour limit exceeded, or graduation cap reached",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
                examples: {
                  scheduleConflict: {
                    summary: "Conflict between newly selected sessions",
                    value: {
                      error:
                        "Schedule conflict on Monday: Data Structures (CS201) [09:00-10:30] overlaps with Algorithms (CS301) [10:00-11:30]",
                    },
                  },
                  conflictWithExisting: {
                    summary: "Conflict with an already-enrolled session",
                    value: {
                      error:
                        "Schedule conflict on Wednesday: Operating Systems (CS401) [11:00-12:30] overlaps with Networks (CS402) [11:30-13:00]",
                    },
                  },
                  capacityFull: {
                    summary: "Lecture is full",
                    value: {
                      error: "Lecture Data Structures (CS201) is full",
                    },
                  },
                  noLabSelected: {
                    summary: "No lab selected for a lecture",
                    value: {
                      error:
                        "No lab selected for course Data Structures (CS201)",
                    },
                  },
                  alreadyEnrolled: {
                    summary: "Already enrolled in this lecture",
                    value: {
                      error: "Already enrolled in Data Structures (CS201)",
                    },
                  },
                  semesterHourLimitExceeded: {
                    summary: "Semester credit hour limit exceeded",
                    value: {
                      error:
                        "Cannot register 6 credit hours. You already have 15 hours enrolled this semester. Maximum allowed is 18 hours (GPA > 3.3 allows 21 hours).",
                      semesterHours: {
                        enrolled: 15,
                        requested: 6,
                        max: 18,
                      },
                    },
                  },
                  graduationCapReached: {
                    summary: "Student has completed all required credit hours",
                    value: {
                      error:
                        "You have completed all 140 required credit hours and are eligible for graduation. No further registration is allowed.",
                      graduationProgress: {
                        completed: 140,
                        required: 140,
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Not authenticated" },
          403: {
            description: "Forbidden — admin/super_admin only",
          },
          404: { description: "Student/leader target not found" },
          500: { description: "Internal server error" },
        },
      },
    },

    "/registration/manual-course-registration/students/{studentId}/enrollments":
      {
        get: {
          tags: ["Manual Course Registration"],
          summary: "Get student manual registrations (read)",
          description:
            "Returns a specific student/leader's enrollments with lecture/lab details and related invoice/payment data for admin manual registration operations.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "studentId",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Target student/leader user id",
            },
            {
              in: "query",
              name: "status",
              required: false,
              schema: {
                type: "string",
                enum: ["enrolled", "dropped", "completed"],
              },
              description: "Optional enrollment status filter",
            },
          ],
          responses: {
            200: {
              description: "Student registrations retrieved",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ManualStudentRegistrationsResponse",
                  },
                },
              },
            },
            400: { description: "Invalid query params" },
            401: { description: "Not authenticated" },
            403: {
              description: "Forbidden — admin/super_admin only",
            },
            404: { description: "Student/leader target not found" },
            500: { description: "Internal server error" },
          },
        },
      },

    "/registration/manual-course-registration/students/{studentId}/register-lab":
      {
        patch: {
          tags: ["Manual Course Registration"],
          summary: "Update student registration lab (update)",
          description:
            "Allows admin/super_admin to update a student's registration by assigning a replacement lab to an enrolled lecture.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "studentId",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Target student/leader user id",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/RegisterLabRequest",
                },
              },
            },
          },
          responses: {
            201: {
              description: "Student registration updated successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/RegisterLabResponse",
                  },
                },
              },
            },
            400: { description: "Validation error" },
            401: { description: "Not authenticated" },
            403: {
              description: "Forbidden — admin/super_admin only",
            },
            404: {
              description: "Student/leader target, lecture, or lab not found",
            },
            500: { description: "Internal server error" },
          },
        },
      },

    "/registration/manual-course-registration/students/{studentId}/unregister":
      {
        delete: {
          tags: ["Manual Course Registration"],
          summary: "Delete student registration (delete)",
          description:
            "Allows admin/super_admin to unregister a student from lecture/lab sessions using the same billing and refund logic used by student unregister operations. This manual endpoint bypasses registration-period window checks.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "studentId",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Target student/leader user id",
            },
          ],
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
              description: "Student registration deleted successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/UnregisterResponse",
                  },
                },
              },
            },
            400: { description: "Validation error" },
            401: { description: "Not authenticated" },
            403: {
              description: "Forbidden — admin/super_admin only",
            },
            404: {
              description: "Student/leader target or enrollment not found",
            },
            500: { description: "Internal server error" },
          },
        },
      },

    "/registration/manual-course-registration/students/{studentId}/schedule": {
      get: {
        tags: ["Manual Course Registration"],
        summary: "Get specific student schedule",
        description:
          "Allows admin/super_admin to view a specific student or leader weekly schedule based on enrolled lecture/lab sessions.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "studentId",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Target student/leader user id",
          },
          {
            in: "query",
            name: "week",
            required: false,
            schema: { type: "integer" },
            description:
              "Week offset (0 = current week, 1 = next week, -1 = previous week)",
          },
          {
            in: "query",
            name: "date",
            required: false,
            schema: { type: "string", format: "date" },
            description: "Specific date (YYYY-MM-DD) to resolve the week",
          },
        ],
        responses: {
          200: {
            description: "Student schedule retrieved",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ManualStudentScheduleResponse",
                },
              },
            },
          },
          400: { description: "Invalid date query format" },
          401: { description: "Not authenticated" },
          403: {
            description: "Forbidden — admin/super_admin only",
          },
          404: { description: "Student/leader target not found" },
          500: { description: "Internal server error" },
        },
      },
    },
  },

  components: {
    schemas: {
      Session: {
        type: "object",
        description: "A single lecture or lab section within a course offering",
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
            description: "Name of the instructor or teaching assistant",
            example: "Dr. Ahmed Hassan",
          },
          capacity: {
            type: "integer",
            description: "Maximum number of students allowed in this section",
            example: 50,
          },
          enrolled_count: {
            type: "integer",
            description: "Current number of enrolled students",
            example: 32,
          },
          available_seats: {
            type: "integer",
            description: "Remaining seats (capacity - enrolled_count)",
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
            description: "Available lecture sections for this offering",
            items: { $ref: "#/components/schemas/Session" },
          },
          labs: {
            type: "array",
            description: "Available lab/tutorial sections for this offering",
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
            example: "Spring",
          },
          year: {
            type: "integer",
            description: "Academic year for the selected semester",
            example: 2026,
          },
          offerings: {
            type: "array",
            description: "List of available course offerings",
            items: { $ref: "#/components/schemas/CourseOffering" },
          },
          registrationPeriod: {
            $ref: "#/components/schemas/RegistrationPeriodInfo",
          },
        },
      },

      RegistrationPeriodInfo: {
        type: "object",
        properties: {
          isOpen: {
            type: "boolean",
            example: true,
          },
          semester: {
            type: "string",
            nullable: true,
            example: "Fall",
          },
          year: {
            type: "integer",
            nullable: true,
            example: 2026,
          },
          startDate: {
            type: "string",
            nullable: true,
            description: "Start date from registration_start event_date.",
            example: "2026-08-01",
          },
          endDate: {
            type: "string",
            nullable: true,
            description:
              "End date from registration_end event_date, or fallback to registration_start.end_date when no registration_end event exists.",
            example: "2026-08-15",
          },
          nextOpenDate: {
            type: "string",
            nullable: true,
            example: null,
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
            description: "IDs of the lectures to register for (one per course)",
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
          semesterHours: {
            type: "object",
            description: "Information about credit hour limits for the current semester",
            properties: {
              used: { type: "integer", description: "Total credit hours registered/requested this semester", example: 18 },
              max: { type: "integer", description: "Maximum allowed credit hours this semester (based on GPA)", example: 18 },
            },
          },
          graduationProgress: {
            type: "object",
            description: "Information about total completed credits against the graduation requirement",
            properties: {
              completed: { type: "integer", description: "Total credits completed before this registration", example: 105 },
              required: { type: "integer", description: "Total credits required for graduation", example: 140 },
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
            example: "Successfully registered for lab G2 in Data Structures.",
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
                description: "How many unpaid invoices were removed",
                example: 1,
              },
              paidInvoicesRefunded: {
                type: "integer",
                description: "How many paid invoices were refunded",
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

      RegistrationClosedResponse: {
        type: "object",
        properties: {
          error: {
            type: "string",
            example: "Registration is currently closed",
          },
          registrationPeriod: {
            $ref: "#/components/schemas/RegistrationPeriodInfo",
          },
        },
      },

      ManualRegistrationStudent: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          full_name: { type: "string", example: "Sara Mohamed" },
          email: {
            type: "string",
            format: "email",
            example: "sara.mohamed@example.edu",
          },
          role: {
            type: "string",
            enum: ["student", "leader"],
            example: "student",
          },
        },
      },

      ManualRegistrationInvoicePayment: {
        type: "object",
        properties: {
          id: { type: "integer", example: 73 },
          gateway: {
            type: "string",
            enum: ["paypal", "paymob", "manual"],
          },
          transaction_id: { type: "string" },
          amount: { type: "number", example: 900 },
          status: {
            type: "string",
            enum: ["pending", "paid", "failed", "refunded"],
          },
          created_at: { type: "string", format: "date-time" },
        },
      },

      ManualRegistrationInvoice: {
        type: "object",
        nullable: true,
        properties: {
          id: { type: "integer", example: 21 },
          course_code: { type: "string", example: "CS201" },
          semester: { type: "string", example: "Fall" },
          year: { type: "integer", example: 2026 },
          credit_hours: { type: "integer", example: 3 },
          credit_price: { type: "number", example: 300 },
          total_amount: { type: "number", example: 900 },
          status: {
            type: "string",
            enum: ["pending", "paid", "failed", "refunded"],
          },
          payment_date: {
            type: "string",
            format: "date-time",
            nullable: true,
          },
          created_at: {
            type: "string",
            format: "date-time",
            nullable: true,
          },
          payments: {
            type: "array",
            items: {
              $ref: "#/components/schemas/ManualRegistrationInvoicePayment",
            },
          },
        },
      },

      ManualRegistrationLecture: {
        type: "object",
        nullable: true,
        properties: {
          lecture_id: { type: "integer", example: 5 },
          course_code: { type: "string", example: "CS201" },
          course_name: {
            type: "string",
            example: "Data Structures",
          },
          semester: { type: "string", example: "Fall" },
          year: { type: "integer", example: 2026 },
          day_of_week: { type: "string", example: "Monday" },
          start_time: { type: "string", example: "09:00" },
          end_time: { type: "string", example: "10:30" },
          location: {
            type: "string",
            nullable: true,
            example: "Hall A",
          },
          instructor: {
            type: "string",
            example: "Dr. Ahmed Hassan",
          },
        },
      },

      ManualRegistrationTutorialLab: {
        type: "object",
        nullable: true,
        properties: {
          tutorial_lab_id: { type: "integer", example: 12 },
          course_code: { type: "string", example: "CS201" },
          course_name: {
            type: "string",
            example: "Data Structures",
          },
          semester: { type: "string", example: "Fall" },
          year: { type: "integer", example: 2026 },
          day_of_week: { type: "string", example: "Wednesday" },
          start_time: { type: "string", example: "11:00" },
          end_time: { type: "string", example: "12:30" },
          location: {
            type: "string",
            nullable: true,
            example: "Lab 3",
          },
          group: { type: "string", example: "G1" },
          type: { type: "string", example: "lab" },
          instructor: {
            type: "string",
            example: "Eng. Sara Khaled",
          },
        },
      },

      ManualRegistrationItem: {
        type: "object",
        properties: {
          id: { type: "integer", example: 44 },
          status: {
            type: "string",
            enum: ["enrolled", "dropped", "completed"],
          },
          lecture: {
            $ref: "#/components/schemas/ManualRegistrationLecture",
          },
          tutorialLab: {
            $ref: "#/components/schemas/ManualRegistrationTutorialLab",
          },
          invoice: {
            $ref: "#/components/schemas/ManualRegistrationInvoice",
          },
        },
      },

      ManualStudentRegistrationsResponse: {
        type: "object",
        properties: {
          student: {
            $ref: "#/components/schemas/ManualRegistrationStudent",
          },
          total: { type: "integer", example: 3 },
          registrations: {
            type: "array",
            items: {
              $ref: "#/components/schemas/ManualRegistrationItem",
            },
          },
        },
      },

      ManualStudentScheduleClass: {
        type: "object",
        properties: {
          courseId: { type: "string", example: "CS201" },
          courseCode: { type: "string", example: "CS201" },
          courseName: {
            type: "string",
            example: "Data Structures",
          },
          startTime: { type: "string", example: "09:00" },
          endTime: { type: "string", example: "10:30" },
          location: { type: "string", example: "Hall A" },
          instructor: {
            type: "string",
            example: "Dr. Ahmed Hassan",
          },
          type: { type: "string", example: "lecture" },
        },
      },

      ManualStudentScheduleDay: {
        type: "object",
        properties: {
          day: { type: "string", example: "Monday" },
          date: { type: "string", format: "date" },
          classes: {
            type: "array",
            items: {
              $ref: "#/components/schemas/ManualStudentScheduleClass",
            },
          },
        },
      },

      ManualStudentScheduleResponse: {
        type: "object",
        properties: {
          student: {
            $ref: "#/components/schemas/ManualRegistrationStudent",
          },
          schedule: {
            type: "array",
            items: {
              $ref: "#/components/schemas/ManualStudentScheduleDay",
            },
          },
        },
      },
    },
  },
};
