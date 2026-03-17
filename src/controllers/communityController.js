import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";
import {
    sendNotification,
    sendBulkNotification,
} from "../utils/notificationService.js";

const GENERAL_GROUP_NAME = "General";

const getOrCreateGeneralGroup = async () => {
    const existing = await prisma.community_groups.findFirst({
        where: { name: GENERAL_GROUP_NAME },
        orderBy: { id: "asc" },
    });

    if (existing) {
        return existing;
    }

    return prisma.community_groups.create({
        data: {
            name: GENERAL_GROUP_NAME,
            description: "Default group for all users",
        },
    });
};

const ensureUserInGeneralGroup = async (userId) => {
    const generalGroup = await getOrCreateGeneralGroup();

    await prisma.group_members.upsert({
        where: {
            group_id_user_id: {
                group_id: generalGroup.id,
                user_id: userId,
            },
        },
        update: {},
        create: {
            group_id: generalGroup.id,
            user_id: userId,
        },
    });

    return generalGroup;
};

const getJoinedGroupIds = async (userId) => {
    const memberships = await prisma.group_members.findMany({
        where: { user_id: userId },
        select: { group_id: true },
    });

    return memberships.map((membership) => membership.group_id);
};

const isGroupMember = async (groupId, userId) => {
    const membership = await prisma.group_members.findUnique({
        where: {
            group_id_user_id: {
                group_id: groupId,
                user_id: userId,
            },
        },
    });

    return !!membership;
};

