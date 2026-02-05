import express from 'express';
import * as registrationController from '../controllers/registrationController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All registration routes require authentication
router.use(authMiddleware);

// GET /api/registration/available-offerings
router.get('/available-offerings', registrationController.getAvailableOfferings);

// POST /api/registration/register
router.post('/register', registrationController.registerCourses);

export default router;
