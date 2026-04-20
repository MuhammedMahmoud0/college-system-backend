import { prisma } from "../config/connection.js";
import { supabase } from "../utils/supabase.js";
import logger from "../utils/logger.js";
import path from "path";
import { userPublicSelect } from "../prisma/selectors/user.selectors.js";
import { studentProfileSelect } from "../prisma/selectors/studentProfile.selectors.js";
import { getCurrentSemester } from "../utils/periodHelpers.js";

const DIGITAL_STUDENT_ID_SYSTEM_NAME = "Academia College";
const DIGITAL_STUDENT_ID_IDENTITY_LABEL = "STUDENT IDENTITY";
const DIGITAL_STUDENT_ID_PRIVILEGES = [
  "Library Access",
  "CS & Engineering Labs",
  "Gym & Sports Facilities",
];

const formatOrdinal = (numberValue) => {
  const value = Number.parseInt(numberValue, 10);

  if (!Number.isInteger(value) || value <= 0) {
    return "1st";
  }

  const mod10 = value % 10;
  const mod100 = value % 100;

  if (mod10 === 1 && mod100 !== 11) return `${value}st`;
  if (mod10 === 2 && mod100 !== 12) return `${value}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${value}rd`;
  return `${value}th`;
};

const normalizeSemesterToken = (semester) => {
  if (!semester || typeof semester !== "string") return null;
  return semester.trim().split(" ")[0] || null;
};

const resolveAcademicContext = async () => {
  const currentSemester = await getCurrentSemester();

  if (currentSemester) {
    return {
      semester: normalizeSemesterToken(currentSemester.semester),
      year: currentSemester.year,
    };
  }

  const now = new Date();
  const month = now.getUTCMonth() + 1;

  return {
    semester:
      month >= 9 ? "Fall" : month >= 2 && month <= 6 ? "Spring" : "Summer",
    year: now.getUTCFullYear(),
  };
};

const getDigitalIdDates = ({ yearLevel, semester, year }) => {
  const safeYearLevel =
    Number.isInteger(Number.parseInt(yearLevel, 10)) &&
    Number.parseInt(yearLevel, 10) > 0
      ? Number.parseInt(yearLevel, 10)
      : 1;

  const academicYearStart = semester === "Fall" ? year : year - 1;
  const entryYear = academicYearStart - (safeYearLevel - 1);
  const issuedDate = `${entryYear}-09-01`;
  const expiresDate = `${entryYear + 4}-07-31`;

  return {
    yearLevel: safeYearLevel,
    issuedDate,
    expiresDate,
  };
};

