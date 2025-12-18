export default {
    paths: {
        "/leaderboard": {
            get: {
                tags: ["Leaderboard"],
                summary: "Get leaderboard",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "query",
                        name: "type",
                        schema: {
                            type: "string",
                            enum: ["gpa", "attendance", "activities"],
                            default: "gpa",
                        },
                    },
                    {
                        in: "query",
                        name: "department",
                        schema: { type: "string" },
                    },
                    {
                        in: "query",
                        name: "level",
                        schema: { type: "integer" },
                    },
                    {
                        in: "query",
                        name: "limit",
                        schema: {
                            type: "integer",
                            default: 50,
                        },
                    },
                ],
                responses: {
                    200: {
                        description: "Leaderboard result",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/LeaderboardResponse",
                                },
                            },
                        },
                    },
                    400: {
                        description: "Bad request",
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
