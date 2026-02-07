import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";

// POST /api/community/posts - Create a new post
export const createPost = async (req, res) => {
    try {
        const { content, image_url, group_id } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: "Content is required" });
        }

        const post = await prisma.community_posts.create({
            data: {
                content,
                image_url: image_url || null,
                group_id: group_id || null,
                author_id: req.user.id,
            },
            include: {
                users: {
                    select: {
                        id: true,
                        full_name: true,
                        avatar_url: true,
                    }
                },
                community_groups: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            }
        });

        res.status(201).json({ message: "Post created successfully", post });
    } catch (err) {
        logger.error("Error creating post:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// GET /api/community/feed - Fetch all posts with details
export const getCommunityFeed = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const posts = await prisma.community_posts.findMany({
            skip,
            take: limit,
            include: {
                users: {
                    select: {
                        id: true,
                        full_name: true,
                        avatar_url: true,
                    }
                },
                community_groups: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                _count: {
                    select: { 
                        post_likes: true,
                        post_comments: true 
                    }
                },
                post_comments: {
                    take: 3,
                    orderBy: { created_at: 'desc' },
                    include: {
                        users: {
                            select: {
                                id: true,
                                full_name: true,
                                avatar_url: true,
                            }
                        }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        // Transform posts to include computed fields
        const transformedPosts = posts.map(post => ({
            ...post,
            author_name: post.users.full_name,
            author_avatar: post.users.avatar_url,
            group_name: post.community_groups?.name || null,
            likes_count: post._count.post_likes,
            comments_count: post._count.post_comments,
            recent_comments: post.post_comments.map(comment => ({
                id: comment.id,
                content: comment.content,
                created_at: comment.created_at,
                author_name: comment.users.full_name,
                author_avatar: comment.users.avatar_url,
            }))
        }));

        res.status(200).json({ posts: transformedPosts });
    } catch (err) {
        logger.error("Error fetching community feed:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// POST /api/community/posts/:id/like - Toggle like on a post
export const togglePostLike = async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const userId = req.user.id;

        // Check if post exists
        const post = await prisma.community_posts.findUnique({
            where: { id: postId }
        });

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        // Check if like exists
        const existingLike = await prisma.post_likes.findUnique({
            where: {
                post_id_user_id: {
                    post_id: postId,
                    user_id: userId
                }
            }
        });

        if (existingLike) {
            // Unlike: delete the like
            await prisma.post_likes.delete({
                where: {
                    post_id_user_id: {
                        post_id: postId,
                        user_id: userId
                    }
                }
            });
            return res.status(200).json({ message: "Post unliked", liked: false });
        } else {
            // Like: create new like
            await prisma.post_likes.create({
                data: {
                    post_id: postId,
                    user_id: userId
                }
            });
            return res.status(200).json({ message: "Post liked", liked: true });
        }
    } catch (err) {
        logger.error("Error toggling post like:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// POST /api/community/posts/:id/comment - Add comment to a post
export const addPostComment = async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ error: "Comment content is required" });
        }

        // Check if post exists
        const post = await prisma.community_posts.findUnique({
            where: { id: postId }
        });

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const comment = await prisma.post_comments.create({
            data: {
                post_id: postId,
                author_id: req.user.id,
                content
            },
            include: {
                users: {
                    select: {
                        id: true,
                        full_name: true,
                        avatar_url: true,
                    }
                }
            }
        });

        res.status(201).json({ 
            message: "Comment added successfully", 
            comment: {
                ...comment,
                author_name: comment.users.full_name,
                author_avatar: comment.users.avatar_url,
            }
        });
    } catch (err) {
        logger.error("Error adding comment:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// GET /api/community/groups/suggested - List groups user hasn't joined
export const getSuggestedGroups = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get groups the user has already joined
        const joinedGroups = await prisma.group_members.findMany({
            where: { user_id: userId },
            select: { group_id: true }
        });

        const joinedGroupIds = joinedGroups.map(g => g.group_id);

        // Get groups the user hasn't joined
        const suggestedGroups = await prisma.community_groups.findMany({
            where: {
                id: {
                    notIn: joinedGroupIds
                }
            },
            include: {
                _count: {
                    select: { group_members: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        const transformedGroups = suggestedGroups.map(group => ({
            ...group,
            members_count: group._count.group_members
        }));

        res.status(200).json({ groups: transformedGroups });
    } catch (err) {
        logger.error("Error fetching suggested groups:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// POST /api/community/groups/:id/join - Join a group
export const joinGroup = async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        const userId = req.user.id;

        // Check if group exists
        const group = await prisma.community_groups.findUnique({
            where: { id: groupId }
        });

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        // Check if already a member
        const existingMembership = await prisma.group_members.findUnique({
            where: {
                group_id_user_id: {
                    group_id: groupId,
                    user_id: userId
                }
            }
        });

        if (existingMembership) {
            return res.status(400).json({ error: "Already a member of this group" });
        }

        // Join the group
        await prisma.group_members.create({
            data: {
                group_id: groupId,
                user_id: userId
            }
        });

        res.status(200).json({ message: "Successfully joined the group" });
    } catch (err) {
        logger.error("Error joining group:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// GET /api/community/events - Fetch all upcoming events
export const getUpcomingEvents = async (req, res) => {
    try {
        const events = await prisma.events.findMany({
            orderBy: { event_date: 'asc' }
        });

        res.status(200).json({ events });
    } catch (err) {
        logger.error("Error fetching events:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};