export default {
  schemas: {
    TeachingAssistantAlertItem: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: [
            "active_task",
            "expired_task",
            "ungraded_submissions",
            "low_midterm_scores",
            "low_work_scores",
          ],
          example: "active_task",
        },
        label: {
          type: "string",
          example:
            '"Lab Report 1" for Database Systems is due in 24h 15m - 3 student(s) have not submitted yet.',
        },
        data: {
          type: "object",
          description:
            "Structured data behind the alert (shape varies by alert type).",
        },
      },
    },
  },

  paths: {
    "/teaching-assistant/alerts": {
      get: {
        tags: ["Teaching Assistant Dashboard"],
        summary:
          "Teaching assistant alerts (active tasks, expired tasks, ungraded submissions, low score counts)",
        description:
          "Returns a unified list of labeled alerts for the authenticated teaching assistant based on their tutorial/lab groups.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Alerts retrieved successfully.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    count: { type: "integer", example: 4 },
                    alerts: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/TeachingAssistantAlertItem",
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized." },
          403: {
            description: "Forbidden - Teaching Assistant or Super Admin only.",
          },
          500: { description: "Internal server error." },
        },
      },
    },
  },
};
