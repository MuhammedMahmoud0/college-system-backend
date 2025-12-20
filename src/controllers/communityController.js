import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";

// GET /api/community/posts
export const getCommunityFeed = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const posts = await prisma.community_posts.findMany({
            skip,
            take: limit,
            include: {
                users: { // Matches the relation in prisma file
                    select: {
                        id: true,
                        full_name: true,
                        avatar_url: true,
                    }
                },
                _count: {
                    select: { post_likes: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        res.status(200).json({ posts });
    } catch (err) {
        logger.error("Error fetching community feed:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// POST /api/community/posts
export const createPost = async (req, res) => {
    try {
        const { content, image_url } = req.body;
        
        const post = await prisma.community_posts.create({
            data: {
                content,
                image_url: image_url || null,
                author_id: req.user.id, // Assumes auth middleware provides user id
            }
        });

        res.status(201).json({ message: "Post created successfully", post });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/community/posts/:postId/like
export const likePost = async (req, res) => {
    try {
        const { postId } = req.params;
        
        const like = await prisma.post_likes.create({
            data: {
                post_id: parseInt(postId),
                user_id: req.user.id
            }
        });
        res.status(200).json({ message: "Post liked successfully" });
    } catch (err) {
        // Handle unique constraint if user already liked the post
        res.status(400).json({ error: "Unable to like post (already liked or invalid ID)" });
    }
};


// GET /api/community/events
export const getUpcomingEvents = async (req, res) => {
    try {
        // Fetch events from the database
        const events = await prisma.events.findMany({
            orderBy: {
                event_date: 'asc' // Show soonest events first
            },
            select: {
                id: true,
                title: true,
                description: true,
                event_date: true,
                time: true,
                location: true,
                img_url: true, // Mapped to 'image' in documentation
                link: true
            }
        });

        // Format the response to match the PDF documentation exactly
        const formattedEvents = events.map(event => ({
            id: event.id.toString(),
            title: event.title,
            description: event.description || "",
            date: event.event_date,
            time: event.time || "",
            location: event.location || "",
            category: "General", // Default since not in schema
            image: event.img_url || "",
            attendees: 0 // Default since not in schema
        }));

        res.status(200).json({ events: formattedEvents });
    } catch (err) {
        logger.error("Error fetching events:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};