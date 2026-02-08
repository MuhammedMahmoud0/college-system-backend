import express from 'express';
import * as registrationController from '../controllers/registrationController.js';
import { authMiddleware, authorizationMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// GET /api/registration/available-offerings - Requires authentication
router.get('/available-offerings', authMiddleware, registrationController.getAvailableOfferings);

// POST /api/registration/register - Only students and leaders can register
router.post('/register', authMiddleware, authorizationMiddleware('student', 'leader'), registrationController.registerCourses);

export default router;
