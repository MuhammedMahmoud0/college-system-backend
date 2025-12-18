import swaggerUi from "swagger-ui-express";
import base from "../swagger/base.js";
import components from "../swagger/components.js";

import leaderboard from "../swagger/leaderboard.swagger.js";
import auth from "../swagger/auth.swagger.js";
import users from "../swagger/users.swagger.js";
import studentProfile from "../swagger/studentProfile.swagger.js";

export const swaggerSpec = {
    ...base,
    components,
    paths: {
        ...auth.paths,
        ...users.paths,
        ...studentProfile.paths,
        ...leaderboard.paths,
    },
};

export const swaggerUiHandler = swaggerUi;
