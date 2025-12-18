#!/usr/bin/env node
import bcrypt from "bcryptjs";
import { prisma } from "../src/config/connection.js";
import { config } from "dotenv";
import logger from "../src/utils/logger.js";

config();
async function main() {
    logger.info(
        "Seeding database (destructive for many tables)  make sure this is a dev DB..."
    );

    // Delete child records first to avoid FK constraint errors
    const deleteOrder = [
        "task_submissions",
        "tasks",
        "enrollments",
        "tutorials_labs",
        "lectures",
        "course_materials",
        "files",
        "course_offerings",
        "post_likes",
        "community_posts",
        "notifications",
        "announcements",
        "student_profiles",
        "user_permissions",
        "users",
        "courses",
        "departments",
    ];

    // Where possible use prisma.<model>.deleteMany()
    try {
        await prisma.task_submissions.deleteMany();
    } catch {}
    try {
        await prisma.tasks.deleteMany();
    } catch {}
    try {
        await prisma.enrollments.deleteMany();
    } catch {}
    try {
        await prisma.tutorials_labs.deleteMany();
    } catch {}
    try {
        await prisma.lectures.deleteMany();
    } catch {}
    try {
        await prisma.course_materials.deleteMany();
    } catch {}
    try {
        await prisma.files.deleteMany();
    } catch {}
    try {
        await prisma.course_offerings.deleteMany();
    } catch {}
    try {
        await prisma.post_likes.deleteMany();
    } catch {}
    try {
        await prisma.community_posts.deleteMany();
    } catch {}
    try {
        await prisma.notifications.deleteMany();
    } catch {}
    try {
        await prisma.announcements.deleteMany();
    } catch {}
    try {
        await prisma.student_profiles.deleteMany();
    } catch {}
    try {
        await prisma.user_permissions.deleteMany();
    } catch {}
    try {
        await prisma.enrollments.deleteMany();
    } catch {}
    try {
        await prisma.users.deleteMany();
    } catch {}
    try {
        await prisma.courses.deleteMany();
    } catch {}
    try {
        await prisma.departments.deleteMany();
    } catch {}

    const passwordPlain = "Passw0rd!";
    const hashed = await bcrypt.hash(passwordPlain, 10);

    // Departments
    const csDept = await prisma.departments.create({
        data: { name: "Computer Science" },
    });
    const mathDept = await prisma.departments.create({
        data: { name: "Mathematics" },
    });

    // Users
    const superAdmin = await prisma.users.create({
        data: {
            full_name: "Magda Madbouly",
            email: "magda_madbouly@example.com",
            password_hash: bcrypt.hashSync("123456789", 10),
            role: "super_admin",
            phone: "+201234567890",
            avatar_url: null,
            national_id: "20907192200123", // integer or null
            address: "123 Admin St, Cairo, Egypt",
        },
    });

    const admin = await prisma.users.create({
        data: {
            full_name: "Admin User",
            email: "admin@example.com",
            password_hash: hashed,
            role: "admin",
        },
    });

    const doctor1 = await prisma.users.create({
        data: {
            full_name: "Dr. Alice",
            email: "doctor.alice@example.com",
            password_hash: hashed,
            role: "doctor",
        },
    });

    const doctor2 = await prisma.users.create({
        data: {
            full_name: "Dr. Bob",
            email: "doctor.bob@example.com",
            password_hash: hashed,
            role: "doctor",
        },
    });

    const ta = await prisma.users.create({
        data: {
            full_name: "TA John",
            email: "ta.john@example.com",
            password_hash: hashed,
            role: "teaching_assistant",
        },
    });

    // Create several students
    const students = [];
    for (let i = 1; i <= 10; i++) {
        const u = await prisma.users.create({
            data: {
                full_name: `Student ${i}`,
                email: `student${i}@example.com`,
                password_hash: hashed,
                role: "student",
            },
        });
        students.push(u);
        await prisma.student_profiles.create({
            data: {
                user_id: u.id,
                student_id: `S2025${100 + i}`,
                year_level: Math.ceil(Math.random() * 4),
                cgpa: +(2 + Math.random() * 2).toFixed(2),
                department_id: csDept.department_id,
            },
        });
    }

    // Courses (use codes as ids)
    const cs101 = await prisma.courses.create({
        data: {
            code: "CS101",
            name: "Intro to Computer Science",
            credits: 3,
            department_id: csDept.department_id,
        },
    });
    const cs201 = await prisma.courses.create({
        data: {
            code: "CS201",
            name: "Data Structures",
            credits: 4,
            department_id: csDept.department_id,
        },
    });
    const math101 = await prisma.courses.create({
        data: {
            code: "MATH101",
            name: "Calculus I",
            credits: 4,
            department_id: mathDept.department_id,
        },
    });

    // Course offerings
    const offer1 = await prisma.course_offerings.create({
        data: { course_code: cs101.code, semester: "Fall 2025" },
    });
    const offer2 = await prisma.course_offerings.create({
        data: { course_code: cs201.code, semester: "Fall 2025" },
    });
    const offer3 = await prisma.course_offerings.create({
        data: { course_code: math101.code, semester: "Fall 2025" },
    });

    // Lectures
    const lecture1 = await prisma.lectures.create({
        data: {
            offering_id: offer1.offering_id,
            instructor_id: doctor1.id,
            capacity: 100,
            day_of_week: "Mon",
            start_time: new Date("1970-01-01T09:00:00Z"),
            end_time: new Date("1970-01-01T10:30:00Z"),
            location: "Hall A",
            group: "A",
        },
    });
    const lecture2 = await prisma.lectures.create({
        data: {
            offering_id: offer2.offering_id,
            instructor_id: doctor2.id,
            capacity: 80,
            day_of_week: "Tue",
            start_time: new Date("1970-01-01T11:00:00Z"),
            end_time: new Date("1970-01-01T12:30:00Z"),
            location: "Hall B",
            group: "A",
        },
    });

    // Tutorials / labs
    const tut1 = await prisma.tutorials_labs.create({
        data: {
            offering_id: offer1.offering_id,
            ta_id: ta.id,
            type: "tutorial",
            capacity: 30,
            day_of_week: "Wed",
            start_time: new Date("1970-01-01T13:00:00Z"),
            end_time: new Date("1970-01-01T14:00:00Z"),
            location: "Lab 1",
            group: "T1",
        },
    });

    // Enroll a subset of students into lecture1 + tut1
    for (let i = 0; i < 8; i++) {
        const s = students[i];
        await prisma.enrollments.create({
            data: {
                student_user_id: s.id,
                lecture_id: lecture1.lecture_id,
                tutorial_lab_id: tut1.tutorial_lab_id,
                status: "enrolled",
            },
        });
    }

    // Tasks for lecture1
    const task1 = await prisma.tasks.create({
        data: {
            lecture_id: lecture1.lecture_id,
            title: "Assignment 1",
            description: "Solve exercises 1-5",
            due_date: new Date(),
        },
    });

    // Task submissions from first 4 students
    for (let i = 0; i < 4; i++) {
        const s = students[i];
        await prisma.task_submissions.create({
            data: {
                task_id: task1.id,
                student_id: s.id,
                submission_content: "My answers...",
                grade: Math.round((50 + Math.random() * 50) * 100) / 100,
            },
        });
    }

    // Files and course materials
    const file1 = await prisma.files.create({
        data: {
            file_name: "syllabus.pdf",
            file_path: "/files/syllabus_cs101.pdf",
            media_type: "application/pdf",
            size_bytes: 12345,
            uploaded_by_user_id: doctor1.id,
        },
    });
    await prisma.course_materials.create({
        data: {
            lecture_id: lecture1.lecture_id,
            title: "Syllabus",
            url: null,
            file_id: file1.file_id,
        },
    });

    // Announcements
    await prisma.announcements.create({
        data: {
            author_id: admin.id,
            title: "Welcome",
            content: "Welcome to the new semester",
            audience: "All",
        },
    });

    logger.info("Seeding finished. Created many demo records.");
    logger.info("Common password for seeded users:", passwordPlain);
}

main()
    .catch((e) => {
        logger.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
