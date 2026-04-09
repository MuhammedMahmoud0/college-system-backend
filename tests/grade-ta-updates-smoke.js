/* eslint-disable no-console */

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api/v1";
const DOCTOR_TOKEN = process.env.DOCTOR_TOKEN;
const TEACHING_ASSISTANT_TOKEN = process.env.TEACHING_ASSISTANT_TOKEN;
const STUDENT_TOKEN = process.env.STUDENT_TOKEN;

const LECTURE_ID = process.env.LECTURE_ID;
const TUTORIAL_LAB_ID = process.env.TUTORIAL_LAB_ID;
const STUDENT_ID = process.env.STUDENT_ID;

const callApi = async (path, method, token, body) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const json = await response.json().catch(() => ({}));
  return { status: response.status, json };
};

const assertHasScoreFields = (coursesPayload) => {
  const courses = coursesPayload?.json?.courses;
  if (!Array.isArray(courses)) {
    throw new Error(
      "Expected /courses/student response to include courses array",
    );
  }

  if (courses.length === 0) {
    console.log(
      "No registered courses found for student; field presence check skipped.",
    );
    return;
  }

  const missing = courses.find(
    (course) =>
      !Object.prototype.hasOwnProperty.call(course, "work_score") ||
      !Object.prototype.hasOwnProperty.call(course, "midterm_score") ||
      !Object.prototype.hasOwnProperty.call(course, "final_score"),
  );

  if (missing) {
    throw new Error(
      "Missing one or more numeric score fields in /courses/student response",
    );
  }
};

const run = async () => {
  if (!DOCTOR_TOKEN || !TEACHING_ASSISTANT_TOKEN || !STUDENT_TOKEN) {
    console.error(
      "Set DOCTOR_TOKEN, TEACHING_ASSISTANT_TOKEN, and STUDENT_TOKEN env vars before running this script.",
    );
    process.exit(1);
  }

  if (!LECTURE_ID || !TUTORIAL_LAB_ID || !STUDENT_ID) {
    console.error(
      "Set LECTURE_ID, TUTORIAL_LAB_ID, and STUDENT_ID env vars before running this script.",
    );
    process.exit(1);
  }

  console.log(
    "1) Doctor updates work_score in lecture endpoint (must be allowed)",
  );
  const doctorWorkUpdate = await callApi(
    `/grades/lecture/${LECTURE_ID}/student/${STUDENT_ID}`,
    "PUT",
    DOCTOR_TOKEN,
    { work_score: 10 },
  );
  console.log(doctorWorkUpdate);

  if (doctorWorkUpdate.status !== 200) {
    console.error(`Expected 200, got ${doctorWorkUpdate.status}`);
    process.exit(1);
  }

  console.log(
    "2) Teaching assistant tries to update mid_score in tutorial/lab endpoint (must be blocked)",
  );
  const taMidBlocked = await callApi(
    `/grades/tutorial-lab/${TUTORIAL_LAB_ID}/student/${STUDENT_ID}`,
    "PUT",
    TEACHING_ASSISTANT_TOKEN,
    { mid_score: 10 },
  );
  console.log(taMidBlocked);

  if (taMidBlocked.status !== 403) {
    console.error(`Expected 403, got ${taMidBlocked.status}`);
    process.exit(1);
  }

  console.log(
    "3) Teaching assistant updates work_score in tutorial/lab endpoint (must be allowed)",
  );
  const taWorkAllowed = await callApi(
    `/grades/tutorial-lab/${TUTORIAL_LAB_ID}/student/${STUDENT_ID}`,
    "PUT",
    TEACHING_ASSISTANT_TOKEN,
    { work_score: 10 },
  );
  console.log(taWorkAllowed);

  if (taWorkAllowed.status !== 200) {
    console.error(`Expected 200, got ${taWorkAllowed.status}`);
    process.exit(1);
  }

  console.log("4) Teaching assistant gets tutorial/lab linked distribution(s)");
  const distributionResult = await callApi(
    `/grades/tutorial-lab/${TUTORIAL_LAB_ID}/distribution`,
    "GET",
    TEACHING_ASSISTANT_TOKEN,
  );
  console.log(distributionResult);

  if (![200, 404].includes(distributionResult.status)) {
    console.error(
      `Expected 200 or 404 from tutorial-lab distribution endpoint, got ${distributionResult.status}`,
    );
    process.exit(1);
  }

  console.log("5) Teaching assistant gets TA dashboard alerts");
  const taAlerts = await callApi(
    "/teaching-assistant/alerts",
    "GET",
    TEACHING_ASSISTANT_TOKEN,
  );
  console.log(taAlerts);

  if (taAlerts.status !== 200) {
    console.error(
      `Expected 200 from /teaching-assistant/alerts, got ${taAlerts.status}`,
    );
    process.exit(1);
  }

  console.log("6) Student registered courses includes numeric score fields");
  const studentCourses = await callApi(
    "/courses/student",
    "GET",
    STUDENT_TOKEN,
  );
  console.log(studentCourses);

  if (studentCourses.status !== 200) {
    console.error(
      `Expected 200 from /courses/student, got ${studentCourses.status}`,
    );
    process.exit(1);
  }

  assertHasScoreFields(studentCourses);
  console.log("grade-ta-updates-smoke passed");
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
