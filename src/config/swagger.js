import swaggerUi from "swagger-ui-express";
import base from "../swagger/base.js";
import components from "../swagger/components.js";

import leaderboard from "../swagger/leaderboard.swagger.js";
import auth from "../swagger/auth.swagger.js";
import users from "../swagger/users.swagger.js";
import studentProfile from "../swagger/studentProfile.swagger.js";
import studentSettings from "../swagger/studentSettings.swagger.js";
import schedule from "../swagger/schedule.swagger.js";
import teacher from "../swagger/teacher.swagger.js";
import notification from "../swagger/notification.swagger.js";
import materials from "../swagger/materials.swagger.js";
import course from "../swagger/course.swagger.js";
import courseOffering from "../swagger/courseOffering.swagger.js";
import exam from "../swagger/exam.swagger.js";
import registration from "../swagger/registration.swagger.js";
import community from "../swagger/community.swagger.js";
import attendance from "../swagger/attendance.swagger.js";
import systemConfig from "../swagger/systemConfig.swagger.js";

export const swaggerSpec = {
  ...base,
  components: {
    ...components,
    schemas: {
      ...components.schemas,
      ...notification.schemas,
      ...materials.schemas,
      ...course.schemas,
      ...courseOffering.schemas,
      ...registration.components.schemas,
      ...systemConfig.schemas,
    },
  },
  paths: {
    ...auth.paths,
    ...users.paths,
    ...studentProfile.paths,
    ...studentSettings.paths,
    ...leaderboard.paths,
    ...schedule.paths,
    ...teacher.paths,
    ...notification.paths,
    ...materials.paths,
    ...course.paths,
    ...courseOffering.paths,
    ...exam.paths,
    ...registration.paths,
    ...community.paths,
    ...attendance.paths,
    ...systemConfig.paths,
  },
};

export const swaggerUiHandler = swaggerUi;
