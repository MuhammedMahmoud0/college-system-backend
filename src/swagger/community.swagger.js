export default {
    paths: {
        "/community/posts": {
            post: {
                summary: "Create a new community post",
                tags: ["Community"],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["content", "group_id"],
                                properties: {
                                    content: {
                                        type: "string",
                                        description: "Post content text",
                                        example:
                                            "This is my first community post!",
                                    },
                                    image_url: {
                                        type: "string",
                                        nullable: true,
                                        description:
                                            "Optional image URL for the post",
                                        example:
                                            "https://example.com/image.jpg",
                                    },
                                    group_id: {
                                        type: "integer",
                                        nullable: true,
                                        description:
                                            "Optional group ID to post in a specific group",
                                        example: 1,
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Post created successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: {
                                            type: "string",
                                            example:
                                                "Post created successfully",
                                        },
                                        post: {
                                            $ref: "#/components/schemas/CommunityPost",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: "Bad request - content is required",
                    },
                    401: {
                        description: "Unauthorized",
                    },
                    500: {
                        description: "Internal server error",
                    },
                },
            },
        },
        "/community/feed": {
            get: {
                summary: "Get community feed with all posts",
                description:
                    "Returns posts visible to the authenticated user only (public posts and posts from groups the user joined).",
                tags: ["Community"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "query",
                        name: "page",
                        schema: {
                            type: "integer",
                            default: 1,
                        },
                        description: "Page number for pagination",
                    },
                    {
                        in: "query",
                        name: "limit",
                        schema: {
                            type: "integer",
                            default: 10,
                        },
                        description: "Number of posts per page",
                    },
                ],
                responses: {
                    200: {
                        description: "Successfully retrieved community feed",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        posts: {
                                            type: "array",
                                            items: {
                                                $ref: "#/components/schemas/CommunityFeedPost",
                                            },
                                        },
                                    },
                                    example: {
                                        posts: [
                                            {
                                                id: 1,
                                                author_id: "b4c6d8e0-f2a3-5b7c-9d0e-1f2a3b4c5d6e",
                                                author_name: "John Doe",
                                                author_avatar:
                                                    "https://storage.example.com/avatars/john-d.jpg",
                                                group_name:
                                                    "Computer Science Club",
                                                content:
                                                    "Just finished my final project for Database Systems! Really proud of what we accomplished as a team.",
                                                image_url:
                                                    "https://storage.example.com/posts/project-demo.jpg",
                                                likes_count: 15,
                                                comments_count: 5,
                                                is_liked_by_me: true,
                                                created_at:
                                                    "2026-02-07T14:25:00Z",
                                                recent_comments: [
                                                    {
                                                        id: 12,
                                                        content:
                                                            "Congratulations! That's awesome!",
                                                        created_at:
                                                            "2026-02-07T14:30:00Z",
                                                        author_id:
                                                            "c5d7e9f1-a3b4-6c8d-0e1f-2a3b4c5d6e7f",
                                                        author_name:
                                                            "Sarah Johnson",
                                                        author_avatar:
                                                            "https://storage.example.com/avatars/sarah-j.jpg",
                                                    },
                                                    {
                                                        id: 13,
                                                        content:
                                                            "Well done! Can't wait to see the demo.",
                                                        created_at:
                                                            "2026-02-07T14:45:00Z",
                                                        author_id:
                                                            "d6e8f0a2-b4c5-7d9e-1f2a-3b4c5d6e7f8a",
                                                        author_name:
                                                            "Mike Chen",
                                                        author_avatar:
                                                            "https://storage.example.com/avatars/mike-c.jpg",
                                                    },
                                                ],
                                            },
                                            {
                                                id: 2,
                                                author_id: "e7f9a1b3-c5d6-8e0f-2a3b-4c5d6e7f8a9b",
                                                author_name: "Emily Wilson",
                                                author_avatar:
                                                    "https://storage.example.com/avatars/emily-w.jpg",
                                                group_name: null,
                                                content:
                                                    "Looking for study partners for the upcoming algorithms exam. Anyone interested?",
                                                image_url: null,
                                                likes_count: 8,
                                                comments_count: 3,
                                                is_liked_by_me: false,
                                                created_at:
                                                    "2026-02-07T13:15:00Z",
                                                recent_comments: [
                                                    {
                                                        id: 14,
                                                        content:
                                                            "I'm in! Let's meet at the library.",
                                                        created_at:
                                                            "2026-02-07T13:20:00Z",
                                                        author_id:
                                                            "f8a0b2c4-d6e7-9f1a-3b4c-5d6e7f8a9b0c",
                                                        author_name:
                                                            "David Lee",
                                                        author_avatar: null,
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                    401: {
                        description: "Unauthorized",
                    },
                    500: {
                        description: "Internal server error",
                    },
                },
            },
        },
        "/community/posts/{id}/like": {
            post: {
                summary: "Toggle like on a post",
                tags: ["Community"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: {
                            type: "integer",
                        },
                        description: "Post ID to like/unlike",
                    },
                ],
                responses: {
                    200: {
                        description: "Successfully toggled like",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: {
                                            type: "string",
                                            example: "Post liked",
                                        },
                                        liked: {
                                            type: "boolean",
                                            description:
                                                "True if liked, false if unliked",
                                            example: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: {
                        description: "Post not found",
                    },
                    401: {
                        description: "Unauthorized",
                    },
                    500: {
                        description: "Internal server error",
                    },
                },
            },
        },
        "/community/posts/{id}/comment": {
            post: {
                summary: "Add a comment to a post",
                tags: ["Community"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: {
                            type: "integer",
                        },
                        description: "Post ID to comment on",
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["content"],
                                properties: {
                                    content: {
                                        type: "string",
                                        description: "Comment text",
                                        example:
                                            "Great post! Thanks for sharing.",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Comment added successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: {
                                            type: "string",
                                            example:
                                                "Comment added successfully",
                                        },
                                        comment: {
                                            type: "object",
                                            properties: {
                                                id: {
                                                    type: "integer",
                                                    example: 1,
                                                },
                                                post_id: {
                                                    type: "integer",
                                                    example: 6,
                                                },
                                                author_id: {
                                                    type: "string",
                                                    format: "uuid",
                                                    example:
                                                        "f6c1fcd5-4d22-4914-87ed-ef86e4bae2e2",
                                                },
                                                content: {
                                                    type: "string",
                                                    example:
                                                        "Great post! Thanks for sharing.",
                                                },
                                                created_at: {
                                                    type: "string",
                                                    format: "date-time",
                                                    example:
                                                        "2026-02-08T09:05:15.178Z",
                                                },
                                                users: {
                                                    type: "object",
                                                    properties: {
                                                        id: {
                                                            type: "string",
                                                            format: "uuid",
                                                            example:
                                                                "f6c1fcd5-4d22-4914-87ed-ef86e4bae2e2",
                                                        },
                                                        full_name: {
                                                            type: "string",
                                                            example:
                                                                "Magda Madbouly",
                                                        },
                                                        avatar_url: {
                                                            type: "string",
                                                            nullable: true,
                                                            example: null,
                                                        },
                                                    },
                                                },
                                                author_name: {
                                                    type: "string",
                                                    example: "Magda Madbouly",
                                                },
                                                author_avatar: {
                                                    type: "string",
                                                    nullable: true,
                                                    example: null,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: "Bad request - content is required",
                    },
                    401: {
                        description: "Unauthorized",
                    },
                    404: {
                        description: "Post not found",
                    },
                    500: {
                        description: "Internal server error",
                    },
                },
            },
        },
        "/community/posts/{id}/comments": {
            get: {
                summary: "Get all comments for a post",
                tags: ["Community"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "integer" },
                        description: "Post ID",
                    },
                ],
                responses: {
                    200: {
                        description: "Successfully retrieved comments",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        post_id: {
                                            type: "integer",
                                            example: 6,
                                        },
                                        comments: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    id: {
                                                        type: "integer",
                                                        example: 1,
                                                    },
                                                    content: {
                                                        type: "string",
                                                        example: "Great post!",
                                                    },
                                                    created_at: {
                                                        type: "string",
                                                        format: "date-time",
                                                        example: "2026-02-08T09:05:15.178Z",
                                                    },
                                                    author_id: {
                                                        type: "string",
                                                        format: "uuid",
                                                        example: "f6c1fcd5-4d22-4914-87ed-ef86e4bae2e2",
                                                    },
                                                    author_name: {
                                                        type: "string",
                                                        example: "John Doe",
                                                    },
                                                    author_avatar: {
                                                        type: "string",
                                                        nullable: true,
                                                        example: null,
                                                    },
                                                },
                                            },
                                        },
                                        total: {
                                            type: "integer",
                                            example: 3,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    401: { description: "Unauthorized" },
                    404: { description: "Post not found" },
                    500: { description: "Internal server error" },
                },
            },
        },
        "/community/posts/{id}/likes": {
            get: {
                summary: "Get all likes for a post",
                tags: ["Community"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "integer" },
                        description: "Post ID",
                    },
                ],
                responses: {
                    200: {
                        description: "Successfully retrieved likes",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        post_id: {
                                            type: "integer",
                                            example: 6,
                                        },
                                        likes: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    user_id: {
                                                        type: "string",
                                                        format: "uuid",
                                                        example: "f6c1fcd5-4d22-4914-87ed-ef86e4bae2e2",
                                                    },
                                                    full_name: {
                                                        type: "string",
                                                        example: "John Doe",
                                                    },
                                                    avatar_url: {
                                                        type: "string",
                                                        nullable: true,
                                                        example: "https://storage.example.com/avatars/john-d.jpg",
                                                    },
                                                },
                                            },
                                        },
                                        total: {
                                            type: "integer",
                                            example: 15,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    401: { description: "Unauthorized" },
                    404: { description: "Post not found" },
                    500: { description: "Internal server error" },
                },
            },
        },
        "/community/posts/user/{userId}": {
            get: {
                summary: "Get all posts by a specific user",
                description:
                    "Retrieve posts by a specific user that are visible to the authenticated user (public posts and groups the authenticated user joined).",
                tags: ["Community"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "userId",
                        required: true,
                        schema: {
                            type: "string",
                            format: "uuid",
                        },
                        description: "User ID whose posts to retrieve",
                    },
                    {
                        in: "query",
                        name: "page",
                        schema: {
                            type: "integer",
                            default: 1,
                        },
                        description: "Page number for pagination",
                    },
                    {
                        in: "query",
                        name: "limit",
                        schema: {
                            type: "integer",
                            default: 10,
                        },
                        description: "Number of posts per page",
                    },
                ],
                responses: {
                    200: {
                        description: "Successfully retrieved user posts",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        user: {
                                            type: "object",
                                            properties: {
                                                id: {
                                                    type: "string",
                                                    format: "uuid",
                                                    example:
                                                        "f6c1fcd5-4d22-4914-87ed-ef86e4bae2e2",
                                                },
                                                full_name: {
                                                    type: "string",
                                                    example: "John Doe",
                                                },
                                                avatar_url: {
                                                    type: "string",
                                                    nullable: true,
                                                    example:
                                                        "https://storage.example.com/avatars/john-d.jpg",
                                                },
                                                role: {
                                                    type: "string",
                                                    example: "student",
                                                },
                                            },
                                        },
                                        posts: {
                                            type: "array",
                                            items: {
                                                $ref: "#/components/schemas/CommunityFeedPost",
                                            },
                                        },
                                        pagination: {
                                            type: "object",
                                            properties: {
                                                page: {
                                                    type: "integer",
                                                    example: 1,
                                                },
                                                limit: {
                                                    type: "integer",
                                                    example: 10,
                                                },
                                                total: {
                                                    type: "integer",
                                                    example: 45,
                                                },
                                                totalPages: {
                                                    type: "integer",
                                                    example: 5,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    401: {
                        description: "Unauthorized",
                    },
                    404: {
                        description: "User not found",
                    },
                    500: {
                        description: "Internal server error",
                    },
                },
            },
        },
        "/community/groups": {
            post: {
                summary: "Create a new community group",
                description: "Create a new community group.",
                tags: ["Community"],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["name"],
                                properties: {
                                    name: {
                                        type: "string",
                                        description: "Name of the group",
                                        example: "JavaScript Study Group",
                                    },
                                    description: {
                                        type: "string",
                                        nullable: true,
                                        description:
                                            "Optional description of the group",
                                        example:
                                            "A community for students learning and mastering JavaScript",
                                    },
                                    avatar_url: {
                                        type: "string",
                                        nullable: true,
                                        description:
                                            "Optional avatar URL for the group",
                                        example:
                                            "https://example.com/group-avatar.jpg",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Group created successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: {
                                            type: "string",
                                            example:
                                                "Group created successfully",
                                        },
                                        group: {
                                            $ref: "#/components/schemas/CommunityGroup",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description:
                            "Bad request - name is required or group already exists",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        error: {
                                            type: "string",
                                            example:
                                                "A group with this name already exists",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    401: {
                        description: "Unauthorized",
                    },
                    403: {
                        description:
                            "Forbidden - Students cannot create groups",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: {
                                            type: "string",
                                            example: "Access denied",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    500: {
                        description: "Internal server error",
                    },
                },
            },
        },
        "/community/groups/suggested": {
            get: {
                summary: "Get suggested groups (groups user hasn't joined)",
                tags: ["Community"],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "Successfully retrieved suggested groups",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        groups: {
                                            type: "array",
                                            items: {
                                                $ref: "#/components/schemas/CommunityGroup",
                                            },
                                        },
                                    },
                                    example: {
                                        groups: [
                                            {
                                                id: 1,
                                                name: "Computer Science Club",
                                                description:
                                                    "A community for CS students to collaborate and share knowledge",
                                                avatar_url:
                                                    "https://storage.example.com/groups/cs-club.jpg",
                                                created_at:
                                                    "2025-09-01T08:00:00Z",
                                                members_count: 45,
                                            },
                                            {
                                                id: 3,
                                                name: "AI & Machine Learning Enthusiasts",
                                                description:
                                                    "Exploring the future of artificial intelligence together",
                                                avatar_url:
                                                    "https://storage.example.com/groups/ai-ml.jpg",
                                                created_at:
                                                    "2025-10-15T10:30:00Z",
                                                members_count: 32,
                                            },
                                            {
                                                id: 5,
                                                name: "Web Development Society",
                                                description:
                                                    "Building the web, one line of code at a time",
                                                avatar_url:
                                                    "https://storage.example.com/groups/webdev.jpg",
                                                created_at:
                                                    "2025-11-20T14:00:00Z",
                                                members_count: 28,
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                    401: {
                        description: "Unauthorized",
                    },
                    500: {
                        description: "Internal server error",
                    },
                },
            },
        },
        "/community/groups/{id}/posts": {
            get: {
                summary: "Get posts for a specific group",
                description:
                    "Returns posts from the specified group. User must be a member of the group.",
                tags: ["Community"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: {
                            type: "integer",
                        },
                        description: "Group ID",
                    },
                    {
                        in: "query",
                        name: "page",
                        schema: {
                            type: "integer",
                            default: 1,
                        },
                        description: "Page number for pagination",
                    },
                    {
                        in: "query",
                        name: "limit",
                        schema: {
                            type: "integer",
                            default: 10,
                        },
                        description: "Number of posts per page",
                    },
                ],
                responses: {
                    200: {
                        description: "Successfully retrieved group posts",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        group: {
                                            type: "object",
                                            properties: {
                                                id: { type: "integer", example: 1 },
                                                name: { type: "string", example: "General" },
                                            },
                                        },
                                        posts: {
                                            type: "array",
                                            items: {
                                                $ref: "#/components/schemas/CommunityFeedPost",
                                            },
                                        },
                                        pagination: {
                                            type: "object",
                                            properties: {
                                                page: { type: "integer", example: 1 },
                                                limit: { type: "integer", example: 10 },
                                                total: { type: "integer", example: 25 },
                                                totalPages: { type: "integer", example: 3 },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden - user is not a group member" },
                    404: { description: "Group not found" },
                    500: { description: "Internal server error" },
                },
            },
        },
        "/community/groups/{id}/join": {
            post: {
                summary: "Toggle group membership (join/unjoin)",
                description: "Join a group if not a member, or leave the group if already a member. Works like a toggle.",
                tags: ["Community"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: {
                            type: "integer",
                        },
                        description: "Group ID to join/unjoin",
                    },
                ],
                responses: {
                    200: {
                        description: "Successfully toggled group membership",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: {
                                            type: "string",
                                            example:
                                                "Successfully joined the group",
                                        },
                                        joined: {
                                            type: "boolean",
                                            description: "true if joined, false if left",
                                            example: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: {
                        description: "Group not found",
                    },
                    401: {
                        description: "Unauthorized",
                    },
                    500: {
                        description: "Internal server error",
                    },
                },
            },
        },
        "/community/events": {
            get: {
                summary: "Get all upcoming events",
                tags: ["Community"],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "Successfully retrieved events",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        events: {
                                            type: "array",
                                            items: {
                                                $ref: "#/components/schemas/Event",
                                            },
                                        },
                                    },
                                    example: {
                                        events: [
                                            {
                                                id: 1,
                                                title: "Annual Tech Conference 2026",
                                                event_date: "2026-03-15",
                                                time: "14:00",
                                                location:
                                                    "Main Auditorium, Building A",
                                                img_url:
                                                    "https://storage.example.com/events/tech-conf-2026.jpg",
                                                link: "https://events.college.edu/tech-conf-2026",
                                                description:
                                                    "Join us for our annual tech conference featuring keynote speakers from leading tech companies and hands-on workshops.",
                                            },
                                            {
                                                id: 2,
                                                title: "Career Fair - Spring 2026",
                                                event_date: "2026-03-22",
                                                time: "10:00",
                                                location: "Student Center",
                                                img_url:
                                                    "https://storage.example.com/events/career-fair-spring.jpg",
                                                link: "https://careers.college.edu/spring-fair",
                                                description:
                                                    "Meet with top employers and explore internship and full-time opportunities.",
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                    401: {
                        description: "Unauthorized",
                    },
                    500: {
                        description: "Internal server error",
                    },
                },
            },
            post: {
                summary: "Create a new event",
                description: "Admin and super_admin only.",
                tags: ["Community"],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["title", "event_date"],
                                properties: {
                                    title: {
                                        type: "string",
                                        example: "Hackathon 2026",
                                    },
                                    event_date: {
                                        type: "string",
                                        example: "2026-04-05",
                                    },
                                    time: {
                                        type: "string",
                                        nullable: true,
                                        example: "09:00",
                                    },
                                    location: {
                                        type: "string",
                                        nullable: true,
                                        example: "Innovation Lab, Building C",
                                    },
                                    img_url: {
                                        type: "string",
                                        nullable: true,
                                        example: "https://example.com/event.jpg",
                                    },
                                    link: {
                                        type: "string",
                                        nullable: true,
                                        example: "https://example.com/register",
                                    },
                                    description: {
                                        type: "string",
                                        nullable: true,
                                        example: "24-hour coding challenge.",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Event created successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string", example: "Event created successfully" },
                                        event: { $ref: "#/components/schemas/Event" },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: "Bad request - title and event_date are required" },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden - admins only" },
                    500: { description: "Internal server error" },
                },
            },
        },
        "/community/events/{id}": {
            patch: {
                summary: "Update an event",
                description: "Admin and super_admin only.",
                tags: ["Community"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "integer" },
                        description: "Event ID",
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    title: { type: "string", example: "Updated Event Title" },
                                    event_date: { type: "string", example: "2026-05-10" },
                                    time: { type: "string", nullable: true, example: "15:00" },
                                    location: { type: "string", nullable: true, example: "Room 204" },
                                    img_url: { type: "string", nullable: true, example: "https://example.com/img.jpg" },
                                    link: { type: "string", nullable: true, example: "https://example.com" },
                                    description: { type: "string", nullable: true, example: "Updated description." },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Event updated successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string", example: "Event updated successfully" },
                                        event: { $ref: "#/components/schemas/Event" },
                                    },
                                },
                            },
                        },
                    },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden - admins only" },
                    404: { description: "Event not found" },
                    500: { description: "Internal server error" },
                },
            },
            delete: {
                summary: "Delete an event",
                description: "Admin and super_admin only.",
                tags: ["Community"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "integer" },
                        description: "Event ID",
                    },
                ],
                responses: {
                    200: {
                        description: "Event deleted successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string", example: "Event deleted successfully" },
                                    },
                                },
                            },
                        },
                    },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden - admins only" },
                    404: { description: "Event not found" },
                    500: { description: "Internal server error" },
                },
            },
        },
        "/community/posts/{id}": {
            patch: {
                summary: "Update a post",
                description: "Only the post author can update their post.",
                tags: ["Community"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "integer" },
                        description: "Post ID",
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    content: { type: "string", example: "Updated post content." },
                                    image_url: { type: "string", nullable: true, example: "https://example.com/new-image.jpg" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Post updated successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string", example: "Post updated successfully" },
                                        post: { $ref: "#/components/schemas/CommunityPost" },
                                    },
                                },
                            },
                        },
                    },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden - not your post" },
                    404: { description: "Post not found" },
                    500: { description: "Internal server error" },
                },
            },
            delete: {
                summary: "Delete a post",
                description: "The post author or an admin/super_admin can delete a post.",
                tags: ["Community"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "integer" },
                        description: "Post ID",
                    },
                ],
                responses: {
                    200: {
                        description: "Post deleted successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string", example: "Post deleted successfully" },
                                    },
                                },
                            },
                        },
                    },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden - not your post" },
                    404: { description: "Post not found" },
                    500: { description: "Internal server error" },
                },
            },
        },
        "/community/groups/my": {
            get: {
                summary: "Get groups the current user has joined",
                tags: ["Community"],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "Successfully retrieved user's groups",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        groups: {
                                            type: "array",
                                            items: { $ref: "#/components/schemas/CommunityGroup" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    401: { description: "Unauthorized" },
                    500: { description: "Internal server error" },
                },
            },
        },
        "/community/groups/{id}": {
            patch: {
                summary: "Update a community group",
                description: "Admin and super_admin only.",
                tags: ["Community"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "integer" },
                        description: "Group ID",
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    name: { type: "string", example: "Updated Group Name" },
                                    description: { type: "string", nullable: true, example: "Updated description." },
                                    avatar_url: { type: "string", nullable: true, example: "https://example.com/avatar.jpg" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Group updated successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string", example: "Group updated successfully" },
                                        group: { $ref: "#/components/schemas/CommunityGroup" },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: "Group name already exists" },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden - admins only" },
                    404: { description: "Group not found" },
                    500: { description: "Internal server error" },
                },
            },
            delete: {
                summary: "Delete a community group",
                description: "Admin and super_admin only.",
                tags: ["Community"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "integer" },
                        description: "Group ID",
                    },
                ],
                responses: {
                    200: {
                        description: "Group deleted successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string", example: "Group deleted successfully" },
                                    },
                                },
                            },
                        },
                    },
                    401: { description: "Unauthorized" },
                    403: { description: "Forbidden - admins only" },
                    404: { description: "Group not found" },
                    500: { description: "Internal server error" },
                },
            },
        },
    },
    components: {
        schemas: {
            CommunityPost: {
                type: "object",
                properties: {
                    id: {
                        type: "integer",
                        example: 1,
                    },
                    group_id: {
                        type: "integer",
                        nullable: true,
                        example: 1,
                    },
                    author_id: {
                        type: "string",
                        format: "uuid",
                        example: "550e8400-e29b-41d4-a716-446655440000",
                    },
                    content: {
                        type: "string",
                        example: "This is a post content",
                    },
                    image_url: {
                        type: "string",
                        nullable: true,
                        example: "https://example.com/image.jpg",
                    },
                    is_pinned: {
                        type: "boolean",
                        example: false,
                    },
                    created_at: {
                        type: "string",
                        format: "date-time",
                        example: "2026-02-07T10:30:00Z",
                    },
                    users: {
                        type: "object",
                        properties: {
                            id: {
                                type: "string",
                                format: "uuid",
                                example: "a3b5c7d9-e1f2-4a6b-8c9d-0e1f2a3b4c5d",
                            },
                            full_name: {
                                type: "string",
                                example: "John Doe",
                            },
                            avatar_url: {
                                type: "string",
                                nullable: true,
                                example: "https://example.com/avatar.jpg",
                            },
                        },
                    },
                    community_groups: {
                        type: "object",
                        nullable: true,
                        properties: {
                            id: {
                                type: "integer",
                                example: 2,
                            },
                            name: {
                                type: "string",
                                example: "Computer Science Club",
                            },
                        },
                    },
                },
            },
            CommunityFeedPost: {
                type: "object",
                properties: {
                    id: {
                        type: "integer",
                        example: 1,
                    },
                    group_id: {
                        type: "integer",
                        nullable: true,
                        example: 1,
                    },
                    author_id: {
                        type: "string",
                        format: "uuid",
                        description: "User ID of the post author",
                        example: "b4c6d8e0-f2a3-5b7c-9d0e-1f2a3b4c5d6e",
                    },
                    author_name: {
                        type: "string",
                        example: "John Doe",
                    },
                    author_avatar: {
                        type: "string",
                        nullable: true,
                        example: "https://example.com/avatar.jpg",
                    },
                    group_name: {
                        type: "string",
                        nullable: true,
                        example: "Computer Science Club",
                    },
                    content: {
                        type: "string",
                        example:
                            "Just finished my final project for Database Systems! Really proud of what we accomplished as a team.",
                    },
                    image_url: {
                        type: "string",
                        nullable: true,
                        example:
                            "https://storage.example.com/posts/project-demo.jpg",
                    },
                    likes_count: {
                        type: "integer",
                        example: 15,
                    },
                    comments_count: {
                        type: "integer",
                        example: 5,
                    },
                    is_liked_by_me: {
                        type: "boolean",
                        description:
                            "Whether the current authenticated user has liked this post",
                        example: true,
                    },
                    created_at: {
                        type: "string",
                        format: "date-time",
                        example: "2026-02-07T14:25:00Z",
                    },
                    recent_comments: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                id: {
                                    type: "integer",
                                    example: 12,
                                },
                                content: {
                                    type: "string",
                                    example: "Congratulations! That's awesome!",
                                },
                                created_at: {
                                    type: "string",
                                    format: "date-time",
                                    example: "2026-02-07T14:30:00Z",
                                },
                                author_id: {
                                    type: "string",
                                    format: "uuid",
                                    description: "User ID of the comment author",
                                    example: "c5d7e9f1-a3b4-6c8d-0e1f-2a3b4c5d6e7f",
                                },
                                author_name: {
                                    type: "string",
                                    example: "Sarah Johnson",
                                },
                                author_avatar: {
                                    type: "string",
                                    nullable: true,
                                    example:
                                        "https://storage.example.com/avatars/sarah-j.jpg",
                                },
                            },
                        },
                    },
                },
            },
            PostComment: {
                type: "object",
                properties: {
                    id: {
                        type: "integer",
                        example: 1,
                    },
                    post_id: {
                        type: "integer",
                        example: 1,
                    },
                    author_id: {
                        type: "string",
                        format: "uuid",
                        example: "b4c6d8e0-f2a3-5b7c-9d0e-1f2a3b4c5d6e",
                    },
                    content: {
                        type: "string",
                        example:
                            "Great post! Really inspiring to see your progress.",
                    },
                    created_at: {
                        type: "string",
                        format: "date-time",
                        example: "2026-02-07T15:10:00Z",
                    },
                    author_name: {
                        type: "string",
                        example: "Jane Smith",
                    },
                    author_avatar: {
                        type: "string",
                        nullable: true,
                        example: "https://example.com/avatar.jpg",
                    },
                },
            },
            CommunityGroup: {
                type: "object",
                properties: {
                    id: {
                        type: "integer",
                        example: 1,
                    },
                    name: {
                        type: "string",
                        example: "Computer Science Club",
                    },
                    description: {
                        type: "string",
                        nullable: true,
                        example: "A community for CS students",
                    },
                    avatar_url: {
                        type: "string",
                        nullable: true,
                        example: "https://example.com/group-avatar.jpg",
                    },
                    created_at: {
                        type: "string",
                        format: "date-time",
                        example: "2025-09-01T08:00:00Z",
                    },
                    members_count: {
                        type: "integer",
                        example: 45,
                    },
                    joined_at: {
                        type: "string",
                        format: "date-time",
                        nullable: true,
                        description: "Only present in /groups/my response",
                        example: "2026-01-15T10:00:00Z",
                    },
                },
            },
            Event: {
                type: "object",
                properties: {
                    id: {
                        type: "integer",
                        example: 1,
                    },
                    title: {
                        type: "string",
                        example: "Annual Tech Conference",
                    },
                    event_date: {
                        type: "string",
                        example: "2026-03-15",
                    },
                    time: {
                        type: "string",
                        nullable: true,
                        example: "14:00",
                    },
                    location: {
                        type: "string",
                        nullable: true,
                        example: "Main Auditorium",
                    },
                    img_url: {
                        type: "string",
                        nullable: true,
                        example: "https://example.com/event.jpg",
                    },
                    link: {
                        type: "string",
                        nullable: true,
                        example: "https://example.com/register",
                    },
                    description: {
                        type: "string",
                        nullable: true,
                        example: "Join us for the annual tech conference",
                    },
                },
            },
        },
    },
};
