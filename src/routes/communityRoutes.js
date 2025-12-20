import express from 'express';
import * as communityController from '../controllers/communityController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js'; 

const router = express.Router();

// Apply authentication to all community routes
router.use(authMiddleware);

router.get('/posts', communityController.getCommunityFeed);
router.post('/posts', communityController.createPost);
router.post('/posts/:postId/like', communityController.likePost);
router.get('/events', communityController.getUpcomingEvents);

export default router;