// POST /api/community/posts - Create a new post
export const createPost = async (req, res) => {
    try {
        const { content, image_url, group_id } = req.body;

        if (!content || !group_id) {
            return res
                .status(400)
                .json({ error: "Content and group_id are required" });
        }

        const generalGroup = await ensureUserInGeneralGroup(req.user.id);

        const targetGroup = await prisma.community_groups.findUnique({
            where: { id: group_id },
        });

        if (!targetGroup) {
            return res.status(404).json({ error: "Group not found" });
        }

        if (
            targetGroup.id === generalGroup.id &&
            !["admin", "super_admin"].includes(req.user.role)
        ) {
            return res.status(403).json({
                error: "Only admins and super admins can post in the General group",
            });
        }

        if (targetGroup.id !== generalGroup.id) {
            const isMember = await isGroupMember(targetGroup.id, req.user.id);
            if (!isMember) {
                return res.status(403).json({
                    error: "You must join this group before posting",
                });
            }
        }

        const post = await prisma.community_posts.create({
            data: {
                content,
                image_url: image_url || null,
                group_id,
                author_id: req.user.id,
            },
            include: {
                users: {
                    select: {
                        id: true,
                        full_name: true,
                        avatar_url: true,
                    },
                },
                community_groups: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        // Notify group members about the new post (if it belongs to a group)
        if (post.group_id) {
            const io = req.app.get("io");
            const members = await prisma.group_members.findMany({
                where: {
                    group_id: post.group_id,
                    user_id: { not: req.user.id },
                },
                select: { user_id: true },
            });

            const memberIds = members.map((m) => m.user_id);
            if (memberIds.length > 0) {
                sendBulkNotification({
                    userIds: memberIds,
                    message: `${post.users.full_name} posted in ${
                        post.community_groups?.name || "your group"
                    }: "${post.content.substring(0, 80)}${
                        post.content.length > 80 ? "..." : ""
                    }".`,
                    type: "community_activity",
                    io,
                }).catch((err) =>
                    logger.error("Error sending post notifications:", err)
                );
            }
        }

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
        const currentUserId = req.user.id;

        await ensureUserInGeneralGroup(currentUserId);
        const joinedGroupIds = await getJoinedGroupIds(currentUserId);

        const posts = await prisma.community_posts.findMany({
            where: {
                group_id: { in: joinedGroupIds },
            },
            skip,
            take: limit,
            include: {
                users: {
                    select: {
                        id: true,
                        full_name: true,
                        avatar_url: true,
                    },
                },
                community_groups: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        post_likes: true,
                        post_comments: true,
                    },
                },
                post_comments: {
                    take: 3,
                    orderBy: { created_at: "desc" },
                    include: {
                        users: {
                            select: {
                                id: true,
                                full_name: true,
                                avatar_url: true,
                            },
                        },
                    },
                },
                post_likes: {
                    where: {
                        user_id: currentUserId,
                    },
                    select: {
                        user_id: true,
                    },
                },
            },
            orderBy: { created_at: "desc" },
        });

        // Transform posts to include computed fields
        const transformedPosts = posts.map((post) => ({
            ...post,
            group_id: post.group_id,
            author_id: post.users.id,
            author_name: post.users.full_name,
            author_avatar: post.users.avatar_url,
            group_name: post.community_groups?.name || null,
            likes_count: post._count.post_likes,
            comments_count: post._count.post_comments,
            is_liked_by_me: post.post_likes.length > 0,
            recent_comments: post.post_comments.map((comment) => ({
                id: comment.id,
                content: comment.content,
                created_at: comment.created_at,
                author_id: comment.users.id,
                author_name: comment.users.full_name,
                author_avatar: comment.users.avatar_url,
            })),
            post_likes: undefined,
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
            where: { id: postId },
        });

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        // Check if like exists
        const existingLike = await prisma.post_likes.findUnique({
            where: {
                post_id_user_id: {
                    post_id: postId,
                    user_id: userId,
                },
            },
        });

        if (existingLike) {
            // Unlike: delete the like
            await prisma.post_likes.delete({
                where: {
                    post_id_user_id: {
                        post_id: postId,
                        user_id: userId,
                    },
                },
            });
            return res
                .status(200)
                .json({ message: "Post unliked", liked: false });
        } else {
            // Like: create new like
            await prisma.post_likes.create({
                data: {
                    post_id: postId,
                    user_id: userId,
                },
            });

            // Notify post author (skip self-like)
            if (post.author_id !== userId) {
                try {
                    const liker = await prisma.users.findUnique({
                        where: { id: userId },
                        select: { full_name: true },
                    });
                    const io = req.app.get("io");
                    sendNotification({
                        userId: post.author_id,
                        message: `${
                            liker?.full_name || "Someone"
                        } liked your post.`,
                        type: "community_activity",
                        io,
                    }).catch((err) =>
                        logger.error("Error sending like notification:", err)
                    );
                } catch (_) {}
            }

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
            return res
                .status(400)
                .json({ error: "Comment content is required" });
        }

        // Check if post exists
        const post = await prisma.community_posts.findUnique({
            where: { id: postId },
        });

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const comment = await prisma.post_comments.create({
            data: {
                post_id: postId,
                author_id: req.user.id,
                content,
            },
            include: {
                users: {
                    select: {
                        id: true,
                        full_name: true,
                        avatar_url: true,
                    },
                },
            },
        });

        // Notify post author about the comment (skip self-comment)
        if (post.author_id !== req.user.id) {
            const io = req.app.get("io");
            sendNotification({
                userId: post.author_id,
                message: `${
                    comment.users.full_name
                } commented on your post: "${content.substring(0, 80)}${
                    content.length > 80 ? "..." : ""
                }".`,
                type: "community_activity",
                io,
            }).catch((err) =>
                logger.error("Error sending comment notification:", err)
            );
        }

        res.status(201).json({
            message: "Comment added successfully",
            comment: {
                ...comment,
                author_name: comment.users.full_name,
                author_avatar: comment.users.avatar_url,
            },
        });
    } catch (err) {
        logger.error("Error adding comment:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// GET /api/community/posts/:id/comments - Get all comments for a post
export const getPostComments = async (req, res) => {
    try {
        const postId = parseInt(req.params.id);

        const post = await prisma.community_posts.findUnique({
            where: { id: postId },
        });

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const comments = await prisma.post_comments.findMany({
            where: { post_id: postId },
            orderBy: { created_at: "asc" },
            include: {
                users: {
                    select: {
                        id: true,
                        full_name: true,
                        avatar_url: true,
                    },
                },
            },
        });

        const result = comments.map((comment) => ({
            id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            author_id: comment.users.id,
            author_name: comment.users.full_name,
            author_avatar: comment.users.avatar_url,
        }));

        res.status(200).json({ post_id: postId, comments: result, total: result.length });
    } catch (err) {
        logger.error("Error fetching post comments:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// GET /api/community/posts/:id/likes - Get all likes for a post
export const getPostLikes = async (req, res) => {
    try {
        const postId = parseInt(req.params.id);

        const post = await prisma.community_posts.findUnique({
            where: { id: postId },
        });

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const likes = await prisma.post_likes.findMany({
            where: { post_id: postId },
            include: {
                users: {
                    select: {
                        id: true,
                        full_name: true,
                        avatar_url: true,
                    },
                },
            },
        });

        const result = likes.map((like) => ({
            user_id: like.users.id,
            full_name: like.users.full_name,
            avatar_url: like.users.avatar_url,
        }));

        res.status(200).json({ post_id: postId, likes: result, total: result.length });
    } catch (err) {
        logger.error("Error fetching post likes:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// POST /api/community/groups - Create a new group
export const createGroup = async (req, res) => {
    try {
        const { name, description, avatar_url } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Group name is required" });
        }

        // Check if group with same name already exists
        const existingGroup = await prisma.community_groups.findFirst({
            where: { name },
        });

        if (existingGroup) {
            return res
                .status(400)
                .json({ error: "A group with this name already exists" });
        }

        // Create the group
        const group = await prisma.community_groups.create({
            data: {
                name,
                description: description || null,
                avatar_url: avatar_url || null,
            },
            include: {
                _count: {
                    select: { group_members: true },
                },
            },
        });

        // Automatically add the creator as a member
        await prisma.group_members.create({
            data: {
                group_id: group.id,
                user_id: req.user.id,
            },
        });

        res.status(201).json({
            message: "Group created successfully",
            group: {
                ...group,
                members_count: 1, // Creator is the first member
            },
        });
    } catch (err) {
        logger.error("Error creating group:", err);
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
            select: { group_id: true },
        });

        const joinedGroupIds = joinedGroups.map((g) => g.group_id);

        // Get groups the user hasn't joined
        const suggestedGroups = await prisma.community_groups.findMany({
            where: {
                id: {
                    notIn: joinedGroupIds,
                },
            },
            include: {
                _count: {
                    select: { group_members: true },
                },
            },
            orderBy: { created_at: "desc" },
        });

        const transformedGroups = suggestedGroups.map((group) => ({
            ...group,
            members_count: group._count.group_members,
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

        const generalGroup = await ensureUserInGeneralGroup(userId);

        // Check if group exists
        const group = await prisma.community_groups.findUnique({
            where: { id: groupId },
        });

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        // Check if already a member
        const existingMembership = await prisma.group_members.findUnique({
            where: {
                group_id_user_id: {
                    group_id: groupId,
                    user_id: userId,
                },
            },
        });

        if (existingMembership) {
            if (groupId === generalGroup.id) {
                return res.status(400).json({
                    error: "You cannot leave the General group",
                });
            }

            // Unjoin: delete the membership
            await prisma.group_members.delete({
                where: {
                    group_id_user_id: {
                        group_id: groupId,
                        user_id: userId,
                    },
                },
            });
            return res
                .status(200)
                .json({ message: "Successfully left the group", joined: false });
        } else {
            // Join: create new membership
            await prisma.group_members.create({
                data: {
                    group_id: groupId,
                    user_id: userId,
                },
            });
            return res
                .status(200)
                .json({ message: "Successfully joined the group", joined: true });
        }
    } catch (err) {
        logger.error("Error toggling group membership:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// GET /api/community/events - Fetch all upcoming events
export const getUpcomingEvents = async (req, res) => {
    try {
        const events = await prisma.events.findMany({
            orderBy: { event_date: "asc" },
        });

        res.status(200).json({ events });
    } catch (err) {
        logger.error("Error fetching events:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// POST /api/community/events - Create a new event
export const createEvent = async (req, res) => {
    try {
        const {
            title,
            event_date,
            time,
            location,
            img_url,
            link,
            description,
        } = req.body;

        if (!title || !event_date) {
            return res
                .status(400)
                .json({ error: "Title and event_date are required" });
        }

        const event = await prisma.events.create({
            data: {
                title,
                event_date,
                time: time || null,
                location: location || null,
                img_url: img_url || null,
                link: link || null,
                description: description || null,
            },
        });

        res.status(201).json({ message: "Event created successfully", event });
    } catch (err) {
        logger.error("Error creating event:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// PATCH /api/community/events/:id - Update an event
export const updateEvent = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        const {
            title,
            event_date,
            time,
            location,
            img_url,
            link,
            description,
        } = req.body;

        const event = await prisma.events.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        const updated = await prisma.events.update({
            where: { id: eventId },
            data: {
                ...(title && { title }),
                ...(event_date && { event_date }),
                ...(time !== undefined && { time }),
                ...(location !== undefined && { location }),
                ...(img_url !== undefined && { img_url }),
                ...(link !== undefined && { link }),
                ...(description !== undefined && { description }),
            },
        });

        res.status(200).json({
            message: "Event updated successfully",
            event: updated,
        });
    } catch (err) {
        logger.error("Error updating event:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// DELETE /api/community/events/:id - Delete an event
export const deleteEvent = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);

        const event = await prisma.events.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        await prisma.events.delete({ where: { id: eventId } });
        res.status(200).json({ message: "Event deleted successfully" });
    } catch (err) {
        logger.error("Error deleting event:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// PATCH /api/community/posts/:id - Update a post
export const updatePost = async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const userId = req.user.id;
        const { content, image_url } = req.body;

        const post = await prisma.community_posts.findUnique({
            where: { id: postId },
        });
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const generalGroup = await getOrCreateGeneralGroup();
        if (
            post.group_id === generalGroup.id &&
            !["admin", "super_admin"].includes(req.user.role)
        ) {
            return res.status(403).json({
                error: "Only admins and super admins can edit posts in the General group",
            });
        }

        if (
            post.group_id !== generalGroup.id &&
            post.author_id !== userId
        ) {
            return res
                .status(403)
                .json({ error: "You can only edit your own posts" });
        }

        const updated = await prisma.community_posts.update({
            where: { id: postId },
            data: {
                ...(content && { content }),
                ...(image_url !== undefined && { image_url }),
            },
            include: {
                users: {
                    select: { id: true, full_name: true, avatar_url: true },
                },
                community_groups: { select: { id: true, name: true } },
            },
        });

        res.status(200).json({
            message: "Post updated successfully",
            post: updated,
        });
    } catch (err) {
        logger.error("Error updating post:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// DELETE /api/community/posts/:id - Delete a post
export const deletePost = async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const userId = req.user.id;
        const userRole = req.user.role;

        const post = await prisma.community_posts.findUnique({
            where: { id: postId },
        });
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const isAdmin = ["admin", "super_admin"].includes(userRole);
        if (post.author_id !== userId && !isAdmin) {
            return res
                .status(403)
                .json({ error: "You can only delete your own posts" });
        }

        const generalGroup = await getOrCreateGeneralGroup();
        if (
            post.group_id === generalGroup.id &&
            !["admin", "super_admin"].includes(userRole)
        ) {
            return res.status(403).json({
                error: "Only admins and super admins can delete posts in the General group",
            });
        }

        await prisma.community_posts.delete({ where: { id: postId } });
        res.status(200).json({ message: "Post deleted successfully" });
    } catch (err) {
        logger.error("Error deleting post:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// PATCH /api/community/groups/:id - Update a group
export const updateGroup = async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        const { name, description, avatar_url } = req.body;

        const group = await prisma.community_groups.findUnique({
            where: { id: groupId },
        });
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        if (name) {
            const nameConflict = await prisma.community_groups.findFirst({
                where: { name, id: { not: groupId } },
            });
            if (nameConflict) {
                return res
                    .status(400)
                    .json({ error: "A group with this name already exists" });
            }
        }

        const updated = await prisma.community_groups.update({
            where: { id: groupId },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(avatar_url !== undefined && { avatar_url }),
            },
            include: { _count: { select: { group_members: true } } },
        });

        res.status(200).json({
            message: "Group updated successfully",
            group: { ...updated, members_count: updated._count.group_members },
        });
    } catch (err) {
        logger.error("Error updating group:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// DELETE /api/community/groups/:id - Delete a group
export const deleteGroup = async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);

        const group = await prisma.community_groups.findUnique({
            where: { id: groupId },
        });
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        await prisma.community_groups.delete({ where: { id: groupId } });
        res.status(200).json({ message: "Group deleted successfully" });
    } catch (err) {
        logger.error("Error deleting group:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// GET /api/community/groups/my - Get groups the current user has joined
export const getMyGroups = async (req, res) => {
    try {
        const userId = req.user.id;

        await ensureUserInGeneralGroup(userId);

        const memberships = await prisma.group_members.findMany({
            where: { user_id: userId },
            include: {
                community_groups: {
                    include: {
                        _count: { select: { group_members: true } },
                    },
                },
            },
            orderBy: { joined_at: "desc" },
        });

        const groups = memberships.map((m) => ({
            ...m.community_groups,
            members_count: m.community_groups._count.group_members,
            joined_at: m.joined_at,
        }));

        res.status(200).json({ groups });
    } catch (err) {
        logger.error("Error fetching user groups:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// GET /api/community/posts/user/:userId - Get all posts by a specific user
export const getUserPosts = async (req, res) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const currentUserId = req.user.id;

        await ensureUserInGeneralGroup(currentUserId);
        const joinedGroupIds = await getJoinedGroupIds(currentUserId);

        // Check if the user exists
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: {
                id: true,
                full_name: true,
                avatar_url: true,
                role: true,
            },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Fetch posts by this user
        const posts = await prisma.community_posts.findMany({
            where: {
                author_id: userId,
                group_id: { in: joinedGroupIds },
            },
            skip,
            take: limit,
            include: {
                users: {
                    select: {
                        id: true,
                        full_name: true,
                        avatar_url: true,
                    },
                },
                community_groups: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        post_likes: true,
                        post_comments: true,
                    },
                },
                post_comments: {
                    take: 3,
                    orderBy: { created_at: "desc" },
                    include: {
                        users: {
                            select: {
                                id: true,
                                full_name: true,
                                avatar_url: true,
                            },
                        },
                    },
                },
                post_likes: {
                    where: {
                        user_id: currentUserId,
                    },
                    select: {
                        user_id: true,
                    },
                },
            },
            orderBy: { created_at: "desc" },
        });

        // Get total count for pagination
        const totalPosts = await prisma.community_posts.count({
            where: {
                author_id: userId,
                group_id: { in: joinedGroupIds },
            },
        });

        // Transform posts to include computed fields
        const transformedPosts = posts.map((post) => ({
            ...post,
            group_id: post.group_id,
            author_name: post.users.full_name,
            author_avatar: post.users.avatar_url,
            group_name: post.community_groups?.name || null,
            likes_count: post._count.post_likes,
            comments_count: post._count.post_comments,
            is_liked_by_me: post.post_likes.length > 0,
            recent_comments: post.post_comments.map((comment) => ({
                id: comment.id,
                content: comment.content,
                created_at: comment.created_at,
                author_name: comment.users.full_name,
                author_avatar: comment.users.avatar_url,
            })),
            post_likes: undefined,
        }));

        res.status(200).json({
            user: {
                id: user.id,
                full_name: user.full_name,
                avatar_url: user.avatar_url,
                role: user.role,
            },
            posts: transformedPosts,
            pagination: {
                page,
                limit,
                total: totalPosts,
                totalPages: Math.ceil(totalPosts / limit),
            },
        });
    } catch (err) {
        logger.error("Error fetching user posts:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// GET /api/community/groups/:id/posts - Get posts for a specific group
export const getGroupPosts = async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const currentUserId = req.user.id;

        await ensureUserInGeneralGroup(currentUserId);

        const group = await prisma.community_groups.findUnique({
            where: { id: groupId },
            select: { id: true, name: true },
        });

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        const isMember = await isGroupMember(groupId, currentUserId);
        if (!isMember) {
            return res.status(403).json({
                error: "You must join this group to view its posts",
            });
        }

        const posts = await prisma.community_posts.findMany({
            where: { group_id: groupId },
            skip,
            take: limit,
            include: {
                users: {
                    select: {
                        id: true,
                        full_name: true,
                        avatar_url: true,
                    },
                },
                community_groups: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        post_likes: true,
                        post_comments: true,
                    },
                },
                post_comments: {
                    take: 3,
                    orderBy: { created_at: "desc" },
                    include: {
                        users: {
                            select: {
                                id: true,
                                full_name: true,
                                avatar_url: true,
                            },
                        },
                    },
                },
                post_likes: {
                    where: {
                        user_id: currentUserId,
                    },
                    select: {
                        user_id: true,
                    },
                },
            },
            orderBy: { created_at: "desc" },
        });

        const totalPosts = await prisma.community_posts.count({
            where: { group_id: groupId },
        });

        const transformedPosts = posts.map((post) => ({
            ...post,
            group_id: post.group_id,
            author_name: post.users.full_name,
            author_avatar: post.users.avatar_url,
            group_name: post.community_groups?.name || null,
            likes_count: post._count.post_likes,
            comments_count: post._count.post_comments,
            is_liked_by_me: post.post_likes.length > 0,
            recent_comments: post.post_comments.map((comment) => ({
                id: comment.id,
                content: comment.content,
                created_at: comment.created_at,
                author_id: comment.users.id,
                author_name: comment.users.full_name,
                author_avatar: comment.users.avatar_url,
            })),
            post_likes: undefined,
        }));

        res.status(200).json({
            group,
            posts: transformedPosts,
            pagination: {
                page,
                limit,
                total: totalPosts,
                totalPages: Math.ceil(totalPosts / limit),
            },
        });
    } catch (err) {
        logger.error("Error fetching group posts:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};
