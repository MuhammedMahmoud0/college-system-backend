/* eslint-disable no-console */

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000/api/v1";
const STAFF_TOKEN =
  process.env.STAFF_TOKEN ||
  process.env.ADMIN_TOKEN ||
  process.env.DOCTOR_TOKEN ||
  process.env.TA_TOKEN ||
  process.env.SUPER_ADMIN_TOKEN;
const STUDENT_TOKEN = process.env.STUDENT_TOKEN;

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

  console.log("profile-access-smoke passed");
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
