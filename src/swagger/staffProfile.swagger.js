export default {
  paths: {
    "/users/profile": {
      get: {
        tags: ["StaffProfile"],
        summary: "Get current non-student profile",
        description:
          "Returns the authenticated non-student user's profile (doctor, teaching_assistant, admin, super_admin).",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Current profile retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/StaffProfileResponse",
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: {
            description:
              "Forbidden - only doctor, teaching_assistant, admin, and super_admin",
          },
          404: { description: "User not found" },
          500: { description: "Internal server error" },
        },
      },
      patch: {
        tags: ["StaffProfile"],
        summary: "Update current non-student profile",
        description:
          "Allows authenticated non-student users (doctor, teaching_assistant, admin, super_admin) to update only phone, home address, and avatar image.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                $ref: "#/components/schemas/UpdateOwnProfileRequest",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Profile updated successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UpdateOwnProfileResponse",
                },
              },
            },
          },
          400: {
            description:
              "Invalid fields or no update fields provided (phone, address, avatar)",
          },
          401: { description: "Unauthorized" },
          403: {
            description:
              "Forbidden - only doctor, teaching_assistant, admin, and super_admin",
          },
          404: { description: "User not found" },
          500: {
            description: "Internal server error or avatar upload failure",
          },
        },
      },
    },
  },
};
