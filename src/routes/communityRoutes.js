import express from 'express';
import * as communityController from '../controllers/communityController.js';
import { authMiddleware, authorizationMiddleware } from '../middlewares/authMiddleware.js'; 

const router = express.Router();

// Apply authentication to all community routes
router.use(authMiddleware);

// Posts
router.post('/posts', communityController.createPost);
router.patch('/posts/:id', communityController.updatePost);
router.delete('/posts/:id', communityController.deletePost);
router.get('/feed', communityController.getCommunityFeed);
router.get('/posts/user/:userId', communityController.getUserPosts);
router.post('/posts/:id/like', communityController.togglePostLike);
router.get('/posts/:id/likes', communityController.getPostLikes);
router.post('/posts/:id/comment', communityController.addPostComment);
router.get('/posts/:id/comments', communityController.getPostComments);

// Groups - Only non-students can create groups
router.post('/groups', authorizationMiddleware('doctor', 'admin', 'super_admin', 'teaching_assistant', 'leader'), communityController.createGroup);
router.get('/groups/suggested', communityController.getSuggestedGroups);
router.get('/groups/my', communityController.getMyGroups);
router.get('/groups/:id/posts', communityController.getGroupPosts);
router.post('/groups/:id/join', communityController.joinGroup);
router.patch('/groups/:id', authorizationMiddleware('admin', 'super_admin'), communityController.updateGroup);
router.delete('/groups/:id', authorizationMiddleware('admin', 'super_admin'), communityController.deleteGroup);

// Events
router.get('/events', communityController.getUpcomingEvents);
router.post('/events', authorizationMiddleware('admin', 'super_admin'), communityController.createEvent);
router.patch('/events/:id', authorizationMiddleware('admin', 'super_admin'), communityController.updateEvent);
router.delete('/events/:id', authorizationMiddleware('admin', 'super_admin'), communityController.deleteEvent);

export default router;