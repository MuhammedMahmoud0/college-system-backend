export default {
  paths: {
    "/student/profile": {
      get: {
        tags: ["StudentProfile"],
        summary: "Get current student's profile",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Student profile",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/StudentProfileResponse",
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
              },
            },
          },
          404: {
            description: "Profile not found",
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
      put: {
        tags: ["StudentProfile"],
        summary: "Update current student's profile",
        description:
          "Update student profile information. All fields are optional - only send the fields you want to update. Supported fields are phone, home address, and avatar image upload.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                $ref: "#/components/schemas/StudentProfileUpdateRequest",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Profile updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    updatedStudent: {
                      $ref: "#/components/schemas/UserPublic",
                    },
                  },
                },
              },
            },
          },
          400: {
            description:
              "Bad request (invalid fields or no allowed fields provided)",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
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
              },
            },
          },
          500: {
            description: "Failed to upload avatar or update profile",
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
    "/student/digital-id/front": {
      get: {
        tags: ["StudentProfile"],
        summary: "Get Digital Student ID front side",
        description:
          "Returns Digital Student ID front-side data for authenticated student or leader including name, student_id, department, level, issue date, and expiry date.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Digital Student ID front-side payload",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/DigitalStudentIdFrontResponse",
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
              },
            },
          },
          404: {
            description: "Student/leader profile not found",
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
    "/student/digital-id/back": {
      get: {
        tags: ["StudentProfile"],
        summary: "Get Digital Student ID back side",
        description:
          "Returns Digital Student ID back-side data including QR payload (student_id and national_id), barcode access flag, and fixed access privileges.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Digital Student ID back-side payload",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/DigitalStudentIdBackResponse",
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
              },
            },
          },
          404: {
            description: "Student/leader profile not found",
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
