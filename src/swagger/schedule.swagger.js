export default {
  paths: {
    "/schedule": {
      get: {
        tags: ["Schedule"],
        summary: "Get student's weekly class schedule",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "week",
            schema: {
              type: "integer",
            },
            required: false,
            description:
              "Week number offset (0 = current week, 1 = next week, -1 = previous week)",
          },
          {
            in: "query",
            name: "date",
            schema: {
              type: "string",
              format: "date",
            },
            required: false,
            description:
              "Specific date (YYYY-MM-DD) to get schedule for that week",
          },
        ],
        responses: {
          200: {
            description: "Student schedule retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ScheduleResponse",
                },
                example: {
                  schedule: [
                    {
                      day: "Sunday",
                      date: "2025-12-14",
                      classes: [],
                    },
                    {
                      day: "Monday",
                      date: "2025-12-15",
                      classes: [
                        {
                          courseId: "CS301",
                          courseCode: "CS301",
                          courseName: "Database Systems",
                          startTime: "09:00:00",
                          endTime: "10:30:00",
                          location: "Building A, Room 201",
                          instructor: "Dr. Sarah Johnson",
                          type: "lecture",
                        },
                        {
                          courseId: "CS301",
                          courseCode: "CS301",
                          courseName: "Database Systems",
                          startTime: "14:00:00",
                          endTime: "16:00:00",
                          location: "Lab 5",
                          instructor: "TA Mike Brown",
                          type: "lab",
                        },
                      ],
                    },
                    {
                      day: "Tuesday",
                      date: "2025-12-16",
                      classes: [],
                    },
                    {
                      day: "Wednesday",
                      date: "2025-12-17",
                      classes: [],
                    },
                    {
                      day: "Thursday",
                      date: "2025-12-18",
                      classes: [],
                    },
                    {
                      day: "Friday",
                      date: "2025-12-19",
                      classes: [],
                    },
                    {
                      day: "Saturday",
                      date: "2025-12-20",
                      classes: [],
                    },
                  ],
                },
              },
            },
          },
          401: {
            description: "Not authenticated or not authorized",
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
};
