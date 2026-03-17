import { config } from "dotenv";
import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";

config();

const GENERAL_GROUP_NAME = "General";

async function main() {
    const generalGroupExisting = await prisma.community_groups.findFirst({
        where: { name: GENERAL_GROUP_NAME },
        orderBy: { id: "asc" },
    });

    const generalGroup =
        generalGroupExisting ||
        (await prisma.community_groups.create({
            data: {
                name: GENERAL_GROUP_NAME,
                description: "Default group for all users",
            },
        }));

    const users = await prisma.users.findMany({
        select: { id: true },
    });

    const existingMembers = await prisma.group_members.findMany({
        where: { group_id: generalGroup.id },
        select: { user_id: true },
    });

    const existingMemberIds = new Set(existingMembers.map((member) => member.user_id));
    const usersToAdd = users
        .map((user) => user.id)
        .filter((userId) => !existingMemberIds.has(userId));

    if (usersToAdd.length > 0) {
        await prisma.group_members.createMany({
            data: usersToAdd.map((userId) => ({
                group_id: generalGroup.id,
                user_id: userId,
            })),
            skipDuplicates: true,
        });
    }

    const updatedNullGroupPosts = await prisma.community_posts.updateMany({
        where: { group_id: null },
        data: { group_id: generalGroup.id },
    });

    const totalMembers = await prisma.group_members.count({
        where: { group_id: generalGroup.id },
    });

    logger.info("General group backfill completed", {
        generalGroupId: generalGroup.id,
        addedMembers: usersToAdd.length,
        totalMembers,
        migratedPostsFromNullGroupId: updatedNullGroupPosts.count,
    });

    console.log(`GENERAL_GROUP_ID=${generalGroup.id}`);
    await prisma.$disconnect();
}

main().catch(async (err) => {
    logger.error("Failed to backfill General group:", err);
    await prisma.$disconnect();
    process.exit(1);
});
