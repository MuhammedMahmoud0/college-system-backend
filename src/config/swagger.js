import swaggerUi from "swagger-ui-express";
import base from "../swagger/base.js";
import components from "../swagger/components.js";

import leaderboard from "../swagger/leaderboard.swagger.js";
import auth from "../swagger/auth.swagger.js";
import users from "../swagger/users.swagger.js";
import studentProfile from "../swagger/studentProfile.swagger.js";
import schedule from "../swagger/schedule.swagger.js";
import teacher from "../swagger/teacher.swagger.js";
import notification from "../swagger/notification.swagger.js";
import materials from "../swagger/materials.swagger.js";
import registration from "../swagger/registration.swagger.js";

export const swaggerSpec = {
    ...base,
    components: {
        ...components,
        schemas: {
            ...components.schemas,
            ...notification.schemas,
            ...materials.schemas,
            ...registration.components.schemas,
        },
    },
    paths: {
        ...auth.paths,
        ...users.paths,
        ...studentProfile.paths,
        ...leaderboard.paths,
        ...schedule.paths,
        ...teacher.paths,
        ...notification.paths,
        ...materials.paths,
        ...registration.paths,
    },
};

export const swaggerUiHandler = swaggerUi;
