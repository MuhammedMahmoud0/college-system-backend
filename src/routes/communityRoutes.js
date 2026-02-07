import express from 'express';
import * as communityController from '../controllers/communityController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js'; 

const router = express.Router();

// Apply authentication to all community routes
router.use(authMiddleware);

// Posts
router.post('/posts', communityController.createPost);
router.get('/feed', communityController.getCommunityFeed);
router.post('/posts/:id/like', communityController.togglePostLike);
router.post('/posts/:id/comment', communityController.addPostComment);

// Groups
router.get('/groups/suggested', communityController.getSuggestedGroups);
router.post('/groups/:id/join', communityController.joinGroup);

// Events
router.get('/events', communityController.getUpcomingEvents);

export default router;