const getStudentOrLeaderIdentity = async (userId) => {
  const identity = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      full_name: true,
      role: true,
      national_id: true,
      student_profiles: {
        select: {
          student_id: true,
          year_level: true,
          departments: {
            select: {
              department_id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!identity || !identity.student_profiles) {
    return null;
  }

  return identity;
};

export const getStudentProfile = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const student = await prisma.users.findUnique({
      where: { id: user.userId },
      select: {
        ...userPublicSelect,
        student_profiles: {
          select: {
            ...studentProfileSelect,
          },
        },
      },
    });

    if (!student || !student.student_profiles) {
      return res.status(404).json({ error: "Student profile not found" });
    }

    res.status(200).json({ studentProfile: student });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateStudentProfile = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = user.userId ?? user.id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const allowedFields = ["phone", "address"];
    const providedFields = Object.keys(req.body || {});
    const disallowedFields = providedFields.filter(
      (field) => !allowedFields.includes(field),
    );

    if (disallowedFields.length > 0) {
      return res.status(400).json({
        error: "Only phone, address, and avatar can be updated",
      });
    }

    const normalizeOptionalField = (value) => {
      if (value === undefined || value === null) return undefined;
      if (typeof value === "string" && value.trim() === "") {
        return undefined;
      }
      return value;
    };

    const { address, phone } = req.body;
    const avatarFile = req.file;

    const normalizedPhone = normalizeOptionalField(phone);
    const normalizedAddress = normalizeOptionalField(address);

    // Prepare update data
    const updateData = {};
    if (normalizedAddress !== undefined) updateData.address = normalizedAddress;
    if (normalizedPhone !== undefined) updateData.phone = normalizedPhone;

    if (Object.keys(updateData).length === 0 && !avatarFile) {
      return res.status(400).json({
        error: "At least one field (phone, address, avatar) must be provided",
      });
    }

    // Handle avatar upload if provided
    if (avatarFile) {
      const ext = path.extname(avatarFile.originalname);
      const fileName = `avatar_${userId}_${Date.now()}${ext}`;
      const filePath = `${userId}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars") // or create a separate 'avatars' bucket
        .upload(filePath, avatarFile.buffer, {
          contentType: avatarFile.mimetype,
          upsert: true, // Replace if exists
        });

      if (uploadError) {
        logger.error("Avatar upload error:", uploadError);
        return res.status(500).json({
          error: "Failed to upload avatar",
        });
      }

      // Get public URL for the uploaded avatar
      // Using getPublicUrl - make sure 'avatars' bucket is PUBLIC in Supabase dashboard
      // This will generate a preview-friendly URL if the bucket is public
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      updateData.avatar_url = publicUrlData.publicUrl;

      // Optional: Delete old avatar from storage if exists
      const currentUser = await prisma.users.findUnique({
        where: { id: userId },
        select: { avatar_url: true },
      });

      if (currentUser?.avatar_url) {
        // Extract path from old URL and delete
        try {
          const oldPath = currentUser.avatar_url.split("/avatars/")[1];
          if (oldPath) {
            await supabase.storage.from("avatars").remove([oldPath]);
          }
        } catch (deleteErr) {
          logger.warn("Failed to delete old avatar:", deleteErr);
          // Continue anyway - not critical
        }
      }
    }

    // Update user profile
    const updatedStudent = await prisma.users.update({
      where: { id: userId },
      data: updateData,
    });

    res.status(200).json({ message: "Profile updated", updatedStudent });
  } catch (err) {
    logger.error("Error updating profile:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getDigitalStudentIdFront = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const identity = await getStudentOrLeaderIdentity(user.userId);

    if (!identity) {
      return res
        .status(404)
        .json({ error: "Student/leader profile not found" });
    }

    const academicContext = await resolveAcademicContext();
    const digitalIdDates = getDigitalIdDates({
      yearLevel: identity.student_profiles.year_level,
      semester: academicContext.semester,
      year: academicContext.year,
    });

    return res.status(200).json({
      system_name: DIGITAL_STUDENT_ID_SYSTEM_NAME,
      identity_label: DIGITAL_STUDENT_ID_IDENTITY_LABEL,
      holder: {
        full_name: identity.full_name,
        role: identity.role,
        student_id: identity.student_profiles.student_id,
        department: identity.student_profiles.departments?.name || null,
        level: `${formatOrdinal(digitalIdDates.yearLevel)} Year`,
        year_level: digitalIdDates.yearLevel,
      },
      card_validity: {
        issued_date: digitalIdDates.issuedDate,
        expires_date: digitalIdDates.expiresDate,
      },
    });
  } catch (err) {
    logger.error("Error getting digital student ID front:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getDigitalStudentIdBack = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const identity = await getStudentOrLeaderIdentity(user.userId);

    if (!identity) {
      return res
        .status(404)
        .json({ error: "Student/leader profile not found" });
    }

    return res.status(200).json({
      system_name: DIGITAL_STUDENT_ID_SYSTEM_NAME,
      qr_code: {
        student_id: identity.student_profiles.student_id,
        national_id: identity.national_id,
      },
      barcode: {
        access: true,
      },
      access_privileges: DIGITAL_STUDENT_ID_PRIVILEGES,
    });
  } catch (err) {
    logger.error("Error getting digital student ID back:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
