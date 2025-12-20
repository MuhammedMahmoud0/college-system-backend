import express from 'express';
import * as courseController from '../controllers/courseController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/student', courseController.getStudentCourses);
router.get('/:courseId', courseController.getCourseDetails);
router.get('/:courseId/grades', courseController.getGradeBreakdown);

export default router;