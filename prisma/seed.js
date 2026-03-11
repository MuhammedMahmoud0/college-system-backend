/**
 * prisma/seed.js
 *
 * Seeds the database with data reflecting the current live state.
 *
 * Known passwords
 * ──────────────────────────────────────────────────────────────────────
 * Magda Madbouly (super_admin)        →  123456789
 * Student 1  (student1@example.com)   →  30405132600822  (national ID)
 * Muhammed Mahmoud                    →  30447812611119  (national ID)
 * Ahmed Qabary                        →  30312110201318  (national ID)
 * Everyone else                       →  Passw0rd!
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool    = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma  = new PrismaClient({ adapter });

// ── Fixed IDs ─────────────────────────────────────────────────────────────────
const CS_DEPT_ID   = '063e1341-2ace-4cc1-a03f-a61c7535fba8';
const MATH_DEPT_ID = 'f4165602-0e48-41e6-9362-4c7768d3ab10';

// users
const MAGDA_ID         = 'c86640c2-def2-4c6f-8b60-8ac2ef55e091';
const ADMIN_ID         = 'c68e74b3-7a96-424b-b97b-0ed4f8b15b1f';
const DR_ALICE_ID      = '55a5ad2a-06e0-495f-abf5-f72a00e0c78a';
const DR_BOB_ID        = '83b69f41-0b77-4acf-a84a-ad6518bc4e67';
const TA_JOHN_ID       = '08a62103-62ea-4c37-8b75-58991e6a6f0c';
const STU1_ID          = '9c60d94a-99e3-44e7-86df-074833cab9e8';
const STU2_ID          = 'e22abc55-4956-4050-baec-154fc02bd508';
const STU3_ID          = '5742bf70-e32a-41cc-89f4-736fff0da79e';
const STU4_ID          = '3b1ce93f-f09c-4c03-8040-1b34a2e6ad13';
const STU5_ID          = 'e5202808-9149-4799-b666-27e2e358c58c';
const STU6_ID          = '28af57a9-5df9-4a1f-ab46-3b1b66b8319c';
const STU7_ID          = '629bbaf0-edf6-43b7-aacf-c528b1e7fa39';
const STU8_ID          = '79fe3b0d-3e8b-4467-a71a-682e21904279';
const STU9_ID          = 'ed55c420-42b5-4103-ae89-6ecd87135077';
const STU10_ID         = '5fbbbdc9-ac4e-4cd7-85b3-2704ad2ea7ba';
const JOHN_SMITH_ID    = '0ca7bae8-b231-4b16-a641-a9bff5975709';
const MUHAMMED_ID      = '8b7809f6-609e-459f-81de-dec4ac30433a';
const AHMED_KABBARY_ID = '96fe4daa-b598-42bd-a50d-ccbdb693858c';
const TEST_STUDENT_ID  = 'f9338e22-6221-4c2b-bd47-3c423359fd87';
const JOHN_DOE_ID      = 'f7e1aeaa-97a8-406c-aea1-bfe0e5d0dbd9';
const JANE_SMITH_ID    = '932aa420-6769-43ff-833f-e0fe2ab66e33';
const CHARLIE_ID       = '7a24bca9-be15-45c0-afcf-0a9cc1a4633d';
const DR_ALICE_J_ID    = 'db6f1fa7-47f3-4511-917c-e8f28294b980';
const PROF_BOB_ID      = '63487637-4a00-47ba-ba31-0b16f0ec4734';
const DIANA_ID         = '85ab8582-4f48-4e1f-a380-bdf412a22e84';
const AHMED_HASSAN_ID  = '6eef4c08-90ec-42cd-8302-6bd133777c6e';
const SARA_ID          = '4f42ac1a-dd74-47e8-ad14-e49bf34f008a';
const OMAR_ID          = '2b70682e-1292-4352-bcbd-99b4a4431af7';
const FATMA_ID         = '2f55184d-bea4-4540-86fd-dd25f9ecee2c';
const DR_MAHMOUD_ID    = '2b6258b2-360e-4a9d-bfbb-aa6c8b073da4';
const NOHA_ID          = '53f277fa-323a-4d1c-afa7-577a7c1ac847';
const YOUSSEF_ID       = '994c6c3a-dae2-4c03-b122-d7bfa7227ab8';
const MONA_ID          = '4a5c326d-ba47-4561-9c0d-3416812a3391';

// files
const FILE_SDA_ID   = 'b1363c9d-c07a-42c6-982b-4f366c532d9f';
const FILE_LEC01_ID = 'dcc97b6d-5d37-4490-a74f-74300b6293b7';

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱  Seeding database…');

  // =========================================================================
  // 1. CLEANUP  (reverse FK order)
  // =========================================================================
  console.log('🗑️   Cleaning existing data…');
  await prisma.task_submissions.deleteMany();
  await prisma.post_likes.deleteMany();
  await prisma.post_comments.deleteMany();
  await prisma.group_members.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.grade_distributions.deleteMany();
  await prisma.course_materials.deleteMany();
  await prisma.enrollments.deleteMany();
  await prisma.notifications.deleteMany();
  await prisma.notification_preferences.deleteMany();
  await prisma.announcements.deleteMany();
  await prisma.academic_calendar.deleteMany();
  await prisma.tasks.deleteMany();
  await prisma.lectures.deleteMany();
  await prisma.tutorials_labs.deleteMany();
  await prisma.community_posts.deleteMany();
  await prisma.community_groups.deleteMany();
  await prisma.exams.deleteMany();
  await prisma.course_offerings.deleteMany();
  await prisma.files.deleteMany();
  await prisma.course_prerequisites.deleteMany();
  await prisma.courses.deleteMany();
  await prisma.student_profiles.deleteMany();
  await prisma.financials.deleteMany();
  await prisma.departments.deleteMany();
  await prisma.users.deleteMany();

  // =========================================================================
  // 2. HASH PASSWORDS
  // =========================================================================
  const SALT      = 10;
  const defPass   = await bcrypt.hash('Passw0rd!', SALT);
  const magdaPass = await bcrypt.hash('123456789', SALT);
  const stu1Pass  = await bcrypt.hash('30405132600822', SALT);
  const muhamPass = await bcrypt.hash('30447812611119', SALT);
  const ahmedPass = await bcrypt.hash('30312110201318', SALT);

  // =========================================================================
  // 3. DEPARTMENTS
  // =========================================================================
  console.log('🏫  Creating departments…');
  await prisma.departments.createMany({
    data: [
      { department_id: CS_DEPT_ID,   name: 'Computer Science' },
      { department_id: MATH_DEPT_ID, name: 'Mathematics' },
    ],
  });

  // =========================================================================
  // 4. USERS
  // =========================================================================
  console.log('👥  Creating users…');
  await prisma.users.createMany({
    data: [
      // ── super_admin ──────────────────────────────────────────────────────
      {
        id: MAGDA_ID, full_name: 'Magda Madbouly', email: 'magda_madbouly@example.com',
        password_hash: magdaPass, role: 'super_admin',
        phone: '+201234567890', address: '123 Admin St, Cairo, Egypt', national_id: '20907192200123',
      },
      // ── admins ──────────────────────────────────────────────────────────
      { id: ADMIN_ID, full_name: 'Admin User',   email: 'admin@example.com',        password_hash: defPass, role: 'admin' },
      { id: DIANA_ID, full_name: 'Diana Prince', email: 'diana.prince@college.edu', password_hash: defPass, role: 'admin' },
      { id: MONA_ID,  full_name: 'Mona Farid',   email: 'mona.farid@college.edu',   password_hash: defPass, role: 'admin' },
      // ── doctors ─────────────────────────────────────────────────────────
      { id: DR_ALICE_ID,   full_name: 'Dr. Alice',         email: 'doctor.alice@example.com',  password_hash: defPass, role: 'doctor' },
      { id: DR_BOB_ID,     full_name: 'Dr. Bob',           email: 'doctor.bob@example.com',    password_hash: defPass, role: 'doctor' },
      { id: DR_ALICE_J_ID, full_name: 'Dr. Alice Johnson', email: 'alice.johnson@college.edu', password_hash: defPass, role: 'doctor' },
      { id: DR_MAHMOUD_ID, full_name: 'Dr. Mahmoud Saleh', email: 'mahmoud.saleh@college.edu', password_hash: defPass, role: 'doctor' },
      // ── teaching assistants ─────────────────────────────────────────────
      { id: TA_JOHN_ID,  full_name: 'TA John',            email: 'ta.john@example.com',      password_hash: defPass, role: 'teaching_assistant' },
      { id: PROF_BOB_ID, full_name: 'Prof. Bob Williams', email: 'bob.williams@college.edu', password_hash: defPass, role: 'teaching_assistant' },
      { id: NOHA_ID,     full_name: 'Eng. Noha Ahmed',    email: 'noha.ahmed@college.edu',   password_hash: defPass, role: 'teaching_assistant' },
      // ── leader ──────────────────────────────────────────────────────────
      { id: YOUSSEF_ID, full_name: 'Youssef Khaled', email: 'youssef.khaled@college.edu', password_hash: defPass, role: 'leader' },
      // ── students – example.com (S2025101..S2025110) ─────────────────────
      {
        id: STU1_ID, full_name: 'Student 1', email: 'student1@example.com',
        password_hash: stu1Pass, role: 'student',
        phone: '01136564892', address: 'Alexandria - Moharram bek', national_id: '30405132600822',
      },
      { id: STU2_ID,  full_name: 'Student 2',  email: 'student2@example.com',  password_hash: defPass, role: 'student' },
      { id: STU3_ID,  full_name: 'Student 3',  email: 'student3@example.com',  password_hash: defPass, role: 'student' },
      { id: STU4_ID,  full_name: 'Student 4',  email: 'student4@example.com',  password_hash: defPass, role: 'student' },
      { id: STU5_ID,  full_name: 'Student 5',  email: 'student5@example.com',  password_hash: defPass, role: 'student' },
      { id: STU6_ID,  full_name: 'Student 6',  email: 'student6@example.com',  password_hash: defPass, role: 'student' },
      { id: STU7_ID,  full_name: 'Student 7',  email: 'student7@example.com',  password_hash: defPass, role: 'student' },
      { id: STU8_ID,  full_name: 'Student 8',  email: 'student8@example.com',  password_hash: defPass, role: 'student' },
      { id: STU9_ID,  full_name: 'Student 9',  email: 'student9@example.com',  password_hash: defPass, role: 'student' },
      { id: STU10_ID, full_name: 'Student 10', email: 'student10@example.com', password_hash: defPass, role: 'student' },
      // ── students – example.edu ──────────────────────────────────────────
      { id: JOHN_SMITH_ID, full_name: 'John Smith', email: 'john.smith@example.edu', password_hash: defPass, role: 'student' },
      {
        id: MUHAMMED_ID, full_name: 'Muhammed Mahmoud', email: 'muhammed.mahmoud@example.edu',
        password_hash: muhamPass, role: 'student',
        phone: '01125360953', address: 'Apeice 10', national_id: '30447812611119',
      },
      {
        id: AHMED_KABBARY_ID, full_name: 'Ahmed Qabary', email: 'ahmedkabary@example.edu',
        password_hash: ahmedPass, role: 'student',
        phone: '01122267427', address: 'Wardian, Alexandria', national_id: '30312110201318',
      },
      { id: TEST_STUDENT_ID, full_name: 'Test Student', email: 'teststudent@example.edu', password_hash: defPass, role: 'student' },
      // ── students – college.edu ──────────────────────────────────────────
      { id: JOHN_DOE_ID,     full_name: 'John Doe',      email: 'john.doe@college.edu',      password_hash: defPass, role: 'student' },
      { id: JANE_SMITH_ID,   full_name: 'Jane Smith',    email: 'jane.smith@college.edu',    password_hash: defPass, role: 'student' },
      { id: CHARLIE_ID,      full_name: 'Charlie Brown', email: 'charlie.brown@college.edu', password_hash: defPass, role: 'student' },
      { id: AHMED_HASSAN_ID, full_name: 'Ahmed Hassan',  email: 'ahmed.hassan@college.edu',  password_hash: defPass, role: 'student' },
      { id: SARA_ID,         full_name: 'Sara Mohamed',  email: 'sara.mohamed@college.edu',  password_hash: defPass, role: 'student' },
      { id: OMAR_ID,         full_name: 'Omar Ali',      email: 'omar.ali@college.edu',      password_hash: defPass, role: 'student' },
      { id: FATMA_ID,        full_name: 'Fatma Ibrahim', email: 'fatma.ibrahim@college.edu', password_hash: defPass, role: 'student' },
    ],
  });

  // =========================================================================
  // 5. STUDENT PROFILES
  // =========================================================================
  console.log('🎓  Creating student profiles…');
  await prisma.student_profiles.createMany({
    data: [
      // example.com – CS dept
      { user_id: STU1_ID,  student_id: 'S2025101', year_level: 2, department_id: CS_DEPT_ID },
      { user_id: STU2_ID,  student_id: 'S2025102', year_level: 4, department_id: CS_DEPT_ID },
      { user_id: STU3_ID,  student_id: 'S2025103', year_level: 4, department_id: CS_DEPT_ID },
      { user_id: STU4_ID,  student_id: 'S2025104', year_level: 2, department_id: CS_DEPT_ID },
      { user_id: STU5_ID,  student_id: 'S2025105', year_level: 3, department_id: CS_DEPT_ID },
      { user_id: STU6_ID,  student_id: 'S2025106', year_level: 4, department_id: CS_DEPT_ID },
      { user_id: STU7_ID,  student_id: 'S2025107', year_level: 3, department_id: CS_DEPT_ID },
      { user_id: STU8_ID,  student_id: 'S2025108', year_level: 1, department_id: CS_DEPT_ID },
      { user_id: STU9_ID,  student_id: 'S2025109', year_level: 3, department_id: CS_DEPT_ID },
      { user_id: STU10_ID, student_id: 'S2025110', year_level: 4, department_id: CS_DEPT_ID },
      // example.edu
      { user_id: MUHAMMED_ID,      student_id: 'S2026101', total_credits: 3 },
      { user_id: AHMED_KABBARY_ID, student_id: '1122' },
      { user_id: TEST_STUDENT_ID,  student_id: '22010100', cgpa: 3.67, total_credits: 9 },
      // college.edu
      { user_id: JOHN_DOE_ID,     student_id: '2021001' },
      { user_id: JANE_SMITH_ID,   student_id: '2021002' },
      { user_id: CHARLIE_ID,      student_id: '2021003' },
      { user_id: AHMED_HASSAN_ID, student_id: '2022001' },
      { user_id: SARA_ID,         student_id: '2022002' },
      { user_id: OMAR_ID,         student_id: '2022003' },
      { user_id: FATMA_ID,        student_id: '2022004' },
    ],
  });

  // =========================================================================
  // 6. COURSES
  // =========================================================================
  console.log('📚  Creating courses…');
  await prisma.courses.createMany({
    data: [
      { code: 'CS5050',  name: 'Intro to CS',   credits: 3, department_id: CS_DEPT_ID },
      { code: 'MATH222', name: 'MATH 2',         credits: 3, department_id: CS_DEPT_ID },
      { code: 'OOP500',  name: 'OOP',            credits: 3, department_id: CS_DEPT_ID },
      { code: 'V202',    name: 'Visualization',  credits: 3, department_id: CS_DEPT_ID },
    ],
  });

  // =========================================================================
  // 7. COURSE OFFERINGS  (individual creates to capture auto-increment IDs)
  // =========================================================================
  console.log('📅  Creating course offerings…');
  const offCS5050  = await prisma.course_offerings.create({ data: { course_code: 'CS5050',  semester: 'Fall', year: 2026 } });
  const offOOP500  = await prisma.course_offerings.create({ data: { course_code: 'OOP500',  semester: 'Fall', year: 2026 } });
  const offV202    = await prisma.course_offerings.create({ data: { course_code: 'V202',    semester: 'Fall', year: 2026 } });
  const offMATH222 = await prisma.course_offerings.create({ data: { course_code: 'MATH222', semester: 'Fall', year: 2026 } });

  // =========================================================================
  // 8. LECTURES
  // =========================================================================
  console.log('🏫  Creating lectures…');
  const lecCS5050 = await prisma.lectures.create({
    data: {
      offering_id: offCS5050.offering_id, instructor_id: DR_MAHMOUD_ID,
      capacity: 50, enrolled_count: 2, day_of_week: 'Sunday', group: '1', location: 'Room 102',
      start_time: new Date('1970-01-01T14:00:00.000Z'),
      end_time:   new Date('1970-01-01T16:00:00.000Z'),
    },
  });

  const lecOOP500 = await prisma.lectures.create({
    data: {
      offering_id: offOOP500.offering_id, instructor_id: DR_ALICE_ID,
      capacity: 50, enrolled_count: 1, day_of_week: 'Thursday', group: '1', location: 'Room 104',
      start_time: new Date('1970-01-01T08:00:00.000Z'),
      end_time:   new Date('1970-01-01T10:00:00.000Z'),
    },
  });

  const lecV202 = await prisma.lectures.create({
    data: {
      offering_id: offV202.offering_id, instructor_id: PROF_BOB_ID,
      capacity: 150, enrolled_count: 2, day_of_week: 'Thursday', group: '1', location: 'Room 105',
      start_time: new Date('1970-01-01T08:00:00.000Z'),
      end_time:   new Date('1970-01-01T10:00:00.000Z'),
    },
  });

  const lecMATH222 = await prisma.lectures.create({
    data: {
      offering_id: offMATH222.offering_id, instructor_id: DR_BOB_ID,
      capacity: 150, enrolled_count: 0, day_of_week: 'Friday', group: '1', location: 'Room 102',
      start_time: new Date('1970-01-01T11:00:00.000Z'),
      end_time:   new Date('1970-01-01T13:00:00.000Z'),
    },
  });

  // =========================================================================
  // 9. TUTORIALS / LABS
  // =========================================================================
  console.log('🔬  Creating tutorials / labs…');
  const tutCS5050 = await prisma.tutorials_labs.create({
    data: {
      offering_id: offCS5050.offering_id, ta_id: NOHA_ID,
      type: 'LAB', capacity: 50, enrolled_count: 2, day_of_week: 'Monday', group: '1', location: 'Room 102',
      start_time: new Date('1970-01-01T14:00:00.000Z'),
      end_time:   new Date('1970-01-01T16:00:00.000Z'),
    },
  });

  const tutOOP500 = await prisma.tutorials_labs.create({
    data: {
      offering_id: offOOP500.offering_id, ta_id: TA_JOHN_ID,
      type: 'LAB', capacity: 50, enrolled_count: 1, day_of_week: 'Wednesday', group: '1', location: 'Lab 212',
      start_time: new Date('1970-01-01T08:00:00.000Z'),
      end_time:   new Date('1970-01-01T10:00:00.000Z'),
    },
  });

  const tutV202_g1 = await prisma.tutorials_labs.create({
    data: {
      offering_id: offV202.offering_id, ta_id: NOHA_ID,
      type: 'LAB', capacity: 150, enrolled_count: 1, day_of_week: 'Wednesday', group: '1', location: 'Room 105',
      start_time: new Date('1970-01-01T08:00:00.000Z'),
      end_time:   new Date('1970-01-01T10:00:00.000Z'),
    },
  });

  const tutV202_g2 = await prisma.tutorials_labs.create({
    data: {
      offering_id: offV202.offering_id, ta_id: NOHA_ID,
      type: 'LAB', capacity: 150, enrolled_count: 1, day_of_week: 'Wednesday', group: '1', location: 'Room 122',
      start_time: new Date('1970-01-01T12:00:00.000Z'),
      end_time:   new Date('1970-01-01T14:00:00.000Z'),
    },
  });

  const tutMATH222 = await prisma.tutorials_labs.create({
    data: {
      offering_id: offMATH222.offering_id, ta_id: TA_JOHN_ID,
      type: 'LAB', capacity: 150, enrolled_count: 0, day_of_week: 'Saturday', group: '1', location: 'Lab 212',
      start_time: new Date('1970-01-01T10:00:00.000Z'),
      end_time:   new Date('1970-01-01T12:00:00.000Z'),
    },
  });

  // =========================================================================
  // 10. FILES  (fixed UUIDs to match Supabase Storage paths)
  // =========================================================================
  console.log('📁  Creating files…');
  await prisma.files.createMany({
    data: [
      {
        file_id: FILE_SDA_ID, file_name: 'Lec.1_SDA.pdf',
        file_path: 'materials/83b69f41-0b77-4acf-a84a-ad6518bc4e67/1772394105040.pdf',
        media_type: 'application/pdf', size_bytes: 737098,
        uploaded_by_user_id: DR_BOB_ID,
        created_at: new Date('2026-03-01T19:41:47.335Z'),
      },
      {
        file_id: FILE_LEC01_ID, file_name: 'Lec01.pdf',
        file_path: 'materials/c86640c2-def2-4c6f-8b60-8ac2ef55e091/1772652264680.pdf',
        media_type: 'application/pdf', size_bytes: 1365984,
        uploaded_by_user_id: MAGDA_ID,
        created_at: new Date('2026-03-04T19:24:26.793Z'),
      },
    ],
  });

  // =========================================================================
  // 11. ENROLLMENTS
  // =========================================================================
  console.log('📝  Creating enrollments…');
  await prisma.enrollments.createMany({
    data: [
      // Muhammed → CS5050 (enrolled)
      { student_user_id: MUHAMMED_ID, lecture_id: lecCS5050.lecture_id, tutorial_lab_id: tutCS5050.tutorial_lab_id, status: 'enrolled' },
      // Test Student → CS5050 (completed, A)
      { student_user_id: TEST_STUDENT_ID, lecture_id: lecCS5050.lecture_id, tutorial_lab_id: tutCS5050.tutorial_lab_id, mid_score: 18, work_score: 30, final_score: 46, grade: 'A', status: 'completed' },
      // Test Student → OOP500 (completed, B)
      { student_user_id: TEST_STUDENT_ID, lecture_id: lecOOP500.lecture_id, tutorial_lab_id: tutOOP500.tutorial_lab_id, mid_score: 15, work_score: 20, final_score: 40, grade: 'B', status: 'completed' },
      // Student 1 → V202 group 2 (enrolled, mid 15)
      { student_user_id: STU1_ID, lecture_id: lecV202.lecture_id, tutorial_lab_id: tutV202_g2.tutorial_lab_id, mid_score: 15, status: 'enrolled' },
      // Student 1 → CS5050 (enrolled, mid 10)
      { student_user_id: STU1_ID, lecture_id: lecCS5050.lecture_id, tutorial_lab_id: tutCS5050.tutorial_lab_id, mid_score: 10, status: 'enrolled' },
      // Test Student → V202 group 1 (enrolled)
      { student_user_id: TEST_STUDENT_ID, lecture_id: lecV202.lecture_id, tutorial_lab_id: tutV202_g1.tutorial_lab_id, status: 'enrolled' },
      // Test Student → MATH222 (completed, A)
      { student_user_id: TEST_STUDENT_ID, lecture_id: lecMATH222.lecture_id, tutorial_lab_id: tutMATH222.tutorial_lab_id, mid_score: 20, work_score: 30, final_score: 50, grade: 'A', status: 'completed' },
    ],
  });

  // =========================================================================
  // 12. COURSE MATERIALS
  // =========================================================================
  console.log('📓  Creating course materials…');
  await prisma.course_materials.createMany({
    data: [
      { lecture_id: lecMATH222.lecture_id, title: 'Lec.1_SDA.pdf',  file_id: FILE_SDA_ID },
      { lecture_id: lecCS5050.lecture_id,  title: 'Lec01.pdf',       file_id: FILE_LEC01_ID },
      { lecture_id: lecCS5050.lecture_id,  title: 'website link',     url: 'https://gs.alexu.edu.eg/FCDS/index.php' },
    ],
  });

  // =========================================================================
  // 13. ANNOUNCEMENTS
  // =========================================================================
  console.log('📢  Creating announcements…');
  await prisma.announcements.createMany({
    data: [
      { author_id: ADMIN_ID, title: 'Updated Title', content: 'Welcome to the new semester', audience: 'Faculty', publish_at: new Date('2026-01-25T12:55:43.063Z'), expire_at: null },
      { author_id: MAGDA_ID, title: 'Updated Title', content: 'Check the portal for your final exam timetable.', audience: 'Faculty', publish_at: new Date('2026-03-05T14:38:56.764Z'), expire_at: new Date('2026-04-01T00:00:00.000Z') },
      { author_id: MAGDA_ID, title: 'Final Exam Schedule Released', content: 'Check the portal for your final exam timetable.', audience: 'Students', publish_at: new Date('2026-03-05T14:46:21.222Z'), expire_at: new Date('2026-04-01T00:00:00.000Z') },
      { author_id: MAGDA_ID, title: 'Final Exam Schedule Released', content: 'Check the portal for your final exam timetable.', audience: 'Students', publish_at: new Date('2026-03-05T19:40:44.732Z'), expire_at: new Date('2026-04-01T00:00:00.000Z') },
      { author_id: MAGDA_ID, title: 'Final Exam Schedule Released', content: 'Check the portal for your final exam timetable.', audience: 'All',      publish_at: new Date('2026-03-05T19:41:02.136Z'), expire_at: new Date('2026-04-01T00:00:00.000Z') },
      { author_id: MAGDA_ID, title: 'Final Exam Schedule Released', content: 'Check the portal for your final exam timetable.', audience: 'All',      publish_at: new Date('2026-03-05T19:41:05.687Z'), expire_at: new Date('2026-04-01T00:00:00.000Z') },
      { author_id: MAGDA_ID, title: 'Final Exam Schedule Released', content: 'Check the portal for your final exam timetable.', audience: 'All',      publish_at: new Date('2026-03-05T19:41:07.448Z'), expire_at: new Date('2026-04-01T00:00:00.000Z') },
    ],
  });

  console.log('\n✅  Database seeded successfully!');
  console.log('    Departments   : 2  (Computer Science, Mathematics)');
  console.log('    Users         : 33 (1 super_admin · 3 admin · 4 doctor · 3 TA · 1 leader · 21 student)');
  console.log('    Profiles      : 20');
  console.log('    Courses       : 4  (CS5050 · OOP500 · V202 · MATH222)');
  console.log('    Offerings     : 4  (all Fall 2026)');
  console.log('    Lectures      : 4');
  console.log('    Tutorials/Labs: 5');
  console.log('    Enrollments   : 7');
  console.log('    Files         : 2');
  console.log('    Materials     : 3');
  console.log('    Announcements : 7');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
