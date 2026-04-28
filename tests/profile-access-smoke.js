/* eslint-disable no-console */

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000/api/v1";
const STAFF_TOKEN =
  process.env.STAFF_TOKEN ||
  process.env.ADMIN_TOKEN ||
  process.env.DOCTOR_TOKEN ||
  process.env.TA_TOKEN ||
  process.env.SUPER_ADMIN_TOKEN;
const STUDENT_TOKEN = process.env.STUDENT_TOKEN;
const ADMIN_MANAGEMENT_TOKEN =
  process.env.ADMIN_MANAGEMENT_TOKEN ||
  process.env.ADMIN_TOKEN ||
  process.env.SUPER_ADMIN_TOKEN;
const SUPER_ADMIN_MANAGEMENT_TOKEN =
  process.env.SUPER_ADMIN_MANAGEMENT_TOKEN || process.env.SUPER_ADMIN_TOKEN;

const callApi = async ({ path, method, token, body }) => {
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(body ? { "Content-Type": "application/json" } : {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await response.text();
  let json;

  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  return { status: response.status, json };
};

const run = async () => {
  if (!STAFF_TOKEN) {
    console.error(
      "Set STAFF_TOKEN (or ADMIN_TOKEN / DOCTOR_TOKEN / TA_TOKEN / SUPER_ADMIN_TOKEN) before running this script",
    );
    process.exit(1);
  }

  console.log("1) Get current non-student profile");
  const staffProfile = await callApi({
    path: "/users/profile",
    method: "GET",
    token: STAFF_TOKEN,
  });
  console.log(staffProfile);

  if (staffProfile.status !== 200) {
    console.error(
      `Expected 200 from GET /users/profile for staff token, got ${staffProfile.status}`,
    );
    process.exit(1);
  }

  if (!staffProfile.json?.user?.id) {
    console.error("Expected profile payload to include user.id");
    process.exit(1);
  }

  if (["student", "leader"].includes(staffProfile.json?.user?.role)) {
    console.error("Expected a non-student role from staff profile endpoint");
    process.exit(1);
  }

  console.log("2) Reject disallowed fields for non-student profile update");
  const invalidStaffPatch = await callApi({
    path: "/users/profile",
    method: "PATCH",
    token: STAFF_TOKEN,
    body: { full_name: "Should Fail" },
  });
  console.log(invalidStaffPatch);

  if (invalidStaffPatch.status !== 400) {
    console.error(
      `Expected 400 from PATCH /users/profile with disallowed field, got ${invalidStaffPatch.status}`,
    );
    process.exit(1);
  }

  console.log("3) Allow phone update for non-student profile");
  const validStaffPatch = await callApi({
    path: "/users/profile",
    method: "PATCH",
    token: STAFF_TOKEN,
    body: { phone: "+201111111111" },
  });
  console.log(validStaffPatch);

  if (validStaffPatch.status !== 200) {
    console.error(
      `Expected 200 from PATCH /users/profile with allowed field, got ${validStaffPatch.status}`,
    );
    process.exit(1);
  }

  if (STUDENT_TOKEN) {
    console.log("4) Ensure student cannot access non-student profile endpoint");
    const studentGetStaffEndpoint = await callApi({
      path: "/users/profile",
      method: "GET",
      token: STUDENT_TOKEN,
    });
    console.log(studentGetStaffEndpoint);

    if (studentGetStaffEndpoint.status !== 403) {
      console.error(
        `Expected 403 from GET /users/profile for student token, got ${studentGetStaffEndpoint.status}`,
      );
      process.exit(1);
    }

    console.log("5) Reject disallowed student profile fields");
    const invalidStudentPatch = await callApi({
      path: "/student/profile",
      method: "PUT",
      token: STUDENT_TOKEN,
      body: { full_name: "Should Also Fail" },
    });
    console.log(invalidStudentPatch);

    if (invalidStudentPatch.status !== 400) {
      console.error(
        `Expected 400 from PUT /student/profile with disallowed field, got ${invalidStudentPatch.status}`,
      );
      process.exit(1);
    }
  } else {
    console.warn(
      "STUDENT_TOKEN not set, skipping student-specific profile access checks",
    );
  }

  if (ADMIN_MANAGEMENT_TOKEN) {
    console.log("6) List students for admin management");
    const studentsManagement = await callApi({
      path: "/users/management/students?limit=1",
      method: "GET",
      token: ADMIN_MANAGEMENT_TOKEN,
    });
    console.log(studentsManagement);

    if (studentsManagement.status !== 200) {
      console.error(
        `Expected 200 from GET /users/management/students, got ${studentsManagement.status}`,
      );
      process.exit(1);
    }

    const managedStudentId =
      studentsManagement.json?.data?.[0]?.student_profiles?.student_id;

    if (managedStudentId) {
      console.log("7) Get student profile by student_id");
      const studentProfileByStudentId = await callApi({
        path: `/users/management/students/${encodeURIComponent(managedStudentId)}/profile`,
        method: "GET",
        token: ADMIN_MANAGEMENT_TOKEN,
      });
      console.log(studentProfileByStudentId);

      if (studentProfileByStudentId.status !== 200) {
        console.error(
          `Expected 200 from GET /users/management/students/:studentId/profile, got ${studentProfileByStudentId.status}`,
        );
        process.exit(1);
      }

      if (!studentProfileByStudentId.json?.student?.student_id) {
        console.error("Expected student profile payload to include student_id");
        process.exit(1);
      }

      console.log("8) Get student grades history by student_id");
      const studentGradesHistory = await callApi({
        path: `/users/management/students/${encodeURIComponent(managedStudentId)}/grades-history`,
        method: "GET",
        token: ADMIN_MANAGEMENT_TOKEN,
      });
      console.log(studentGradesHistory);

      if (studentGradesHistory.status !== 200) {
        console.error(
          `Expected 200 from GET /users/management/students/:studentId/grades-history, got ${studentGradesHistory.status}`,
        );
        process.exit(1);
      }

      if (!Array.isArray(studentGradesHistory.json?.grades_history)) {
        console.error("Expected grades_history to be an array");
        process.exit(1);
      }
    } else {
      console.warn(
        "No student profile found from management list, skipping student-id management endpoint checks",
      );
    }

    console.log("9) List doctors for admin management");
    const doctorsManagement = await callApi({
      path: "/users/management/staff?role=doctor&limit=1",
      method: "GET",
      token: ADMIN_MANAGEMENT_TOKEN,
    });
    console.log(doctorsManagement);

    if (doctorsManagement.status !== 200) {
      console.error(
        `Expected 200 from GET /users/management/staff?role=doctor, got ${doctorsManagement.status}`,
      );
      process.exit(1);
    }

    const managedDoctorUserId = doctorsManagement.json?.data?.[0]?.id;

    if (managedDoctorUserId) {
      console.log("10) Get doctor profile by user_id");
      const doctorProfileByUserId = await callApi({
        path: `/users/management/doctors/${managedDoctorUserId}/profile`,
        method: "GET",
        token: ADMIN_MANAGEMENT_TOKEN,
      });
      console.log(doctorProfileByUserId);

      if (doctorProfileByUserId.status !== 200) {
        console.error(
          `Expected 200 from GET /users/management/doctors/:userId/profile, got ${doctorProfileByUserId.status}`,
        );
        process.exit(1);
      }

      if (!doctorProfileByUserId.json?.doctor?.id) {
        console.error("Expected doctor profile payload to include doctor.id");
        process.exit(1);
      }

      console.log("11) Get doctor courses by user_id");
      const doctorCoursesByUserId = await callApi({
        path: `/users/management/doctors/${managedDoctorUserId}/courses`,
        method: "GET",
        token: ADMIN_MANAGEMENT_TOKEN,
      });
      console.log(doctorCoursesByUserId);

      if (doctorCoursesByUserId.status !== 200) {
        console.error(
          `Expected 200 from GET /users/management/doctors/:userId/courses, got ${doctorCoursesByUserId.status}`,
        );
        process.exit(1);
      }

      if (!Array.isArray(doctorCoursesByUserId.json?.schedule)) {
        console.error(
          "Expected doctor courses payload to include schedule array",
        );
        process.exit(1);
      }
    } else {
      console.warn(
        "No doctor found from staff management list, skipping doctor management endpoint checks",
      );
    }

    console.log("12) List teaching assistants for admin management");
    const teachingAssistantsManagement = await callApi({
      path: "/users/management/staff?role=teaching_assistant&limit=1",
      method: "GET",
      token: ADMIN_MANAGEMENT_TOKEN,
    });
    console.log(teachingAssistantsManagement);

    if (teachingAssistantsManagement.status !== 200) {
      console.error(
        `Expected 200 from GET /users/management/staff?role=teaching_assistant, got ${teachingAssistantsManagement.status}`,
      );
      process.exit(1);
    }

    const managedTeachingAssistantUserId =
      teachingAssistantsManagement.json?.data?.[0]?.id;

    if (managedTeachingAssistantUserId) {
      console.log("13) Get teaching assistant profile by user_id");
      const teachingAssistantProfileByUserId = await callApi({
        path: `/users/management/teaching-assistants/${managedTeachingAssistantUserId}/profile`,
        method: "GET",
        token: ADMIN_MANAGEMENT_TOKEN,
      });
      console.log(teachingAssistantProfileByUserId);

      if (teachingAssistantProfileByUserId.status !== 200) {
        console.error(
          `Expected 200 from GET /users/management/teaching-assistants/:userId/profile, got ${teachingAssistantProfileByUserId.status}`,
        );
        process.exit(1);
      }

      if (!teachingAssistantProfileByUserId.json?.teaching_assistant?.id) {
        console.error(
          "Expected teaching assistant profile payload to include teaching_assistant.id",
        );
        process.exit(1);
      }

      console.log("14) Get teaching assistant courses by user_id");
      const teachingAssistantCoursesByUserId = await callApi({
        path: `/users/management/teaching-assistants/${managedTeachingAssistantUserId}/courses`,
        method: "GET",
        token: ADMIN_MANAGEMENT_TOKEN,
      });
      console.log(teachingAssistantCoursesByUserId);

      if (teachingAssistantCoursesByUserId.status !== 200) {
        console.error(
          `Expected 200 from GET /users/management/teaching-assistants/:userId/courses, got ${teachingAssistantCoursesByUserId.status}`,
        );
        process.exit(1);
      }

      if (!Array.isArray(teachingAssistantCoursesByUserId.json?.schedule)) {
        console.error(
          "Expected teaching assistant courses payload to include schedule array",
        );
        process.exit(1);
      }
    } else {
      console.warn(
        "No teaching assistant found from staff management list, skipping teaching assistant management endpoint checks",
      );
    }
  } else {
    console.warn(
      "ADMIN_MANAGEMENT_TOKEN not set, skipping admin-only management endpoint checks",
    );
  }

  if (SUPER_ADMIN_MANAGEMENT_TOKEN) {
    console.log("15) List admin users for super_admin management");
    const adminsManagement = await callApi({
      path: "/users/management/admins",
      method: "GET",
      token: SUPER_ADMIN_MANAGEMENT_TOKEN,
    });
    console.log(adminsManagement);

    if (adminsManagement.status !== 200) {
      console.error(
        `Expected 200 from GET /users/management/admins, got ${adminsManagement.status}`,
      );
      process.exit(1);
    }

    if (!Array.isArray(adminsManagement.json?.admins)) {
      console.error("Expected admins payload to include admins array");
      process.exit(1);
    }

    console.log("16) Create a new admin user");
    const uniqueAdminEmail = `smoke.admin.${Date.now()}@example.com`;
    const createAdminResponse = await callApi({
      path: "/users/management/admins",
      method: "POST",
      token: SUPER_ADMIN_MANAGEMENT_TOKEN,
      body: {
        name: "Smoke Admin",
        email: uniqueAdminEmail,
        password: "Admin123!",
      },
    });
    console.log(createAdminResponse);

    if (createAdminResponse.status !== 201) {
      console.error(
        `Expected 201 from POST /users/management/admins, got ${createAdminResponse.status}`,
      );
      process.exit(1);
    }

    if (!createAdminResponse.json?.userId) {
      console.error("Expected create admin response to include userId");
      process.exit(1);
    }
  } else {
    console.warn(
      "SUPER_ADMIN_MANAGEMENT_TOKEN not set, skipping super_admin-only admin endpoint checks",
    );
  }

  console.log("profile-access-smoke passed");
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
