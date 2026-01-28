export default {
    paths: {
        "/materials": {
            get: {
                tags: ["Materials"],
                summary: "Get course materials",
                description:
                    "Retrieve course materials filtered by lecture or tutorial/lab. Accessible by all authenticated users.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "lecture_id",
                        in: "query",
                        schema: { type: "integer" },
                        description: "Filter by lecture ID",
                    },
                    {
                        name: "tutorial_lab_id",
                        in: "query",
                        schema: { type: "integer" },
                        description: "Filter by tutorial/lab ID",
                    },
                ],
                responses: {
                    200: {
                        description: "List of materials",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: {
                                        $ref: "#/components/schemas/Material",
                                    },
                                },
                            },
                        },
                    },
                    401: {
                        description: "Unauthorized",
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
                                    $ref: "#/components/schemas/MaterialErrorResponse",
                                },
                            },
                        },
                    },
                },
            },
            post: {
                tags: ["Materials"],
                summary: "Create a new material (Doctor/Admin only)",
                description:
                    "Upload a file or add a link as course material. Doctors can only add materials to their assigned courses.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                $ref: "#/components/schemas/CreateMaterialRequest",
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Material created successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/Material",
                                },
                            },
                        },
                    },
                    400: {
                        description: "Validation error",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/MaterialErrorResponse",
                                },
                            },
                        },
                    },
                    401: {
                        description: "Unauthorized",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    403: {
                        description: "Forbidden - Doctor/Admin access required",
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
                                    $ref: "#/components/schemas/MaterialErrorResponse",
                                },
                            },
                        },
                    },
                },
            },
        },
        "/materials/{id}": {
            put: {
                tags: ["Materials"],
                summary: "Update a material (Doctor/Admin only)",
                description:
                    "Update material title or URL (for link materials only)",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "integer" },
                        description: "Material ID",
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/UpdateMaterialRequest",
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Material updated successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/Material",
                                },
                            },
                        },
                    },
                    400: {
                        description: "Cannot add URL to file material",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/MaterialErrorResponse",
                                },
                            },
                        },
                    },
                    401: {
                        description: "Unauthorized",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    403: {
                        description: "Forbidden - Doctor/Admin access required",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    404: {
                        description: "Material not found",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/MaterialErrorResponse",
                                },
                            },
                        },
                    },
                    500: {
                        description: "Internal server error",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/MaterialErrorResponse",
                                },
                            },
                        },
                    },
                },
            },
            delete: {
                tags: ["Materials"],
                summary: "Delete a material (Doctor/Admin only)",
                description:
                    "Delete a material. If it's a file material, the file is also removed from storage.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "integer" },
                        description: "Material ID",
                    },
                ],
                responses: {
                    200: {
                        description: "Material deleted successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                    },
                                    example: {
                                        message:
                                            "Material deleted successfully",
                                    },
                                },
                            },
                        },
                    },
                    401: {
                        description: "Unauthorized",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    403: {
                        description: "Forbidden - Doctor/Admin access required",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    404: {
                        description: "Material not found",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/MaterialErrorResponse",
                                },
                            },
                        },
                    },
                    500: {
                        description: "Internal server error",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/MaterialErrorResponse",
                                },
                            },
                        },
                    },
                },
            },
        },
        "/materials/{id}/download": {
            get: {
                tags: ["Materials"],
                summary: "Get download URL for a material",
                description:
                    "Returns a signed URL for downloading the material file. For link materials, returns the URL directly. The signed URL expires in 1 hour.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "integer" },
                        description: "Material ID",
                    },
                ],
                responses: {
                    200: {
                        description: "Download URL generated successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/DownloadResponse",
                                },
                            },
                        },
                    },
                    302: {
                        description: "Redirect to URL (for link materials)",
                    },
                    401: {
                        description: "Unauthorized",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    404: {
                        description: "Material not found",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/MaterialErrorResponse",
                                },
                            },
                        },
                    },
                    500: {
                        description: "Failed to generate download link",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/MaterialErrorResponse",
                                },
                            },
                        },
                    },
                },
            },
        },
        "/materials/{id}/stream": {
            get: {
                tags: ["Materials"],
                summary: "Stream/download a material file directly",
                description:
                    "Streams the file directly to the client. For link materials, redirects to the URL. Use this for direct downloads without needing a signed URL.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "integer" },
                        description: "Material ID",
                    },
                ],
                responses: {
                    200: {
                        description: "File stream",
                        content: {
                            "application/octet-stream": {
                                schema: {
                                    type: "string",
                                    format: "binary",
                                },
                            },
                            "application/pdf": {
                                schema: {
                                    type: "string",
                                    format: "binary",
                                },
                            },
                        },
                    },
                    302: {
                        description: "Redirect to URL (for link materials)",
                    },
                    401: {
                        description: "Unauthorized",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ErrorResponse",
                                },
                            },
                        },
                    },
                    404: {
                        description: "Material not found",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/MaterialErrorResponse",
                                },
                            },
                        },
                    },
                    500: {
                        description: "Failed to stream file",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/MaterialErrorResponse",
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    schemas: {
        // Material object
        Material: {
            type: "object",
            properties: {
                id: { type: "integer" },
                title: { type: "string" },
                url: { type: "string", nullable: true },
                file_id: { type: "string", format: "uuid", nullable: true },
                lecture_id: { type: "integer", nullable: true },
                tutorial_lab_id: { type: "integer", nullable: true },
                uploaded_at: { type: "string", format: "date-time" },
                files: {
                    type: "object",
                    nullable: true,
                    properties: {
                        file_id: { type: "string", format: "uuid" },
                        file_name: { type: "string" },
                        file_path: { type: "string" },
                        media_type: { type: "string" },
                        size_bytes: { type: "integer" },
                    },
                },
            },
            example: {
                id: 1,
                title: "Lecture_01_Introduction.pdf",
                url: null,
                file_id: "550e8400-e29b-41d4-a716-446655440000",
                lecture_id: 5,
                tutorial_lab_id: null,
                uploaded_at: "2026-01-28T10:30:00.000Z",
                files: {
                    file_id: "550e8400-e29b-41d4-a716-446655440000",
                    file_name: "Lecture_01_Introduction.pdf",
                    file_path: "materials/doctor-uuid/1706436600000.pdf",
                    media_type: "application/pdf",
                    size_bytes: 2048576,
                },
            },
        },
        // Create material request (multipart/form-data)
        CreateMaterialRequest: {
            type: "object",
            required: ["type"],
            properties: {
                type: {
                    type: "string",
                    enum: ["link", "file"],
                    description: "Material type - either 'link' or 'file'",
                },
                lecture_id: {
                    type: "integer",
                    description:
                        "Lecture ID (required if tutorial_lab_id is not provided)",
                },
                tutorial_lab_id: {
                    type: "integer",
                    description:
                        "Tutorial/Lab ID (required if lecture_id is not provided)",
                },
                title: {
                    type: "string",
                    description:
                        "Material title (required for links, auto-set to filename for files)",
                },
                url: {
                    type: "string",
                    format: "uri",
                    description:
                        "URL of the material (required when type is 'link')",
                },
                file: {
                    type: "string",
                    format: "binary",
                    description:
                        "File to upload (required when type is 'file')",
                },
            },
        },
        // Update material request
        UpdateMaterialRequest: {
            type: "object",
            properties: {
                title: {
                    type: "string",
                    description: "New title for the material",
                },
                url: {
                    type: "string",
                    format: "uri",
                    description:
                        "New URL (only allowed for link materials, not file materials)",
                },
            },
            example: {
                title: "Updated Lecture Notes",
                url: "https://example.com/updated-notes",
            },
        },
        // Material error response
        MaterialErrorResponse: {
            type: "object",
            properties: {
                message: { type: "string" },
            },
            example: {
                message: "Material not found",
            },
        },
        // Download response
        DownloadResponse: {
            type: "object",
            properties: {
                material: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        title: { type: "string" },
                        file_name: { type: "string" },
                        media_type: { type: "string" },
                        size_bytes: { type: "integer" },
                    },
                },
                download_url: {
                    type: "string",
                    format: "uri",
                    description: "Signed URL for downloading the file",
                },
                expires_in: {
                    type: "integer",
                    description: "URL expiration time in seconds",
                },
            },
            example: {
                material: {
                    id: 1,
                    title: "Lecture_01_Introduction.pdf",
                    file_name: "Lecture_01_Introduction.pdf",
                    media_type: "application/pdf",
                    size_bytes: 2048576,
                },
                download_url:
                    "https://your-project.supabase.co/storage/v1/object/sign/course-materials/materials/uuid/123456.pdf?token=xxx",
                expires_in: 3600,
            },
        },
    },
};
