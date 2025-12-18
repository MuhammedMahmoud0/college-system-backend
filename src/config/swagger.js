import swaggerUi from "swagger-ui-express";
import base from "../swagger/base.js";
import components from "../swagger/components.js";

import leaderboard from "../swagger/leaderboard.swagger.js";
import auth from "../swagger/auth.swagger.js";
import users from "../swagger/users.swagger.js";
import studentProfile from "../swagger/studentProfile.swagger.js";
import schedule from "../swagger/schedule.swagger.js";
import teacher from "../swagger/teacher.swagger.js";

export const swaggerSpec = {
  ...base,
  components,
  paths: {
    ...auth.paths,
    ...users.paths,
    ...studentProfile.paths,
    ...leaderboard.paths,
    ...schedule.paths,
    ...teacher.paths,
  },
};

export const swaggerUiHandler = swaggerUi;
