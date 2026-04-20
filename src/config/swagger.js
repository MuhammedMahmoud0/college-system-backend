import swaggerUi from "swagger-ui-express";
import base from "../swagger/base.js";
import components from "../swagger/components.js";

import leaderboard from "../swagger/leaderboard.swagger.js";
import auth from "../swagger/auth.swagger.js";
import users from "../swagger/users.swagger.js";
import staffProfile from "../swagger/staffProfile.swagger.js";
import studentProfile from "../swagger/studentProfile.swagger.js";
import settings from "../swagger/settings.swagger.js";
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
import grade from "../swagger/grade.swagger.js";
import task from "../swagger/task.swagger.js";
import adminDashboard from "../swagger/adminDashboard.swagger.js";
import department from "../swagger/department.swagger.js";
import doctorDashboard from "../swagger/doctorDashboard.swagger.js";
import teachingAssistantDashboard from "../swagger/teachingAssistantDashboard.swagger.js";
import financial from "../swagger/financial.swagger.js";
import paymentReport from "../swagger/paymentReport.swagger.js";
import payment from "../swagger/payment.swagger.js";
import faq from "../swagger/faq.swagger.js";

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
      ...grade.schemas,
      ...task.schemas,
      ...adminDashboard.schemas,
      ...department.schemas,
      ...doctorDashboard.schemas,
      ...teachingAssistantDashboard.schemas,
      ...financial.schemas,
      ...paymentReport.schemas,
      ...payment.schemas,
    },
  },
  paths: {
    ...auth.paths,
    ...users.paths,
    ...staffProfile.paths,
    ...studentProfile.paths,
    ...settings.paths,
    ...department.paths,
    ...leaderboard.paths,
    ...financial.paths,
    ...payment.paths,
    ...paymentReport.paths,
    ...faq.paths,
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
    ...grade.paths,
    ...task.paths,
    ...adminDashboard.paths,
    ...doctorDashboard.paths,
    ...teachingAssistantDashboard.paths,
  },
};

export const swaggerUiHandler = swaggerUi;
